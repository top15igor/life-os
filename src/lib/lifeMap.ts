// Карта жизни: все точки, где человек был, — по фотографиям.
//
// Источника два, и оба необязательные:
//   memories — снимки, присланные боту и загруженные на сайте (главный);
//   photos   — домашний фотоархив, если модуль фотоархива подключён.
// Если таблицы или колонок ещё нет (миграция не применена), возвращаем пустой
// список, а не роняем страницу.

import { supabaseAdmin } from "./supabaseAdmin";
import { signForWeb } from "./fileLink";

export type MapPoint = {
  id: string;
  kind: "memory" | "photo";
  lat: number;
  lng: number;
  url: string | null;      // картинка: сам снимок или кадр-обложка ролика
  video: string | null;    // ссылка на ролик, если это видео
  title: string;
  place: string | null;
  date: string | null;     // ISO, момент съёмки
  note: string | null;
};

// Что человек считает «своей жизнью на карте»: моменты, места, люди, вещи.
// Чеки, договоры и скриншоты — не про место, и в списке «фото без точки» они
// только мешают: их там сотни, а поставить их на карту никто не захочет.
const OFF_MAP_CATEGORIES = ["document", "info"];

const MAX_POINTS = 2000;

function dateOf(row: any): string | null {
  const raw = row.shot_at || row.captured_at || row.mem_date || row.created_at || null;
  if (!raw) return null;
  try {
    return new Date(raw).toISOString();
  } catch {
    return null;
  }
}

async function fromMemories(userId: string): Promise<MapPoint[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("memories")
      .select("id, title, summary, image_url, file_url, mime_type, mem_date, shot_at, created_at, lat, lng, place_name, note")
      .eq("user_id", userId)
      .not("lat", "is", null)
      .order("created_at", { ascending: false })
      .limit(MAX_POINTS);
    if (error) throw error;
    const rows = (data as any[]) || [];
    return await Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        kind: "memory" as const,
        lat: Number(r.lat),
        lng: Number(r.lng),
        url: r.image_url ? await signForWeb(r.image_url) : null,
        video: String(r.mime_type || "").startsWith("video/") && r.file_url ? await signForWeb(r.file_url) : null,
        title: r.title || r.summary || "",
        place: r.place_name || null,
        date: dateOf(r),
        note: r.note || null,
      })),
    );
  } catch {
    return [];
  }
}

async function fromArchive(userId: string): Promise<MapPoint[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("photos")
      .select("id, caption, thumb_url, captured_at, created_at, gps_lat, gps_lng, location_city, location_country, note")
      .eq("user_id", userId)
      .not("gps_lat", "is", null)
      .order("captured_at", { ascending: false })
      .limit(MAX_POINTS);
    if (error) throw error;
    const rows = (data as any[]) || [];
    return await Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        kind: "photo" as const,
        lat: Number(r.gps_lat),
        lng: Number(r.gps_lng),
        url: r.thumb_url ? await signForWeb(r.thumb_url) : null,
        video: null,
        title: r.caption || "",
        place: [r.location_city, r.location_country].filter(Boolean).join(", ") || null,
        date: dateOf(r),
        note: r.note || null,
      })),
    );
  } catch {
    return [];
  }
}

export async function getMapPoints(userId: string): Promise<MapPoint[]> {
  const [a, b] = await Promise.all([fromMemories(userId), fromArchive(userId)]);
  const all = [...a, ...b].filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  // По времени съёмки: карта рисует маршрут именно в этом порядке.
  return all.sort((x, y) => (x.date || "").localeCompare(y.date || ""));
}

// Снимки, которые ждут своей точки: координат в файле не было (Telegram их
// вырезает из сжатых картинок), поэтому на карту фото поставит сам человек —
// выбрал снимок, ткнул в место. Без этого списка карта у большинства осталась
// бы почти пустой.
export type Orphan = { id: string; url: string | null; video: string | null; title: string; date: string | null };

export async function getPhotosWithoutGeo(userId: string, limit = 60): Promise<{ items: Orphan[]; total: number }> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("memories")
      .select("id, title, summary, image_url, file_url, mime_type, mem_date, shot_at, created_at")
      .eq("user_id", userId)
      .is("lat", null)
      // Пустая категория — тоже «не документ»: у старых записей её просто нет,
      // и терять их из-за этого нельзя.
      .or(`category.is.null,category.not.in.(${OFF_MAP_CATEGORIES.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(limit * 3);
    if (error) throw error;
    const rows = ((data as any[]) || []).filter(
      (r) => r.image_url || String(r.mime_type || "").startsWith("video/"),
    );
    const items = await Promise.all(
      rows.slice(0, limit).map(async (r) => ({
        id: r.id,
        url: r.image_url ? await signForWeb(r.image_url) : null,
        video: String(r.mime_type || "").startsWith("video/") && r.file_url ? await signForWeb(r.file_url) : null,
        title: r.title || r.summary || "",
        date: dateOf(r),
      })),
    );
    // Счётчик — по тому же правилу, что и список: обещать «26 фото» и показать
    // из них только снимки было бы обманом.
    return { items, total: rows.length };
  } catch {
    return { items: [], total: 0 };
  }
}

// Вся лента снимков и роликов — и те, что уже стоят точками, и те, что ещё нет.
// Нужна для полки «Все фото и видео» под картой: нажал на кадр — карта показала
// его место (а если места нет, предложила поставить точку).
export type MediaItem = {
  id: string;
  url: string | null;
  video: string | null;
  title: string;
  date: string | null;
  lat: number | null;
  lng: number | null;
};

export async function getAllMedia(userId: string, limit = 200): Promise<MediaItem[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("memories")
      .select("id, title, summary, image_url, file_url, mime_type, mem_date, shot_at, created_at, lat, lng")
      .eq("user_id", userId)
      .or(`category.is.null,category.not.in.(${OFF_MAP_CATEGORIES.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(limit * 2);
    if (error) throw error;
    const rows = ((data as any[]) || []).filter(
      (r) => r.image_url || String(r.mime_type || "").startsWith("video/"),
    );
    return await Promise.all(
      rows.slice(0, limit).map(async (r) => ({
        id: r.id,
        url: r.image_url ? await signForWeb(r.image_url) : null,
        video: String(r.mime_type || "").startsWith("video/") && r.file_url ? await signForWeb(r.file_url) : null,
        title: r.title || r.summary || "",
        date: dateOf(r),
        lat: r.lat === null || r.lat === undefined ? null : Number(r.lat),
        lng: r.lng === null || r.lng === undefined ? null : Number(r.lng),
      })),
    );
  } catch {
    return [];
  }
}
