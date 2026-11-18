import { supabaseAdmin } from "./supabaseAdmin";

// Защита от двойного срабатывания расписания.
//
// Один и тот же отчёт могут дёрнуть два будильника: старый (GitHub Actions) и
// новый (Supabase pg_cron) — пока переезд не закончен, они живут оба, и это
// правильно: выключить старый раньше, чем заработал новый, значит остаться без
// отчётов вовсе. Но два разбора за утро и задачи-дубли в бэклоге — шум, который
// отучает читать. Поэтому вызов по расписанию сначала «занимает» слот: если его
// уже занимали недавно, второй заход тихо выходит.
//
// Отметка лежит у владельца в morning_prefs — там же, где остальные мелкие
// служебные отметки; отдельная таблица ради двух дат была бы лишней.
// Ручной запуск владельцем сюда не ходит: попросил руками — получи отчёт.

const OWNER = "00000000-0000-0000-0000-000000000000";

export async function claimScheduled(slot: string, minHours: number): Promise<boolean> {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("users").select("morning_prefs").eq("id", OWNER).maybeSingle();
    const prefs = (data as any)?.morning_prefs && typeof (data as any).morning_prefs === "object" ? (data as any).morning_prefs : {};
    const marks = prefs.scheduleMarks && typeof prefs.scheduleMarks === "object" ? prefs.scheduleMarks : {};
    const last = Date.parse(String(marks[slot] || ""));
    if (Number.isFinite(last) && Date.now() - last < minHours * 3600_000) return false;
    await db.from("users").update({ morning_prefs: { ...prefs, scheduleMarks: { ...marks, [slot]: new Date().toISOString() } } }).eq("id", OWNER);
    return true;
  } catch {
    // Защита не имеет права отменить сам отчёт: не смогли проверить — запускаем.
    return true;
  }
}

// Отчёт упал — освобождаем слот, чтобы второй будильник мог попробовать ещё раз,
// а не молчал до завтра из-за чужой неудачи.
export async function releaseScheduled(slot: string): Promise<void> {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("users").select("morning_prefs").eq("id", OWNER).maybeSingle();
    const prefs = (data as any)?.morning_prefs && typeof (data as any).morning_prefs === "object" ? (data as any).morning_prefs : {};
    const marks = { ...(prefs.scheduleMarks && typeof prefs.scheduleMarks === "object" ? prefs.scheduleMarks : {}) };
    delete marks[slot];
    await db.from("users").update({ morning_prefs: { ...prefs, scheduleMarks: marks } }).eq("id", OWNER);
  } catch { /* не вышло — слот просто истечёт сам */ }
}
