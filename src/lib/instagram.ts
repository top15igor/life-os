import { supabaseAdmin } from "./supabaseAdmin";
import { transcribeFile } from "./transcribe";
import { analyzeSaved, type SavedAnalysis } from "./ai";
import { uploadVideo, MAX_VIDEO_BYTES } from "./videoStore";
import { insertSavedItem } from "./savedItems";

// Любая ссылка на пост/reels/видео Instagram.
const IG_RE = /https?:\/\/(?:www\.)?instagram\.com\/[^\s]+/i;

export function extractInstagramUrl(text?: string | null): string | null {
  if (!text) return null;
  const m = text.match(IG_RE);
  return m ? m[0].replace(/[)\].,]+$/, "") : null;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&#0?34;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#0?64;/g, "@")
    .replace(/&#x[0-9a-f]+;/gi, (h) => { try { return String.fromCodePoint(parseInt(h.slice(3, -1), 16)); } catch { return h; } })
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(Number(n)); } catch { return _; } })
    .replace(/&amp;/g, "&");
}

function ogTag(html: string, prop: string): string | null {
  const a = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']*)["']`, "i"));
  if (a) return decodeHtml(a[1]);
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:${prop}["']`, "i"));
  return b ? decodeHtml(b[1]) : null;
}

// og:description у Instagram обычно вида: «123 likes, 45 comments - user on March 1, 2024: "подпись"».
// Вытаскиваем саму подпись (после двоеточия / из кавычек), убирая шапку со статистикой.
function captionFromDescription(desc: string | null): string {
  if (!desc) return "";
  const q = desc.match(/[:\-—]\s*["“](.+)["”]\s*$/s);
  if (q) return q[1].trim();
  const colon = desc.indexOf(": ");
  if (/likes?|comments?|подписчик|нравится|коммент/i.test(desc.slice(0, Math.max(colon, 0))) && colon > -1) {
    return desc.slice(colon + 2).replace(/^["“]|["”]$/g, "").trim();
  }
  return desc.trim();
}

function shortcodeOf(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

type IgMedia = { caption: string; imageUrl: string | null; videoUrl: string | null; author: string | null; shortcode: string | null; kind: "post" | "reel" };

const kindOf = (url: string): "post" | "reel" => (/\/reels?\//i.test(url) || /\/tv\//i.test(url) ? "reel" : "post");

// Способ 1 (основной): сторонний Instagram-API через RapidAPI.
// Instagram отдаёт логин-стену на «голые» запросы, поэтому без авторизованного
// движка контент не достать. RapidAPI-скрапер ходит как залогиненный и возвращает
// подпись, автора, картинку и ПРЯМУЮ ссылку на видео (нужна для расшифровки голоса).
// Включается переменной RAPIDAPI_KEY. Хост/путь настраиваются под выбранный API.
function deepGet(obj: any, key: string, depth = 0): any {
  if (obj == null || depth > 7) return undefined;
  if (Array.isArray(obj)) {
    for (const it of obj) {
      const r = deepGet(it, key, depth + 1);
      if (r !== undefined) return r;
    }
    return undefined;
  }
  if (typeof obj === "object") {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
    for (const v of Object.values(obj)) {
      const r = deepGet(v, key, depth + 1);
      if (r !== undefined) return r;
    }
  }
  return undefined;
}

type ApiResult = { media: IgMedia | null; rateLimited: boolean };

async function fetchViaRapidApi(url: string): Promise<ApiResult> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return { media: null, rateLimited: false };
  const host = process.env.RAPIDAPI_INSTAGRAM_HOST || "instagram-scraper-api2.p.rapidapi.com";
  // Путь до эндпоинта «инфо о посте». В пути/теле подставляются плейсхолдеры:
  //   {url}       — полная ссылка поста (url-encoded)
  //   {shortcode} — только код поста (многие API хотят именно его)
  // Метод по умолчанию GET; если задан RAPIDAPI_INSTAGRAM_BODY — запрос уходит
  // POST'ом с form-data (так устроены некоторые API, напр. *.php).
  const path = process.env.RAPIDAPI_INSTAGRAM_PATH || "/v1/post_info?code_or_id_or_url={url}";
  const bodyTpl = process.env.RAPIDAPI_INSTAGRAM_BODY || "";
  const method = (process.env.RAPIDAPI_INSTAGRAM_METHOD || (bodyTpl ? "POST" : "GET")).toUpperCase();
  const enc = encodeURIComponent(url);
  const sc = shortcodeOf(url) || "";
  const fill = (s: string) => s.replace(/\{url\}/g, enc).replace(/\{shortcode\}/g, sc);
  const endpoint = `https://${host}${fill(path)}`;

  const init: RequestInit = {
    method,
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": host,
      accept: "application/json",
      ...(method === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
  };
  if (method === "POST") init.body = fill(bodyTpl || "url={url}");

  // До 2 попыток: API иногда отдаёт временную ошибку/пустоту. На 429 (лимит) не повторяем.
  let json: any;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(endpoint, init);
      if (res.status === 429) {
        console.error("rapidapi ig 429 (лимит)");
        return { media: null, rateLimited: true };
      }
      if (!res.ok) {
        console.error("rapidapi ig", res.status, (await res.text()).slice(0, 200));
        if (attempt === 2) return { media: null, rateLimited: false };
        continue;
      }
      json = await res.json();
      break;
    } catch (e) {
      console.error("rapidapi ig fetch", e);
      if (attempt === 2) return { media: null, rateLimited: false };
    }
  }
  if (!json) return { media: null, rateLimited: false };

  // Достаём поля устойчиво к разной форме ответа разных API.
  let caption = "";
  const cap = deepGet(json, "caption");
  if (typeof cap === "string") caption = cap;
  else if (cap && typeof cap === "object" && typeof cap.text === "string") caption = cap.text;
  if (!caption) {
    const node = deepGet(json, "edge_media_to_caption")?.edges?.[0]?.node?.text;
    if (typeof node === "string") caption = node;
  }
  if (!caption) {
    const ct = deepGet(json, "caption_text");
    if (typeof ct === "string") caption = ct;
  }

  let videoUrl: string | null = deepGet(json, "video_url") || null;
  if (!videoUrl) {
    const vv = deepGet(json, "video_versions");
    if (Array.isArray(vv) && vv[0]?.url) videoUrl = vv[0].url;
  }

  let imageUrl: string | null = deepGet(json, "thumbnail_url") || deepGet(json, "display_url") || null;
  if (!imageUrl) {
    const iv = deepGet(json, "image_versions2") || deepGet(json, "image_versions");
    const cand = iv?.candidates || iv?.items;
    if (Array.isArray(cand) && cand[0]?.url) imageUrl = cand[0].url;
  }

  const uname = deepGet(json, "username") || deepGet(json, "owner_username");
  const author = uname ? "@" + String(uname).replace(/^@/, "") : null;

  // Нечего отдавать — пусть сработает запасной способ.
  if (!caption && !videoUrl && !imageUrl) return { media: null, rateLimited: false };
  return { media: { caption: (caption || "").trim(), imageUrl, videoUrl, author, shortcode: shortcodeOf(url), kind: kindOf(url) }, rateLimited: false };
}

