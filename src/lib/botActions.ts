import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { DREAM_SPHERES } from "./ai";
import { createReminder, localToISO } from "./reminders";
import type { Recurrence } from "./googleCalendar";
import { addMediaByTitle } from "./books";
import { normalizeMorningPrefs } from "./morningPrefs";
import { askKnowledge } from "./knowledge";
import { birthdayISO, BDAY_UNKNOWN_YEAR } from "./birthday";

// ===== Агентный слой бота: понять ЯВНУЮ команду и выполнить её вместо пользователя. =====
// routeMessage решает за ОДИН вызов: это действие, вопрос или дневниковая запись.

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export type Lang = "ru" | "en" | "uk" | "fr" | "es";

export type Route =
  | { kind: "action"; name: string; input: any; more?: { name: string; input: any }[] }
  | { kind: "question" }
  | { kind: "note" };

export const ACTION_TOOLS: any[] = [
  { name: "add_goal", description: "Добавить цель на год. Только при явной команде вроде «добавь цель…», «поставь цель…».", input_schema: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } },
  { name: "add_task", description: "Добавить задачу/дело БЕЗ конкретного времени. Команда «добавь задачу…», «надо не забыть…», «запиши в дела…». Если названо КОНКРЕТНОЕ время/дата напоминания — это set_reminder, не add_task.", input_schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
  {
    name: "set_reminder",
    description:
      "Поставить НАПОМИНАНИЕ на конкретное время/дату (уйдёт в календарь с уведомлением). Команды: «напомни …», «напоминай …», «напомни мне …», «через час …», «завтра в 9 …», «каждый день в 8 …». Разбери: что напомнить (text, без слова «напомни»), дату и время по МЕСТНОМУ времени пользователя.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "что напомнить, без слова «напомни»" },
        date: { type: "string", description: "дата YYYY-MM-DD по местному времени пользователя" },
        time: { type: "string", description: "время HH:MM 24ч по местному; не указывай, если на весь день" },
        all_day: { type: "boolean", description: "true, если без конкретного времени (день рождения и т.п.)" },
        recurrence: { type: "string", enum: ["none", "daily", "weekly", "monthly", "yearly"], description: "повтор, если сказано «каждый день/неделю/месяц/год»" },
        remind_min: { type: "number", description: "за сколько минут предупредить, если названо (10/30/60/1440); иначе не указывай" },
      },
      required: ["text", "date"],
    },
  },
  { name: "complete_task", description: "Отметить существующую задачу выполненной. Команда «отметь задачу … выполненной», «заверши задачу …», «выполнил …». query — слова для поиска задачи.", input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "log_weight", description: "Записать вес в трекер веса. Команда «запиши вес 78», «мой вес 80 кг». kg — число в килограммах.", input_schema: { type: "object", properties: { kg: { type: "number" } }, required: ["kg"] } },
  { name: "add_dream", description: "Добавить мечту в Карту желаний. Команда «добавь мечту …», «хочу чтобы это было моей мечтой …».", input_schema: { type: "object", properties: { text: { type: "string" }, sphere: { type: "string", enum: [...DREAM_SPHERES] } }, required: ["text"] } },
  { name: "complete_dream", description: "Отметить мечту сбывшейся. Команда «мечта … сбылась», «отметь мечту … исполненной». query — слова для поиска мечты.", input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "add_deed", description: "Добавить доброе дело в «Мой след». Команда «отметь доброе дело …», «запиши что я помог …». person — кому помог, если назван.", input_schema: { type: "object", properties: { text: { type: "string" }, person: { type: "string" } }, required: ["text"] } },
  {
    name: "add_media",
    description:
      "Добавить фильм, сериал или книгу в Медиатеку. Команды: «хочу посмотреть …», «добавь фильм …», «посмотрел сериал …», «хочу прочитать книгу …», «добавь в медиатеку …». title — название (без слов «фильм/сериал/хочу»); kind — film (фильм), series (сериал) или book (книга); status — want (хочу), doing (смотрю/читаю), done (посмотрел/прочитал), по умолчанию want.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "название фильма/сериала/книги" },
        kind: { type: "string", enum: ["film", "series", "book"] },
        status: { type: "string", enum: ["want", "doing", "done"], description: "want по умолчанию" },
      },
      required: ["title", "kind"],
    },
  },
  {
    name: "rename_person",
    description:
      "Пользователь исправляет ИМЯ человека: «её зовут X (а не Y)», «настоящее имя — X», «переименуй Y в X», «исправь имя», «это не Y, это X», «запиши, что её зовут X». Переименовывает человека в базе людей и исправляет его имя во всех сохранённых инсайтах — выбирай это, а НЕ save_entry, когда суть сообщения = поправить имя. from — имя, как записано сейчас (неправильное), to — правильное; оба в именительном падеже.",
    input_schema: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, required: ["from", "to"] },
  },
  {
    name: "ask_knowledge",
    description:
      "Просьба ДАТЬ или НАЙТИ что-то из СОХРАНЁННЫХ материалов пользователя (База знаний: рилсы, посты, ссылки — рецепты, тренировки, советы): «дай рецепт…», «найди рецепт…», «что я сохранял про…», «найди тот рилс/видео про…», «покажи из сохранёнок…». Это ЗАПРОС ответа, а не рассказ о дне — НЕ save_entry. query — сам вопрос своими словами.",
    input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "set_birthday",
    description:
      "Пользователь сообщает СВОЙ день рождения или просит его запомнить: «мой день рождения 15 марта», «я родился 07.03.1990», «запомни, у меня др 1 января». ТОЛЬКО про самого пользователя — дни рождения ДРУГИХ людей (мамы, друга) сюда не относятся (для «напомни про др мамы» — set_reminder). year указывай только если год прямо назван.",
    input_schema: { type: "object", properties: { day: { type: "number", description: "день месяца 1–31" }, month: { type: "number", description: "месяц 1–12" }, year: { type: "number", description: "год рождения, только если назван" } }, required: ["day", "month"] },
  },
  {
    name: "account_info",
    description:
      "Вопросы про СВОЙ АККАУНТ и вход в LIFE OS: «на какую почту зарегистрирован аккаунт», «какая у меня почта», «как я вошёл», «куда привязан аккаунт», «какой у меня логин/юзернейм». Это НЕ вопрос о содержимом дневника.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "set_style",
    description:
      "Пользователь просит ИЗМЕНИТЬ МАНЕРУ ОБЩЕНИЯ бота или содержание его сообщений: «пиши короче», «меньше эмодзи», «без пафоса», «обращайся на вы», «не называй меня…», «не пиши мне про…», «хватит спрашивать про…», «пиши по-украински». Пожелание СОХРАНЯЕТСЯ и реально влияет на будущие сообщения (утренние и чат). wish — суть пожелания одной короткой фразой-инструкцией.",
    input_schema: { type: "object", properties: { wish: { type: "string", description: "пожелание кратко, напр. «писать короче, без эмодзи»" } }, required: ["wish"] },
  },
  { name: "delete_last_entry", description: "Удалить ПОСЛЕДНЮЮ запись дневника. ТОЛЬКО при явной команде удаления, где прямо сказано «удали/убери/сотри» + «(последнюю) запись»: «удали последнюю запись», «убери предыдущую запись», «сотри последнее». НЕ выбирай на фразы-поправки и недовольство («не то записал», «не надо было это добавлять», «надо было иначе», «неправильно», «зачем ты…») — это НЕ команда удаления, для них save_entry.", input_schema: { type: "object", properties: {} } },
  { name: "ask_question", description: "Пользователь СПРАШИВАЕТ ассистента о своей жизни / просит найти, вспомнить, проанализировать — ИЛИ возмущается/уточняет по поводу уже записанного («почему трату не учёл?», «где сегодняшний расход?», «чего не показал?»). Сюда же: вопросы про СВОИ ЦИФРЫ И СТАТИСТИКУ («сколько у меня записей/голосовых сообщений», «сколько слов я написал за всё время», «когда я зарегистрировался») и вопросы ПРО ПРИЛОЖЕНИЕ («как зайти в приложение», «как работает…», «где найти…», «что ты умеешь») — у ассистента есть эти данные и инструкция. Это НЕ новая запись, повторно данные (в т.ч. траты) записывать не нужно.", input_schema: { type: "object", properties: {} } },
  { name: "save_entry", description: "Обычная дневниковая запись: рассказ о дне, мысли, чувства, событие, идея. ПО УМОЛЧАНИЮ выбирай это.", input_schema: { type: "object", properties: {} } },
];

