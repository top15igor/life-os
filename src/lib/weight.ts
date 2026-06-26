import { supabaseAdmin } from "./supabaseAdmin";
import { getEntries } from "./queries";

export type WeightPoint = { day: string; kg: number };
export type WeightGoal = { target_kg: number | null; target_date: string | null; start_kg: number | null; start_date: string | null };
export type WeightData = { points: WeightPoint[]; current: WeightPoint | null; goal: WeightGoal | null };

// Все замеры веса: лог веса (источник истины) + вес, упомянутый в записях.
// На один день — одно значение (лог перекрывает запись).
export async function getWeightData(userId: string): Promise<WeightData> {
  const db = supabaseAdmin();
  const byDay = new Map<string, number>();

  try {
    const all = await getEntries(userId, 300);
    for (const e of all as any[]) {
      if (e.weight != null && e.entry_date) byDay.set(e.entry_date, Number(e.weight));
    }
  } catch {
    // нет записей — не страшно
  }

  let goal: WeightGoal | null = null;
  try {
    const { data: logs } = await db.from("weight_log").select("day, kg").eq("user_id", userId);
    for (const l of logs || []) byDay.set(l.day as string, Number(l.kg));
    const { data: g } = await db.from("weight_goal").select("target_kg, target_date, start_kg, start_date").eq("user_id", userId).maybeSingle();
    if (g) goal = g as any;
  } catch {
    // таблиц ещё нет — отдаём что есть из записей
  }

  const points = [...byDay.entries()].map(([day, kg]) => ({ day, kg })).sort((a, b) => a.day.localeCompare(b.day));
  const current = points.length ? points[points.length - 1] : null;
  return { points, current, goal };
}
