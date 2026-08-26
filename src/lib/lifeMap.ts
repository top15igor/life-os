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
  url: string | null;
  title: string;
  place: string | null;
  date: string | null; // ISO, момент съёмки
  note: string | null;
};

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
      .select("id, title, summary, image_url, mem_date, shot_at, created_at, lat, lng, place_name, note")
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
export type Orphan = { id: string; url: string | null; title: string; date: string | null };

export async function getPhotosWithoutGeo(userId: string, limit = 60): Promise<{ items: Orphan[]; total: number }> {
  try {
    const { data, error, count } = await supabaseAdmin()
      .from("memories")
      .select("id, title, summary, image_url, mem_date, shot_at, created_at", { count: "exact" })
      .eq("user_id", userId)
      .not("image_url", "is", null)
      .is("lat", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    const rows = (data as any[]) || [];
    const items = await Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        url: r.image_url ? await signForWeb(r.image_url) : null,
        title: r.title || r.summary || "",
        date: dateOf(r),
      })),
    );
    return { items, total: count || items.length };
  } catch {
    return { items: [], total: 0 };
  }
}
