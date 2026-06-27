// ============================================================
//  Импорт данных из приложения MoneyOK (экспорт «MoneyOK.csv»).
//  Чистый парсер без зависимостей: текст CSV → операции LIFE OS.
//
//  Формат экспорта MoneyOK публично не задокументирован, поэтому
//  парсер устойчив к вариациям: сам определяет разделитель, понимает
//  заголовки на RU/EN, доход/расход по типу или знаку суммы, валюту
//  по коду или символу, дату в нескольких форматах. Если строки
//  заголовков нет — колонки определяются эвристически по содержимому.
// ============================================================

export type ParsedTx = {
  day: string; // YYYY-MM-DD
  kind: "income" | "expense";
  amount: number; // > 0
  currency: string; // код из ALLOWED
  category: string; // ключ нашей категории либо исходное название
  note: string | null;
};

export type ParseResult = {
  rows: ParsedTx[];
  total: number; // всего строк данных в файле
  skipped: number; // пропущено (переводы, пустые, без суммы/даты)
};

// Валюты, которые понимает наш модуль финансов.
const ALLOWED = ["USD", "EUR", "UAH", "RUB", "GBP", "PLN", "KZT", "GEL", "TRY", "AED"];

// Символы и народные названия валют → код.
const CUR_ALIAS: Record<string, string> = {
  "₴": "UAH", "грн": "UAH", "грн.": "UAH", "uah": "UAH", "₴.": "UAH",
  "$": "USD", "usd": "USD", "дол": "USD", "долл": "USD",
  "€": "EUR", "eur": "EUR", "евро": "EUR",
  "₽": "RUB", "руб": "RUB", "руб.": "RUB", "rub": "RUB", "р.": "RUB",
  "£": "GBP", "gbp": "GBP",
  "zł": "PLN", "zl": "PLN", "pln": "PLN", "злот": "PLN",
  "₸": "KZT", "kzt": "KZT", "тенге": "KZT",
  "₾": "GEL", "gel": "GEL", "лари": "GEL",
  "₺": "TRY", "try": "TRY",
  "aed": "AED", "дирхам": "AED",
};

// Названия категорий MoneyOK (и похожих приложений) → наши ключи.
// Сопоставление по вхождению подстроки в нижнем регистре.
const EXPENSE_MAP: Array<[string[], string]> = [
  [["продукт", "еда", "супермаркет", "groceries", "food", "магазин прод"], "food"],
  [["кафе", "ресторан", "столов", "фастфуд", "fast food", "eating", "cafe", "restaurant", "бар"], "cafe"],
  [["транспорт", "авто", "машин", "бензин", "топлив", "такси", "метро", "проезд", "transport", "fuel", "taxi", "car", "парков"], "transport"],
  [["жиль", "жилье", "аренд", "квартир", "ипотек", "дом", "rent", "housing", "mortgage"], "housing"],
  [["связ", "интернет", "телефон", "коммунал", "жкх", "счет", "счёт", "услуг", "подписк", "bills", "utilities", "subscription", "phone", "internet"], "bills"],
  [["одежд", "обув", "покупк", "шопинг", "shopping", "clothes", "товар"], "shopping"],
  [["здоров", "аптек", "медицин", "лекарств", "врач", "стоматолог", "health", "pharmacy", "doctor", "medical"], "health"],
  [["развлеч", "отдых", "кино", "игр", "хобби", "fun", "entertainment", "games", "movie"], "fun"],
  [["образован", "учеб", "учёб", "книг", "курс", "обучен", "education", "books", "course", "study"], "education"],
  [["путешеств", "отпуск", "поездк", "туризм", "отель", "travel", "trip", "hotel", "vacation", "flight"], "travel"],
  [["подарк", "подарок", "gift"], "gifts"],
];
const INCOME_MAP: Array<[string[], string]> = [
  [["зарплат", "аванс", "зп", "оклад", "salary", "wage"], "salary"],
  [["подработ", "фриланс", "халтур", "freelance", "side"], "freelance"],
  [["бизнес", "business", "продаж", "выручк"], "business"],
  [["подарок", "подарк", "gift"], "gift"],
  [["инвестиц", "процент", "дивиденд", "вклад", "депозит", "кэшбэк", "кешбек", "investment", "interest", "dividend", "cashback", "deposit"], "investment"],
];

// Синонимы заголовков колонок.
const HEAD = {
  date: ["дата", "date", "день", "когда"],
  time: ["время", "time"],
  amount: ["сумма", "amount", "сума", "value", "размер"],
  income: ["доход", "приход", "income", "credit", "поступлен"],
  expense: ["расход", "трата", "expense", "debit", "списан"],
  currency: ["валюта", "currency", "cur", "валюти"],
  category: ["категория", "категорія", "category", "статья", "тип расхода", "тип расхо"],
  type: ["тип", "type", "вид", "операция", "операци", "направлен"],
  account: ["счет", "счёт", "account", "кошел", "карта", "wallet", "рахунок"],
  note: ["заметка", "коммент", "комментар", "описание", "note", "comment", "description", "назначение", "примечан", "нотатк"],
};

