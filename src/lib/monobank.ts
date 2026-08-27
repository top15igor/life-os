// ============================================================
//  Monobank: маппинг транзакции личного API → операция finance_tx.
//  Док: https://api.monobank.ua/docs/
// ============================================================

// Числовой код валюты (ISO 4217) → буквенный. Таблица должна быть ПОЛНОЙ для
// стран, куда люди реально ездят: живой случай — покупка в Рейкьявике на
// 23 986 исландских крон записалась как 23 986 ГРИВЕН, потому что кроны (352)
// в таблице не было, а неизвестный код молча превращался в UAH. Сумма операции
// в чужой валюте + не та валюта = расходы, завышенные в разы.
const CUR_NUM: Record<number, string> = {
  980: "UAH", 840: "USD", 978: "EUR", 826: "GBP", 985: "PLN",
  643: "RUB", 398: "KZT", 981: "GEL", 949: "TRY", 784: "AED",
  352: "ISK", 203: "CZK", 208: "DKK", 578: "NOK", 752: "SEK", 756: "CHF",
  392: "JPY", 156: "CNY", 410: "KRW", 764: "THB", 704: "VND", 356: "INR",
  376: "ILS", 946: "RON", 348: "HUF", 975: "BGN", 941: "RSD", 498: "MDL",
  807: "MKD", 8: "ALL", 977: "BAM", 124: "CAD", 36: "AUD", 554: "NZD",
  484: "MXN", 986: "BRL", 32: "ARS", 818: "EGP", 504: "MAD", 788: "TND",
  51: "AMD", 944: "AZN", 860: "UZS", 417: "KGS", 972: "TJS", 702: "SGD",
  344: "HKD", 901: "TWD", 458: "MYR", 360: "IDR", 608: "PHP", 144: "LKR",
  682: "SAR", 634: "QAR", 414: "KWD", 48: "BHD", 512: "OMR", 400: "JOD",
  710: "ZAR", 404: "KES", 834: "TZS", 214: "DOP", 188: "CRC", 604: "PEN",
  152: "CLP", 170: "COP", 858: "UYU", 191: "HRK",
};
// Для СЧЕТОВ (валюта счёта Monobank — всегда из короткого списка) — с запасным UAH.
export function currencyAlpha(code: number): string {
  return CUR_NUM[code] || "UAH";
}
// Для ОПЕРАЦИЙ — без запасного: неизвестный код должен вести к честному
// фолбэку «сумма по счёту в валюте счёта», а не к чужой сумме в гривнах.
export function currencyAlphaOrNull(code: number): string | null {
  return CUR_NUM[code] || null;
}

// MCC (категория торговой точки) → наш ключ категории. null — не распознано.
export function mccCategory(mcc: number): string | null {
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
  time: string | null;
  kind: "income" | "expense";
  amount: number;
  currency: string;
  category: string | null;
  note: string | null;
  scope: string;
};

// Преобразовать statementItem из вебхука/выписки Monobank в операцию.
// Пишем сумму и валюту ОПЕРАЦИИ (item.operationAmount + item.currencyCode): трата в
// Париже на 134.82 € так и попадёт как 134.82 €, а не как её гривневый эквивалент со
// счёта (item.amount). Для покупок дома в гривне operationAmount == amount → без разницы.
// Знак (расход/доход) берём по счёту — он всегда согласован. Fallback на счёт, если
// Monobank не прислал operationAmount/currencyCode.
export function mapStatementItem(item: any, accountCurrency?: string): MonoMapped | null {
  if (!item || typeof item.amount !== "number" || !item.id) return null;
  const kind: "income" | "expense" = item.amount < 0 ? "expense" : "income";
  // Валюту операции берём ТОЛЬКО если её код нам известен. Неизвестный код —
  // честный фолбэк: сумма ПО СЧЁТУ в валюте счёта (гривневый эквивалент верен
  // всегда). Раньше неизвестная валюта превращалась в UAH при сумме операции —
  // и исландские кроны становились «гривнами» один к одному.
  const opAlpha = Number.isFinite(Number(item.currencyCode)) ? currencyAlphaOrNull(Number(item.currencyCode)) : null;
  const useOp = opAlpha !== null && typeof item.operationAmount === "number";
  const minor = useOp ? item.operationAmount : item.amount;
  const amount = Math.round((Math.abs(minor) / 100) * 100) / 100;
  if (!(amount > 0)) return null;
  const currency = useOp ? (opAlpha as string) : (accountCurrency || "UAH");
  const day = new Date((Number(item.time) || 0) * 1000).toISOString().slice(0, 10);
  // Время операции — по Киеву: банк украинский, и человек помнит покупку
  // в местном времени, а не в UTC.
  let time: string | null = null;
  try {
    time = new Date((Number(item.time) || 0) * 1000).toLocaleTimeString("uk-UA", { timeZone: "Europe/Kiev", hour: "2-digit", minute: "2-digit" });
    if (!/^\d{2}:\d{2}$/.test(time || "")) time = null;
  } catch { time = null; }
  const category = mccCategory(Number(item.mcc));
  const desc = [item.description, item.comment].filter(Boolean).join(" · ").trim();
  const note = desc ? desc.slice(0, 200) : null;
  return {
    ext_id: String(item.id),
    day,
    time,
    kind,
    amount,
    currency,
    category,
    note,
    scope: classifyScope({ note, category }),
  };
}