const SYS =
  "Ты — маршрутизатор сообщений в личном дневнике-боте. Большинство сообщений — это ДНЕВНИКОВЫЕ ЗАПИСИ " +
  "(человек рассказывает о дне, мыслях, чувствах, событиях) → save_entry. " +
  "Инструменты-ДЕЙСТВИЯ (add_goal, add_task, set_reminder, complete_task, log_weight, add_dream, complete_dream, add_deed, delete_last_entry) " +
  "выбирай ТОЛЬКО при ЯВНОЙ ПОВЕЛИТЕЛЬНОЙ команде боту («добавь…», «напомни…», «отметь…», «удали…», «запиши вес…», «заверши задачу…»). " +
  "«Напомни …» с датой/временем → set_reminder (разбери дату и время по местному времени). «Добавь задачу» без времени → add_task. " +
  "Если человек просто описывает, что сделал («сегодня пробежал 5 км», «поговорил с мамой») — это save_entry, НЕ действие. " +
  "ВАЖНО: фразы-поправки, недовольство и уточнения («не так записал», «не надо было это добавлять», «надо было иначе», «зачем ты…», «неправильно понял») — это НЕ команда действия и тем более НЕ удаление; по умолчанию save_entry. " +
  "ИСКЛЮЧЕНИЕ: если поправка — про ИМЯ человека («её зовут X», «настоящее имя — X», «переименуй Y в X», «исправь имя», «запиши у себя и измени: её зовут X») → rename_person, чтобы имя исправилось во всей базе, а не легло новой записью. " +
  "delete_last_entry выбирай ТОЛЬКО когда прямо сказано «удали/убери/сотри (последнюю) запись»; при любом сомнении — НЕ удаляй. " +
  "Просьбы к БОТУ изменить манеру или содержание его сообщений («пиши короче», «меньше эмодзи», «не пиши мне про…», «обращайся иначе», «не называй меня…») → set_style, а НЕ save_entry: пожелание должно сохраниться и влиять. " +
  "Вопросы про свой АККАУНТ и вход («на какую почту зарегистрирован», «какая у меня почта», «как я вошёл») → account_info, а НЕ save_entry и НЕ ask_question. " +
  "Вопросы про свои ЦИФРЫ/СТАТИСТИКУ («сколько у меня записей/голосовых», «сколько слов/букв за всё время», «когда я зарегистрировался») и про ПРИЛОЖЕНИЕ («как зайти в приложение», «как работает…», «где найти…», «что ты умеешь») → ask_question: у ассистента есть точные данные и инструкция. ЛЮБОЙ вопрос боту — это ask_question, а НЕ save_entry, даже если ты не уверен, что ассистент знает ответ: лучше честное «не умею», чем молчаливая запись в дневник. " +
  "Если человек сообщает СВОЙ день рождения («мой др 15 марта», «я родился 07.03.1990», «запомни мой день рождения») → set_birthday; дни рождения ДРУГИХ людей — set_reminder (если просит напомнить) или save_entry. " +
  "Просьбы дать/найти рецепт, совет, тренировку или материал из сохранённого («дай рецепт…», «найди тот рилс про…», «что я сохранял о…») → ask_knowledge, а НЕ save_entry: человек ждёт ОТВЕТ, а не запись в дневник. " +
  "Вопросы о своей жизни → ask_question. " +
  "ВАЖНО: если человек СПРАШИВАЕТ или ВОЗМУЩАЕТСЯ по поводу уже записанного (особенно трат/денег) — " +
  "«а почему трату не учёл?», «где сегодняшний расход?», «чего не показал?», «ты не записал…?» — это ask_question, " +
  "а НЕ save_entry, даже если в фразе названа сумма. Такую операцию НЕ нужно записывать заново — она уже есть. " +
  "Выбирай ОДИН вид инструмента на сообщение. НО если в сообщении перечислено НЕСКОЛЬКО объектов одного действия " +
  "(два фильма: «Река Медисон, Ранчо Даттонов — надо посмотреть»; несколько задач; несколько напоминаний) — " +
  "вызови этот инструмент НЕСКОЛЬКО РАЗ, отдельно на каждый объект, чтобы ни один не потерялся. " +
  "КОНТЕКСТ ДИАЛОГА: если ниже дано последнее сообщение бота, а сообщение пользователя — короткая отсылка к нему " +
  "(«а скинь мне рецепт» после того как бот сам упомянул рецепт гречневого хлеба; «да, добавь», «скинь его», «покажи этот») — " +
  "РАСКРОЙ отсылку конкретикой из контекста: в query/параметры инструмента пиши полное название («рецепт гречневого хлеба»), а не общее слово («рецепт»).";

