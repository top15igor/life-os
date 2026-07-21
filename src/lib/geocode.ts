// Геокодинг названий мест → координаты. Результат кэшируется в таблице places,
// поэтому каждое уникальное название запрашивается ОДИН раз (стоимость копеечная).
// Без ключа GOOGLE_MAPS_API_KEY тихо отдаёт null — фича просто не активна.

export type GeoResult = { lat: number; lng: number; country: string | null; formatted: string };

export async function geocodeName(name: string, hint?: string): Promise<GeoResult | null | "notfound"> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const q = [name, hint].filter(Boolean).join(", ").trim();
  if (!q) return "notfound";
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}`;
    const r = await fetch(url).then((x) => x.json());
    if (r?.status === "ZERO_RESULTS") return "notfound";
    if (r?.status !== "OK" || !r.results?.length) {
      console.error("geocode", r?.status, r?.error_message);
      return null;
    }
    const top = r.results[0];
    const loc = top.geometry?.location;
    if (!loc || typeof loc.lat !== "number") return "notfound";
    const country =
      (top.address_components || []).find((c: any) => (c.types || []).includes("country"))?.long_name || null;
    return { lat: loc.lat, lng: loc.lng, country, formatted: top.formatted_address || q };
  } catch (e) {
    console.error("geocode", e);
    return null;
  }
}

// Ссылка «Открыть в Google Картах» (Шаг 0 — работает без всякого API).
export function mapsLink(name: string, lat?: number | null, lng?: number | null): string {
  if (typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}
