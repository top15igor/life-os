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

type IgMedia = { caption: string; imageUrl: string | null; imageUrls: string[]; videoUrl: string | null; author: string | null; shortcode: string | null; kind: "post" | "reel" };

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

// Собрать все кадры карусельного поста (несколько фото/видео в одном посте).
// Разные Instagram-API кладут элементы под разными ключами (carousel_media / edges),
// а внутри — image_versions2.candidates / display_url и video_versions. Берём первый
// (самый крупный) url каждого кадра.
function collectCarousel(json: any): { images: string[]; videos: string[] } {
  const images: string[] = [];
  const videos: string[] = [];
  // Разные Instagram-API называют массив кадров по-разному — пробуем известные ключи.
  let nodes: any = null;
  for (const key of ["carousel_media", "sidecar_children", "resources", "carousel", "medias"]) {
    const found = deepGet(json, key);
    if (Array.isArray(found) && found.length) { nodes = found; break; }
    if (found && !Array.isArray(found) && Array.isArray(found.edges)) { nodes = found.edges.map((e: any) => e?.node).filter(Boolean); break; }
  }
  if (!Array.isArray(nodes)) {
    const edges = deepGet(json, "edge_sidecar_to_children")?.edges;
    if (Array.isArray(edges)) nodes = edges.map((e: any) => e?.node).filter(Boolean);
  }
  if (!Array.isArray(nodes) || !nodes.length) return { images, videos };
  const pickImg = (n: any): string | null => {
    const iv = n?.image_versions2 || n?.image_versions || n?.image;
    const cand = iv?.candidates || iv?.items || (Array.isArray(iv) ? iv : null);
    if (Array.isArray(cand) && cand[0]?.url) return cand[0].url;
    if (typeof n?.display_url === "string") return n.display_url;
    if (typeof n?.thumbnail_url === "string") return n.thumbnail_url;
    if (typeof n?.display_src === "string") return n.display_src;
    if (typeof n?.image_url === "string") return n.image_url;
    // Крайняя мера — первый глубокий candidates[].url внутри узла (формат API может отличаться).
    const deepCand = deepGet(n, "candidates");
    if (Array.isArray(deepCand) && deepCand[0]?.url) return deepCand[0].url;
    return null;
  };
  const pickVid = (n: any): string | null => {
    const vv = n?.video_versions;
    if (Array.isArray(vv) && vv[0]?.url) return vv[0].url;
    if (typeof n?.video_url === "string") return n.video_url;
    const dv = deepGet(n, "video_versions");
    if (Array.isArray(dv) && dv[0]?.url) return dv[0].url;
    return null;
  };
  for (const n of nodes) {
    const v = pickVid(n);
    if (v) videos.push(v);
    const img = pickImg(n);
    if (img) images.push(img);
  }
  return { images, videos };
}

type ApiResult = { media: IgMedia | null; rateLimited: boolean; notFound?: boolean };

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
  // Чистим ссылку от query (?img_index=2&igsh=…): некоторые API по img_index
  // отдают ТОЛЬКО один кадр карусели вместо всего поста.
  const cleanUrl = url.replace(/\?.*$/, "");
  const enc = encodeURIComponent(cleanUrl);
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

  // Карусель (несколько фото/видео в одном посте) — забираем ВСЕ кадры, чтобы, как
  // Save As Bot, вернуть пользователю альбом целиком, а не одну обложку.
  const carousel = collectCarousel(json);
  let imageUrls = carousel.images;
  if (!imageUrls.length && imageUrl) imageUrls = [imageUrl];
  if (!videoUrl && carousel.videos[0]) videoUrl = carousel.videos[0];

  const uname = deepGet(json, "username") || deepGet(json, "owner_username");
  const author = uname ? "@" + String(uname).replace(/^@/, "") : null;

  // Некоторые API на удалённый/приватный/несуществующий пост отвечают 200 и телом-ошибкой
  // вида {detail:"Not found"} — контента нет. Отмечаем это, чтобы показать понятное сообщение.
  const detail = deepGet(json, "detail") ?? deepGet(json, "message") ?? deepGet(json, "error");
  const hasErrorDetail = typeof detail === "string" && detail.length > 0;

  // Нечего отдавать — пусть сработает запасной способ.
  if (!caption && !videoUrl && !imageUrl && !imageUrls.length) return { media: null, rateLimited: false, notFound: hasErrorDetail };
  return { media: { caption: (caption || "").trim(), imageUrl: imageUrl || imageUrls[0] || null, imageUrls, videoUrl, author, shortcode: shortcodeOf(url), kind: kindOf(url) }, rateLimited: false };
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
  const ogImage = ogTag(html, "image");
  return {
    caption,
    imageUrl: ogImage,
    imageUrls: ogImage ? [ogImage] : [],  // og-теги отдают только обложку — один кадр
    videoUrl: ogTag(html, "video") || ogTag(html, "video:url") || ogTag(html, "video:secure_url"),
    author,
    shortcode: shortcodeOf(url),
    kind: kindOf(url),
  };
}

