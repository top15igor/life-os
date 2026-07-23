import { supabaseAdmin } from "./supabaseAdmin";
import { getEntries, places as placesOf, type Entry } from "./queries";

// ===== Дневник путешествий =====
// Поездка (trip) = место + даты + история + фото + привязанные записи дневника.
// Автопредложения: записи уже связаны с местами (entry_places) — группируем
// упоминания одного места по близким датам (зазор <= CLUSTER_GAP_DAYS) и
// предлагаем «похоже, это была поездка» в один клик.

export const CLUSTER_GAP_DAYS = 3;

// Контекст упоминания места: поездка vs мечта (то же правило, что на странице мест).
export const VISIT_RE = /(\bбыл[аи]?\b|побыва|съездил|съездили|поехал|ездил|посети|вернул|прилет|отдыхал|переехал|гостил|\bжил\b|жил[аи]? в|летал в|visited|went to|came back|trip to|was in)/i;
export const WISH_RE = /(мечт|хочу|хотел|объезд|когда-нибудь|планиру|поехать|съездить|побывать|dream|want to go|wish to|would love)/i;

export type TripEntryLite = { id: string; date: string; text: string };
export type Trip = {
  id: string;
  title: string;
  destination: string | null;
  country: string | null;
  emoji: string | null;
  date_start: string | null;
  date_end: string | null;
  status: string;
  story: string | null;
  cover_url: string | null;
  photos: string[];
  entries: TripEntryLite[];
};
export type TripSuggestion = {
  key: string; // place|date_start — стабильный ключ (для «скрыть»)
  name: string;
  date_start: string;
  date_end: string;
  entryIds: string[];
  count: number;
  sample: string;
};

const TRIP_SEL = "id, title, destination, country, emoji, date_start, date_end, status, story, cover_url, photos, created_at";

// Все поездки пользователя + привязанные записи (кратко).
export async function getTrips(userId: string): Promise<Trip[]> {
  const db = supabaseAdmin();
  try {
    const { data: rows } = await db
      .from("trips")
      .select(TRIP_SEL)
      .eq("user_id", userId)
      .order("date_start", { ascending: false, nullsFirst: false });
    const trips = rows || [];
    if (!trips.length) return [];
    const ids = trips.map((t: any) => t.id);
    const byTrip: Record<string, TripEntryLite[]> = {};
    try {
      const { data: links } = await db
        .from("trip_entries")
        .select("trip_id, entries ( id, entry_date, summary, raw_text )")
        .in("trip_id", ids);
      for (const l of links || []) {
        const e = (l as any).entries;
        if (!e) continue;
        (byTrip[(l as any).trip_id] ||= []).push({ id: e.id, date: e.entry_date, text: String(e.summary || e.raw_text || "").slice(0, 400) });
      }
    } catch {}
    return trips.map((t: any) => ({
      ...t,
      photos: Array.isArray(t.photos) ? t.photos.filter(Boolean) : [],
      entries: (byTrip[t.id] || []).sort((a, b) => (a.date < b.date ? -1 : 1)),
    }));
  } catch {
    return []; // таблицы ещё нет — страница работает без поездок
  }
}

// Автопредложения поездок из дневника.
export async function getTripSuggestions(userId: string, hiddenNames?: Set<string>): Promise<TripSuggestion[]> {
  const db = supabaseAdmin();
  const hidden = hiddenNames || new Set<string>();
  try {
    const entries = await getEntries(userId, 400);

    // Записи, уже привязанные к поездкам, и скрытые предложения.
    let linked = new Set<string>();
    let dismissed = new Set<string>();
    try {
      const { data: tr } = await db.from("trips").select("id").eq("user_id", userId);
      const tids = (tr || []).map((t: any) => t.id);
      if (tids.length) {
        const { data: ls } = await db.from("trip_entries").select("entry_id").in("trip_id", tids);
        linked = new Set((ls || []).map((l: any) => l.entry_id));
      }
      const { data: dm } = await db.from("trip_dismissed").select("key").eq("user_id", userId);
      dismissed = new Set((dm || []).map((d: any) => d.key));
    } catch {}

    // Группируем записи по месту. Предлагаем только имена собственные
    // (с заглавной буквы): «Бильбао» — да, «пляж»/«детская площадка» — нет.
    const byPlace = new Map<string, Entry[]>();
    for (const e of entries) {
      for (const name of placesOf(e)) {
        if (hidden.has(name)) continue;
        if (!/^[A-ZА-ЯЁІЇЄҐ]/.test(name)) continue;
        const arr = byPlace.get(name);
        if (arr) arr.push(e);
        else byPlace.set(name, [e]);
      }
    }

    const sugg: TripSuggestion[] = [];
    for (const [name, es] of byPlace) {
      const sorted = [...es].sort((a, b) => (a.entry_date < b.entry_date ? -1 : 1));
      let cluster: Entry[] = [];
      const flush = () => {
        if (!cluster.length) return;
        const text = cluster.map((e) => `${e.summary || ""} ${e.raw_text || ""}`).join(" ").toLowerCase();
        const ok =
          VISIT_RE.test(text) && // есть явный признак состоявшейся поездки
          !cluster.some((e) => linked.has(e.id)); // ещё не в поездке
        if (ok) {
          const start = cluster[0].entry_date;
          const end = cluster[cluster.length - 1].entry_date;
          const key = `${name}|${start}`;
          if (!dismissed.has(key)) {
            sugg.push({
              key,
              name,
              date_start: start,
              date_end: end,
              entryIds: cluster.map((e) => e.id),
              count: cluster.length,
              sample: String(cluster[0].summary || cluster[0].raw_text || "").slice(0, 140),
            });
          }
        }
        cluster = [];
      };
      for (const e of sorted) {
        if (!cluster.length) { cluster = [e]; continue; }
        const gap = (Date.parse(e.entry_date) - Date.parse(cluster[cluster.length - 1].entry_date)) / 86400000;
        if (gap <= CLUSTER_GAP_DAYS) cluster.push(e);
        else flush(), (cluster = [e]);
      }
      flush();
    }

    sugg.sort((a, b) => (a.date_start < b.date_start ? 1 : -1));
    return sugg.slice(0, 8);
  } catch {
    return [];
  }
}