// Local "now" string for resolving relative dates (today/tomorrow/in an hour).
function nowLocalLine(off?: number | null): string {
  const ms = Date.now() + (typeof off === "number" ? off : 0) * 60000;
  const d = new Date(ms);
  const iso = d.toISOString().slice(0, 16).replace("T", " ");
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  return `Сейчас у пользователя (местное время): ${iso} (${dow}). Используй это для дат «сегодня», «завтра», «через час», «в 9».`;
}

// Последнее сообщение бота пользователю (пуш или ответ) не старше 6 часов —
// контекст для роутера, чтобы понимать отсылки «а скинь его», «да, добавь».
export async function recentBotContext(userId: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin()
      .from("biographer_chats")
      .select("answer, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data?.answer) return null;
    if (Date.now() - Date.parse((data as any).created_at) > 6 * 3600 * 1000) return null;
    return String((data as any).answer).slice(0, 600);
  } catch {
    return null;
  }
}

// Один haiku-проход: действие / вопрос / запись. lastBot — последнее сообщение
// бота пользователю (если недавнее): без него короткая отсылка «а скинь мне рецепт»
// после утреннего пуша про гречневый хлеб превращалась в поиск «рецепт» вообще.
export async function routeMessage(text: string, userId?: string, tzOffset?: number | null, lastBot?: string | null): Promise<Route> {
  try {
    const resp = await client().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      // SYS статичен → кэшируем (одна кэш-точка покрывает и tools). Время меняется
      // каждую минуту — держим его отдельным НЕкэшируемым блоком после SYS.
      system: [
        { type: "text", text: SYS, cache_control: { type: "ephemeral" } },
        { type: "text", text: nowLocalLine(tzOffset) },
        ...(lastBot ? [{ type: "text" as const, text: `Последнее сообщение бота пользователю (контекст для коротких отсылок «его», «этот», «а скинь…»):\n«${lastBot}»` }] : []),
      ],
      messages: [{ role: "user", content: text }],
      tools: ACTION_TOOLS,
      tool_choice: { type: "any" },
    });
    logClaude(userId, "bot_route", "haiku", (resp as any).usage);
    const blocks: any[] = resp.content.filter((c: any) => c.type === "tool_use");
    const block: any = blocks[0];
    const name = block?.name;
    if (!name || name === "save_entry") return { kind: "note" };
    if (name === "ask_question") return { kind: "question" };
    // Несколько действий в одном сообщении («добавь два фильма: X и Y») — модель
    // вызывает инструмент несколько раз; раньше выполнялся только первый вызов.
    const more = blocks.slice(1, 5)
      .filter((b: any) => b.name && b.name !== "save_entry" && b.name !== "ask_question")
      .map((b: any) => ({ name: b.name, input: b.input || {} }));
    return { kind: "action", name, input: block.input || {}, ...(more.length ? { more } : {}) };
  } catch {
    return { kind: "note" }; // при ошибке безопаснее сохранить как запись
  }
}

