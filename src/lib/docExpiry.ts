// Сроки документов «Визуальной памяти»: находим дату окончания в извлечённых
// полях (паспорт, виза, гарантия, права) и считаем, сколько дней осталось.
// Модуль без серверных импортов — годится и для страницы (баннер), и для крона (напоминания).

type Field = { label?: string; value?: string };

// Ярлыки полей, означающие «действителен до / истекает». Консервативно: если явного
// признака окончания нет — НЕ трактуем дату как срок (лучше не напомнить, чем спутать
// с датой выдачи и пугать зря).
const EXPIRY_LABELS = [
  // ru / uk
  "действ", "оконч", "истек", "истёк", "годен", "годна", "срок дейст", "срок годн",
  "дійсн", "закінч", "термін дії", "дата закінчення", "чинн",
  // en
  "expir", "valid until", "valid thru", "valid to", "expiry", "expiration", "date of expiry", "exp date", "exp.",
  // fr
  "validité", "valable jusqu", "expir", "échéance",
  // es
  "vence", "vencimiento", "válid", "valido hasta", "caduc", "expira",
];

const MONTHS: Record<string, number> = {
  // ru
  "янв": 1, "фев": 2, "мар": 3, "апр": 4, "мая": 5, "май": 5, "июн": 6, "июл": 7, "авг": 8, "сен": 9, "окт": 10, "ноя": 11, "дек": 12,
  // uk
  "січ": 1, "лют": 2, "бер": 3, "квіт": 4, "трав": 5, "черв": 6, "лип": 7, "серп": 8, "вер": 9, "жовт": 10, "лист": 11, "груд": 12,
  // en
  "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
};

// Разобрать дату из «сырого» текста поля. Поддержаны: ISO, DD.MM.YYYY, DD/MM/YYYY,
// «24 октября 2027», «October 24, 2027», MM/YYYY (карты → конец месяца).
export function parseLooseDate(raw: string): string | null {
  const t = (raw || "").trim();
  if (!t) return null;
  const mk = (y: number, m: number, d: number): string | null => {
    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };
  let m: RegExpMatchArray | null;
  if ((m = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/))) return mk(+m[1], +m[2], +m[3]);
  if ((m = t.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/))) return mk(+m[3], +m[2], +m[1]);
  if ((m = t.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2})\b/))) { const yy = +m[3]; return mk(2000 + yy, +m[2], +m[1]); }
  // Месяц словом.
  const low = t.toLowerCase();
  const nameRe = /(\d{1,2})?\s*([а-яёіїєa-z]{3,})[a-zа-яёіїє]*\.?,?\s*(\d{1,2})?,?\s*(\d{4})/i;
  if ((m = low.match(nameRe))) {
    const monKey = Object.keys(MONTHS).find((k) => m![2].startsWith(k));
    if (monKey) {
      const mon = MONTHS[monKey];
      const day = +(m[1] || m[3] || 1);
      return mk(+m[4], mon, day || 1);
    }
  }
  // MM/YYYY (банковские карты) — берём конец месяца как срок.
  if ((m = t.match(/(?:^|\D)(\d{1,2})[\/.](\d{4})(?:\D|$)/))) {
    const mm = +m[1];
    if (mm >= 1 && mm <= 12) { const last = new Date(Date.UTC(+m[2], mm, 0)).getUTCDate(); return mk(+m[2], mm, last); }
  }
  return null;
}

// Найти дату окончания документа. Возвращает { date, label } или null.
export function documentExpiry(category: string, fields?: Field[]): { date: string; label: string } | null {
  if (!fields || !fields.length) return null;
  // Только у документов и вещей (гарантии). Моменты/люди/места — не про сроки.
  if (category !== "document" && category !== "thing" && category !== "info") return null;
  for (const f of fields) {
    const label = (f?.label || "").toLowerCase();
    if (!EXPIRY_LABELS.some((k) => label.includes(k))) continue;
    const d = parseLooseDate(String(f?.value || ""));
    if (d) return { date: d, label: f!.label || "" };
  }
  return null;
}

// Сколько дней до срока (отрицательно — уже истёк). todayISO — «сегодня» вызывающего.
export function daysLeft(dateISO: string, todayISO: string): number {
  return Math.round((Date.parse(dateISO) - Date.parse(todayISO)) / 86400000);
}
