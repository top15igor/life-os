import { analyzeSaved } from "./ai";
import type { ImportResult } from "./instagram";
import { storeVideo } from "./videoStore";
import { insertSavedItem } from "./savedItems";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Любая ссылка на видео/shorts YouTube → нормализованный watch-URL + id.
const YT_RE = /(?:youtube\.com\/(?:watch\?(?:[^\s]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;

export function extractYoutubeUrl(text?: string | null): { url: string; id: string; kind: "video" | "short" } | null {
  if (!text) return null;
  const m = text.match(YT_RE);
  if (!m) return null;
  const id = m[1];
  const kind = /shorts\//i.test(m[0]) ? "short" : "video";
  return { url: `https://www.youtube.com/watch?v=${id}`, id, kind };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(Number(n)); } catch { return _; } })
    .replace(/\\u0026/g, "&").replace(/\\"/g, '"').replace(/\\n/g, "\n");
}

// Вырезать сбалансированный JSON-объект, идущий после маркера (учёт строк/экранирования).
function extractJsonObject(html: string, marker: string): string | null {
  const i = html.indexOf(marker);
  if (i < 0) return null;
  const start = html.indexOf("{", i);
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let j = start; j < html.length; j++) {
    const c = html[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return html.slice(start, j + 1); }
  }
  return null;
}

// InnerTube player API — надёжно отдаёт videoDetails + субтитры даже с серверного IP
// (страница watch часто возвращает consent-заглушку без данных). Ключ WEB-клиента публичный.
const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
async function innertubePlayer(videoId: string): Promise<any | null> {
  try {
    const res = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
      body: JSON.stringify({ context: { client: { clientName: "WEB", clientVersion: "2.20240726.00.00", hl: "en", gl: "US" } }, videoId }),
    });
    if (!res.ok) { console.error("yt innertube", res.status); return null; }
    return await res.json();
  } catch (e) {
    console.error("yt innertube", e);
    return null;
  }
}

// Рекурсивно собрать текст расшифровки из ответа любого YouTube-transcript API
// (форматы разные: массив {text,...}, {transcript:[...]}, {content:[...]} и т.п.).
function collectTranscript(node: any, depth = 0, acc: string[] = []): string[] {
  if (node == null || depth > 9) return acc;
  if (Array.isArray(node)) { for (const x of node) collectTranscript(x, depth + 1, acc); return acc; }
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === "string") {
        if (/^(text|subtitle|utf8|snippet|caption|line|segment)$/i.test(k) && v.trim()) acc.push(v.trim());
        else if (/^(transcript|content)$/i.test(k) && v.trim().length > 40) acc.push(v.trim());
      } else collectTranscript(v, depth + 1, acc);
    }
  }
  return acc;
}

