import { supabaseAdmin } from "./supabaseAdmin";

const dayStr = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export async function getExperiments(userId: string) {
  const { data } = await supabaseAdmin()
    .from("experiments")
    .select("id, title, hypothesis, duration_days, start_date, status, result, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

// Вывод эксперимента: сравнение метрик в период эксперимента vs равный период до него.
export async function computeResult(userId: string, startDate: string) {
  const db = supabaseAdmin();
  const today = dayStr(Date.now());
  const startMs = new Date(startDate + "T00:00:00Z").getTime();
  const lenDays = Math.max(1, Math.round((Date.now() - startMs) / 86400000) + 1);
  const beforeStart = dayStr(startMs - lenDays * 86400000);

  const { data: entries } = await db
    .from("entries")
    .select("entry_date, mood, energy, health, sleep_hours")
    .eq("user_id", userId)
    .gte("entry_date", beforeStart);
  const list = entries || [];

  const during = list.filter((e) => e.entry_date >= startDate && e.entry_date <= today);
  const before = list.filter((e) => e.entry_date >= beforeStart && e.entry_date < startDate);

  const avg = (arr: any[], k: string) => {
    const v = arr.map((e) => e[k]).filter((x) => x != null) as number[];
    return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
  };

  const deltas = ["mood", "energy", "health", "sleep_hours"].map((m) => {
    const a = avg(before, m);
    const b = avg(during, m);
    return { metric: m, before: a, after: b, delta: a != null && b != null ? Math.round((b - a) * 10) / 10 : null };
  });

  return {
    lenDays,
    duringCount: during.length,
    beforeCount: before.length,
    deltas,
    enough: during.length >= 3 && before.length >= 1,
    finishedAt: today,
  };
}
