import { supabaseAdmin } from "./supabaseAdmin";

export type Tx = {
  id: string;
  day: string;
  kind: "income" | "expense";
  amount: number;
  currency: string;
  category: string | null;
  note: string | null;
};

export type CatSlice = { category: string; amount: number; pct: number };

export type FinanceData = {
  month: string; // YYYY-MM выбранного периода
  currency: string; // основная валюта (самая частая)
  income: number; // доход за месяц
  expense: number; // расход за месяц
  balance: number; // доход − расход за месяц
  byCategory: CatSlice[]; // расходы по категориям за месяц (по убыванию)
  txs: Tx[]; // операции за месяц (свежие сверху)
  monthsWithData: string[]; // месяцы, где есть операции (для навигации)
  hasAny: boolean; // есть ли вообще хоть одна операция
};

// Текущий месяц в формате YYYY-MM.
export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// Сдвиг месяца на ±N: «2026-06» + 1 → «2026-07».
export function shiftMonth(m: string, delta: number): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Данные по финансам за выбранный месяц + сводка по категориям.
export async function getFinanceData(userId: string, month?: string): Promise<FinanceData> {
  const m = /^\d{4}-\d{2}$/.test(month || "") ? (month as string) : currentMonth();
  const db = supabaseAdmin();

  let all: Tx[] = [];
  try {
    const { data } = await db
      .from("finance_tx")
      .select("id, day, kind, amount, currency, category, note")
      .eq("user_id", userId)
      .order("day", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(2000);
    all = (data || []).map((t: any) => ({ ...t, amount: Number(t.amount) }));
  } catch {
    // таблицы ещё нет — отдаём пустую сводку
  }

  // Основная валюта: самая частая по всем операциям.
  const curCount = new Map<string, number>();
  for (const t of all) curCount.set(t.currency, (curCount.get(t.currency) || 0) + 1);
  const currency = [...curCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "USD";

  const monthsWithData = [...new Set(all.map((t) => t.day.slice(0, 7)))].sort().reverse();

  const txs = all.filter((t) => t.day.slice(0, 7) === m);
  let income = 0,
    expense = 0;
  const catMap = new Map<string, number>();
  for (const t of txs) {
    if (t.kind === "income") income += t.amount;
    else {
      expense += t.amount;
      const c = t.category || "other";
      catMap.set(c, (catMap.get(c) || 0) + t.amount);
    }
  }
  income = round2(income);
  expense = round2(expense);

  const byCategory: CatSlice[] = [...catMap.entries()]
    .map(([category, amount]) => ({ category, amount: round2(amount), pct: expense > 0 ? Math.round((amount / expense) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount);

  return {
    month: m,
    currency,
    income,
    expense,
    balance: round2(income - expense),
    byCategory,
    txs,
    monthsWithData,
    hasAny: all.length > 0,
  };
}
