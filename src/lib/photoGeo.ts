// Точка на карте жизни: откуда у фотографии берутся координаты и как они
// сохраняются рядом с самим снимком.
//
// Источников три, по убыванию точности:
//   exif     — координаты внутри файла (снимок «файлом» в боте, загрузка с сайта);
//   telegram — человек прислал геометку следом за фото;
//   caption  — в подписи назвал место, и мы его геокодировали.
//
// Название места («Биарриц, Франция») получаем обратным геокодированием — оно
// нужно только для подписи под точкой, сама точка живёт по координатам.

import { supabaseAdmin } from "./supabaseAdmin";
import { readExif } from "./exif";
import { readVideoMeta } from "./videoMeta";
import { geocodeName } from "./geocode";

export type GeoSource = "exif" | "telegram" | "caption" | "manual";
export type PhotoPoint = { lat: number; lng: number; place: string | null; source: GeoSource; shotAt?: string | null };

// Название точки по координатам. Без ключа Google тихо отдаём null:
// точка всё равно встанет на карту, просто без подписи.
export async function placeNameAt(lat: number, lng: number, lang = "ru"): Promise<string | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return placeNameOsm(lat, lng, lang);
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=${encodeURIComponent(lang)}&key=${key}`;
    const r = await fetch(url).then((x) => x.json());
    if (r?.status !== "OK" || !Array.isArray(r.results) || !r.results.length) return placeNameOsm(lat, lng, lang);
    // Ищем человеческое имя: город, потом район, потом страна. Полный адрес с
    // номером дома под точкой на карте не нужен.
    const want = ["locality", "postal_town", "administrative_area_level_2", "administrative_area_level_1", "country"];
    const comps: any[] = r.results.flatMap((res: any) => res.address_components || []);
    const city = want.map((t) => comps.find((c) => (c.types || []).includes(t))?.long_name).find(Boolean) || null;
    const country = comps.find((c) => (c.types || []).includes("country"))?.long_name || null;
    if (city && country && city !== country) return `${city}, ${country}`;
    return city || country || null;
  } catch {
    return null;
  }
}

// Название места без ключа Google — через общий поиск OpenStreetMap. Без него
// точки на карте оставались безымянными у всех, у кого ключа нет.
async function placeNameOsm(lat: number, lng: number, lang: string): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&accept-language=${encodeURIComponent(lang)}&lat=${lat}&lon=${lng}`;
    const r = await fetch(url, { headers: { "User-Agent": "LIFE OS (life-os.today)" } }).then((x) => x.json());
    const a = r?.address || {};
    const city = a.city || a.town || a.village || a.municipality || a.county || a.state || null;
    const country = a.country || null;
    if (city && country && city !== country) return `${city}, ${country}`;
    return city || country || null;
  } catch {
    return null;
  }
}

// Координаты из самого файла. У фотографии их держит EXIF, у видео — атом
// «©xyz» внутри mp4/mov; наружу это одна и та же точка.
export function pointFromFile(buf: Buffer, mediaType?: string): { lat: number; lng: number; shotAt: string | null } | null {
  const meta = (mediaType || "").startsWith("video/") ? readVideoMeta(buf) : readExif(buf);
  if (meta.lat === null || meta.lng === null) return null;
  return { lat: meta.lat, lng: meta.lng, shotAt: meta.shotAt };
}

// Момент съёмки из файла — пригодится, даже когда координат нет.
export function shotAtOfFile(buf: Buffer, mediaType?: string): string | null {
  return (mediaType || "").startsWith("video/") ? readVideoMeta(buf).shotAt : readExif(buf).shotAt;
}

// Место из подписи к фото: «на пляже в Биаррице» → координаты Биаррица.
// Берём только если в подписи действительно есть похожее на место слово с
// заглавной буквы: геокодировать всю фразу целиком бессмысленно.
export async function pointFromCaption(caption: string): Promise<{ lat: number; lng: number; place: string } | null> {
  const text = (caption || "").trim();
  if (text.length < 3 || text.length > 120) return null;
  const m = text.match(/(?:^|[\s,«"(])([A-ZА-ЯЁ][\p{L}-]{2,}(?:\s+[A-ZА-ЯЁ][\p{L}-]{2,})?)/u);
  const guess = (m?.[1] || "").trim();
  if (!guess) return null;
  const res = await geocodeName(guess);
  if (!res || res === "notfound") return null;
  return { lat: res.lat, lng: res.lng, place: res.formatted || guess };
}

// Записать точку рядом с фотографией. Если миграция photo_map.sql ещё не
// применена — тихо ничего не делаем: остальная «Память» работает как работала.
export async function saveGeo(memoryId: string, userId: string, p: PhotoPoint): Promise<boolean> {
  try {
    const patch: Record<string, any> = {
      lat: p.lat,
      lng: p.lng,
      place_name: p.place || null,
      geo_source: p.source,
    };
    if (p.shotAt) patch.shot_at = p.shotAt;
    const { error } = await supabaseAdmin().from("memories").update(patch).eq("id", memoryId).eq("user_id", userId);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

// Полный путь для только что сохранённого снимка: достать координаты из файла,
// подписать место — и положить рядом с фото.
export async function geoTagMemory(
  memoryId: string,
  userId: string,
  buf: Buffer,
  opts?: { caption?: string; lang?: string; mediaType?: string },
): Promise<PhotoPoint | null> {
  let point: PhotoPoint | null = null;

  const fromFile = pointFromFile(buf, opts?.mediaType);
  if (fromFile) {
    point = { lat: fromFile.lat, lng: fromFile.lng, place: null, source: "exif", shotAt: fromFile.shotAt };
  } else if (opts?.caption) {
    const fromText = await pointFromCaption(opts.caption);
    if (fromText) point = { lat: fromText.lat, lng: fromText.lng, place: fromText.place, source: "caption" };
  }
  if (!point) {
    // Координат нет, но время съёмки из файла всё равно ценно: по нему фото
    // встаёт в правильное место маршрута, когда точку добавят геометкой.
    const shotAt = shotAtOfFile(buf, opts?.mediaType);
    if (shotAt) {
      try {
        await supabaseAdmin().from("memories").update({ shot_at: shotAt }).eq("id", memoryId).eq("user_id", userId);
      } catch {}
    }
    return null;
  }

  if (!point.place) point.place = await placeNameAt(point.lat, point.lng, opts?.lang || "ru");
  const ok = await saveGeo(memoryId, userId, point);
  return ok ? point : null;
}

// Последнее фото без координат — к нему прикрепляется геометка, присланная
// следом. Окно в полчаса: «фото → метка» человек делает подряд, а вот метка
// через день к вчерашнему снимку почти наверняка означает другое место.
export async function lastPhotoWithoutGeo(userId: string, minutes = 30): Promise<{ id: string; title: string | null } | null> {
  try {
    const since = new Date(Date.now() - minutes * 60_000).toISOString();
    const { data, error } = await supabaseAdmin()
      .from("memories")
      .select("id, title, created_at, lat")
      .eq("user_id", userId)
      .not("image_url", "is", null)
      .is("lat", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    const row = (data || [])[0] as any;
    return row ? { id: row.id, title: row.title || null } : null;
  } catch {
    return null;
  }
}
