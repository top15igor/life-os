// Геокодинг названий мест → координаты. Результат кэшируется в таблице places,
// поэтому каждое уникальное название запрашивается ОДИН раз (стоимость копеечная).
// Без ключа GOOGLE_MAPS_API_KEY тихо отдаёт null — фича просто не активна.

export type GeoResult = { lat: number; lng: number; country: string | null; formatted: string };

// Запасной геокодер — общий поиск OpenStreetMap. Нужен, когда ключа Google нет
// (а без него раньше вся геопривязка молча выключалась). Их правила просят
// представляться и не частить — у нас запросы редкие, по одному на снимок.
async function geocodeOsm(q: string): Promise<GeoResult | null | "notfound"> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=ru&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { "User-Agent": "LIFE OS (life-os.today)" } }).then((x) => x.json());
    const top = Array.isArray(r) ? r[0] : null;
    if (!top) return "notfound";
    const lat = Number(top.lat), lng = Number(top.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "notfound";
    const parts = String(top.display_name || "").split(",").map((x: string) => x.trim());
    return { lat, lng, country: parts.length ? parts[parts.length - 1] : null, formatted: top.display_name || q };
  } catch {
    return null;
  }
}

export async function geocodeName(name: string, hint?: string): Promise<GeoResult | null | "notfound"> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const q = [name, hint].filter(Boolean).join(", ").trim();
  if (!q) return "notfound";
  if (!key) return geocodeOsm(q);
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}`;
    const r = await fetch(url).then((x) => x.json());
    if (r?.status === "ZERO_RESULTS") return geocodeOsm(q);
    if (r?.status !== "OK" || !r.results?.length) {
      console.error("geocode", r?.status, r?.error_message);
      return geocodeOsm(q);
    }
    const top = r.results[0];
    const loc = top.geometry?.location;
    if (!loc || typeof loc.lat !== "number") return "notfound";
    const country =
      (top.address_components || []).find((c: any) => (c.types || []).includes("country"))?.long_name || null;
    return { lat: loc.lat, lng: loc.lng, country, formatted: top.formatted_address || q };
  } catch (e) {
    console.error("geocode", e);
    return geocodeOsm(q);
  }
}

// Ссылка «Открыть в Google Картах» (Шаг 0 — работает без всякого API).
export function mapsLink(name: string, lat?: number | null, lng?: number | null): string {
  if (typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}
