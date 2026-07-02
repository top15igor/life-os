import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { DREAM_SPHERES } from "./ai";
import { createReminder, localToISO } from "./reminders";
import type { Recurrence } from "./googleCalendar";
import { addMediaByTitle } from "./books";

// ===== Агентный слой бота: понять ЯВНУЮ команду и выполнить её вместо пользователя. =====
// routeMessage решает за ОДИН вызов: это действие, вопрос или дневниковая запись.

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export type Lang = "ru" | "en" | "uk" | "fr";

export type Route =
  | { kind: "action"; name: string; input: any }
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
  { name: "delete_last_entry", description: "Удалить ПОСЛЕДНЮЮ запись дневника. Команда «удали последнюю запись», «убери предыдущую запись».", input_schema: { type: "object", properties: {} } },
  { name: "ask_question", description: "Пользователь СПРАШИВАЕТ ассистента о своей жизни / просит найти, вспомнить, проанализировать.", input_schema: { type: "object", properties: {} } },
  { name: "save_entry", description: "Обычная дневниковая запись: рассказ о дне, мысли, чувства, событие, идея. ПО УМОЛЧАНИЮ выбирай это.", input_schema: { type: "object", properties: {} } },
];

const SYS =
  "Ты — маршрутизатор сообщений в личном дневнике-боте. Большинство сообщений — это ДНЕВНИКОВЫЕ ЗАПИСИ " +
  "(человек рассказывает о дне, мыслях, чувствах, событиях) → save_entry. " +
  "Инструменты-ДЕЙСТВИЯ (add_goal, add_task, set_reminder, complete_task, log_weight, add_dream, complete_dream, add_deed, delete_last_entry) " +
  "выбирай ТОЛЬКО при ЯВНОЙ ПОВЕЛИТЕЛЬНОЙ команде боту («добавь…», «напомни…», «отметь…», «удали…», «запиши вес…», «заверши задачу…»). " +
  "«Напомни …» с датой/временем → set_reminder (разбери дату и время по местному времени). «Добавь задачу» без времени → add_task. " +
  "Если человек просто описывает, что сделал («сегодня пробежал 5 км», «поговорил с мамой») — это save_entry, НЕ действие. " +
  "Вопросы о своей жизни → ask_question. Всегда выбирай РОВНО один инструмент.";

// Local "now" string for resolving relative dates (today/tomorrow/in an hour).
function nowLocalLine(off?: number | null): string {
  const ms = Date.now() + (typeof off === "number" ? off : 0) * 60000;
  const d = new Date(ms);
  const iso = d.toISOString().slice(0, 16).replace("T", " ");
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  return `Сейчас у пользователя (местное время): ${iso} (${dow}). Используй это для дат «сегодня», «завтра», «через час», «в 9».`;
}

// Один haiku-проход: действие / вопрос / запись.
export async function routeMessage(text: string, userId?: string, tzOffset?: number | null): Promise<Route> {
  try {
    const resp = await client().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      system: SYS + "\n" + nowLocalLine(tzOffset),
      messages: [{ role: "user", content: text }],
      tools: ACTION_TOOLS,
      tool_choice: { type: "any" },
    });
    logClaude(userId, "bot_route", "haiku", (resp as any).usage);
    const block: any = resp.content.find((c: any) => c.type === "tool_use");
    const name = block?.name;
    if (!name || name === "save_entry") return { kind: "note" };
    if (name === "ask_question") return { kind: "question" };
    return { kind: "action", name, input: block.input || {} };
  } catch {
    return { kind: "note" }; // при ошибке безопаснее сохранить как запись
  }
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
    delLast: (t: string) => `🗑 Удалил последнюю запись${t ? `: «${t}»` : ""}.`,
    delNone: "Записей для удаления нет.",
    fail: "Не получилось выполнить — попробуй ещё раз чуть позже.",
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
    delLast: (t: string) => `🗑 Deleted the last entry${t ? `: “${t}”` : ""}.`,
    delNone: "No entries to delete.",
    fail: "Couldn't do it — try again a bit later.",
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
    delLast: (t: string) => `🗑 Видалив останній запис${t ? `: «${t}»` : ""}.`,
    delNone: "Записів для видалення немає.",
    fail: "Не вдалося виконати — спробуй ще раз трохи пізніше.",
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
    delLast: (t: string) => `🗑 Dernière entrée supprimée${t ? ` : « ${t} »` : ""}.`,
    delNone: "Aucune entrée à supprimer.",
    fail: "Échec — réessaie un peu plus tard.",
    open: "Ouvrir",
    mvKind: { film: "🎬 film", series: "📺 série", book: "📚 livre" } as Record<string, string>,
    mvStatusWatch: { want: "à voir", reading: "en cours", read: "vu" } as Record<string, string>,
    mvStatusRead: { want: "à lire", reading: "en cours", read: "lu" } as Record<string, string>,
    media: (kindLabel: string, title: string, statusLabel: string) => `Ajouté à ta Médiathèque : ${kindLabel} « ${title} » — ${statusLabel}.`,
  },
};

// Reminder confirmation strings (kept separate from M for brevity).
const REMIND_MSG: Record<Lang, { label: (t: string, w: string) => string; at: string; allDayNote: string; rep: Record<Recurrence, string> }> = {
  ru: { label: (t, w) => `⏰ Напомню: «${t}» — ${w}.`, at: "в", allDayNote: "весь день", rep: { daily: " · каждый день", weekly: " · каждую неделю", monthly: " · каждый месяц", yearly: " · каждый год" } },
  en: { label: (t, w) => `⏰ I'll remind you: “${t}” — ${w}.`, at: "at", allDayNote: "all day", rep: { daily: " · every day", weekly: " · every week", monthly: " · every month", yearly: " · every year" } },
  uk: { label: (t, w) => `⏰ Нагадаю: «${t}» — ${w}.`, at: "о", allDayNote: "весь день", rep: { daily: " · щодня", weekly: " · щотижня", monthly: " · щомісяця", yearly: " · щороку" } },
  fr: { label: (t, w) => `⏰ Je te rappellerai : « ${t} » — ${w}.`, at: "à", allDayNote: "toute la journée", rep: { daily: " · chaque jour", weekly: " · chaque semaine", monthly: " · chaque mois", yearly: " · chaque année" } },
};

export type ActionResult = { text: string; openNext?: string };

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
      const kindLabel = s.mvKind[kind] || s.mvKind.film;
      const statusLabel = (kind === "book" ? s.mvStatusRead : s.mvStatusWatch)[status];
      return { text: s.media(kindLabel, title, statusLabel), openNext: "/books" };
    }
    if (name === "delete_last_entry") {
      const { data } = await db.from("entries").select("id, summary, raw_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(1);
      const row = (data || [])[0] as any;
      if (!row) return { text: s.delNone };
      await db.from("entries").delete().eq("id", row.id).eq("user_id", userId); // FK on delete cascade убирает задачи/инсайты/и т.д.
      const preview = String(row.summary || row.raw_text || "").slice(0, 80);
      return { text: s.delLast(preview) };
    }
  } catch (e) {
    console.error("runAction", name, e);
    return { text: s.fail };
  }
  return { text: s.fail };
}
