import { supabaseAdmin } from "./supabaseAdmin";
import { analyzeSaved } from "./ai";
import type { ImportResult } from "./instagram";
import { insertSavedItem } from "./savedItems";

// Ссылки Facebook: пост, видео, reel, короткая share-ссылка, fb.watch.
// Не ловим служебные адреса вроде facebook.com/login или /settings — там нечего сохранять.
const FB_RE = /https?:\/\/(?:www\.|m\.|web\.|mbasic\.)?(?:facebook\.com|fb\.watch|fb\.me)\/[^\s]+/i;
const FB_SKIP = /facebook\.com\/(?:login|settings|privacy|policies|help|terms|marketplace\/?$)/i;

export function extractFacebookUrl(text?: string | null): string | null {
  if (!text) return null;
  const m = text.match(FB_RE);
  if (!m) return null;
  const url = m[0].replace(/[)\].,]+$/, "");
  if (FB_SKIP.test(url)) return null;
  return url;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (h, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch { return h; } })
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(Number(n)); } catch { return _; } })
    .replace(/&amp;/g, "&");
}

function ogTag(html: string, prop: string): string | null {
  const a = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']*)["']`, "i"));
  if (a) return decodeHtml(a[1]);
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:${prop}["']`, "i"));
  return b ? decodeHtml(b[1]) : null;
}

// Обычному браузеру Facebook отдаёт пустую страницу-редирект без единого og-тега,
// зато своему же краулеру — полный набор: заголовок, описание, обложку.
// Поэтому представляемся именно так (это публичный, документированный UA Facebook).
const FB_UA = "facebookexternalhit/1.1";

// «269 K vues · 13 K réactions | Настоящий текст поста» — счётчики просмотров и
// реакций Facebook приклеивает к заголовку. В базу знаний нужен только текст.
function stripCounters(title: string): string {
  const parts = title.split("|");
  if (parts.length > 1 && /\d/.test(parts[0]) && parts[0].length < 90) {
    return parts.slice(1).join("|").trim();
  }
  return title.trim();
}

// Автор поста — из заголовка страницы или из адреса профиля.
function authorOf(html: string, url: string): string | null {
  const site = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i);
  if (site && !/facebook/i.test(site[1])) return decodeHtml(site[1]);
  const named = url.match(/facebook\.com\/([A-Za-z0-9._-]+)\/(?:posts|videos|reel|photos)/i);
  if (named && !/^\d+$/.test(named[1])) return named[1];
  return null;
}

type FbMedia = { caption: string; imageUrl: string | null; author: string | null; canonical: string; kind: "video" | "post" };

async function unpackFacebook(url: string): Promise<FbMedia> {
  const html = await fetch(url, {
    headers: { "user-agent": FB_UA, "accept-language": "ru,en;q=0.9" },
    redirect: "follow",
  }).then((r) => r.text());

  const title = stripCounters(ogTag(html, "title") || "");
  const desc = (ogTag(html, "description") || "").trim();
  // Заголовок обычно длиннее описания (описание Facebook обрезает многоточием) —
  // берём то, где текста больше.
  const caption = (title.length >= desc.length ? title : desc).trim();
  const type = (ogTag(html, "type") || "").toLowerCase();

  return {
    caption,
    imageUrl: ogTag(html, "image"),
    author: authorOf(html, ogTag(html, "url") || url),
    canonical: ogTag(html, "url") || url,
    kind: type.includes("video") ? "video" : "post",
  };
}

// Главная: ссылка Facebook -> текст/обложка -> AI-разбор -> запись в базу знаний.
// Видеофайл не забираем: Facebook не отдаёт прямую ссылку краулеру, поэтому
// сохраняем смысл и обложку, а сам ролик открывается по исходной ссылке.
export async function importFacebook(userId: string, url: string, locale = "ru"): Promise<ImportResult> {
  let media: FbMedia;
  try {
    media = await unpackFacebook(url);
  } catch (e) {
    console.error("fb fetch", e);
    return { ok: false, reason: "blocked" };
  }

  const caption = media.caption.trim();
  // Закрытая группа или удалённый пост — текста нет, и придумывать нечего.
  if (!caption || /^(facebook|log in|войти|se connecter)$/i.test(caption)) {
    return { ok: false, reason: media.imageUrl ? "empty" : "blocked" };
  }

  const analysis = await analyzeSaved(caption, userId, locale);

  // Обложку перекладываем к себе: ссылки fbcdn протухают через несколько часов.
  let image_url: string | null = null;
  if (media.imageUrl) {
    try {
      const ibuf = Buffer.from(await (await fetch(media.imageUrl, { headers: { "user-agent": FB_UA } })).arrayBuffer());
      const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
      const db = supabaseAdmin();
      const { error } = await db.storage.from("saved").upload(path, ibuf, { contentType: "image/jpeg", upsert: true });
      image_url = !error ? db.storage.from("saved").getPublicUrl(path).data?.publicUrl || media.imageUrl : media.imageUrl;
    } catch {
      image_url = media.imageUrl;
    }
  }

  const id = await insertSavedItem({
    user_id: userId,
    source: "facebook",
    url,
    shortcode: null,
    author: media.author,
    kind: media.kind,
    title: analysis.title,
    topic: analysis.topic,
    summary: analysis.summary,
    key_points: analysis.key_points,
    tags: analysis.tags,
    caption: caption || null,
    transcript: null,
    image_url,
    video_url: null,
    video_size: null,
    status: "ok",
  });
  const saved = !!id;

  const item = saved
    ? { id, source: "facebook", url, author: media.author, kind: media.kind, title: analysis.title, topic: analysis.topic, summary: analysis.summary, key_points: analysis.key_points, tags: analysis.tags, image_url, video_url: null, note: null, favorite: false, done: false, position: 0, created_at: new Date().toISOString() }
    : null;

  return { ok: true, id, saved, item, analysis, kind: "post", hadTranscript: false };
}
