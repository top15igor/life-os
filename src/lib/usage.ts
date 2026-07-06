import { supabaseAdmin } from "./supabaseAdmin";

// Цены за 1М токенов (USD), приблизительно.
const RATES: Record<string, { in: number; out: number }> = {
  sonnet: { in: 3, out: 15 },
  haiku: { in: 1, out: 5 },
};

// Себестоимость вызова Claude с учётом prompt caching:
// - обычный ввод и вывод — по базовой цене;
// - чтение из кэша (cacheRead) — ~10% цены ввода;
// - запись в кэш (cacheWrite) — ~125% цены ввода.
export function claudeCostCents(
  model: "sonnet" | "haiku",
  tokensIn: number,
  tokensOut: number,
  cacheRead = 0,
  cacheWrite = 0,
): number {
  const r = RATES[model] || RATES.sonnet;
  const usd =
    (tokensIn / 1e6) * r.in +
    (tokensOut / 1e6) * r.out +
    (cacheRead / 1e6) * r.in * 0.1 +
    (cacheWrite / 1e6) * r.in * 1.25;
  return Math.round(usd * 100 * 1000) / 1000; // центы, 3 знака
}

// Записать расход (не блокирует основной поток; молча игнорирует, если таблицы нет).
export async function logUsage(userId: string | undefined, kind: string, tokensIn = 0, tokensOut = 0, costCents = 0) {
  if (!userId) return;
  try {
    await supabaseAdmin().from("usage").insert({ user_id: userId, kind, tokens_in: Math.round(tokensIn), tokens_out: Math.round(tokensOut), cost_cents: costCents });
  } catch {
    // таблицы usage может не быть — не страшно
  }
}

// Лог для Claude по объекту usage из ответа SDK.
export async function logClaude(userId: string | undefined, kind: string, model: "sonnet" | "haiku", usage: any) {
  const ti = usage?.input_tokens || 0;
  const to = usage?.output_tokens || 0;
  const cr = usage?.cache_read_input_tokens || 0;   // прочитано из кэша (дёшево)
  const cw = usage?.cache_creation_input_tokens || 0; // записано в кэш
  // tokens_in — суммарный обработанный ввод (для статистики), cost — с учётом кэша.
  return logUsage(userId, kind, ti + cr + cw, to, claudeCostCents(model, ti, to, cr, cw));
}
