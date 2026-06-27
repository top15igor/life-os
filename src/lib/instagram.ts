import { supabaseAdmin } from "./supabaseAdmin";
import { transcribeFile } from "./transcribe";
import { analyzeSaved, type SavedAnalysis } from "./ai";

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

async function fetchIg(url: string): Promise<IgMedia> {
  const kind: "post" | "reel" = /\/reels?\//i.test(url) || /\/tv\//i.test(url) ? "reel" : "post";
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
    kind,
  };
}

export type ImportResult =
  | { ok: false; reason: "empty" | "blocked" }
  | { ok: true; id: string | null; analysis: SavedAnalysis; kind: "post" | "reel"; hadTranscript: boolean };

// Главная: ссылка Instagram -> контент -> (видео: расшифровка) -> AI-разбор -> запись в saved_items.
export async function importInstagram(userId: string, url: string): Promise<ImportResult> {
  let media: IgMedia;
  try {
    media = await fetchIg(url);
  } catch (e) {
    console.error("ig fetch", e);
    return { ok: false, reason: "blocked" };
  }

  // Расшифровка звука видео (reels), если ссылку на файл удалось получить.
  let transcript = "";
  if (media.videoUrl) {
    try {
      const buf = Buffer.from(await (await fetch(media.videoUrl)).arrayBuffer());
      transcript = await transcribeFile(buf, "reel.mp4");
    } catch (e) {
      console.error("ig transcribe", e);
    }
  }

  const combined = [media.caption, transcript].filter(Boolean).join("\n\n").trim();
  if (!combined) return { ok: false, reason: media.videoUrl || media.imageUrl ? "empty" : "blocked" };

  const analysis = await analyzeSaved(combined, userId);

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

  let id: string | null = null;
  try {
    const { data } = await supabaseAdmin()
      .from("saved_items")
      .insert({
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
        status: "ok",
      })
      .select("id")
      .single();
    id = (data as any)?.id || null;
  } catch (e) {
    console.error("ig insert", e);
  }

  return { ok: true, id, analysis, kind: media.kind, hadTranscript: !!transcript };
}
