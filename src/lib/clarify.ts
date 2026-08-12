import { supabaseAdmin } from "./supabaseAdmin";

// Ответ на уточняющий вопрос — это ответ, а не новая запись.
//
// Живой случай: бот спросил «в каком городе искать?» и показал кнопки. Человек
// не нажал кнопку, а написал словами — «Рейк явик». Для бота это было отдельное
// сообщение ниоткуда, и он ответил: «это звучит как что-то важное для тебя, но
// я не совсем понимаю, что ты имеешь в виду». Вопрос задал он сам минуту назад.
//
// Поэтому запоминаем: о чём спросили и ради какой просьбы. Следующая реплика
// приходит к мозгу вместе с этим — и он доводит дело до конца.

type Pending = { q: string; ask: string; at: number };

// Пятнадцати минут хватает: человек отвлёкся, вернулся, дописал. Дольше — и
// связь с вопросом уже додумана нами, а не им.
const LIVE_MS = 15 * 60_000;

async function prefsOf(userId: string): Promise<any> {
  const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
  return { ...((data as any)?.morning_prefs || {}) };
}

export async function rememberClarify(userId: string, question: string, ask: string): Promise<void> {
  try {
    const p = await prefsOf(userId);
    p.pendingClarify = { q: String(question).slice(0, 300), ask: String(ask).slice(0, 700), at: Date.now() } as Pending;
    await supabaseAdmin().from("users").update({ morning_prefs: p }).eq("id", userId);
  } catch {
    // Без этого бот просто менее внимателен — ронять из-за такого разговор нельзя.
  }
}

// Забираем и сразу гасим: уточнение отвечается один раз.
export async function takeClarify(userId: string): Promise<Pending | null> {
  try {
    const p = await prefsOf(userId);
    const c: Pending | undefined = p.pendingClarify;
    if (!c?.q) return null;
    delete p.pendingClarify;
    await supabaseAdmin().from("users").update({ morning_prefs: p }).eq("id", userId);
    if (Date.now() - Number(c.at || 0) > LIVE_MS) return null;
    return c;
  } catch {
    return null;
  }
}

// Подсказка мозгу. Короткая реплика после вопроса — почти наверняка ответ на
// него; длинный рассказ — уже своя жизнь, и навязывать ему старую просьбу не надо.
export function clarifyContext(c: Pending, said: string): string | null {
  const t = (said || "").trim();
  if (!t || t.length > 200 || t.startsWith("/")) return null;
  return `Минуту назад ТЫ САМ спросил у человека: «${c.q}» — ради его просьбы: «${c.ask}». Сейчас он отвечает на этот вопрос: «${t}». Это НЕ новая запись в дневник и не отдельная тема. Прими ответ (даже если он написан с опечаткой или в другом падеже) и доведи исходную просьбу до конца.`;
}