// Принять предложение: создать поездку, привязать записи, подтянуть фото из «Памяти».
export async function acceptSuggestion(userId: string, key: string): Promise<boolean> {
  const db = supabaseAdmin();
  const sugg = await getTripSuggestions(userId);
  const sg = sugg.find((s) => s.key === key);
  if (!sg) return false;

  // Фото из «Визуальной памяти» за даты поездки.
  let photos: string[] = [];
  try {
    const { data: mem } = await db
      .from("memories")
      .select("image_url, mem_date")
      .eq("user_id", userId)
      .not("image_url", "is", null)
      .gte("mem_date", sg.date_start)
      .lte("mem_date", sg.date_end)
      .limit(12);
    photos = (mem || []).map((m: any) => m.image_url).filter(Boolean);
  } catch {}

  // Страна — из справочника мест (геокодирование), если есть.
  let country: string | null = null;
  try {
    const { data: p } = await db.from("places").select("country").eq("user_id", userId).eq("name", sg.name).maybeSingle();
    country = (p as any)?.country || null;
  } catch {}

  try {
    const { data: trip, error } = await db
      .from("trips")
      .insert({ user_id: userId, title: sg.name, destination: sg.name, country, emoji: "✈️", date_start: sg.date_start, date_end: sg.date_end, status: "past", photos, cover_url: photos[0] || null })
      .select("id")
      .single();
    if (error || !trip) return false;
    await db.from("trip_entries").insert(sg.entryIds.map((id) => ({ trip_id: (trip as any).id, entry_id: id })));
    return true;
  } catch {
    return false;
  }
}

// Скрыть предложение (больше не показывать).
export async function dismissSuggestion(userId: string, key: string): Promise<boolean> {
  try {
    await supabaseAdmin().from("trip_dismissed").insert({ user_id: userId, key: String(key).slice(0, 200) });
    return true;
  } catch {
    return false;
  }
}

const EDITABLE = ["title", "destination", "country", "emoji", "date_start", "date_end", "status", "story", "cover_url", "photos"] as const;

function cleanFields(f: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of EDITABLE) {
    if (!(k in (f || {}))) continue;
    let v = f[k];
    if (k === "photos") v = Array.isArray(v) ? v.filter((x: any) => typeof x === "string").slice(0, 40) : [];
    else if (k === "date_start" || k === "date_end") v = v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
    else if (k === "status") v = v === "planned" ? "planned" : "past";
    else v = v == null ? null : String(v).slice(0, k === "story" ? 8000 : 300);
    out[k] = v;
  }
  return out;
}

// Создать поездку вручную.
export async function createTrip(userId: string, fields: any): Promise<boolean> {
  const f = cleanFields(fields);
  if (!f.title) return false;
  try {
    const { error } = await supabaseAdmin().from("trips").insert({ user_id: userId, photos: [], ...f });
    return !error;
  } catch {
    return false;
  }
}

// Обновить поля поездки.
export async function updateTrip(userId: string, id: string, fields: any): Promise<boolean> {
  const f = cleanFields(fields);
  if (!Object.keys(f).length) return false;
  try {
    const { error } = await supabaseAdmin().from("trips").update(f).eq("id", id).eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}

// Удалить поездку (записи дневника не трогаем — отвяжутся каскадом).
export async function deleteTrip(userId: string, id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin().from("trips").delete().eq("id", id).eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}