const norm = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");

// Разбор CSV в матрицу строк с учётом кавычек и выбранного разделителя.
function parseCsv(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === delim) { row.push(field); field = ""; continue; }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((x) => x.trim() !== "")) rows.push(row); }
  return rows;
}

// Выбор разделителя по первой содержательной строке.
function detectDelim(text: string): string {
  const line = (text.split(/\r?\n/).find((l) => l.trim() !== "") || "");
  let best = ",", bestN = -1;
  for (const d of [";", "\t", ",", "|"]) {
    // считаем вхождения вне кавычек
    let n = 0, q = false;
    for (const ch of line) { if (ch === '"') q = !q; else if (ch === d && !q) n++; }
    if (n > bestN) { bestN = n; best = d; }
  }
  return best;
}

// «1 250,50» / «1,250.50» / «(300)» / «−42» → число (>0) либо NaN.
function parseAmount(raw: string): number {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/[\s  ]/g, "");
  if (!s) return NaN;
  const neg = /^[(-]/.test(s) || /[-)]$/.test(s) || s.includes("−");
  s = s.replace(/[^\d.,]/g, "");
  if (s.includes(",") && s.includes(".")) {
    // последний разделитель — десятичный
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (s.includes(",")) {
    const parts = s.split(",");
    // запятая как десятичный, если после неё 1–2 цифры и одна запятая
    if (parts.length === 2 && parts[1].length <= 2) s = parts[0] + "." + parts[1];
    else s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  if (!isFinite(n)) return NaN;
  return neg ? -Math.abs(n) : n;
}

// Дата в YYYY-MM-DD из распространённых форматов.
function parseDate(raw: string): string | null {
  if (!raw) return null;
  const s = String(raw).trim().split(/[ T]/)[0];
  let m = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/); // YYYY-MM-DD
  if (m) return iso(m[1], m[2], m[3]);
  m = s.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{2,4})$/); // DD.MM.YYYY / DD/MM/YY
  if (m) {
    let y = m[3];
    if (y.length === 2) y = (Number(y) > 70 ? "19" : "20") + y;
    return iso(y, m[2], m[1]);
  }
  return null;
}
function iso(y: string, mo: string, d: string): string | null {
  const Y = Number(y), M = Number(mo), D = Number(d);
  if (!Y || M < 1 || M > 12 || D < 1 || D > 31) return null;
  return `${Y}-${String(M).padStart(2, "0")}-${String(D).padStart(2, "0")}`;
}

function mapCurrency(raw: string, fallback: string): string {
  const s = norm(raw).replace(/\.$/, "");
  if (!s) return fallback;
  const up = s.toUpperCase();
  if (ALLOWED.includes(up)) return up;
  for (const [k, v] of Object.entries(CUR_ALIAS)) if (s === norm(k) || s.includes(norm(k))) return v;
  return fallback;
}

function mapCategory(raw: string, kind: "income" | "expense"): string {
  const s = norm(raw);
  if (!s) return kind === "income" ? "salary" : "other";
  const table = kind === "income" ? INCOME_MAP : EXPENSE_MAP;
  for (const [keys, key] of table) if (keys.some((k) => s.includes(k))) return key;
  // Не распознали — сохраняем исходное название (усечённое), чтобы не терять данные.
  return raw.trim().slice(0, 40);
}

// Найти индекс колонки по списку синонимов заголовка.
function findCol(headers: string[], names: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (names.some((n) => h === n || h.includes(n))) return i;
  }
  return -1;
}

// Похожа ли строка на заголовок (содержит известные названия колонок)?
function looksLikeHeader(cells: string[]): boolean {
  const hs = cells.map(norm);
  const all = [...HEAD.date, ...HEAD.amount, ...HEAD.category, ...HEAD.type, ...HEAD.currency, ...HEAD.note, ...HEAD.account, ...HEAD.income, ...HEAD.expense];
  return hs.some((h) => all.some((n) => h === n || h.includes(n))) && !hs.some((h) => parseDate(h));
}

// Эвристически определить колонки, когда строки заголовка нет.
function detectColumns(data: string[][]) {
  const cols = data[0]?.length || 0;
  const sample = data.slice(0, 30);
  let dateCol = -1, amountCol = -1, curCol = -1;
  let bestDate = 0, bestNum = 0;
  for (let c = 0; c < cols; c++) {
    let dates = 0, nums = 0, curs = 0;
    for (const r of sample) {
      const v = (r[c] || "").trim();
      if (parseDate(v)) dates++;
      if (isFinite(parseAmount(v)) && /\d/.test(v)) nums++;
      if (mapCurrency(v, "") && norm(v).length <= 4) curs++;
    }
    if (dates > bestDate) { bestDate = dates; dateCol = c; }
    if (nums > bestNum && c !== dateCol) { bestNum = nums; amountCol = c; }
    if (curs > sample.length * 0.6) curCol = c;
  }
  // оставшиеся текстовые колонки: первая — категория, вторая — заметка
  const used = new Set([dateCol, amountCol, curCol]);
  const textCols = [];
  for (let c = 0; c < cols; c++) if (!used.has(c)) textCols.push(c);
  return { dateCol, amountCol, curCol, catCol: textCols[0] ?? -1, noteCol: textCols[1] ?? -1 };
}

