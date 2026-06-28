import { analyzeSaved } from "./ai";
import { supabaseAdmin } from "./supabaseAdmin";
import type { ImportResult } from "./instagram";

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

async function ytFetch(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9", cookie: "CONSENT=YES+1" },
    redirect: "follow",
  });
  return res.text();
}

// Достать текст субтитров из выбранного трека (XML вида <text ...>...</text>).
async function fetchTranscript(tracks: any[]): Promise<string> {
  const track = tracks.find((t) => t?.baseUrl);
  if (!track) return "";
  const url = decodeEntities(String(track.baseUrl));
  const xml = await (await fetch(url, { headers: { "user-agent": UA } })).text();
  const parts = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) =>
    decodeEntities(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
  );
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export type YtMedia = { title: string; author: string | null; description: string; thumbnail: string | null; transcript: string; kind: "video" | "short" };

export async function unpackYoutube(url: string, kind: "video" | "short"): Promise<YtMedia> {
  let title = "", author: string | null = null, description = "", thumbnail: string | null = null, transcript = "";

  // 1) Страница видео — заголовок, автор, описание, субтитры.
  try {
    const html = await ytFetch(url + "&hl=en");
    const raw = extractJsonObject(html, "ytInitialPlayerResponse");
    if (raw) {
      const pr = JSON.parse(raw);
      const vd = pr?.videoDetails || {};
      title = vd.title || "";
      author = vd.author || null;
      description = vd.shortDescription || "";
      const th = vd.thumbnail?.thumbnails;
      if (Array.isArray(th) && th.length) thumbnail = th[th.length - 1]?.url || null;
      const tracks = pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(tracks) && tracks.length) {
        try { transcript = await fetchTranscript(tracks); } catch (e) { console.error("yt transcript", e); }
      }
    }
  } catch (e) {
    console.error("yt watch", e);
  }

  // 2) oEmbed (без ключа) — надёжный запас для заголовка/автора/превью.
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

  return { title, author, description, thumbnail, transcript, kind };
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

  let id: string | null = null;
  let saved = false;
  try {
    const { data, error } = await supabaseAdmin()
      .from("saved_items")
      .insert({
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
        status: content ? "ok" : "review",
      })
      .select("id")
      .single();
    if (error) throw error;
    id = (data as any)?.id || null;
    saved = !!id;
  } catch (e) {
    console.error("yt insert", e);
  }

  const item = saved
    ? {
        id, source: "youtube", url, author: media.author, kind,
        title: analysis.title, topic: analysis.topic, summary: analysis.summary,
        key_points: analysis.key_points, tags: analysis.tags, image_url: media.thumbnail,
        note: null, favorite: false, done: false, position: 0, created_at: new Date().toISOString(),
      }
    : null;

  // kind в ImportResult нужен только для IG-сообщения «звук не достал» — для YouTube не шлём.
  return { ok: true, id, saved, item, analysis, kind: "post", hadTranscript: !!media.transcript };
}
