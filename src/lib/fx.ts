// ============================================================
//  Исторические курсы валют → конвертация операций в одну валюту
//  по курсу НА ДАТУ ОПЕРАЦИИ (а не по сегодняшнему).
//
//  Источник: официальные курсы Национального банка Украины (НБУ),
//  https://bank.gov.ua/ — авторитетно для гривны и кросс-курсов.
//  Курс берётся помесячно (на середину месяца), кэшируется в Supabase
//  (таблица fx_monthly). Если НБУ недоступен — используется встроенный
//  запасной набор годовых курсов (приблизительный, для устойчивости).
//
//  Модель: usd_per_unit(currency, month) — сколько USD стоит 1 единица
//  валюты в этом месяце. Конвертация суммы в произвольную базовую валюту:
//     amount_base = amount * usd_per_unit(cur, m) / usd_per_unit(base, m)
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";

// ---- Запасные (fallback) курсы: средний UAH за 1 USD по годам --------------
// Используются, только если курс НБУ не закэширован и API недоступно.
// 2022 разбит: до фиксации НБУ (H1 ≈ 29.25) и после 21.07.2022 (36.57).
const UAH_PER_USD_FALLBACK: Record<number, number> = {
  2019: 25.85, 2020: 26.96, 2021: 27.29, 2022: 32.34, 2023: 36.57, 2024: 39.9, 2025: 41.7, 2026: 41.8,
};
function uahPerUsdFallback(month: string): number {
  const [y, m] = month.split("-").map(Number);
  if (y === 2022) return m <= 6 ? 29.25 : 36.57; // скачок из-за фиксации курса НБУ в июле 2022
  return UAH_PER_USD_FALLBACK[y] ?? UAH_PER_USD_FALLBACK[2024];
}
// Запасной USD за 1 EUR по годам.
const USD_PER_EUR_FALLBACK: Record<number, number> = {
  2019: 1.12, 2020: 1.14, 2021: 1.18, 2022: 1.05, 2023: 1.08, 2024: 1.08, 2025: 1.08, 2026: 1.08,
};
function usdPerEurFallback(month: string): number {
  const y = Number(month.split("-")[0]);
  return USD_PER_EUR_FALLBACK[y] ?? USD_PER_EUR_FALLBACK[2024];
}

// usd_per_unit из запасного набора для базовых валют. null — если валюту не знаем.
function fallbackUsdPerUnit(currency: string, month: string): number | null {
  if (currency === "USD") return 1;
  const uahPerUsd = uahPerUsdFallback(month);
  if (currency === "UAH") return 1 / uahPerUsd;
  if (currency === "EUR") return usdPerEurFallback(month);
  return null;
}

// ---- Источник: НБУ ---------------------------------------------------------
// Дата запроса к НБУ — 15-е число месяца (официальный курс есть на любой день).
function nbuDate(month: string): string {
  return month.replace("-", "") + "15"; // YYYY-MM -> YYYYMM15
}

// Получить от НБУ «UAH за 1 единицу валюты» на дату. null — при ошибке/таймауте.
async function nbuUahPer(valcode: string, month: string): Promise<number | null> {
  if (valcode === "UAH") return 1;
  const url = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${valcode}&date=${nbuDate(month)}&json`;
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(to);
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ rate?: number }>;
    const rate = Array.isArray(arr) && arr[0]?.rate;
    return typeof rate === "number" && isFinite(rate) && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

// usd_per_unit для валюты на месяц по данным НБУ. null — если не удалось.
async function nbuUsdPerUnit(currency: string, month: string): Promise<number | null> {
  if (currency === "USD") return 1;
  const uahPerUsd = await nbuUahPer("USD", month); // якорь: UAH за 1 USD
  if (!uahPerUsd) return null;
  if (currency === "UAH") return 1 / uahPerUsd;
  const uahPerCur = await nbuUahPer(currency, month); // UAH за 1 единицу валюты
  if (!uahPerCur) return null;
  return uahPerCur / uahPerUsd; // USD за 1 единицу валюты
}

// ---- Публичное API ---------------------------------------------------------
const keyOf = (month: string, cur: string) => `${month}|${cur}`;

// Карта usd_per_unit для нужных (месяц × валюта). Сначала кэш Supabase,
// затем НБУ (с записью в кэш), затем запасной набор. Никогда не бросает.
export async function getUsdPerUnit(
  db: SupabaseClient,
  months: string[],
  currencies: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const uniqMonths = [...new Set(months)];
  const uniqCurs = [...new Set(currencies)];

  // 1) Кэш.
  let cacheOk = true;
  try {
    const { data, error } = await db
      .from("fx_monthly")
      .select("month, currency, usd_per_unit")
      .in("month", uniqMonths)
      .in("currency", uniqCurs);
    if (error) cacheOk = false;
    for (const r of data || []) {
      const v = Number((r as any).usd_per_unit);
      if (isFinite(v) && v > 0) out.set(keyOf((r as any).month, (r as any).currency), v);
    }
  } catch {
    cacheOk = false; // таблицы ещё нет — работаем без кэша
  }

  // 2) Чего не хватает — добираем из НБУ и кэшируем.
  for (const m of uniqMonths) {
    for (const cur of uniqCurs) {
      if (cur === "USD") { out.set(keyOf(m, cur), 1); continue; }
      if (out.has(keyOf(m, cur))) continue;
      const nbu = await nbuUsdPerUnit(cur, m);
      if (nbu != null) {
        out.set(keyOf(m, cur), nbu);
        if (cacheOk) {
          try { await db.from("fx_monthly").upsert({ month: m, currency: cur, usd_per_unit: nbu, source: "nbu" }, { onConflict: "month,currency" }); }
          catch { /* запись в кэш не критична */ }
        }
      }
    }
  }

  // 3) Чего так и нет — запасной набор (не кэшируем, чтобы позже взять НБУ).
  for (const m of uniqMonths) {
    for (const cur of uniqCurs) {
      if (out.has(keyOf(m, cur))) continue;
      const fb = fallbackUsdPerUnit(cur, m);
      if (fb != null) out.set(keyOf(m, cur), fb);
    }
  }

  return out;
}
