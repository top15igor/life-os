import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { normalizeMorningPrefs } from "./morningPrefs";

// 🎂 День рождения пользователя: бот сам поздравляет раз в год — тепло, лично и
// с улыбкой. Дата хранится в users.birthday; если год неизвестен, ставим
// год-заглушку 1904 (високосный — переживёт даже 29 февраля).

export type Lang = "ru" | "en" | "uk" | "fr" | "es";

export const BDAY_UNKNOWN_YEAR = 1904;

// day/month(/year) → "YYYY-MM-DD" или null, если дата невозможная.
export function birthdayISO(day: number, month: number, year?: number | null): string | null {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return null;
  const y = year && Number.isInteger(year) && year >= 1900 && year <= new Date().getUTCFullYear() ? year : BDAY_UNKNOWN_YEAR;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(y, month - 1, day));
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null; // 31 февраля и т.п.
  return d.toISOString().slice(0, 10);
}

// Совпадает ли локальная дата пользователя с его днём рождения.
// Рождённых 29 февраля в невисокосный год поздравляем 1 марта.
export function isBirthdayToday(birthday: string, localDateKey: string): boolean {
  const bm = birthday.slice(5, 7), bd = birthday.slice(8, 10);
  const lm = localDateKey.slice(5, 7), ld = localDateKey.slice(8, 10);
  if (bm === lm && bd === ld) return true;
  if (bm === "02" && bd === "29" && lm === "03" && ld === "01") {
    const y = Number(localDateKey.slice(0, 4));
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return !leap;
  }
  return false;
}

// Возраст, если год известен (не заглушка); иначе null.
export function birthdayAge(birthday: string, localDateKey: string): number | null {
  const y = Number(birthday.slice(0, 4));
  if (!y || y <= BDAY_UNKNOWN_YEAR) return null;
  const age = Number(localDateKey.slice(0, 4)) - y;
  return age > 0 && age < 130 ? age : null;
}

// Дата рождения из профиля Telegram (getChat → birthdate). Бот видит её, только
// если пользователь заполнил ДР в Telegram И открыл в приватности («Кто видит
// дату рождения» = Все). Поэтому это лишь фолбэк с частичным покрытием.
export async function tgProfileBirthday(chatId: number): Promise<{ day: number; month: number; year?: number } | null> {
  try {
    const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId }),
    });
    const j = await r.json().catch(() => null);
    const b = j?.result?.birthdate;
    if (!b || !b.day || !b.month) return null;
    return { day: Number(b.day), month: Number(b.month), year: b.year ? Number(b.year) : undefined };
  } catch {
    return null;
  }
}

// Тихо заполняет users.birthday из Telegram-профиля — ТОЛЬКО если поле пустое
// (дата, названная пользователем, всегда главнее и не перезаписывается).
// Возвращает записанную дату YYYY-MM-DD или null (нет даты / колонки / уже задана).
export async function autoFillBirthdayFromTelegram(userId: string, chatId: number): Promise<string | null> {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db.from("users").select("birthday").eq("id", userId).maybeSingle();
    if (error || (data as any)?.birthday) return null; // колонки нет (birthday.sql) или дата уже есть
    const b = await tgProfileBirthday(chatId);
    if (!b) return null;
    const iso = birthdayISO(b.day, b.month, b.year || null);
    if (!iso) return null;
    const { error: e2 } = await db.from("users").update({ birthday: iso }).eq("id", userId);
    return e2 ? null : iso;
  } catch {
    return null;
  }
}

const GREET_LANG: Record<Lang, string> = {
  ru: "русском", en: "English", uk: "українській", fr: "français", es: "español",
};