// Запасной способ через RapidAPI (твой ключ). Включается, если задан
// RAPIDAPI_YOUTUBE_HOST. Плейсхолдеры {id} и {url} в пути/теле.
async function transcriptViaRapidApi(videoId: string, url: string): Promise<string> {
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_YOUTUBE_HOST;
  if (!key || !host) return "";
  const pathTpl = process.env.RAPIDAPI_YOUTUBE_PATH || "/transcript?video_id={id}";
  const bodyTpl = process.env.RAPIDAPI_YOUTUBE_BODY || "";
  const method = (process.env.RAPIDAPI_YOUTUBE_METHOD || (bodyTpl ? "POST" : "GET")).toUpperCase();
  const fill = (s: string) => s.replace(/\{id\}/g, encodeURIComponent(videoId)).replace(/\{url\}/g, encodeURIComponent(url));
  try {
    const init: RequestInit = {
      method,
      headers: {
        "x-rapidapi-key": key, "x-rapidapi-host": host, accept: "application/json",
        ...(method === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      },
    };
    if (method === "POST") init.body = fill(bodyTpl || "video_id={id}");
    const res = await fetch(`https://${host}${fill(pathTpl)}`, init);
    if (!res.ok) { console.error("yt rapidapi transcript", res.status); return ""; }
    const json = await res.json();
    return collectTranscript(json).join(" ").replace(/\s+/g, " ").trim().slice(0, 100000);
  } catch (e) {
    console.error("yt rapidapi transcript", e);
    return "";
  }
}

// Рекурсивно найти в ответе YouTube-dl API прямую ссылку на mp4 со ЗВУКОМ (прогрессивный).
// Форма ответа у разных API разная, поэтому оцениваем эвристикой на уровне ОБЪЕКТА-формата
// (видно соседние поля hasAudio/quality/mimeType, а не только сам URL): берём mp4 со звуком,
// предпочитаем полегче (360–720p — влезает в лимит 50 МБ); аудио-дорожки и видео-без-звука
// (hasAudio:false, itag аудио, mime=audio, .m4a) отбрасываем.
function pickDownloadUrl(json: any): string | null {
  const cands: { url: string; score: number }[] = [];
  const isVideoUrl = (s: string) => /^https?:\/\//i.test(s) && /(\.mp4|googlevideo\.com|videoplayback)/i.test(s);
  const walk = (n: any, key: string, parent: any, depth: number) => {
    if (n == null || depth > 10) return;
    if (typeof n === "string") {
      if (!isVideoUrl(n)) return;
      // meta — сам объект-формат (родитель ссылки) + ключ + URL: по нему судим о звуке/качестве.
      const meta = (JSON.stringify(parent || {}) + " " + key + " " + n).toLowerCase();
      if (/"has_?audio":false|"videoonly":true|"is_?audio_?video":false/.test(meta)) return;   // явно без звука
      if (/\.m4a(\?|$)|mime=audio|"mimetype":"audio|"itag":\s*"?(139|140|141|171|249|250|251)\b/.test(meta)) return; // аудио-дорожка
      if (/^audio/i.test(key) && !/video/.test(meta)) return;
      let score = 1;
      if (/"has_?audio":true|audioquality|audiochannels|progressive|muxed|withaudio|audio.?and.?video/.test(meta)) score += 5;
      if (/"extension":"mp4"|"mimetype":"video\/mp4|\.mp4/.test(meta)) score += 2;
      const q = Number((meta.match(/"(?:quality|qualitylabel|height|resolution)":\s*"?(\d{3,4})p?/) || [])[1] || 0);
      if (q) { if (q <= 480) score += 3; else if (q <= 720) score += 1; else score -= 2; }
      cands.push({ url: n, score });
      return;
    }
    if (Array.isArray(n)) { for (const x of n) walk(x, key, parent, depth + 1); return; }
    if (typeof n === "object") { for (const [k, v] of Object.entries(n)) walk(v, k, n, depth + 1); }
  };
  walk(json, "", null, 0);
  if (!cands.length) return null;
  cands.sort((a, b) => b.score - a.score);
  return cands[0].url;
}

// Запасной способ достать ПРЯМУЮ ссылку на файл видео через RapidAPI (твой ключ).
// Включается, если задан RAPIDAPI_YOUTUBE_DL_HOST. Нужен для облака: YouTube не отдаёт
// форматы напрямую с серверного IP, а RapidAPI ходит со своих IP. Плейсхолдеры {id}/{url}.
async function videoUrlViaRapidApi(videoId: string, url: string): Promise<string | null> {
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_YOUTUBE_DL_HOST;
  if (!key || !host) return null;
  const pathTpl = process.env.RAPIDAPI_YOUTUBE_DL_PATH || "/dl?id={id}";
  const bodyTpl = process.env.RAPIDAPI_YOUTUBE_DL_BODY || "";
  const method = (process.env.RAPIDAPI_YOUTUBE_DL_METHOD || (bodyTpl ? "POST" : "GET")).toUpperCase();
  const fill = (s: string) => s.replace(/\{id\}/g, encodeURIComponent(videoId)).replace(/\{url\}/g, encodeURIComponent(url));
  try {
    const init: RequestInit = {
      method,
      headers: {
        "x-rapidapi-key": key, "x-rapidapi-host": host, accept: "application/json",
        ...(method === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      },
    };
    if (method === "POST") init.body = fill(bodyTpl || "id={id}");
    const res = await fetch(`https://${host}${fill(pathTpl)}`, init);
    if (!res.ok) { console.error("yt rapidapi dl", res.status); return null; }
    const json = await res.json();
    return pickDownloadUrl(json);
  } catch (e) {
    console.error("yt rapidapi dl", e);
    return null;
  }
}

// ANDROID-клиент InnerTube — часто отдаёт дорожки субтитров, когда WEB их прячет.
async function innertubePlayerAndroid(videoId: string): Promise<any | null> {
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/player?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
        "accept-language": "en-US,en;q=0.9",
      },
      body: JSON.stringify({ context: { client: { clientName: "ANDROID", clientVersion: "19.09.37", androidSdkVersion: 30, hl: "en", gl: "US" } }, videoId }),
    });
    if (!res.ok) { console.error("yt innertube android", res.status); return null; }
    return await res.json();
  } catch (e) {
    console.error("yt innertube android", e);
    return null;
  }
}

// IOS-клиент InnerTube — сейчас надёжнее всех отдаёт прогрессивный mp4 с ПРЯМОЙ
// (нешифрованной) ссылкой, в т.ч. для Shorts. Основной источник ссылки на файл.
async function innertubePlayerIos(videoId: string): Promise<any | null> {
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/player?key=AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X)",
        "accept-language": "en-US,en;q=0.9",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "IOS",
            clientVersion: "19.29.1",
            deviceMake: "Apple",
            deviceModel: "iPhone16,2",
            osName: "iPhone",
            osVersion: "17.5.1.21F90",
            hl: "en",
            gl: "US",
          },
        },
        videoId,
      }),
    });
    if (!res.ok) { console.error("yt innertube ios", res.status); return null; }
    return await res.json();
  } catch (e) {
    console.error("yt innertube ios", e);
    return null;
  }
}

