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

// Явная команда поправить («исправь…», «замени…», «можешь поправить…?») — только
// с ней сообщение с вопросительным знаком считается поправкой.
const IMPERATIVE_FIX =
  /(исправ|поправ|измени|замени|поменяй|перепиши|убери|допиши|виправ|зміни|заміни|поміняй|перепиши|прибери|допиши|запиши\s+(правильно|верно)|fix|change|replace|rewrite|corrige|remplace)/i;

export function isCorrection(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  // Вопрос-подтверждение или вопрос о данных («…ты поставил на вчера, правильно?
  // А записи на сегодня есть?») — это ВОПРОС боту, человек ждёт ОТВЕТА, а не правки
  // записи (кейс Игоря 26.07: такие фразы уходили в amend и пачкали запись).
  // Вопросом считаем текст, кончающийся «?», без явной команды исправить.
  if (/\?\s*$/.test(t) && !IMPERATIVE_FIX.test(t)) return false;
  return MARKERS.test(t) || MISHEARD.test(t);
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
): Promise<{ entry: { id: string; entry_date: string }; analysis: Analysis; moved: boolean } | null> {
  const db = supabaseAdmin();
  // Последняя — та, что НАПИСАНА последней (created_at), а не та, что подшита к
  // самому свежему дню. Запись прошлым числом ломала и то, и другое: «на выходных
  // ездили в Тулузу» ложилось в 26.09, и сразу сказанное «нет, это было в
  // воскресенье» либо правило чужую запись (у неё entry_date свежее), либо не
  // правило ничего — проверка «сделана сегодня» сравнивала с 26.09 и отказывала.
  const { data: last } = await db
    .from("entries")
    .select("id, raw_text, entry_date, entry_time, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last) return null;

  // Правим только что написанное: «я ошибся» через неделю не должно переписывать
  // старую запись. Считаем по местному дню человека — у края суток UTC врёт.
  let off = 0;
  try {
    const { data: u } = await db.from("users").select("tz_offset").eq("id", userId).maybeSingle();
    if (typeof (u as any)?.tz_offset === "number") off = (u as any).tz_offset;
  } catch { /* нет колонки — считаем по UTC */ }
  const localDay = (ms: number) => new Date(ms + off * 60000).toISOString().slice(0, 10);
  const written = Date.parse(String((last as any).created_at || ""));
  if (!Number.isFinite(written) || localDay(written) !== localDay(Date.now())) return null;

  return amendEntryById(userId, String(last.id), correction);
}

// Та же правка, но по НАЙДЕННОЙ записи, а не по последней. Дневник копится
// годами, и «исправь запись про Лиссабон» — такая же обычная просьба, как
// «я ошибся» сразу после отправки.
export async function amendEntryById(
  userId: string,
  entryId: string,
  correction: string
): Promise<{ entry: { id: string; entry_date: string }; analysis: Analysis; moved: boolean } | null> {
  const db = supabaseAdmin();
  const { data: last } = await db
    .from("entries")
    .select("id, raw_text, entry_date, entry_time")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!last) return null;

  const combined = `${last.raw_text || ""}\n\n[Поправка пользователя]: ${correction}`;
  const a = await analyze(combined, userId);

  // Поправка про ДЕНЬ («это было в воскресенье», «не 15-го, а 16-го») должна
  // двигать саму запись — иначе бот отвечает «поправил», а в дневнике всё тот же
  // чужой день. Берём дату из нового разбора ТОЛЬКО если про день сказано в самой
  // поправке: «вчера» из старого текста при разборе через неделю означает уже
  // другой день, и запись уехала бы на ровном месте.
  const moved = mentionsDay(correction) ? sanePastDate((a as any).entry_date, last.entry_date) : null;

  await db
    .from("entries")
    .update({
      raw_text: combined,
      ...(moved ? { entry_date: moved, entry_time: last.entry_time || "12:00:00" } : {}),
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

  return { entry: { id: last.id, entry_date: moved || last.entry_date }, analysis: a, moved: !!moved };
}

// Сказано ли в поправке что-то про ДЕНЬ: день недели, «вчера», число с месяцем.
const DAY_WORD =
  /(вчера|позавчера|сегодня|учора|позавчора|сьогодні|yesterday|today|понедельник|вторник|сред[ау]|четверг|пятниц|суббот|воскресен|понеділок|вівторок|середу|четвер|п'ятниц|субот|неділ|monday|tuesday|wednesday|thursday|friday|saturday|sunday|(?:[12]\d|3[01]|0?[1-9])[.\/-](?:0[1-9]|1[0-2])\b|\d{1,2}\s*(январ|феврал|март|апрел|ма[яй]|июн|июл|август|сентябр|октябр|ноябр|декабр|січн|лют|берез|квітн|травн|черв|лип|серпн|вересн|жовтн|листопад|грудн))/i;
export function mentionsDay(text: string): boolean {
  return !!text && DAY_WORD.test(text);
}

// Дата годится, только если она в прошлом, не старше года и реально другая.
function sanePastDate(next: unknown, current: string): string | null {
  if (typeof next !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(next) || next === current) return null;
  const diff = Date.now() - Date.parse(next);
  return diff > -86400000 && diff <= 366 * 86400000 ? next : null;
}