// Нормализация имени для сравнения (регистр, ё→е, пробелы).
const normName = (x: string) => (x || "").toLowerCase().replace(/ё/g, "е").trim();

const escRx = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Заменить имя в тексте с учётом падежных окончаний: если оба имени кончаются
// на -а/-я, меняем основу и сохраняем окончание («Стельку» → «Эстельку»).
function renameInText(text: string, from: string, to: string): string {
  const lf = from.slice(-1).toLowerCase(), lt = to.slice(-1).toLowerCase();
  const flex = "ая".includes(lf) && lf === lt;
  const fromCore = flex ? from.slice(0, -1) : from;
  const toCore = flex ? to.slice(0, -1) : to;
  const rx = new RegExp(`(?<![а-яёa-z])${escRx(fromCore)}${flex ? "([а-яё]{1,3})" : "(?![а-яёa-z])"}`, "gi");
  return text.replace(rx, (_m, tail?: string) => toCore + (typeof tail === "string" ? tail : ""));
}

// Локальная дата YYYY-MM-DD пользователя (по tz_offset, как в saveEntry).
function localDay(off?: number | null): string {
  const ms = Date.now() + (typeof off === "number" ? off : 0) * 60000;
  return new Date(ms).toISOString().slice(0, 10);
}

const M: Record<Lang, any> = {
  ru: {
    goal: (t: string) => `🎯 Добавил цель: «${t}».`,
    task: (t: string) => `✅ Добавил задачу: «${t}».`,
    taskDone: (t: string) => `✔️ Отметил задачу выполненной: «${t}».`,
    taskNone: "Не нашёл такой открытой задачи. Можешь сказать точнее?",
    weight: (k: number) => `⚖️ Записал вес: ${k} кг.`,
    dream: (t: string) => `✨ Добавил мечту: «${t}».`,
    dreamDone: (t: string) => `🌟 Отметил мечту сбывшейся: «${t}»!`,
    dreamNone: "Не нашёл такую мечту. Скажи точнее?",
    deed: (t: string) => `💛 Записал доброе дело: «${t}».`,
    style: (t: string) => `🎨 Запомнил: «${t}». Буду учитывать — и в утренних сообщениях, и в чате.`,
    bday: (d: string) => `🎂 Запомнил: твой день рождения — ${d}. Жди в этот день кое-что приятное — я такие даты не пропускаю 😉`,
    account: (email: string | null, tg: string | null, since?: string | null) => `🔐 Твой аккаунт:\n${email ? `📧 Почта: ${email}` : "📧 Почта не привязана — ты входишь через Telegram"}${tg ? `\n✈️ Telegram: @${tg}` : ""}${since ? `\n📅 В LIFE OS с ${since}` : ""}\n\nПривязать или сменить почту можно в Профиле → Аккаунт и вход.`,
    delAsk: (t: string) => `🗑 Удалить последнюю запись${t ? `: «${t}»` : ""}? Это действие нельзя отменить.`,
    delLast: (t: string) => `🗑 Удалил последнюю запись${t ? `: «${t}»` : ""}.`,
    delKept: "Ок, оставил запись.",
    delNone: "Записей для удаления нет.",
    fail: "Не получилось выполнить — попробуй ещё раз чуть позже.",
    rename: (a: string, b: string) => `✏️ Исправил: «${a}» → «${b}» — в людях и в инсайтах.`,
    renameNone: (a: string) => `Не нашёл «${a}» ни в людях, ни в инсайтах. Скажи, как имя записано сейчас?`,
    open: "Открыть",
    mvKind: { film: "🎬 фильм", series: "📺 сериал", book: "📚 книгу" } as Record<string, string>,
    mvStatusWatch: { want: "хочу посмотреть", reading: "смотрю", read: "посмотрел" } as Record<string, string>,
    mvStatusRead: { want: "хочу прочитать", reading: "читаю", read: "прочитал" } as Record<string, string>,
    media: (kindLabel: string, title: string, statusLabel: string) => `Добавил в Медиатеку: ${kindLabel} «${title}» — ${statusLabel}.`,
  },
  en: {
    goal: (t: string) => `🎯 Added a goal: “${t}”.`,
    task: (t: string) => `✅ Added a task: “${t}”.`,
    taskDone: (t: string) => `✔️ Marked task done: “${t}”.`,
    taskNone: "Couldn't find such an open task. Can you be more specific?",
    weight: (k: number) => `⚖️ Logged weight: ${k} kg.`,
    dream: (t: string) => `✨ Added a dream: “${t}”.`,
    dreamDone: (t: string) => `🌟 Marked dream as come true: “${t}”!`,
    dreamNone: "Couldn't find that dream. Be more specific?",
    deed: (t: string) => `💛 Logged a good deed: “${t}”.`,
    style: (t: string) => `🎨 Got it: “${t}”. I'll keep it in mind — in morning messages and in chat.`,
    bday: (d: string) => `🎂 Got it: your birthday is ${d}. Expect something nice that day — I never miss dates like this 😉`,
    account: (email: string | null, tg: string | null, since?: string | null) => `🔐 Your account:\n${email ? `📧 Email: ${email}` : "📧 No email linked — you sign in via Telegram"}${tg ? `\n✈️ Telegram: @${tg}` : ""}${since ? `\n📅 With LIFE OS since ${since}` : ""}\n\nYou can link or change email in Profile → Account.`,
    delAsk: (t: string) => `🗑 Delete the last entry${t ? `: “${t}”` : ""}? This can't be undone.`,
    delLast: (t: string) => `🗑 Deleted the last entry${t ? `: “${t}”` : ""}.`,
    delKept: "Ok, kept the entry.",
    delNone: "No entries to delete.",
    fail: "Couldn't do it — try again a bit later.",
    rename: (a: string, b: string) => `✏️ Fixed: “${a}” → “${b}” — in people and insights.`,
    renameNone: (a: string) => `Couldn't find “${a}” in people or insights. How is the name written now?`,
    open: "Open",
    mvKind: { film: "🎬 film", series: "📺 series", book: "📚 book" } as Record<string, string>,
    mvStatusWatch: { want: "want to watch", reading: "watching", read: "watched" } as Record<string, string>,
    mvStatusRead: { want: "want to read", reading: "reading", read: "read" } as Record<string, string>,
    media: (kindLabel: string, title: string, statusLabel: string) => `Added to your Media library: ${kindLabel} “${title}” — ${statusLabel}.`,
  },
  uk: {
    goal: (t: string) => `🎯 Додав ціль: «${t}».`,
    task: (t: string) => `✅ Додав завдання: «${t}».`,
    taskDone: (t: string) => `✔️ Позначив завдання виконаним: «${t}».`,
    taskNone: "Не знайшов такого відкритого завдання. Скажи точніше?",
    weight: (k: number) => `⚖️ Записав вагу: ${k} кг.`,
    dream: (t: string) => `✨ Додав мрію: «${t}».`,
    dreamDone: (t: string) => `🌟 Позначив мрію здійсненою: «${t}»!`,
    dreamNone: "Не знайшов таку мрію. Скажи точніше?",
    deed: (t: string) => `💛 Записав добру справу: «${t}».`,
    style: (t: string) => `🎨 Запам'ятав: «${t}». Враховуватиму — і в ранкових повідомленнях, і в чаті.`,
    bday: (d: string) => `🎂 Запам'ятав: твій день народження — ${d}. Чекай того дня дещо приємне — такі дати я не пропускаю 😉`,
    account: (email: string | null, tg: string | null, since?: string | null) => `🔐 Твій акаунт:\n${email ? `📧 Пошта: ${email}` : "📧 Пошта не прив'язана — ти входиш через Telegram"}${tg ? `\n✈️ Telegram: @${tg}` : ""}${since ? `\n📅 У LIFE OS з ${since}` : ""}\n\nПрив'язати або змінити пошту можна в Профілі → Акаунт і вхід.`,
    delAsk: (t: string) => `🗑 Видалити останній запис${t ? `: «${t}»` : ""}? Цю дію не можна скасувати.`,
    delLast: (t: string) => `🗑 Видалив останній запис${t ? `: «${t}»` : ""}.`,
    delKept: "Ок, залишив запис.",
    delNone: "Записів для видалення немає.",
    fail: "Не вдалося виконати — спробуй ще раз трохи пізніше.",
    rename: (a: string, b: string) => `✏️ Виправив: «${a}» → «${b}» — у людях і в інсайтах.`,
    renameNone: (a: string) => `Не знайшов «${a}» ні в людях, ні в інсайтах. Скажи, як ім'я записано зараз?`,
    open: "Відкрити",
    mvKind: { film: "🎬 фільм", series: "📺 серіал", book: "📚 книгу" } as Record<string, string>,
    mvStatusWatch: { want: "хочу подивитися", reading: "дивлюся", read: "переглянув" } as Record<string, string>,
    mvStatusRead: { want: "хочу прочитати", reading: "читаю", read: "прочитав" } as Record<string, string>,
    media: (kindLabel: string, title: string, statusLabel: string) => `Додав у Медіатеку: ${kindLabel} «${title}» — ${statusLabel}.`,
  },
  fr: {
    goal: (t: string) => `🎯 Objectif ajouté : « ${t} ».`,
    task: (t: string) => `✅ Tâche ajoutée : « ${t} ».`,
    taskDone: (t: string) => `✔️ Tâche marquée terminée : « ${t} ».`,
    taskNone: "Je n'ai pas trouvé cette tâche ouverte. Peux-tu préciser ?",
    weight: (k: number) => `⚖️ Poids enregistré : ${k} kg.`,
    dream: (t: string) => `✨ Rêve ajouté : « ${t} ».`,
    dreamDone: (t: string) => `🌟 Rêve marqué comme réalisé : « ${t} » !`,
    dreamNone: "Je n'ai pas trouvé ce rêve. Précise ?",
    deed: (t: string) => `💛 Bonne action enregistrée : « ${t} ».`,
    style: (t: string) => `🎨 C'est noté : « ${t} ». J'en tiendrai compte — le matin et dans le chat.`,
    bday: (d: string) => `🎂 C'est noté : ton anniversaire, c'est le ${d}. Attends-toi à une surprise ce jour-là — je ne rate jamais ces dates 😉`,
    account: (email: string | null, tg: string | null, since?: string | null) => `🔐 Ton compte :\n${email ? `📧 E-mail : ${email}` : "📧 Pas d'e-mail lié — tu te connectes via Telegram"}${tg ? `\n✈️ Telegram : @${tg}` : ""}${since ? `\n📅 Sur LIFE OS depuis le ${since}` : ""}\n\nTu peux lier ou changer l'e-mail dans Profil → Compte.`,
    delAsk: (t: string) => `🗑 Supprimer la dernière entrée${t ? ` : « ${t} »` : ""} ? Action irréversible.`,
    delLast: (t: string) => `🗑 Dernière entrée supprimée${t ? ` : « ${t} »` : ""}.`,
    delKept: "Ok, entrée conservée.",
    delNone: "Aucune entrée à supprimer.",
    fail: "Échec — réessaie un peu plus tard.",
    rename: (a: string, b: string) => `✏️ Corrigé : « ${a} » → « ${b} » — dans les personnes et les insights.`,
    renameNone: (a: string) => `Je n'ai pas trouvé « ${a} ». Comment le nom est-il écrit actuellement ?`,
    open: "Ouvrir",
    mvKind: { film: "🎬 film", series: "📺 série", book: "📚 livre" } as Record<string, string>,
    mvStatusWatch: { want: "à voir", reading: "en cours", read: "vu" } as Record<string, string>,
    mvStatusRead: { want: "à lire", reading: "en cours", read: "lu" } as Record<string, string>,
    media: (kindLabel: string, title: string, statusLabel: string) => `Ajouté à ta Médiathèque : ${kindLabel} « ${title} » — ${statusLabel}.`,
  },
  es: {
    goal: (t: string) => `🎯 Agregué una meta: «${t}».`,
    task: (t: string) => `✅ Agregué una tarea: «${t}».`,
    taskDone: (t: string) => `✔️ Marqué la tarea como hecha: «${t}».`,
    taskNone: "No encontré esa tarea abierta. ¿Puedes ser más específico?",
    weight: (k: number) => `⚖️ Registré el peso: ${k} kg.`,
    dream: (t: string) => `✨ Agregué un sueño: «${t}».`,
    dreamDone: (t: string) => `🌟 Marqué el sueño como cumplido: «${t}»!`,
    dreamNone: "No encontré ese sueño. ¿Puedes ser más específico?",
    deed: (t: string) => `💛 Registré una buena acción: «${t}».`,
    style: (t: string) => `🎨 Anotado: «${t}». Lo tendré en cuenta — por la mañana y en el chat.`,
    bday: (d: string) => `🎂 Anotado: tu cumpleaños es el ${d}. Espera algo lindo ese día — nunca me pierdo estas fechas 😉`,
    account: (email: string | null, tg: string | null, since?: string | null) => `🔐 Tu cuenta:\n${email ? `📧 Correo: ${email}` : "📧 Sin correo vinculado — entras por Telegram"}${tg ? `\n✈️ Telegram: @${tg}` : ""}${since ? `\n📅 En LIFE OS desde ${since}` : ""}\n\nPuedes vincular o cambiar el correo en Perfil → Cuenta.`,
    delAsk: (t: string) => `🗑 ¿Eliminar la última entrada${t ? `: «${t}»` : ""}? Esta acción no se puede deshacer.`,
    delLast: (t: string) => `🗑 Eliminé la última entrada${t ? `: «${t}»` : ""}.`,
    delKept: "Ok, dejé la entrada.",
    delNone: "No hay entradas para eliminar.",
    fail: "No se pudo hacer — intenta de nuevo un poco más tarde.",
    open: "Abrir",
    mvKind: { film: "🎬 película", series: "📺 serie", book: "📚 libro" } as Record<string, string>,
    mvStatusWatch: { want: "quiero ver", reading: "viendo", read: "vista" } as Record<string, string>,
    mvStatusRead: { want: "quiero leer", reading: "leyendo", read: "leído" } as Record<string, string>,
    media: (kindLabel: string, title: string, statusLabel: string) => `Agregué a tu Mediateca: ${kindLabel} «${title}» — ${statusLabel}.`,
  },
};

