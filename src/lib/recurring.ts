import { supabaseAdmin } from "./supabaseAdmin";

export type Recurring = {
  id: string; kind: "income" | "expense"; amount: number; currency: string;
  category: string | null; subcategory: string | null; note: string | null; day_of_month: number;
};

// Регулярные платежи пользователя, по которым СЕГОДНЯ нужно напомнить:
// активные, день совпадает с сегодняшним (день > длины месяца → последний день),
// и сегодня ещё не напоминали. Безопасно при отсутствии таблицы.
export async function getDueRecurring(userId: string, todayISO: string): Promise<Recurring[]> {
  const db = supabaseAdmin();
  const [y, mo, d] = todayISO.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  try {
    const { data } = await db
      .from("finance_recurring")
      .select("id, kind, amount, currency, category, subcategory, note, day_of_month, last_reminded")
      .eq("user_id", userId)
      .eq("active", true);
    return (data || [])
      .filter((r: any) => {
        const due = r.day_of_month === d || (r.day_of_month > daysInMonth && d === daysInMonth);
        return due && r.last_reminded !== todayISO;
      })
      .map((r: any) => ({ ...r, amount: Number(r.amount) }));
  } catch {
    return [];
  }
}

export async function markReminded(ids: string[], todayISO: string): Promise<void> {
  if (!ids.length) return;
  try {
    await supabaseAdmin().from("finance_recurring").update({ last_reminded: todayISO }).in("id", ids);
  } catch { /* не критично */ }
}