// Способ 2 (запасной): og-теги превью. Работает редко (Instagram чаще отдаёт логин-стену),
// но бесплатно и иногда выручает, если API-ключ не задан или API недоступен.
async function fetchViaOg(url: string): Promise<IgMedia> {
  const res = await fetch(url, {
    headers: {
      // UA «крылатого» бота — Instagram отдаёт ему og-теги для превью ссылок.
      "user-agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "accept-language": "ru,en;q=0.9",
    },
    redirect: "follow",
  });
  const html = await res.text();
  const title = ogTag(html, "title") || "";
  const desc = ogTag(html, "description");
  let caption = captionFromDescription(desc);
  // Заголовок вида «User on Instagram: "подпись"» — иногда подпись полнее в title.
  const tQ = title.match(/["“](.+)["”]\s*$/s);
  if (tQ && tQ[1].length > caption.length) caption = tQ[1].trim();
  const author = (title.match(/^([^•|]+?)\s+(?:on Instagram|в Instagram|on\b)/i)?.[1] || "").trim() || null;
  return {
    caption,
    imageUrl: ogTag(html, "image"),
    videoUrl: ogTag(html, "video") || ogTag(html, "video:url") || ogTag(html, "video:secure_url"),
    author,
    shortcode: shortcodeOf(url),
    kind: kindOf(url),
  };
}

// Сначала пробуем API (если задан ключ), потом — og-теги. Поля API имеют приоритет.
async function fetchIg(url: string): Promise<{ media: IgMedia; rateLimited: boolean }> {
  const api = await fetchViaRapidApi(url).catch(() => ({ media: null, rateLimited: false } as ApiResult));
  const viaApi = api.media;
  if (viaApi && (viaApi.caption || viaApi.videoUrl)) return { media: viaApi, rateLimited: api.rateLimited };

  let viaOg: IgMedia | null = null;
  try {
    viaOg = await fetchViaOg(url);
  } catch (e) {
    if (viaApi) return { media: viaApi, rateLimited: api.rateLimited }; // API хоть что-то дал (например, картинку)
    if (api.rateLimited) return { media: { caption: "", imageUrl: null, videoUrl: null, author: null, shortcode: shortcodeOf(url), kind: kindOf(url) }, rateLimited: true };
    throw e;
  }
  if (!viaApi) return { media: viaOg, rateLimited: api.rateLimited };
  // Объединяем: непустые поля API перекрывают og.
  return {
    media: {
      caption: viaApi.caption || viaOg.caption,
      imageUrl: viaApi.imageUrl || viaOg.imageUrl,
      videoUrl: viaApi.videoUrl || viaOg.videoUrl,
      author: viaApi.author || viaOg.author,
      shortcode: viaApi.shortcode || viaOg.shortcode,
      kind: viaApi.kind,
    },
    rateLimited: api.rateLimited,
  };
}

