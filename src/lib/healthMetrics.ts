import { supabaseAdmin } from "./supabaseAdmin";

// Одна метрика-день из Apple «Здоровье».
export type HealthDay = {
  day: string;
  steps?: number | null;
  active_kcal?: number | null;
  distance_km?: number | null;
  sleep_hours?: number | null;
  sleep_deep_min?: number | null;
  sleep_rem_min?: number | null;
  sleep_light_min?: number | null;
  hr_avg?: number | null;
  hr_resting?: number | null;
  hrv?: number | null;
  azm?: number | null;
};

export type HealthMetricsData = {
  days: HealthDay[];            // по возрастанию даты, последние ~30
  latest: HealthDay | null;     // самый свежий день
};

const NUM_KEYS = ["steps", "active_kcal", "distance_km", "sleep_hours", "sleep_deep_min", "sleep_rem_min", "sleep_light_min", "hr_avg", "hr_resting", "hrv", "azm"] as const;

// Провайдер источника: Fitbit/Google Health vs Apple Health (Команды/архив).
export function healthProvider(source?: string | null): "google" | "apple" {
  return source === "googlehealth" ? "google" : "apple";
}

function fieldCount(r: any): number {
  return NUM_KEYS.reduce((n, k) => n + (r && r[k] != null ? 1 : 0), 0);
}

// Прочитать дневные метрики пользователя (последние N дней).
// Источники (Google/Apple) хранятся раздельно (ряд на день на источник); тут
// выбираем ОСНОВНОЙ по настройке users.health_source ('auto' | 'google' | 'apple').
export async function getHealthMetrics(userId: string, limit = 30): Promise<HealthMetricsData> {
  const db = supabaseAdmin();
  try {
    let pref = "auto";
    try {
      const { data: u } = await db.from("users").select("health_source").eq("id", userId).maybeSingle();
      if ((u as any)?.health_source) pref = (u as any).health_source;
    } catch {}

    const { data } = await db
      .from("health_metrics")
      .select("day, source, steps, active_kcal, distance_km, sleep_hours, sleep_deep_min, sleep_rem_min, sleep_light_min, hr_avg, hr_resting, hrv, azm")
      .eq("user_id", userId)
      .order("day", { ascending: false })
      .limit(limit * 2 + 20);

    // Группируем по дню: { google?, apple? }.
    const byDay = new Map<string, { google?: any; apple?: any }>();
    for (const r of (data || []) as any[]) {
      const d = String(r.day).slice(0, 10);
      let g = byDay.get(d);
      if (!g) { g = {}; byDay.set(d, g); }
      const p = healthProvider(r.source);
      // если вдруг несколько рядов одного провайдера — берём более полный
      if (!g[p] || fieldCount(r) > fieldCount(g[p])) g[p] = r;
    }

    const pick = (g: { google?: any; apple?: any }) => {
      if (pref === "google") return g.google || g.apple;
      if (pref === "apple") return g.apple || g.google;
      // auto: чей ряд полнее — тот и берём, при равенстве Google
      if (g.google && g.apple) return fieldCount(g.apple) > fieldCount(g.google) ? g.apple : g.google;
      return g.google || g.apple;
    };

    const days = [...byDay.entries()]
      .map(([day, g]) => { const chosen = pick(g); return chosen ? ({ ...chosen, day } as HealthDay) : null; })
      .filter((d): d is HealthDay => !!d)
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-limit);

    return { days, latest: days.length ? days[days.length - 1] : null };
  } catch {
    // таблицы ещё нет — отдаём пусто
    return { days: [], latest: null };
  }
}

// Привести одну запись к чистым числам (или null). Возвращает null, если нет валидной даты.
function normalizeDay(raw: any): HealthDay | null {
  const day = String(raw?.day || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const out: HealthDay = { day };
  for (const k of NUM_KEYS) {
    const v = raw?.[k];
    if (v === undefined || v === null || v === "") continue;
    const n = Number(v);
    if (isFinite(n) && n >= 0) (out as any)[k] = n;
  }
  return out;
}

// Частичный upsert: пишем только переданные поля, остальные в строке не трогаем.
// (PostgREST в ON CONFLICT обновляет только присутствующие в payload колонки.)
export async function upsertHealthDays(userId: string, raw: any[], source: string): Promise<number> {
  const db = supabaseAdmin();
  const rows = raw
    .map(normalizeDay)
    .filter((d): d is HealthDay => !!d && NUM_KEYS.some((k) => (d as any)[k] != null))
    .map((d) => ({ user_id: userId, source, updated_at: new Date().toISOString(), ...d }));
  if (!rows.length) return 0;
  // Чанками, чтобы не упереться в лимиты запроса при большом импорте.
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    // Ключ (user_id, day, source) появляется после миграции health_sources.sql.
    // До неё откатываемся на старый (user_id, day), чтобы синк не падал.
    let { error } = await db.from("health_metrics").upsert(chunk, { onConflict: "user_id,day,source" });
    if (error) {
      ({ error } = await db.from("health_metrics").upsert(chunk, { onConflict: "user_id,day" }));
    }
    if (error) throw error;
  }
  return rows.length;
}