async function ytFetch(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9", cookie: "CONSENT=YES+1" },
    redirect: "follow",
  });
  return res.text();
}

// Достать текст субтитров: предпочитаем ручные (не asr), пробуем json3 и xml.
async function fetchTranscript(tracks: any[]): Promise<string> {
  const pick = tracks.find((t) => t?.kind !== "asr" && t?.baseUrl) || tracks.find((t) => t?.baseUrl);
  if (!pick) return "";
  const base = decodeEntities(String(pick.baseUrl));
  for (const u of [base + (base.includes("?") ? "&" : "?") + "fmt=json3", base]) {
    try {
      const res = await fetch(u, { headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" } });
      if (!res.ok) continue;
      const body = await res.text();
      if (u.includes("fmt=json3")) {
        const j = JSON.parse(body);
        const text = (j?.events || []).flatMap((e: any) => (e?.segs || []).map((s: any) => s?.utf8 || "")).join("").replace(/\s+/g, " ").trim();
        if (text) return text;
      } else {
        const parts = [...body.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) =>
          decodeEntities(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
        );
        const text = parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
        if (text) return text;
      }
    } catch {
      // пробуем следующий формат
    }
  }
  return "";
}

export type YtMedia = { title: string; author: string | null; description: string; thumbnail: string | null; transcript: string; kind: "video" | "short"; videoUrl: string | null };

// Выбрать прогрессивный mp4 (видео+звук в одном файле) с ПРЯМОЙ ссылкой из streamingData.
// Берём наименьшее подходящее разрешение (≥360p) — файл легче и укладывается в лимиты.
// Форматы с signatureCipher (без готового url) пропускаем: расшифровать подпись без
// player-JS мы не можем — тогда видео просто не сохраняем.
function pickProgressive(streamings: any[]): string | null {
  for (const sd of streamings) {
    const fmts = Array.isArray(sd?.formats) ? sd.formats : [];
    const mp4 = fmts.filter((f: any) => typeof f?.url === "string" && f.url && /mp4/i.test(f?.mimeType || "") && (f?.audioQuality || f?.audioChannels));
    if (!mp4.length) continue;
    mp4.sort((a: any, b: any) => (a.height || 0) - (b.height || 0));
    const pick = mp4.find((f: any) => (f.height || 0) >= 360) || mp4[0];
    if (pick?.url) return pick.url as string;
  }
  return null;
}

export async function unpackYoutube(url: string, kind: "video" | "short"): Promise<YtMedia> {
  const videoId = (url.match(/[?&]v=([A-Za-z0-9_-]{11})/) || [])[1] || "";
  let title = "", author: string | null = null, description = "", thumbnail: string | null = null, transcript = "";
  const streamings: any[] = [];

  // Применить player-response-подобный объект к полям; вернуть треки субтитров.
  const apply = (pr: any): any[] | null => {
    const vd = pr?.videoDetails || {};
    if (!title) title = vd.title || "";
    if (!author) author = vd.author || null;
    if (!description) description = vd.shortDescription || "";
    const th = vd.thumbnail?.thumbnails;
    if (!thumbnail && Array.isArray(th) && th.length) thumbnail = th[th.length - 1]?.url || null;
    if (pr?.streamingData) streamings.push(pr.streamingData);
    const tr = pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    return Array.isArray(tr) && tr.length ? tr : null;
  };

  let tracks: any[] | null = null;

  // 1) InnerTube player API (основной — стабильно работает с серверного IP).
  if (videoId) {
    const pr = await innertubePlayer(videoId);
    if (pr) tracks = apply(pr);
  }

  // 2) ANDROID-клиент — если WEB не отдал субтитры.
  if (!tracks && videoId) {
    const pr = await innertubePlayerAndroid(videoId);
    if (pr) tracks = apply(pr);
  }

  // 3) Страница видео (запасной) — если чего-то не хватило.
  if (!description || !tracks) {
    try {
      const html = await ytFetch(url + "&hl=en");
      const raw = extractJsonObject(html, "ytInitialPlayerResponse");
      if (raw) { const pr = JSON.parse(raw); tracks = tracks || apply(pr); }
    } catch (e) {
      console.error("yt watch", e);
    }
  }

  // 3) oEmbed (без ключа) — надёжный запас для заголовка/автора/превью.
  if (!title || !thumbnail) {
    try {
      const o: any = await (await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)).json();
      title = title || o?.title || "";
      author = author || o?.author_name || null;
      thumbnail = thumbnail || o?.thumbnail_url || null;
    } catch (e) {
      console.error("yt oembed", e);
    }
  }

  // Субтитры — речь из видео (бесплатно).
  if (tracks && tracks.length) {
    try { transcript = await fetchTranscript(tracks); } catch (e) { console.error("yt transcript", e); }
  }
  // Запас: если бесплатно не вышло — через RapidAPI (если настроен).
  if (!transcript && videoId) {
    transcript = await transcriptViaRapidApi(videoId, url);
  }

  // Прямая ссылка на файл видео. WEB-клиент обычно шифрует ссылки, поэтому берём
  // из мобильных клиентов: сперва IOS (самый надёжный, отдаёт прогрессивный mp4),
  // затем ANDROID запасом.
  let videoUrl = pickProgressive(streamings);
  if (!videoUrl && videoId) {
    const ios = await innertubePlayerIos(videoId);
    if (ios?.streamingData) videoUrl = pickProgressive([ios.streamingData]);
  }
  if (!videoUrl && videoId) {
    const apr = await innertubePlayerAndroid(videoId);
    if (apr?.streamingData) videoUrl = pickProgressive([apr.streamingData]);
  }
  // Запас для облака: YouTube часто блокирует InnerTube с серверного IP — тогда берём
  // прямую ссылку через RapidAPI (если настроен RAPIDAPI_YOUTUBE_DL_HOST). Вызываем
  // ТОЛЬКО для Shorts — чтобы не жечь платный лимит на обычных (часто длинных) видео.
  if (!videoUrl && videoId && kind === "short") {
    videoUrl = await videoUrlViaRapidApi(videoId, url);
  }

  return { title, author, description, thumbnail, transcript, kind, videoUrl };
}

// Ссылка YouTube → контент (описание + субтитры) → AI-разбор → запись в saved_items.
export async function importYoutube(userId: string, url: string, kind: "video" | "short", locale = "ru"): Promise<ImportResult> {
  let media: YtMedia;
  try {
    media = await unpackYoutube(url, kind);
  } catch (e) {
    console.error("yt fetch", e);
    return { ok: false, reason: "blocked" };
  }

  const content = [media.description, media.transcript].filter(Boolean).join("\n\n").trim().slice(0, 12000);
  const text = content || media.title;
  if (!text) return { ok: false, reason: "blocked" };

  const analysis = await analyzeSaved(text, userId, locale);

  // Скачиваем сам файл видео в bucket 'saved' (влезает — короткие ролики/shorts;
  // длинные ролики отсекаются по размеру, карточка сохранится по описанию/субтитрам).
  let video_url: string | null = null;
  let video_size: number | null = null;
  if (media.videoUrl) {
    const stored = await storeVideo(userId, media.videoUrl, { "user-agent": UA });
    if (stored) {
      video_url = stored.url;
      video_size = stored.size;
    }
  }

  const id = await insertSavedItem({
    user_id: userId,
    source: "youtube",
    url,
    author: media.author,
    kind,
    title: analysis.title,
    topic: analysis.topic,
    summary: analysis.summary,
    key_points: analysis.key_points,
    tags: analysis.tags,
    caption: media.description || null,
    transcript: media.transcript || null,
    image_url: media.thumbnail,
    video_url,
    video_size,
    status: content ? "ok" : "review",
  });
  const saved = !!id;

  const item = saved
    ? {
        id, source: "youtube", url, author: media.author, kind,
        title: analysis.title, topic: analysis.topic, summary: analysis.summary,
        key_points: analysis.key_points, tags: analysis.tags, image_url: media.thumbnail,
        video_url,
        note: null, favorite: false, done: false, position: 0, created_at: new Date().toISOString(),
      }
    : null;

  // kind в ImportResult нужен только для IG-сообщения «звук не достал» — для YouTube не шлём.
  return { ok: true, id, saved, item, analysis, kind: "post", hadTranscript: !!media.transcript, videoUrl: video_url };
}
