// ============================================================
//  Monobank: маппинг транзакции личного API → операция finance_tx.
//  Док: https://api.monobank.ua/docs/
// ============================================================

// Числовой код валюты (ISO 4217) → буквенный.
const CUR_NUM: Record<number, string> = {
  980: "UAH", 840: "USD", 978: "EUR", 826: "GBP", 985: "PLN",
  643: "RUB", 398: "KZT", 981: "GEL", 949: "TRY", 784: "AED",
};
export function currencyAlpha(code: number): string {
  return CUR_NUM[code] || "UAH";
}

// MCC (категория торговой точки) → наш ключ категории. null — не распознано.
function mccCategory(mcc: number): string | null {
  if ([5411, 5412, 5422, 5441, 5451, 5462, 5499].includes(mcc)) return "food";          // продукты
  if ([5811, 5812, 5813, 5814].includes(mcc)) return "cafe";                              // кафе/рестораны
  if ([5541, 5542, 5172].includes(mcc)) return "transport";                               // топливо
  if ([4111, 4121, 4131, 4789, 7512, 7523].includes(mcc)) return "transport";             // транспорт/такси/парковка
  if (mcc >= 3000 && mcc <= 3299) return "travel";                                         // авиалинии
  if (mcc >= 3300 && mcc <= 3499) return "transport";                                      // прокат авто
  if (mcc >= 3500 && mcc <= 3999) return "travel";                                         // отели
  if ([4511, 4722].includes(mcc)) return "travel";                                         // авиа/турагентства
  if ([5912, 5122, 8011, 8021, 8031, 8042, 8043, 8049, 8062, 8071, 8099].includes(mcc)) return "health"; // аптеки/медицина
  if ([5611, 5621, 5631, 5641, 5651, 5661, 5691, 5697, 5698, 5699, 5948].includes(mcc)) return "shopping"; // одежда/обувь
  if ([5732, 5733, 5734, 5735, 5311, 5331, 5399, 5999, 5200, 5211, 5251].includes(mcc)) return "shopping"; // техника/универмаги
  if ([4814, 4815, 4821, 4899, 4900, 4901].includes(mcc)) return "bills";                  // связь/коммуналка
  if ([7832, 7841, 7922, 7929, 7991, 7996, 7997, 7998, 7999, 5815, 5816, 5817, 5818].includes(mcc)) return "fun"; // развлечения/цифра
  if ([5942, 5943, 8211, 8220, 8241, 8244, 8249, 8299].includes(mcc)) return "education";  // книги/обучение
  if ([5947, 5992].includes(mcc)) return "gifts";                                          // подарки/цветы
  return null;
}

import { classifyScope } from "./financeScope";

export type MonoMapped = {
  ext_id: string;
  day: string;
  kind: "income" | "expense";
  amount: number;
  currency: string;
  category: string | null;
  note: string | null;
  scope: string;
};

// Преобразовать statementItem из вебхука/выписки Monobank в операцию.
// ВАЖНО: item.amount — в валюте СЧЁТА, поэтому валюту берём по счёту
// (accountCurrency), а не по item.currencyCode (это может быть валюта операции).
// Возвращает null, если данные неполные.
export function mapStatementItem(item: any, accountCurrency?: string): MonoMapped | null {
  if (!item || typeof item.amount !== "number" || !item.id) return null;
  const amountMinor = item.amount; // в копейках, со знаком (расход < 0)
  const kind: "income" | "expense" = amountMinor < 0 ? "expense" : "income";
  const amount = Math.round((Math.abs(amountMinor) / 100) * 100) / 100;
  if (!(amount > 0)) return null;
  // item.currencyCode — валюта ОПЕРАЦИИ (для трат за границей ≠ валюте счёта),
  // а amount — в валюте СЧЁТА. Если валюту счёта не передали — безопасный дефолт UAH
  // (Monobank украинский; счёт почти всегда в гривне), НЕ валюта операции.
  const currency = accountCurrency || "UAH";
  const day = new Date((Number(item.time) || 0) * 1000).toISOString().slice(0, 10);
  const category = mccCategory(Number(item.mcc));
  const desc = [item.description, item.comment].filter(Boolean).join(" · ").trim();
  const note = desc ? desc.slice(0, 200) : null;
  return {
    ext_id: String(item.id),
    day,
    kind,
    amount,
    currency,
    category,
    note,
    scope: classifyScope({ note, category }),
  };
}