// Reminder confirmation strings (kept separate from M for brevity).
const REMIND_MSG: Record<Lang, { label: (t: string, w: string) => string; at: string; allDayNote: string; rep: Record<Recurrence, string> }> = {
  ru: { label: (t, w) => `⏰ Напомню: «${t}» — ${w}.`, at: "в", allDayNote: "весь день", rep: { daily: " · каждый день", weekly: " · каждую неделю", monthly: " · каждый месяц", yearly: " · каждый год" } },
  en: { label: (t, w) => `⏰ I'll remind you: “${t}” — ${w}.`, at: "at", allDayNote: "all day", rep: { daily: " · every day", weekly: " · every week", monthly: " · every month", yearly: " · every year" } },
  uk: { label: (t, w) => `⏰ Нагадаю: «${t}» — ${w}.`, at: "о", allDayNote: "весь день", rep: { daily: " · щодня", weekly: " · щотижня", monthly: " · щомісяця", yearly: " · щороку" } },
  fr: { label: (t, w) => `⏰ Je te rappellerai : « ${t} » — ${w}.`, at: "à", allDayNote: "toute la journée", rep: { daily: " · chaque jour", weekly: " · chaque semaine", monthly: " · chaque mois", yearly: " · chaque année" } },
  es: { label: (t, w) => `⏰ Te recordaré: «${t}» — ${w}.`, at: "a las", allDayNote: "todo el día", rep: { daily: " · cada día", weekly: " · cada semana", monthly: " · cada mes", yearly: " · cada año" } },
};

