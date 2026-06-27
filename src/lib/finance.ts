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

// Категория расходов за месяц: сумма (в основной валюте), доля от расходов и бюджет (если задан).
export type CatSlice = {
  category: string;
  amount: number; // потрачено, в основной валюте
  pct: number; // доля от всех расходов месяца
  limit: number | null; // месячный лимит, если задан
  budgetPct: number | null; // потрачено / лимит, %
  over: boolean; // превышен ли лимит
};

export type FinanceData = {
  month: string; // YYYY-MM выбранного периода
  currency: string; // основная валюта (для отображения сумм-итогов)
  rates: Record<string, number>; // курсы остальных валют к основной
  currenciesUsed: string[]; // какие валюты встречаются в операциях
  needsRates: boolean; // есть операции в валюте без курса (итоги неточны)
  income: number; // доход за месяц (в основной валюте)
  expense: number; // расход за месяц (в основной валюте)
  balance: number; // доход − расход за месяц
  byCategory: CatSlice[]; // расходы по категориям за месяц (по убыванию)
  budgetTotal: { limit: number; spent: number; pct: number; over: boolean } | null; // сводный бюджет
  txs: Tx[]; // операции за месяц (свежие сверху, в исходной валюте)
  monthsWithData: string[]; // месяцы, где есть операции
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

// Данные по финансам за выбранный месяц: итоги в основной валюте + бюджеты по категориям.
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

  const currenciesUsed = [...new Set(all.map((t) => t.currency))].sort();

  // Настройки: основная валюта + курсы. По умолчанию — самая частая валюта операций.
  let base = currenciesUsed[0] || "USD";
  let rates: Record<string, number> = {};
  if (currenciesUsed.length) {
    const freq = new Map<string, number>();
    for (const t of all) freq.set(t.currency, (freq.get(t.currency) || 0) + 1);
    base = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  try {
    const { data: st } = await db.from("finance_settings").select("base_currency, rates").eq("user_id", userId).maybeSingle();
    if (st?.base_currency) base = st.base_currency;
    if (st?.rates && typeof st.rates === "object") {
      for (const [k, v] of Object.entries(st.rates as Record<string, any>)) {
        const n = Number(v);
        if (isFinite(n) && n > 0) rates[k] = n;
      }
    }
  } catch {
    // нет таблицы настроек — используем дефолты
  }

  // Конвертация суммы в основную валюту. Если курс не задан — берём 1:1 и помечаем неточность.
  let needsRates = false;
  const toBase = (amount: number, cur: string) => {
    if (cur === base) return amount;
    const r = rates[cur];
    if (!r || !isFinite(r) || r <= 0) { needsRates = true; return amount; }
    return amount * r;
  };

  const monthsWithData = [...new Set(all.map((t) => t.day.slice(0, 7)))].sort().reverse();

  const txs = all.filter((t) => t.day.slice(0, 7) === m);
  let income = 0,
    expense = 0;
  const catMap = new Map<string, number>();
  for (const t of txs) {
    const v = toBase(t.amount, t.currency);
    if (t.kind === "income") income += v;
    else {
      expense += v;
      const c = t.category || "other";
      catMap.set(c, (catMap.get(c) || 0) + v);
    }
  }
  income = round2(income);
  expense = round2(expense);

  // Бюджеты по категориям (лимиты — в основной валюте).
  const budgets = new Map<string, number>();
  try {
    const { data: bs } = await db.from("finance_budget").select("category, amount").eq("user_id", userId);
    for (const b of bs || []) budgets.set(b.category as string, Number(b.amount));
  } catch {
    // нет таблицы — без бюджетов
  }

  // Категории = все, где были траты, плюс все, на которые задан бюджет (даже без трат).
  const allCats = new Set<string>([...catMap.keys(), ...budgets.keys()]);
  const byCategory: CatSlice[] = [...allCats]
    .map((category) => {
      const amount = round2(catMap.get(category) || 0);
      const limit = budgets.has(category) ? round2(budgets.get(category)!) : null;
      const budgetPct = limit && limit > 0 ? Math.round((amount / limit) * 100) : null;
      return {
        category,
        amount,
        pct: expense > 0 ? Math.round((amount / expense) * 100) : 0,
        limit,
        budgetPct,
        over: limit != null && amount > limit,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Сводный бюджет = сумма всех лимитов против суммы расходов по этим категориям.
  let budgetTotal: FinanceData["budgetTotal"] = null;
  if (budgets.size) {
    const limit = round2([...budgets.values()].reduce((a, b) => a + b, 0));
    const spent = round2([...budgets.keys()].reduce((a, c) => a + (catMap.get(c) || 0), 0));
    budgetTotal = { limit, spent, pct: limit > 0 ? Math.round((spent / limit) * 100) : 0, over: spent > limit };
  }

  return {
    month: m,
    currency: base,
    rates,
    currenciesUsed,
    needsRates,
    income,
    expense,
    balance: round2(income - expense),
    byCategory,
    budgetTotal,
    txs,
    monthsWithData,
    hasAny: all.length > 0,
  };
}
