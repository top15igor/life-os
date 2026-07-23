import { supabaseAdmin } from "./supabaseAdmin";
import { analyze, type Analysis } from "./ai";
import { attachDerived, clearDerived } from "./saveEntry";

// Сообщение похоже на исправление/уточнение предыдущей записи?
const MARKERS =
  /(исправ|поправ|уточняю|уточнение|уточню|уточнить|на самом деле|не наоборот|ошибся|ошибк[аи] в|опечатк|имел[аи]? в виду|перепутал|корректир|это не так|не верно|верная сумма|правильн[аоы]|виправ|уточнюю|насправді|переплута|actually|correction|i meant|to clarify|let me clarify|fix that|that'?s wrong|that is wrong|en fait|je voulais dire|erreur|(?:измени|замени|поменяй|заміни|поміняй)(?![а-яёіїєґ])[^.!?]{0,40}\sна\s|(?:change|replace)[^.!?]{0,30}\b(?:to|with)\b)/i;

// Отдельно: явная жалоба «(ты) неправильно/неверно/не так записал|понял|услышал|распознал»
// в любом порядке слов («записал не так», «распознал неправильно», «ты не так понял»).
const MISHEARD =
  /((неправильно|неверно|не\s+так|не\s+то)\s*(ты\s+)?(записал|записав|запис|сохранил|понял|зрозумів|услышал|почув|распознал|розпізнав))|((записал|записав|запис(ал|ала|ано)?|сохранил|понял|услышал|распознал)[^.!?]{0,20}(неправильно|неверно|не\s+так|не\s+то))|(ты\s+(не\s+так|неправильно|неверно))|(запиши\s+(правильно|верно))/i;

export function isCorrection(text: string): boolean {
  return !!text && (MARKERS.test(text) || MISHEARD.test(text));
}

// Исправление ИМЕНИ человека («её зовут X», «настоящее имя — X», «переименуй…»,
// «исправь имя») — этим занимается действие rename_person через роутер: имя надо
// поменять во всей базе (люди + инсайты), а не в одной последней записи.
const NAME_FIX =
  /(зовут|звати|кличут|переимен|настоящее имя|справжнє ім'я|real name|(исправь|поправь|виправ|поменяй|зміни|change|fix)\s+(имя|ім'я|name))/i;
export function isNameCorrection(text: string): boolean {
  return !!text && NAME_FIX.test(text);
}

// Применить поправку к ПОСЛЕДНЕЙ сегодняшней записи: пере-разобрать и заменить производные.
export async function amendLastEntry(
  userId: string,
  correction: string
): Promise<{ entry: { id: string; entry_date: string }; analysis: Analysis } | null> {
  const db = supabaseAdmin();
  const { data: last } = await db
    .from("entries")
    .select("id, raw_text, entry_date, entry_time")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .order("entry_time", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last) return null;

  // Правим только последнюю запись, если она сделана сегодня.
  const todayISO = new Date().toISOString().slice(0, 10);
  if (last.entry_date !== todayISO) return null;

  const combined = `${last.raw_text || ""}\n\n[Поправка пользователя]: ${correction}`;
  const a = await analyze(combined, userId);

  await db
    .from("entries")
    .update({
      raw_text: combined,
      summary: a.summary ?? null,
      focus: a.focus ?? null,
      mood: a.mood ?? null,
      energy: a.energy ?? null,
      health: a.health ?? null,
      importance: a.importance ?? null,
      sleep_hours: a.sleep_hours ?? null,
      weight: a.weight ?? null,
    })
    .eq("id", last.id)
    .eq("user_id", userId);

  await clearDerived(last.id);
  await attachDerived(userId, last.id, a);

  return { entry: { id: last.id, entry_date: last.entry_date }, analysis: a };
}