export type ActionResult = { text: string; openNext?: string; confirmDelete?: { entryId: string; preview: string } };

// Выполняет распознанное действие. Возвращает текст подтверждения (+ опц. куда открыть на сайте).
export async function runAction(userId: string, name: string, input: any, lang: Lang, tzOffset?: number | null): Promise<ActionResult> {
  const s = M[lang] || M.ru;
  const db = supabaseAdmin();
  try {
    if (name === "add_goal") {
      const title = String(input?.title || "").trim();
      if (!title) return { text: s.fail };
      await db.from("goals").insert({ user_id: userId, title, year: new Date().getFullYear(), progress: 0 });
      return { text: s.goal(title), openNext: "/goals" };
    }
    if (name === "add_task") {
      const t = String(input?.text || "").trim();
      if (!t) return { text: s.fail };
      await db.from("tasks").insert({ user_id: userId, text: t, done: false });
      return { text: s.task(t), openNext: "/goals?tab=tasks" };
    }
    if (name === "set_reminder") {
      const t = String(input?.text || "").trim();
      const date = String(input?.date || "").trim();
      if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { text: s.fail };
      const time = input?.time ? String(input.time).trim() : null;
      const allDay = !!input?.all_day || !time;
      const recurrence = (["daily", "weekly", "monthly", "yearly"] as Recurrence[]).includes(input?.recurrence) ? (input.recurrence as Recurrence) : null;
      const remindMin = typeof input?.remind_min === "number" ? input.remind_min : null;
      const dueISO = localToISO(date, allDay ? null : time, tzOffset);
      if (!dueISO) return { text: s.fail };
      const res = await createReminder(userId, { text: t, dueISO, dateStr: date, allDay, recurrence, remindMin });
      if (!res.ok) return { text: s.fail };
      const rm = REMIND_MSG[lang] || REMIND_MSG.ru;
      const [, mm, dd] = date.split("-");
      const when = allDay ? `${dd}.${mm} (${rm.allDayNote})` : `${dd}.${mm} ${rm.at} ${time}`;
      const suffix = recurrence ? rm.rep[recurrence] : "";
      return { text: rm.label(t, when + suffix), openNext: "/reminders" };
    }
    if (name === "complete_task") {
      const q = String(input?.query || "").trim();
      if (!q) return { text: s.taskNone };
      const { data } = await db.from("tasks").select("id, text").eq("user_id", userId).eq("done", false).ilike("text", `%${q}%`).order("created_at", { ascending: false }).limit(1);
      const row = (data || [])[0] as any;
      if (!row) return { text: s.taskNone };
      await db.from("tasks").update({ done: true }).eq("id", row.id).eq("user_id", userId);
      return { text: s.taskDone(row.text), openNext: "/goals?tab=tasks" };
    }
    if (name === "log_weight") {
      const kg = Number(input?.kg);
      if (!isFinite(kg) || kg < 20 || kg > 400) return { text: s.fail };
      const day = localDay(tzOffset);
      await db.from("weight_log").upsert({ user_id: userId, day, kg }, { onConflict: "user_id,day" });
      return { text: s.weight(kg), openNext: "/health" };
    }
    if (name === "add_dream") {
      const t = String(input?.text || "").trim();
      if (!t) return { text: s.fail };
      const sphere = (DREAM_SPHERES as readonly string[]).includes(input?.sphere) ? input.sphere : "other";
      await db.from("dreams").insert({ user_id: userId, text: t, sphere, status: "dream" });
      return { text: s.dream(t), openNext: "/goals?tab=dreams" };
    }
    if (name === "complete_dream") {
      const q = String(input?.query || "").trim();
      if (!q) return { text: s.dreamNone };
      const { data } = await db.from("dreams").select("id, text").eq("user_id", userId).neq("status", "done").ilike("text", `%${q}%`).order("created_at", { ascending: false }).limit(1);
      const row = (data || [])[0] as any;
      if (!row) return { text: s.dreamNone };
      await db.from("dreams").update({ status: "done" }).eq("id", row.id).eq("user_id", userId);
      return { text: s.dreamDone(row.text), openNext: "/goals?tab=dreams" };
    }
    if (name === "add_deed") {
      const t = String(input?.text || "").trim();
      if (!t) return { text: s.fail };
      const person = input?.person ? String(input.person).trim() : null;
      await db.from("good_deeds").insert({ user_id: userId, text: t, kind: "other", person });
      return { text: s.deed(t), openNext: "/trace" };
    }
    if (name === "add_media") {
      const title = String(input?.title || "").trim();
      const kind = (["film", "series", "book"] as const).includes(input?.kind) ? input.kind : "film";
      if (!title) return { text: s.fail };
      // doing/done -> внутренние статусы медиатеки reading/read; иначе want.
      const status = input?.status === "done" ? "read" : input?.status === "doing" ? "reading" : "want";
      const book = await addMediaByTitle(userId, title, kind, status, lang);
      if (!book) return { text: s.fail };
      // Подтверждаем тем, что реально сохранилось: TMDb мог уточнить тип
      // (фильм → сериал) и каноничное название.
      const finalKind = (book as any).kind || kind;
      const finalTitle = (book as any).title || title;
      const kindLabel = s.mvKind[finalKind] || s.mvKind.film;
      const statusLabel = (finalKind === "book" ? s.mvStatusRead : s.mvStatusWatch)[status];
      return { text: s.media(kindLabel, finalTitle, statusLabel), openNext: "/books" };
    }
    if (name === "rename_person") {
      const from = String(input?.from || "").trim();
      const to = String(input?.to || "").trim();
      if (!from || !to || normName(from) === normName(to)) return { text: s.fail };

      // 1) Человек в базе людей: переименовать (или слить со уже существующим правильным).
      let renamed = false;
      try {
        const { data: ppl } = await db.from("people").select("id,name").eq("user_id", userId);
        const nf = normName(from), nt = normName(to);
        const oldP = (ppl || []).find((p: any) => normName(p.name) === nf);
        const newP = (ppl || []).find((p: any) => normName(p.name) === nt);
        if (oldP && newP && oldP.id !== newP.id) {
          // Слияние: перевешиваем связи записей на правильного человека, дубль удаляем.
          const { data: oldLinks } = await db.from("entry_people").select("entry_id").eq("person_id", oldP.id);
          const { data: newLinks } = await db.from("entry_people").select("entry_id").eq("person_id", newP.id);
          const have = new Set((newLinks || []).map((l: any) => l.entry_id));
          const moves = (oldLinks || []).filter((l: any) => !have.has(l.entry_id));
          if (moves.length) await db.from("entry_people").insert(moves.map((l: any) => ({ entry_id: l.entry_id, person_id: newP.id })));
          await db.from("entry_people").delete().eq("person_id", oldP.id);
          await db.from("people").delete().eq("id", oldP.id);
          renamed = true;
        } else if (oldP) {
          await db.from("people").update({ name: to }).eq("id", oldP.id);
          renamed = true;
        }
      } catch (e) { console.error("rename_person people", e); }

      // 2) Инсайты: правим имя в тексте (с учётом падежных окончаний — «Стельку» → «Эстельку»).
      let fixed = 0;
      try {
        const lf = from.slice(-1).toLowerCase();
        const core = "ая".includes(lf) && lf === to.slice(-1).toLowerCase() ? from.slice(0, -1) : from;
        const { data: ins } = await db.from("insights").select("id,text").eq("user_id", userId).ilike("text", `%${core}%`);
        for (const i of (ins || []) as any[]) {
          const t2 = renameInText(i.text || "", from, to);
          if (t2 !== i.text) { await db.from("insights").update({ text: t2 }).eq("id", i.id); fixed++; }
        }
      } catch (e) { console.error("rename_person insights", e); }

      // 3) «Мой след»: поле «кому помог».
      try { await db.from("good_deeds").update({ person: to }).eq("user_id", userId).ilike("person", from); } catch {}

      if (!renamed && !fixed) return { text: s.renameNone(from) };
      return { text: s.rename(from, to), openNext: "/people" };
    }
    if (name === "ask_knowledge") {
      const q = String(input?.query || "").trim();
      if (!q) return { text: s.fail };
      const ans = await askKnowledge(userId, q, lang);
      return { text: ans, openNext: "/knowledge" };
    }
    if (name === "set_birthday") {
      const iso = birthdayISO(Number(input?.day), Number(input?.month), input?.year ? Number(input.year) : null);
      if (!iso) return { text: s.fail };
      const { error } = await db.from("users").update({ birthday: iso }).eq("id", userId);
      if (error) { console.error("set_birthday (birthday.sql applied?)", error); return { text: s.fail }; }
      const [y, mo, d] = iso.split("-");
      const label = Number(y) > BDAY_UNKNOWN_YEAR ? `${d}.${mo}.${y}` : `${d}.${mo}`;
      return { text: s.bday(label) };
    }
    if (name === "account_info") {
      const { data } = await db.from("users").select("email, tg_username, created_at").eq("id", userId).maybeSingle();
      // Дата регистрации в формате dd.mm.yyyy — Коля спрашивал «когда я зарегистрировался»,
      // а бот отвечал только про почту.
      const created = (data as any)?.created_at ? String((data as any).created_at).slice(0, 10) : null;
      const since = created ? created.split("-").reverse().join(".") : null;
      return { text: s.account((data as any)?.email || null, (data as any)?.tg_username || null, since), openNext: "/profile" };
    }
    if (name === "set_style") {
      const wish = String(input?.wish || "").trim().slice(0, 200);
      if (!wish) return { text: s.fail };
      const { data } = await db.from("users").select("morning_prefs").eq("id", userId).maybeSingle();
      const prefs = normalizeMorningPrefs((data as any)?.morning_prefs);
      // Копим пожелания списком через «; », новые вытесняют самые старые (лимит поля 300).
      const appendWish = (cur: string): string => {
        const parts = cur ? cur.split("; ").filter(Boolean) : [];
        if (!parts.some((x) => x.toLowerCase() === wish.toLowerCase())) parts.push(wish);
        while (parts.join("; ").length > 300 && parts.length > 1) parts.shift();
        return parts.join("; ").slice(0, 300);
      };
      prefs.customStyle = appendWish(prefs.customStyle); // утренние сообщения
      prefs.chatStyle = appendWish(prefs.chatStyle);     // AI-друг в чате
      await db.from("users").update({ morning_prefs: prefs }).eq("id", userId);
      return { text: s.style(wish) };
    }
    if (name === "delete_last_entry") {
      // Не удаляем сразу — спрашиваем подтверждение (защита от случайной потери записи).
      const { data } = await db.from("entries").select("id, summary, raw_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(1);
      const row = (data || [])[0] as any;
      if (!row) return { text: s.delNone };
      const preview = String(row.summary || row.raw_text || "").slice(0, 80);
      return { text: s.delAsk(preview), confirmDelete: { entryId: row.id, preview } };
    }
  } catch (e) {
    console.error("runAction", name, e);
    return { text: s.fail };
  }
  return { text: s.fail };
}
