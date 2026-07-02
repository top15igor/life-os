import { supabaseAdmin } from "./supabaseAdmin";
import { analyzeSaved, type SavedAnalysis } from "./ai";
import type { ImportResult } from "./instagram";

// Любая ссылка TikTok: полная (tiktok.com/@user/video/123), мобильная или короткая (vm./vt.).
const TT_RE = /https?:\/\/(?:www\.|vm\.|vt\.|m\.)?tiktok\.com\/[^\s]+/i;

export function extractTiktokUrl(text?: string | null): string | null {
  if (!text) return null;
  const m = text.match(TT_RE);
  return m ? m[0].replace(/[)\].,]+$/, "") : null;
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

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

function shortcodeOf(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/) || url.match(/\/(?:photo)\/(\d+)/);
  return m ? m[1] : null;
}

type TtMedia = { caption: string; imageUrl: string | null; author: string | null; shortcode: string | null };

// Короткие ссылки vm./vt. ведут редиректом на каноничную — раскрываем её.
async function resolveUrl(url: string): Promise<string> {
  try {
    const r = await fetch(url, { redirect: "follow", headers: { "user-agent": UA } });
    return r.url || url;
  } catch {
    return url;
  }
}

// Способ 1: публичный oEmbed TikTok (без ключа) — даёт подпись, автора и обложку.
// Способ 2 (fallback): og-теги страницы.
async function unpackTiktok(url: string): Promise<TtMedia> {
  const full = /vm\.|vt\./i.test(url) ? await resolveUrl(url) : url;

  try {
    const o = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(full)}`, { headers: { "user-agent": UA } }).then((r) => r.json());
    if (o && (o.title || o.thumbnail_url)) {
      return {
        caption: decodeHtml(String(o.title || "")),
        imageUrl: o.thumbnail_url || null,
        author: o.author_name ? String(o.author_name) : null,
        shortcode: shortcodeOf(full),
      };
    }
  } catch {
    /* пробуем og */
  }

  try {
    const html = await fetch(full, { headers: { "user-agent": UA, "accept-language": "ru,en;q=0.9" }, redirect: "follow" }).then((r) => r.text());
    const title = ogTag(html, "title") || "";
    const desc = ogTag(html, "description") || "";
    let author = (title.match(/^(.+?)\s+(?:on TikTok|в TikTok|\| TikTok)/i)?.[1] || "").trim() || null;
    let caption = (desc || title).trim();
    let image = ogTag(html, "image");
    // Способ 3: photo-посты (oEmbed → 400, og-теги пусты) — подпись/автор из встроенного
    // JSON страницы. Без этого слайдшоу-посты не сохранялись вообще.
    if (!caption || /^tiktok\b/i.test(caption) || /make your day/i.test(caption)) {
      const j = extractTiktokJson(html);
      if (j.caption) caption = j.caption;
      if (!author && j.author) author = j.author;
      if (!image && j.image) image = j.image;
    }
    return { caption, imageUrl: image, author, shortcode: shortcodeOf(full) };
  } catch {
    return { caption: "", imageUrl: null, author: null, shortcode: shortcodeOf(full) };
  }
}

function jsonUnescape(s: string): string {
  try { return JSON.parse('"' + s + '"'); } catch { return s; }
}

// Подпись/автор/обложка из встроенного JSON страницы TikTok (для photo-постов).
function extractTiktokJson(html: string): { caption: string | null; author: string | null; image: string | null } {
  const descs = [...html.matchAll(/"desc":"((?:[^"\\]|\\.)*)"/g)].map((m) => jsonUnescape(m[1]).trim()).filter((d) => d.length > 3);
  const clean = descs.filter((d) => !/^(лайки|likes|reproduc|j'aime|aime|\d)/i.test(d)).sort((a, b) => b.length - a.length);
  const caption = clean[0] || descs.sort((a, b) => b.length - a.length)[0] || null;
  const author = /"uniqueId":"([^"]+)"/.exec(html)?.[1] || /"nickname":"((?:[^"\\]|\\.)+)"/.exec(html)?.[1] || null;
  const cover = /"(?:originCover|cover|dynamicCover)":"((?:[^"\\]|\\.)+)"/.exec(html)?.[1];
  const image = cover ? jsonUnescape(cover) : null;
  return { caption, author: author ? jsonUnescape(author) : null, image };
}

// Главная: ссылка TikTok -> подпись/автор/обложка -> AI-разбор -> запись в saved_items.
export async function importTiktok(userId: string, url: string, locale = "ru"): Promise<ImportResult> {
  let media: TtMedia;
  try {
    media = await unpackTiktok(url);
  } catch (e) {
    console.error("tt fetch", e);
    return { ok: false, reason: "blocked" };
  }

  const caption = media.caption.trim();
  if (!caption) return { ok: false, reason: media.imageUrl ? "empty" : "blocked" };

  const analysis = await analyzeSaved(caption, userId, locale);

  // Обложку перекладываем в bucket 'saved' (ссылки TikTok-CDN протухают).
  let image_url: string | null = null;
  if (media.imageUrl) {
    try {
      const ibuf = Buffer.from(await (await fetch(media.imageUrl, { headers: { "user-agent": UA } })).arrayBuffer());
      const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
      const db = supabaseAdmin();
      const { error } = await db.storage.from("saved").upload(path, ibuf, { contentType: "image/jpeg", upsert: true });
      image_url = !error ? db.storage.from("saved").getPublicUrl(path).data?.publicUrl || media.imageUrl : media.imageUrl;
    } catch {
      image_url = media.imageUrl;
    }
  }

  let id: string | null = null;
  let saved = false;
  try {
    const { data, error } = await supabaseAdmin()
      .from("saved_items")
      .insert({
        user_id: userId,
        source: "tiktok",
        url,
        shortcode: media.shortcode,
        author: media.author,
        kind: "video",
        title: analysis.title,
        topic: analysis.topic,
        summary: analysis.summary,
        key_points: analysis.key_points,
        tags: analysis.tags,
        caption: caption || null,
        transcript: null,
        image_url,
        status: "ok",
      })
      .select("id")
      .single();
    if (error) throw error;
    id = (data as any)?.id || null;
    saved = !!id;
  } catch (e) {
    console.error("tt insert", e);
  }

  const item = saved
    ? { id, source: "tiktok", url, author: media.author, kind: "video", title: analysis.title, topic: analysis.topic, summary: analysis.summary, key_points: analysis.key_points, tags: analysis.tags, image_url, note: null, favorite: false, done: false, position: 0, created_at: new Date().toISOString() }
    : null;

  return { ok: true, id, saved, item, analysis, kind: "post", hadTranscript: false };
}
