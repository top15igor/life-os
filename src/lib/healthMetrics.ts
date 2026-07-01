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

// Прочитать дневные метрики пользователя (последние N дней).
export async function getHealthMetrics(userId: string, limit = 30): Promise<HealthMetricsData> {
  try {
    const { data } = await supabaseAdmin()
      .from("health_metrics")
      .select("day, steps, active_kcal, distance_km, sleep_hours, sleep_deep_min, sleep_rem_min, sleep_light_min, hr_avg, hr_resting, hrv, azm")
      .eq("user_id", userId)
      .order("day", { ascending: false })
      .limit(limit);
    const days = (data || []).map((d: any) => d as HealthDay).sort((a, b) => a.day.localeCompare(b.day));
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
    const { error } = await db.from("health_metrics").upsert(chunk, { onConflict: "user_id,day" });
    if (error) throw error;
  }
  return rows.length;
}