// Сначала пробуем API (если задан ключ), потом — og-теги. Поля API имеют приоритет.
async function fetchIg(url: string): Promise<{ media: IgMedia; rateLimited: boolean; notFound: boolean }> {
  const api = await fetchViaRapidApi(url).catch(() => ({ media: null, rateLimited: false } as ApiResult));
  const viaApi = api.media;
  const emptyMedia = (): IgMedia => ({ caption: "", imageUrl: null, imageUrls: [], videoUrl: null, author: null, shortcode: shortcodeOf(url), kind: kindOf(url) });
  if (viaApi && (viaApi.caption || viaApi.videoUrl)) return { media: viaApi, rateLimited: api.rateLimited, notFound: false };

  let viaOg: IgMedia | null = null;
  try {
    viaOg = await fetchViaOg(url);
  } catch (e) {
    if (viaApi) return { media: viaApi, rateLimited: api.rateLimited, notFound: false }; // API хоть что-то дал (например, картинку)
    if (api.rateLimited) return { media: emptyMedia(), rateLimited: true, notFound: false };
    if (api.notFound) return { media: emptyMedia(), rateLimited: false, notFound: true }; // пост удалён/приватный
    throw e;
  }
  if (!viaApi) return { media: viaOg, rateLimited: api.rateLimited, notFound: !!api.notFound && !viaOg.caption && !viaOg.videoUrl && !viaOg.imageUrl };
  // Объединяем: непустые поля API перекрывают og.
  return {
    media: {
      caption: viaApi.caption || viaOg.caption,
      imageUrl: viaApi.imageUrl || viaOg.imageUrl,
      imageUrls: viaApi.imageUrls.length ? viaApi.imageUrls : viaOg.imageUrls,
      videoUrl: viaApi.videoUrl || viaOg.videoUrl,
      author: viaApi.author || viaOg.author,
      shortcode: viaApi.shortcode || viaOg.shortcode,
      kind: viaApi.kind,
    },
    rateLimited: api.rateLimited,
    notFound: false,
  };
}

// Диагностика (owner-only, команда /igdebug): показывает, ЧТО именно вернул RapidAPI
// на пост — структуру ответа (ключи и длины массивов) и результат разбора карусели.
// Нужна, чтобы понять, отдаёт ли конкретный API все кадры карусели и под каким ключом.
function schemaOf(v: any, depth = 0, maxDepth = 4): string {
  if (depth > maxDepth) return "…";
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return `[${v.length}]${v.length ? " of " + schemaOf(v[0], depth + 1, maxDepth) : ""}`;
  if (typeof v === "object") {
    const keys = Object.keys(v);
    return "{" + keys.slice(0, 40).map((k) => `${k}:${schemaOf(v[k], depth + 1, maxDepth)}`).join(", ") + (keys.length > 40 ? ", …" : "") + "}";
  }
  if (typeof v === "string") return "str";
  return typeof v;
}