export type ImportResult =
  | { ok: false; reason: "empty" | "blocked" | "limited" }
  | { ok: true; id: string | null; saved: boolean; item: any | null; analysis: SavedAnalysis; kind: "post" | "reel"; hadTranscript: boolean; videoUrl?: string | null };

// Главная: ссылка Instagram -> контент -> (видео: расшифровка) -> AI-разбор -> запись в saved_items.
export async function importInstagram(userId: string, url: string, locale = "ru"): Promise<ImportResult> {
  let media: IgMedia;
  let rateLimited = false;
  try {
    const r = await fetchIg(url);
    media = r.media;
    rateLimited = r.rateLimited;
  } catch (e) {
    console.error("ig fetch", e);
    return { ok: false, reason: "blocked" };
  }

  // Скачиваем видео (reels): один буфер и для расшифровки звука, и для сохранения файла.
  let transcript = "";
  let videoBuf: Buffer | null = null;
  if (media.videoUrl) {
    try {
      const vr = await fetch(media.videoUrl);
      const len = Number(vr.headers.get("content-length") || "0");
      // До 50 МБ — качаем ради сохранения файла. Расшифровку делаем только на ≤24 МБ
      // (Whisper не принимает файлы больше 25 МБ), но само видео сохраняем и крупнее.
      if (vr.ok && (!len || len < MAX_VIDEO_BYTES)) {
        const buf = Buffer.from(await vr.arrayBuffer());
        if (buf.length <= MAX_VIDEO_BYTES) {
          videoBuf = buf;
          if (buf.length < 24 * 1024 * 1024) transcript = await transcribeFile(buf, "reel.mp4");
        }
      }
    } catch (e) {
      console.error("ig video", e);
    }
  }

  const combined = [media.caption, transcript].filter(Boolean).join("\n\n").trim();
  if (!combined) {
    if (rateLimited) return { ok: false, reason: "limited" };
    return { ok: false, reason: media.videoUrl || media.imageUrl ? "empty" : "blocked" };
  }

  const analysis = await analyzeSaved(combined, userId, locale);

  // Сохраняем превью в bucket 'saved' (ссылки Instagram-CDN протухают).
  let image_url: string | null = null;
  if (media.imageUrl) {
    try {
      const ibuf = Buffer.from(await (await fetch(media.imageUrl)).arrayBuffer());
      const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
      const db = supabaseAdmin();
      const { error } = await db.storage.from("saved").upload(path, ibuf, { contentType: "image/jpeg", upsert: true });
      if (!error) image_url = db.storage.from("saved").getPublicUrl(path).data?.publicUrl || media.imageUrl;
      else image_url = media.imageUrl;
    } catch {
      image_url = media.imageUrl;
    }
  }

  // Сохраняем сам файл видео в bucket 'saved' (ссылки Instagram-CDN протухают).
  let video_url: string | null = null;
  let video_size: number | null = null;
  if (videoBuf) {
    const stored = await uploadVideo(userId, videoBuf);
    if (stored) {
      video_url = stored.url;
      video_size = stored.size;
    }
  }

  const id = await insertSavedItem({
    user_id: userId,
    source: "instagram",
    url,
    shortcode: media.shortcode,
    author: media.author,
    kind: media.kind,
    title: analysis.title,
    topic: analysis.topic,
    summary: analysis.summary,
    key_points: analysis.key_points,
    tags: analysis.tags,
    caption: media.caption || null,
    transcript: transcript || null,
    image_url,
    video_url,
    video_size,
    status: "ok",
  });
  const saved = !!id;

  // Готовая карточка для UI — без повторного чтения БД (не зависит от наличия
  // колонок note/favorite/done/position, которые добавляет миграция).
  const item = saved
    ? {
        id,
        source: "instagram",
        url,
        author: media.author,
        kind: media.kind,
        title: analysis.title,
        topic: analysis.topic,
        summary: analysis.summary,
        key_points: analysis.key_points,
        tags: analysis.tags,
        image_url,
        video_url,
        note: null,
        favorite: false,
        done: false,
        position: 0,
        created_at: new Date().toISOString(),
      }
    : null;

  return { ok: true, id, saved, item, analysis, kind: media.kind, hadTranscript: !!transcript, videoUrl: video_url };
}