export function parseMoneyOk(text: string): ParseResult {
  // Срезаем BOM.
  text = text.replace(/^﻿/, "");
  const delim = detectDelim(text);
  const matrix = parseCsv(text, delim);
  if (!matrix.length) return { rows: [], total: 0, skipped: 0 };

  let idx: Record<string, number>;
  let data: string[][];
  const hasHeader = looksLikeHeader(matrix[0]);

  if (hasHeader) {
    const headers = matrix[0].map(norm);
    idx = {
      date: findCol(headers, HEAD.date),
      time: findCol(headers, HEAD.time),
      amount: findCol(headers, HEAD.amount),
      income: findCol(headers, HEAD.income),
      expense: findCol(headers, HEAD.expense),
      currency: findCol(headers, HEAD.currency),
      category: findCol(headers, HEAD.category),
      type: findCol(headers, HEAD.type),
      note: findCol(headers, HEAD.note),
    };
    data = matrix.slice(1);
  } else {
    const d = detectColumns(matrix);
    idx = { date: d.dateCol, time: -1, amount: d.amountCol, income: -1, expense: -1, currency: d.curCol, category: d.catCol, type: -1, note: d.noteCol };
    data = matrix;
  }

  // Валюта по умолчанию — самая частая распознанная в файле, иначе USD.
  const curFreq = new Map<string, number>();
  if (idx.currency >= 0) {
    for (const r of data) { const c = mapCurrency(r[idx.currency] || "", ""); if (c) curFreq.set(c, (curFreq.get(c) || 0) + 1); }
  }
  const fallbackCur = [...curFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "USD";

  // Использует ли файл знак суммы (есть ли хоть одно отрицательное значение)?
  // Если да — знак различает доход/расход. Если нет и нет типа — считаем расходом
  // (в финансовом журнале расходов кратно больше).
  let fileHasSigns = false;
  if (idx.amount >= 0) {
    for (const r of data) { const a = parseAmount(r[idx.amount] || ""); if (isFinite(a) && a < 0) { fileHasSigns = true; break; } }
  }

  const rows: ParsedTx[] = [];
  let skipped = 0;
  for (const r of data) {
    const day = parseDate(idx.date >= 0 ? r[idx.date] || "" : "");
    if (!day) { skipped++; continue; }

    // Определяем тип и сумму.
    let kind: "income" | "expense" | null = null;
    let amount = NaN;

    // Явные раздельные колонки доход/расход.
    if (idx.income >= 0 || idx.expense >= 0) {
      const inc = idx.income >= 0 ? parseAmount(r[idx.income] || "") : NaN;
      const exp = idx.expense >= 0 ? parseAmount(r[idx.expense] || "") : NaN;
      if (isFinite(inc) && Math.abs(inc) > 0) { kind = "income"; amount = Math.abs(inc); }
      else if (isFinite(exp) && Math.abs(exp) > 0) { kind = "expense"; amount = Math.abs(exp); }
    }

    // Колонка типа: Расход/Доход/Перевод.
    const typeRaw = idx.type >= 0 ? norm(r[idx.type] || "") : "";
    if (typeRaw && (typeRaw.includes("перевод") || typeRaw.includes("transfer"))) { skipped++; continue; }

    if (kind === null) {
      amount = parseAmount(idx.amount >= 0 ? r[idx.amount] || "" : "");
      if (!isFinite(amount) || amount === 0) { skipped++; continue; }
      if (typeRaw.includes("доход") || typeRaw.includes("income") || typeRaw.includes("приход")) kind = "income";
      else if (typeRaw.includes("расход") || typeRaw.includes("expense") || typeRaw.includes("трата")) kind = "expense";
      else if (fileHasSigns) kind = amount < 0 ? "expense" : "income"; // знак различает тип
      else kind = "expense"; // нет ни типа, ни знаков — по умолчанию расход
      amount = Math.abs(amount);
    }

    if (!isFinite(amount) || amount <= 0 || amount > 1e12) { skipped++; continue; }

    const currency = idx.currency >= 0 ? mapCurrency(r[idx.currency] || "", fallbackCur) : fallbackCur;
    const rawCat = idx.category >= 0 ? r[idx.category] || "" : "";
    const category = mapCategory(rawCat, kind);
    let note = idx.note >= 0 ? (r[idx.note] || "").trim() : "";
    // Если категорию распознали в наш ключ, но исходное имя отличалось — сохраним его в заметке.
    if (note.length > 200) note = note.slice(0, 200);

    rows.push({ day, kind, amount: Math.round(amount * 100) / 100, currency, category, note: note || null });
  }

  return { rows, total: data.length, skipped };
}
