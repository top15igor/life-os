// «Похоже, это Брюарфосс» — превращение узнанного AI места в точку на карте.
//
// Координат в файле часто нет: Telegram стирает их при сжатии, а старые снимки
// их и не имели. Зато AI, разбирая фотографию, обычно узнаёт САМО МЕСТО и
// пишет его словами. Здесь это название превращается в координаты — и человеку
// остаётся только подтвердить, а не искать точку на карте вручную.
//
// Догадка НИКОГДА не становится точкой сама: AI ошибается, а неверная точка на
// карте жизни хуже, чем её отсутствие.

import { supabaseAdmin } from "./supabaseAdmin";
import { geocodeName } from "./geocode";

export type Guess = { lat: number; lng: number; place: string; query: string };

// Метки полей, за которыми у разобранных снимков прячется место.
const PLACE_LABEL = /мест|place|location|локац|город|city|страна|country|адрес|address|где/i;

// Из чего вообще можно искать: короткая строка с именем собственным.
function usable(q: string): boolean {
  const s = q.trim();
  if (s.length < 3 || s.length > 120) return false;
  // «Неизвестно», «не определено» и прочие честные пустышки геокодировать незачем.
  if (/не\s?извест|не\s?определ|unknown|n\/a|—|--/i.test(s)) return false;
  return /[\p{Lu}\p{Lt}]/u.test(s) || /\d/.test(s);
}

// Название места из уже сохранённого снимка: сначала отдельное поле догадки,
// потом — извлечённые AI данные («• Место: …»).
export function placeQueryOf(row: any): string | null {
  if (row?.geo_source === "guess" && usable(String(row.place_name || ""))) return String(row.place_name).trim();
  const fields = Array.isArray(row?.fields) ? row.fields : [];
  for (const f of fields) {
    const label = String(f?.label || "");
    const value = String(f?.value || "");
    if (PLACE_LABEL.test(label) && usable(value)) return value.trim();
  }
  return null;
}

// Скобки с латинской калькой («Брюарфосс (Brúarfoss)») геокодеру только мешают —
// оставляем то, что человек прочёл бы вслух.
function clean(q: string): string {
  return q.replace(/\s*\([^)]*\)/g, "").replace(/\s{2,}/g, " ").trim();
}

// Чем искать. AI пишет по-человечески — «Концертный зал Харпа, Рейкьявик», — а
// поиску по карте такое не всегда по зубам. Поэтому пробуем несколько
// написаний, от самого точного к самому общему: последним идёт просто город со
// страной. Даже он лучше пустоты: точка встанет рядом, а человек подвинет.
function variants(raw: string): string[] {
  const out: string[] = [];
  const push = (v: string) => {
    const t = v.trim().replace(/^[,\s]+|[,\s]+$/g, "");
    if (t.length >= 3 && !out.includes(t)) out.push(t);
  };
  push(clean(raw));
  push(raw);
  // Латинское написание из скобок часто узнаётся лучше кириллицы.
  const latin = raw.match(/\(([^)]{3,40})\)/)?.[1];
  const parts = clean(raw).split(",").map((x) => x.trim()).filter(Boolean);
  if (latin) push([latin, parts[parts.length - 1]].filter(Boolean).join(", "));
  if (parts.length > 2) push(parts.slice(-2).join(", "));
  if (parts.length > 1) push(parts[parts.length - 1]);
  return out.slice(0, 5);
}

export async function guessFor(userId: string, memoryId: string): Promise<Guess | null> {
  try {
    const { data } = await supabaseAdmin()
      .from("memories")
      .select("id, title, summary, fields, place_name, geo_source, lat")
      .eq("id", memoryId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return null;
    // У снимка уже есть точка — предлагать нечего.
    if ((data as any).lat !== null && (data as any).lat !== undefined) return null;

    const raw = placeQueryOf(data);
    if (!raw) return null;

    for (const q of variants(raw)) {
      const res = await geocodeName(q);
      if (res && res !== "notfound") {
        // Показываем человеку ЕГО формулировку, а не адрес из справочника:
        // «Водопад Брюарфосс, Исландия» понятнее, чем «Brúarfoss, Боргарнес,
        // Вестюрланд». Полный адрес всё равно виден на самой карте.
        return { lat: res.lat, lng: res.lng, place: clean(raw), query: q };
      }
    }
    return null;
  } catch {
    return null;
  }
}