// Запасное поздравление, если AI недоступен — всё равно тёплое и с улыбкой.
const FALLBACK: Record<Lang, (name: string) => string> = {
  ru: (n) => `🎂 <b>С днём рождения${n ? `, ${n}` : ""}!</b> 🎉\n\nСегодня твой день — и я, твой дневник, знаю это лучше всех: целый год твоих историй у меня как на ладони, и это был хороший год. 😊\n\nЖелаю, чтобы следующая глава получилась ещё интереснее — а я, как всегда, всё бережно запишу. Обнимаю виртуально, но искренне! 🤗✨`,
  en: (n) => `🎂 <b>Happy birthday${n ? `, ${n}` : ""}!</b> 🎉\n\nToday is your day — and I, your diary, know it better than anyone: I've got a whole year of your stories, and it was a good one. 😊\n\nMay the next chapter be even better — and I'll write it all down, as always. A virtual but very sincere hug! 🤗✨`,
  uk: (n) => `🎂 <b>З днем народження${n ? `, ${n}` : ""}!</b> 🎉\n\nСьогодні твій день — і я, твій щоденник, знаю це краще за всіх: цілий рік твоїх історій у мене як на долоні, і це був гарний рік. 😊\n\nНехай наступний розділ буде ще цікавішим — а я, як завжди, все дбайливо запишу. Обіймаю віртуально, але щиро! 🤗✨`,
  fr: (n) => `🎂 <b>Joyeux anniversaire${n ? `, ${n}` : ""} !</b> 🎉\n\nAujourd'hui c'est ton jour — et moi, ton journal, je le sais mieux que personne : j'ai toute une année de tes histoires, et c'était une belle année. 😊\n\nQue le prochain chapitre soit encore meilleur — je noterai tout, comme toujours. Un câlin virtuel mais sincère ! 🤗✨`,
  es: (n) => `🎂 <b>¡Feliz cumpleaños${n ? `, ${n}` : ""}!</b> 🎉\n\nHoy es tu día — y yo, tu diario, lo sé mejor que nadie: tengo todo un año de tus historias, y fue un buen año. 😊\n\nQue el próximo capítulo sea aún mejor — yo lo anotaré todo, como siempre. ¡Un abrazo virtual pero sincero! 🤗✨`,
};

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Собирает персональное поздравление: имя + возраст (если знаем) + живые детали
// из записей за год (достижения, люди, мечты). Возвращает готовый HTML-текст.
export async function birthdayGreeting(userId: string, lang: Lang, name: string | null, birthday: string | null, localDateKey?: string): Promise<string> {
  const db = supabaseAdmin();
  const fallback = (FALLBACK[lang] || FALLBACK.ru)(name || "");
  try {
    const today = localDateKey || new Date().toISOString().slice(0, 10);
    const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
    const [{ data: ents }, { data: dreams }, { data: prefsRow }] = await Promise.all([
      db.from("entries").select("entry_date, summary").eq("user_id", userId).gte("entry_date", yearAgo).order("entry_date", { ascending: false }).limit(40),
      db.from("dreams").select("text, status").eq("user_id", userId).neq("status", "done").limit(5),
      db.from("users").select("morning_prefs").eq("id", userId).maybeSingle(),
    ]);
    const prefs = normalizeMorningPrefs((prefsRow as any)?.morning_prefs);
    const age = birthday ? birthdayAge(birthday, today) : null;

    const entryLines = (ents || []).map((e: any) => `${e.entry_date}: ${String(e.summary || "").slice(0, 200)}`).join("\n").slice(0, 6000);
    const dreamLines = (dreams || []).map((d: any) => `- ${String(d.text || "").slice(0, 100)}`).join("\n");

    const prompt = `Сегодня ДЕНЬ РОЖДЕНИЯ пользователя твоего дневника LIFE OS! Напиши поздравление на ${GREET_LANG[lang] || GREET_LANG.ru} языке.

Ты — его близкий AI-друг, который целый год бережно хранил его истории. Задача: чтобы человек, читая, УЛЫБНУЛСЯ. Тёплое, личное, с лёгким юмором — как поздравил бы остроумный друг, который правда всё про него помнит.

Правила:
- 8–12 коротких строк, живой язык, эмодзи уместны (🎂🎉✨ и по смыслу), НИКАКОГО канцелярита и ИИ-штампов («в этот особенный день», «пусть сбудутся все мечты»).
- Обратись по имени${prefs.address ? ` (он просил называть его «${prefs.address}»)` : name ? ` (${name})` : " (если имени нет — без имени, на «ты»)"}.
${age ? `- Ему сегодня исполняется ${age} — можно тепло обыграть цифру, без шуток про старость.` : "- Возраст не называй (не знаем)."}
- Вплети 1–2 КОНКРЕТНЫЕ детали из его года по записям ниже (чем он жил, что получилось, кто рядом) — именно это вызывает улыбку «он правда помнит!». Не пересказывай записи списком.
- Если есть мечты — можешь легко подмигнуть одной из них как пожеланию на новый год жизни.
- Финал: одно тёплое пожелание + намёк, что следующую главу его книги жизни вы напишете вместе.
${prefs.chatStyle ? `- Пожелания пользователя к стилю общения: ${prefs.chatStyle}` : ""}
- Только текст поздравления, без заголовков и пояснений.

ЗАПИСИ ЗА ГОД:
${entryLines || "(записей мало — поздравь тепло и обещай запомнить всё, что впереди)"}

МЕЧТЫ:
${dreamLines || "(нет данных)"}`;

    const r = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      temperature: 0.9,
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(userId, "birthday", "sonnet", (r as any).usage);
    const text = r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim();
    if (!text) return fallback;
    const head: Record<Lang, string> = {
      ru: "🎂 <b>С днём рождения!</b> 🎉", en: "🎂 <b>Happy birthday!</b> 🎉",
      uk: "🎂 <b>З днем народження!</b> 🎉", fr: "🎂 <b>Joyeux anniversaire !</b> 🎉", es: "🎂 <b>¡Feliz cumpleaños!</b> 🎉",
    };
    return `${head[lang] || head.ru}\n\n${escHtml(text)}`;
  } catch (e) {
    console.error("birthdayGreeting", userId, e);
    return fallback;
  }
}