export async function igDebug(url: string): Promise<string> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return "RAPIDAPI_KEY не задан — используется только og-путь (одна обложка).";
  const host = process.env.RAPIDAPI_INSTAGRAM_HOST || "instagram-scraper-api2.p.rapidapi.com";
  const path = process.env.RAPIDAPI_INSTAGRAM_PATH || "/v1/post_info?code_or_id_or_url={url}";
  const bodyTpl = process.env.RAPIDAPI_INSTAGRAM_BODY || "";
  const method = (process.env.RAPIDAPI_INSTAGRAM_METHOD || (bodyTpl ? "POST" : "GET")).toUpperCase();
  const cleanUrl = url.replace(/\?.*$/, "");
  const enc = encodeURIComponent(cleanUrl);
  const sc = shortcodeOf(url) || "";
  const fill = (s: string) => s.replace(/\{url\}/g, enc).replace(/\{shortcode\}/g, sc);
  const endpoint = `https://${host}${fill(path)}`;
  const init: RequestInit = {
    method,
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": host, accept: "application/json", ...(method === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
  };
  if (method === "POST") init.body = fill(bodyTpl || "url={url}");
  try {
    const res = await fetch(endpoint, init);
    if (!res.ok) return `HTTP ${res.status}\nendpoint: ${host}${fill(path)}\n${(await res.text()).slice(0, 400)}`;
    const json = await res.json();
    const car = collectCarousel(json);
    const schema = schemaOf(json).slice(0, 2200);
    // Сырой ответ целиком (обрезанный) — чтобы видеть значения полей вроде detail/message
    // (туда API кладёт текст ошибки), а не только их типы.
    const raw = JSON.stringify(json).slice(0, 1200);
    return [
      `HTTP 200 · host=${host}`,
      `carousel: images=${car.images.length}, videos=${car.videos.length}`,
      `top keys: ${Object.keys(json || {}).join(", ")}`,
      `RAW: ${raw}`,
      `SCHEMA:`,
      schema,
    ].join("\n");
  } catch (e) {
    return `fetch error: ${String(e).slice(0, 300)}`;
  }
}

export type ImportResult =
  | { ok: false; reason: "empty" | "blocked" | "limited" | "notfound" }
  | { ok: true; id: string | null; saved: boolean; item: any | null; analysis: SavedAnalysis; kind: "post" | "reel"; hadTranscript: boolean; videoUrl?: string | null; imageUrls?: string[]; saveError?: string | null };

// Главная: ссылка Instagram -> контент -> (видео: расшифровка) -> AI-разбор -> запись в saved_items.
export async function importInstagram(userId: string, url: string, locale = "ru"): Promise<ImportResult> {
  let media: IgMedia;
  let rateLimited = false;
  let notFound = false;
  try {
    const r = await fetchIg(url);
    media = r.media;
    rateLimited = r.rateLimited;
    notFound = r.notFound;
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
  const hasMedia = media.imageUrls.length > 0 || !!media.imageUrl || !!media.videoUrl || !!videoBuf;
  if (!combined && !hasMedia) {
    if (rateLimited) return { ok: false, reason: "limited" };
    if (notFound) return { ok: false, reason: "notfound" };
    return { ok: false, reason: "blocked" };
  }

  // Если есть текст — раскладываем его AI. Если текста нет, но есть медиа — не бросаем
  // пост, а сохраняем его как Save As Bot (по автору/типу), чтобы фото/видео не потерялись.
  const analysis: SavedAnalysis = combined
    ? await analyzeSaved(combined, userId, locale)
    : { title: media.author ? `${media.kind === "reel" ? "Reel" : "Пост"} ${media.author}` : (media.kind === "reel" ? "Сохранённое видео" : "Сохранённый пост"), topic: "", summary: "", key_points: [], tags: [] };

  // Сохраняем все кадры в bucket 'saved' (ссылки Instagram-CDN протухают).
  // Первый кадр остаётся в image_url (обложка/совместимость), остальные — в image_urls.
  const db = supabaseAdmin();
  const storeImage = async (srcUrl: string): Promise<string> => {
    try {
      const ibuf = Buffer.from(await (await fetch(srcUrl)).arrayBuffer());
      const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
      const { error } = await db.storage.from("saved").upload(path, ibuf, { contentType: "image/jpeg", upsert: true });
      if (!error) return db.storage.from("saved").getPublicUrl(path).data?.publicUrl || srcUrl;
    } catch { /* оставляем исходную ссылку */ }
    return srcUrl;
  };
  const srcImages = media.imageUrls.length ? media.imageUrls : (media.imageUrl ? [media.imageUrl] : []);
  // Храним всю карусель (до 20 кадров — потолок Instagram), но грузим параллельно,
  // чтобы не упереться в таймаут serverless-функции. Порядок кадров сохраняется.
  const storedImages: string[] = await Promise.all(srcImages.slice(0, 20).map(storeImage));
  const image_url: string | null = storedImages[0] || null;

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

  let saveError: string | null = null;
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
    image_urls: storedImages.length ? storedImages : null,
    video_url,
    video_size,
    status: "ok",
  }, (m) => { saveError = m; });
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
        image_urls: storedImages.length ? storedImages : null,
        video_url,
        note: null,
        favorite: false,
        done: false,
        position: 0,
        created_at: new Date().toISOString(),
      }
    : null;

  return { ok: true, id, saved, item, analysis, kind: media.kind, hadTranscript: !!transcript, videoUrl: video_url, imageUrls: storedImages, saveError };
}
