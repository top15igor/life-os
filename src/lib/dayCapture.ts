import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { analyze } from "./ai";
import { saveEntry } from "./saveEntry";
import { normalizeMorningPrefs } from "./morningPrefs";
import { userTzOffsetMin } from "./pushSchedule";

// «Помогу зафиксировать день»: короткий диалог, который снимает ступор чистого листа.
//
// Почему так: «расскажи, как прошёл день» — вопрос с открытым концом, на него мозг
// зависает. На узкий вопрос («получилось дозвониться?», «где столько ходил?») человек
// отвечает не задумываясь. Поэтому бот ведёт по одному короткому вопросу за раз,
// начиная с ФАКТОВ (они разгоняют память) и заканчивая смыслом.
//
// Главное отличие от «Давай познакомимся»: знакомство — про прошлое и личность,
// здесь — только про сегодняшний день. И на выходе ОДНА связная запись, а не
// россыпь огрызков: ответы копятся в буфере, в конце AI склеивает их в текст от
// первого лица и показывает на подтверждение. Иначе дневник станет нечитаемым,
// а перечитывание — вся ценность продукта.
//
// Состояние — в users.morning_prefs (как у знакомства), отдельных таблиц не нужно.

type Lang = "ru" | "en" | "uk" | "fr" | "es";

const MAX_ANSWERS = 12;      // предохранитель для режима «поговорим»
const IDLE_MS = 3 * 60 * 60 * 1000; // через столько тишины режим сам встаёт на паузу
const ANSWER_MIN = 2;        // совсем пустой ответ («.») не считаем

export type DayChip = { label: string; value: string };
export type DayTurn = { text: string; chips?: DayChip[]; phase: "ask" | "draft" | "done" };

let _client: Anthropic | null = null;
const client = () => (_client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }));
const L = (lang: string): Lang => (["ru", "en", "uk", "fr", "es"].includes(lang) ? (lang as Lang) : "ru");

// ===== Тексты интерфейса (5 языков) =====

const DEPTH_ASK: Record<Lang, string> = {
  ru: "Хорошо, давай зафиксируем сегодняшний день 🌙\n\nЯ буду задавать по одному короткому вопросу — отвечай как удобно: текстом, голосом или кнопкой. В конце соберу всё в одну запись и покажу тебе.\n\nСколько у тебя времени?",
  en: "Alright, let's capture today 🌙\n\nI'll ask one short question at a time — answer however you like: by text, by voice or with a button. At the end I'll gather it into a single entry and show it to you.\n\nHow much time do you have?",
  uk: "Добре, зафіксуймо сьогоднішній день 🌙\n\nЯ ставитиму по одному короткому питанню — відповідай як зручно: текстом, голосом або кнопкою. Наприкінці зберу все в один запис і покажу тобі.\n\nСкільки в тебе часу?",
  fr: "D'accord, capturons ta journée 🌙\n\nJe vais poser une seule question courte à la fois — réponds comme tu veux : par écrit, à la voix ou avec un bouton. À la fin, je rassemblerai tout en une seule entrée et je te la montrerai.\n\nTu as combien de temps ?",
  es: "Muy bien, vamos a capturar el día de hoy 🌙\n\nTe haré una sola pregunta corta cada vez — responde como quieras: por texto, por voz o con un botón. Al final lo reuniré todo en una entrada y te la mostraré.\n\n¿Cuánto tiempo tienes?",
};

export const DEPTH_CHIPS: Record<Lang, { label: string; max: number }[]> = {
  ru: [{ label: "⚡ Минутка — 3 вопроса", max: 3 }, { label: "🙂 Нормально — 6 вопросов", max: 6 }, { label: "🌙 Поглубже — про состояние", max: 106 }, { label: "💬 Поговорим", max: 0 }],
  en: [{ label: "⚡ A minute — 3 questions", max: 3 }, { label: "🙂 Normal — 6 questions", max: 6 }, { label: "🌙 Deeper — how you are", max: 106 }, { label: "💬 Let's talk", max: 0 }],
  uk: [{ label: "⚡ Хвилинка — 3 питання", max: 3 }, { label: "🙂 Нормально — 6 питань", max: 6 }, { label: "🌙 Глибше — про стан", max: 106 }, { label: "💬 Поговорімо", max: 0 }],
  fr: [{ label: "⚡ Une minute — 3 questions", max: 3 }, { label: "🙂 Normal — 6 questions", max: 6 }, { label: "🌙 Plus profond — ton état", max: 106 }, { label: "💬 On discute", max: 0 }],
  es: [{ label: "⚡ Un minuto — 3 preguntas", max: 3 }, { label: "🙂 Normal — 6 preguntas", max: 6 }, { label: "🌙 Más hondo — cómo estás", max: 106 }, { label: "💬 Charlemos", max: 0 }],
};

const LEAD_FIRST: Record<Lang, string> = {
  ru: "Поехали 🙂",
  en: "Here we go 🙂",
  uk: "Поїхали 🙂",
  fr: "C'est parti 🙂",
  es: "Vamos allá 🙂",
};

// Счётчик шагов виден человеку: «1/3» показывает, что это ненадолго.
const step = (n: number, max: number) => (max > 0 ? `${n}/${max} · ` : "");

const DRAFT_LEAD: Record<Lang, string> = {
  ru: "Вот что получилось из твоих ответов 👇",
  en: "Here's what came out of your answers 👇",
  uk: "Ось що вийшло з твоїх відповідей 👇",
  fr: "Voici ce qui ressort de tes réponses 👇",
  es: "Esto es lo que salió de tus respuestas 👇",
};

const DRAFT_HINT: Record<Lang, string> = {
  ru: "\n\nСохранить как запись за сегодня? Можно дописать — просто пришли ещё пару слов, я адаптирую текст.",
  en: "\n\nSave it as today's entry? You can add more — just send a few more words and I'll weave them in.",
  uk: "\n\nЗберегти як запис за сьогодні? Можна дописати — просто надішли ще пару слів, я адаптую текст.",
  fr: "\n\nJe l'enregistre comme entrée d'aujourd'hui ? Tu peux compléter — envoie quelques mots de plus et je les intégrerai.",
  es: "\n\n¿La guardo como entrada de hoy? Puedes añadir más — mándame unas palabras y las integro.",
};

const SAVED: Record<Lang, string> = {
  ru: "✅ Сохранил в дневник. День зафиксирован — теперь он никуда не денется 💛",
  en: "✅ Saved to your diary. The day is captured — it won't slip away now 💛",
  uk: "✅ Зберіг у щоденник. День зафіксовано — тепер він нікуди не подінеться 💛",
  fr: "✅ Enregistré dans ton journal. La journée est capturée — elle ne s'effacera plus 💛",
  es: "✅ Guardado en tu diario. El día queda capturado — ya no se te escapa 💛",
};

const EMPTY: Record<Lang, string> = {
  ru: "Пока нечего сохранять — ты ещё ни на что не ответил 🙂 Скажи пару слов, и я всё соберу.",
  en: "Nothing to save yet — you haven't answered anything 🙂 Say a couple of words and I'll put it together.",
  uk: "Поки нема чого зберігати — ти ще ні на що не відповів 🙂 Скажи пару слів, і я все зберу.",
  fr: "Rien à enregistrer pour l'instant — tu n'as encore rien répondu 🙂 Dis quelques mots et je m'occupe du reste.",
  es: "Todavía no hay nada que guardar — aún no has respondido nada 🙂 Di un par de palabras y yo lo armo.",
};

const STOPPED: Record<Lang, string> = {
  ru: "Хорошо, остановились. Позови, когда захочешь — «помоги зафиксировать день» 🙂",
  en: "Okay, we've stopped. Call me whenever — just say “help me capture the day” 🙂",
  uk: "Гаразд, зупинилися. Поклич, коли захочеш — «допоможи зафіксувати день» 🙂",
  fr: "D'accord, on s'arrête. Appelle-moi quand tu veux — « aide-moi à capturer ma journée » 🙂",
  es: "Vale, paramos. Llámame cuando quieras — «ayúdame a capturar el día» 🙂",
};

// Предложение помощи при ступоре — бот замечает его сам, потому что человек
// в ступоре кнопку не ищет, он закрывает чат.
export const STUCK_OFFER: Record<Lang, string> = {
  ru: "Знакомое чувство 🙂 Тогда давай я поведу: задам пару коротких вопросов, а в конце соберу из твоих ответов запись. Пробуем?",
  en: "Familiar feeling 🙂 Let me lead then: I'll ask a couple of short questions and turn your answers into an entry. Shall we?",
  uk: "Знайоме відчуття 🙂 Тоді давай я поведу: поставлю пару коротких питань, а наприкінці зберу з твоїх відповідей запис. Спробуємо?",
  fr: "Sensation familière 🙂 Laisse-moi guider alors : je pose deux ou trois questions courtes et j'en fais une entrée. On essaie ?",
  es: "Sensación conocida 🙂 Entonces te guío yo: te hago un par de preguntas cortas y con tus respuestas armo una entrada. ¿Probamos?",
};

export const START_BTN: Record<Lang, string> = {
  ru: "✍️ Помоги рассказать",
  en: "✍️ Help me tell it",
  uk: "✍️ Допоможи розповісти",
  fr: "✍️ Aide-moi à raconter",
  es: "✍️ Ayúdame a contarlo",
};

export const BTN: Record<Lang, { skip: string; finish: string; save: string; more: string; short: string; stop: string }> = {
  ru: { skip: "⏭ Пропустить", finish: "✅ Хватит, собери", save: "💾 Сохранить", more: "➕ Ещё вопрос", short: "✂️ Покороче", stop: "✖️ Отмена" },
  en: { skip: "⏭ Skip", finish: "✅ Enough, wrap up", save: "💾 Save", more: "➕ One more", short: "✂️ Shorter", stop: "✖️ Cancel" },
  uk: { skip: "⏭ Пропустити", finish: "✅ Досить, збери", save: "💾 Зберегти", more: "➕ Ще питання", short: "✂️ Коротше", stop: "✖️ Скасувати" },
  fr: { skip: "⏭ Passer", finish: "✅ Ça suffit, assemble", save: "💾 Enregistrer", more: "➕ Une de plus", short: "✂️ Plus court", stop: "✖️ Annuler" },
  es: { skip: "⏭ Saltar", finish: "✅ Ya está, arma", save: "💾 Guardar", more: "➕ Una más", short: "✂️ Más corto", stop: "✖️ Cancelar" },
};

// Запасные вопросы, если AI недоступен. Лестница: факт → главное → смысл.
// Ровно та последовательность, которой пользуются интервьюеры: сначала «что было»,
// и только потом «что это значило».
const FALLBACK: Record<Lang, { q: string; chips?: string[] }[]> = {
  ru: [
    { q: "С чего начался твой день?", chips: ["Обычно, как всегда", "Тяжело вставал", "Рано и бодро"] },
    { q: "Где ты сегодня был и с кем виделся?" },
    { q: "Что было главным событием дня?" },
    { q: "Что сегодня получилось лучше, чем ты ожидал?" },
    { q: "Что тебя сегодня зацепило — хорошее или не очень?" },
    { q: "Как ты себя чувствуешь к вечеру?", chips: ["Устал, но доволен", "Вымотан", "Спокойно"] },
    { q: "Что из сегодняшнего ты захочешь вспомнить через год?" },
  ],
  en: [
    { q: "How did your day start?", chips: ["Same as usual", "Hard to get up", "Early and fresh"] },
    { q: "Where were you today and who did you see?" },
    { q: "What was the main thing that happened?" },
    { q: "What went better than you expected today?" },
    { q: "What struck you today — good or bad?" },
    { q: "How do you feel this evening?", chips: ["Tired but happy", "Drained", "Calm"] },
    { q: "What from today will you want to remember a year from now?" },
  ],
  uk: [
    { q: "З чого почався твій день?", chips: ["Як завжди", "Важко вставав", "Рано й бадьоро"] },
    { q: "Де ти сьогодні був і з ким бачився?" },
    { q: "Що було головною подією дня?" },
    { q: "Що сьогодні вийшло краще, ніж ти очікував?" },
    { q: "Що тебе сьогодні зачепило — хороше чи не дуже?" },
    { q: "Як ти почуваєшся надвечір?", chips: ["Втомився, але задоволений", "Виснажений", "Спокійно"] },
    { q: "Що із сьогоднішнього ти захочеш згадати через рік?" },
  ],
  fr: [
    { q: "Comment a commencé ta journée ?", chips: ["Comme d'habitude", "Dur de me lever", "Tôt et en forme"] },
    { q: "Où étais-tu aujourd'hui et qui as-tu vu ?" },
    { q: "Quel a été l'événement principal de la journée ?" },
    { q: "Qu'est-ce qui s'est mieux passé que prévu aujourd'hui ?" },
    { q: "Qu'est-ce qui t'a marqué aujourd'hui — en bien ou en mal ?" },
    { q: "Comment te sens-tu en cette fin de journée ?", chips: ["Fatigué mais content", "Épuisé", "Serein"] },
    { q: "Que voudras-tu te rappeler de cette journée dans un an ?" },
  ],
  es: [
    { q: "¿Cómo empezó tu día?", chips: ["Como siempre", "Me costó levantarme", "Temprano y con energía"] },
    { q: "¿Dónde estuviste hoy y a quién viste?" },
    { q: "¿Cuál fue lo principal que pasó hoy?" },
    { q: "¿Qué salió mejor de lo que esperabas hoy?" },
    { q: "¿Qué te marcó hoy — para bien o para mal?" },
    { q: "¿Cómo te sientes al final del día?", chips: ["Cansado pero contento", "Agotado", "Tranquilo"] },
    { q: "¿Qué de hoy querrás recordar dentro de un año?" },
  ],
};

// Фразы ступора: человек прямо говорит, что не знает, с чего начать.
const STUCK_RE = [
  /не\s*зна(ю|ешь).{0,20}(что|про что|о ч[её]м|с чего)/i,
  /(что|о ч[её]м|про что)\s*(мне\s*)?(писать|рассказ|говорить)/i,
  /с\s*чего\s*нача/i,
  /нечего\s*(писать|рассказ)/i,
  /помоги\s*(мне\s*)?(рассказ|записать|зафиксир|начать)/i,
  /зафиксир(уй|овать)\s*(мне\s*)?день/i,
  /don'?t know what to (write|say|talk)/i,
  /where do i (start|begin)/i,
  /help me (write|tell|capture)/i,
  /не\s*зна(ю|єш).{0,20}(що|про що)/i,
  /(no s[ée]|no sabes)\s.{0,20}(qu[ée] escribir|qu[ée] contar)/i,
  /je ne sais pas quoi (écrire|raconter|dire)/i,
];

export function isStuckPhrase(text: string): boolean {
  const t = (text || "").trim();
  if (!t || t.startsWith("/")) return false;
  // Только короткая реплика целиком про ступор. Иначе «не знаю, что писать в резюме
  // заказчику» — обычная запись дневника — была бы съедена предложением помощи.
  if (t.length > 60 || t.split(/\s+/).length > 8) return false;
  return STUCK_RE.some((re) => re.test(t));
}

// ===== Состояние =====

type St = { active: boolean; prefs: any; max: number; deep: boolean; asked: string[]; chips: string[]; answers: string[]; draft: string; date: string };

async function readState(userId: string): Promise<St> {
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const prefs = normalizeMorningPrefs((data as any)?.morning_prefs);
    return { active: prefs.dayActive, prefs, max: prefs.dayMax, deep: prefs.dayDeep === true, asked: prefs.dayAsked, chips: prefs.dayChips, answers: prefs.dayAnswers, draft: prefs.dayDraft, date: prefs.dayDate };
  } catch {
    const prefs = normalizeMorningPrefs(null);
    return { active: false, prefs, max: 3, deep: false, asked: [], chips: [], answers: [], draft: "", date: "" };
  }
}

// Текст варианта по номеру кнопки: в callback_data Telegram влезает только индекс.
export async function dayChipText(userId: string, idx: number): Promise<string> {
  const st = await readState(userId);
  return st.chips[idx] || "";
}

async function writeState(userId: string, prefs: any, patch: Partial<{ active: boolean; max: number; deep: boolean; asked: string[]; chips: string[]; answers: string[]; draft: string; date: string }>): Promise<void> {
  const next = { ...prefs };
  if (patch.active !== undefined) next.dayActive = patch.active;
  if (patch.max !== undefined) next.dayMax = patch.max;
  if (patch.deep !== undefined) next.dayDeep = patch.deep;
  if (patch.asked !== undefined) next.dayAsked = patch.asked.slice(-MAX_ANSWERS);
  if (patch.chips !== undefined) next.dayChips = patch.chips.slice(0, 3);
  if (patch.answers !== undefined) next.dayAnswers = patch.answers.slice(-MAX_ANSWERS);
  if (patch.draft !== undefined) next.dayDraft = patch.draft.slice(0, 4000);
  if (patch.date !== undefined) next.dayDate = patch.date;
  next.dayAt = new Date().toISOString();
  try {
    await supabaseAdmin().from("users").update({ morning_prefs: next }).eq("id", userId);
  } catch { /* нет колонки — фича мягко деградирует */ }
}

// Режим сам встаёт на паузу после долгой тишины: иначе завтрашний «купи молока»
// уедет в незакрытый вчерашний разбор дня вместо списка дел.
export async function isDayCapturing(userId: string): Promise<boolean> {
  const st = await readState(userId);
  if (!st.active) return false;
  const at = Date.parse((st.prefs as any)?.dayAt || "");
  if (!Number.isNaN(at) && Date.now() - at > IDLE_MS) {
    await writeState(userId, st.prefs, { active: false });
    return false;
  }
  return true;
}

export async function stopDayCapture(userId: string, lang = "ru"): Promise<string> {
  const st = await readState(userId);
  // Не пишем в базу впустую: функция дёргается при любом нажатии кнопок меню.
  if (st.active || st.draft || st.answers.length) {
    await writeState(userId, st.prefs, { active: false, answers: [], asked: [], chips: [], draft: "" });
  }
  return STOPPED[L(lang)];
}

// ===== Местная дата пользователя =====

async function localNow(userId: string): Promise<{ date: string; time: string }> {
  let off: number | null = null;
  try {
    const { data } = await supabaseAdmin().from("users").select("tz_offset, morning_prefs").eq("id", userId).maybeSingle();
    off = userTzOffsetMin((data as any)?.tz_offset, (data as any)?.morning_prefs?.tz);
  } catch { /* без зоны — считаем по UTC */ }
  const d = new Date(Date.now() + (off ?? 0) * 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
  };
}

// ===== Контекст дня =====
//
// Это и есть сердце фичи: бот спрашивает не «что делал?», а про то, что уже про
// тебя знает. «Ты обещал перезвонить Артуру — получилось?» отвечается мгновенно,
// потому что тема уже задана. Всё через try/catch: таблиц может не быть.

type DayCtx = { today: string; entries: string[]; due: string[]; promises: string[]; steps: number | null; spent: string };

async function dayContext(userId: string, today: string): Promise<DayCtx> {
  const db = supabaseAdmin();
  const ctx: DayCtx = { today, entries: [], due: [], promises: [], steps: null, spent: "" };

  const [entries, due, promises, health, tx] = await Promise.allSettled([
    db.from("entries").select("raw_text").eq("user_id", userId).eq("entry_date", today).limit(5),
    db.from("reminders").select("text").eq("user_id", userId).gte("due_at", today + "T00:00:00Z").lte("due_at", today + "T23:59:59Z").limit(5),
    db.from("promises").select("text, person").eq("user_id", userId).eq("status", "active").limit(3),
    db.from("health_metrics").select("steps").eq("user_id", userId).eq("day", today).limit(2),
    db.from("finance_tx").select("kind, amount, currency, category").eq("user_id", userId).eq("day", today).limit(8),
  ]);

  if (entries.status === "fulfilled") ctx.entries = ((entries.value.data as any[]) || []).map((e) => String(e.raw_text || "").slice(0, 200)).filter(Boolean);
  if (due.status === "fulfilled") ctx.due = ((due.value.data as any[]) || []).map((r) => String(r.text || "").slice(0, 120)).filter(Boolean);
  if (promises.status === "fulfilled") {
    ctx.promises = ((promises.value.data as any[]) || [])
      .map((p) => [p.person, p.text].filter(Boolean).join(": ").slice(0, 120)).filter(Boolean);
  }
  if (health.status === "fulfilled") {
    // Источников может быть два (Apple + Google) — берём максимум за день.
    const s = Math.max(0, ...((health.value.data as any[]) || []).map((r) => Number(r.steps) || 0));
    if (s > 0) ctx.steps = Math.round(s);
  }
  if (tx.status === "fulfilled") {
    const rows = ((tx.value.data as any[]) || []).filter((t) => t.kind === "expense");
    if (rows.length) {
      const cats = [...new Set(rows.map((t) => t.category).filter(Boolean))].slice(0, 3);
      ctx.spent = `${rows.length} трат за день${cats.length ? ` (${cats.join(", ")})` : ""}`;
    }
  }
  return ctx;
}

function ctxLines(ctx: DayCtx): string {
  const out: string[] = [];
  if (ctx.due.length) out.push(`На сегодня у него было запланировано: ${ctx.due.join("; ")}`);
  if (ctx.promises.length) out.push(`Открытые обещания: ${ctx.promises.join("; ")}`);
  if (ctx.steps !== null) out.push(`Шагов за день: ${ctx.steps}`);
  if (ctx.spent) out.push(`Финансы: ${ctx.spent}`);
  if (ctx.entries.length) out.push(`Уже записал сегодня (НЕ переспрашивай об этом): ${ctx.entries.join(" | ")}`);
  return out.join("\n");
}

// ===== Вопрос =====

const LANG_NAME: Record<Lang, string> = { ru: "русском", en: "английском", uk: "украинском", fr: "французском", es: "испанском" };

// Есть ли в ответе за что зацепиться. Отговорки («нет», «только работа»,
// «ничего») — это конец ветки, а не приглашение копать.
function worthDigging(a: string): boolean {
  const t = (a || "").trim().toLowerCase().replace(/ё/g, "е");
  if (t.length < 25) return false;
  // Отмашку надо ловить ГДЕ УГОДНО во фразе, а не только в начале. Живой
  // случай: «да просто запасался, ничего особенного» начинается с «да» —
  // формально не отговорка, и бот пошёл выспрашивать про помидоры.
  if (/ничего особенн|ничего интересн|просто так|как обычно|да ничего|ничего такого|нечего рассказ|nothing special|as usual/.test(t)) return false;
  if (/^(нет|ничего|не было|только работа|как обычно|норм|ok|no|nothing)\b/.test(t)) return false;
  // Пять слов — минимальный признак того, что человеку есть что добавить.
  if (t.split(/\s+/).filter(Boolean).length < 5) return false;
  return true;
}

// Сколько раз подряд мы уже углублялись. Больше двух — это уже допрос.
function digDepth(asked: string[], answers: string[]): number {
  let n = 0;
  for (let i = answers.length - 1; i >= 1 && n < 3; i--) {
    if (!worthDigging(answers[i] || "")) break;
    n++;
  }
  return n;
}

async function nextQuestion(userId: string, lang: Lang, ctx: DayCtx, asked: string[], answers: string[], max: number, deep = false): Promise<{ q: string; chips: string[] }> {
  const n = asked.length; // сколько уже задано
  const isFirst = n === 0;
  const isLast = max > 0 && n === max - 1;

  const fb = FALLBACK[lang][Math.min(n, FALLBACK[lang].length - 1)];
  if (!process.env.ANTHROPIC_API_KEY) return { q: fb.q, chips: fb.chips || [] };

  // Стороны дня. Разбор должен ОХВАТИТЬ день, а не выпотрошить одну его минуту:
  // живая жалоба звучала так — «ты задаёшь первый вопрос, а потом все остальные
  // крутятся вокруг него, и раскрыта только маленькая часть дня». Так и было:
  // подсказка прямо велела цепляться за предыдущий ответ.
  // В режиме «поглубже» спрашиваем не про дела, а про то, что с человеком
  // происходило. Это другой разбор: «что было» против «как тебе было».
  const AREAS = deep
    ? [
        "состояние: где сегодня было тяжело и где отпустило",
        "отношения: кто был рядом, с кем не хватило контакта",
        "смысл: что из сегодняшнего было по-настоящему твоим, а что чужим",
        "тело: что оно сегодня говорило — усталость, напряжение, лёгкость",
        "выбор: где ты сегодня поступил как хотел, а где как пришлось",
        "внимание: на что ушла голова, о чём думалось между делами",
        "благодарность: за что сегодня стоит сказать спасибо — себе или кому-то",
      ]
    : [
    "дела и работа: что двигал, что получилось или застряло",
    "люди: с кем виделся, говорил, кому написал",
    "тело и самочувствие: сон, спорт, усталость, здоровье",
    "дом и быт: что делал по хозяйству, что чинил, что решал",
    "отдых и голова: что смотрел, читал, о чём думал",
    "деньги: на что потратил, что решил не покупать",
    "перемещения: где был кроме дома, куда ездил",
  ];

  const stage = isFirst
    ? "ПЕРВЫЙ вопрос: строго про ФАКТЫ (что было, где был, с кем, получилось ли запланированное). Факты разгоняют память — про чувства сейчас НЕ спрашивай."
    : isLast
      ? "ПОСЛЕДНИЙ вопрос: про смысл — что из сегодняшнего он захочет вспомнить, что понял, что почувствовал."
      // Сторону дня выбираем МЫ, а не модель. Просьба «спроси про другое» не
      // работает: модель послушно меняет формулировку, но остаётся внутри уже
      // рассказанного — «ты ходил в эти магазины специально или по пути?» это
      // всё тот же поход в магазин. Поэтому область задаётся жёстко, по кругу,
      // со сдвигом по дню — чтобы разбор не начинался одинаково каждый раз.
      // Глубину решает НЕ чётность, а сам ответ. Живой случай: человек написал
      // «сделал Джарвиса и надеюсь он не будет тупить» — и следующий вопрос был
      // «что ты сделал по дому?». Самое живое в дне бросили ради расписания.
      // Правило простое: есть за что зацепиться — цепляемся; ответ пустой или
      // отговорка («нет», «только работа») — открываем новую сторону.
      : (worthDigging(answers[answers.length - 1] || "") && digDepth(asked, answers) < 2
        ? `СЕРЕДИНА, шаг вглубь: в последнем ответе есть живое — иди туда. Спроси про ЭТО конкретнее: что именно, чем закончилось, что оказалось трудным, что теперь. Один вопрос, по существу сказанного, без общих слов.`
        : `СЕРЕДИНА, шаг вширь: предыдущая ветка исчерпана — открой сторону дня, которой ещё не касались: «${AREAS[(n + new Date().getDate()) % AREAS.length]}».\n\nСпрашивай про то, что БЫЛО, а не «было ли». Вопрос не должен допускать ответа «нет, не было» — иначе получается анкета, а не разговор.`);

  // Шаг вширь собираем отдельным заданием, в котором прошлых ответов НЕТ.
  // Уговоры не помогают: пока в подсказке видна булочная, модель спросит про
  // булочную, как её ни проси открыть новую сторону дня. Проще не показывать.
  const goWide = !isFirst && !isLast && !(worthDigging(answers[answers.length - 1] || "") && digDepth(asked, answers) < 2);
  if (goWide) {
    const area = AREAS[(n + new Date().getDate()) % AREAS.length];
    const widePrompt = `Ты — внимательный друг, который помогает человеку зафиксировать сегодняшний день.

Задай ОДИН короткий вопрос (максимум 15 слов) ровно про это и ни про что другое: «${area}».

ПРАВИЛА:
— Спрашивай про то, что БЫЛО, а не «было ли»: вопрос не должен допускать ответа «нет, не было».
— Обращайся на «ты», тепло и без пафоса. Без вступлений.
— Предложи 2–3 варианта быстрого ответа кнопками (до 22 символов) или пустой список, если вопрос открытый.
— Язык ответа: ${LANG_NAME[lang]}.

Эти вопросы уже заданы, не повторяйся:
${asked.map((a) => `— ${a}`).join("\n") || "(пока никаких)"}

Верни ТОЛЬКО JSON: {"q": "вопрос", "chips": ["вариант", "вариант"]}`;
    try {
      const mw = await client().messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 200, temperature: 0.7,
        messages: [{ role: "user", content: widePrompt }],
      });
      logClaude(userId, "day-question", "haiku", (mw as any).usage);
      const raw = mw.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
      const j = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      const q = String(j?.q || "").trim();
      if (q) return { q, chips: Array.isArray(j?.chips) ? j.chips.map((c: any) => String(c).slice(0, 22)).slice(0, 3) : [] };
    } catch {
      /* не вышло — падаем в общий путь ниже */
    }
  }

  const prompt = `Ты — внимательный друг, который помогает человеку зафиксировать сегодняшний день в дневнике. Человек в ступоре от вопроса «расскажи, как прошёл день», поэтому твоя задача — задать ОДИН короткий конкретный вопрос, на который легко ответить не задумываясь.

${stage}

ПРАВИЛА:
— Ровно один вопрос, максимум 15 слов. Без вступлений и без «расскажи о своём дне».
— Если в контексте ниже есть зацепка (планы на сегодня, обещание, шаги, траты) — спроси про НЕЁ конкретно, по имени и цифре. Это ценнее общего вопроса. Но ОДНА зацепка — один вопрос: во второй раз к той же теме не возвращайся.
— Каждый следующий вопрос — про ДРУГУЮ часть дня, чем предыдущий. Проверь себя по списку уже заданных: если новый вопрос про то же самое, замени его.
— Не повторяй уже заданные вопросы и не переспрашивай то, что он уже рассказал.
— Обращайся на «ты», тепло и без пафоса.
— Предложи 2–3 варианта быстрого ответа кнопками, если вопрос это допускает (короткие, до 22 символов). Если вопрос открытый — пустой список.
— Язык ответа: ${LANG_NAME[lang]}.

${ctxLines(ctx) ? `ЧТО Я ЗНАЮ ПРО ЕГО СЕГОДНЯ:\n${ctxLines(ctx)}` : "Про его сегодня я ничего не знаю — спроси по-простому про факты."}

${asked.length ? `УЖЕ СПРОСИЛ:\n${asked.map((a) => `— ${a}`).join("\n")}` : ""}
${answers.length ? `ОН ОТВЕТИЛ:\n${answers.map((a) => `— ${a.slice(0, 300)}`).join("\n")}` : ""}

Верни ТОЛЬКО JSON: {"q": "вопрос", "chips": ["вариант", "вариант"]}`;

  try {
    const m = await client().messages.create({
      model: "claude-haiku-4-5-20251001", max_tokens: 200, temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(userId, "day-question", "haiku", (m as any).usage);
    const raw = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json);
    const q = String(parsed.q || "").trim();
    if (!q) return { q: fb.q, chips: fb.chips || [] };
    const chips = Array.isArray(parsed.chips)
      ? parsed.chips.filter((c: any) => typeof c === "string" && c.trim()).map((c: string) => c.trim().slice(0, 30)).slice(0, 3)
      : [];
    return { q, chips };
  } catch {
    return { q: fb.q, chips: fb.chips || [] };
  }
}

// ===== Сборка записи =====

async function buildDraft(userId: string, lang: Lang, qa: { q: string; a: string }[], short: boolean): Promise<string> {
  // Дополнения из фазы черновика приходят без вопроса — помечаем их отдельно,
  // иначе в промпт уходит пустое «Вопрос:» и модель начинает его домысливать.
  const body = qa.map((p) => (p.q ? `Вопрос: ${p.q}\nОтвет: ${p.a.slice(0, 600)}` : `Он добавил от себя: ${p.a.slice(0, 600)}`)).join("\n\n");
  if (!process.env.ANTHROPIC_API_KEY) return qa.map((p) => p.a).join(" ");

  const prompt = `Ниже — короткий разговор: я задавал человеку вопросы про его сегодняшний день, он отвечал. Собери из ЕГО ОТВЕТОВ цельную запись в дневник — связный живой текст ОТ ПЕРВОГО ЛИЦА (от «я»), как будто он сам записал этот день.

ПРАВИЛА:
— Только то, что он реально сказал. Ничего не выдумывай и не приукрашивай.
— Не пересказывай мои вопросы, не пиши «на вопрос о… я ответил». Только его день.
— Сохраняй его слова и интонацию, не облагораживай речь.
— ${short ? "Уложись в 2–3 коротких предложения." : "3–6 предложений, живым языком, без канцелярита."}
— Без markdown, заголовков, кавычек и подписей.
— Язык: ${LANG_NAME[lang]}.

РАЗГОВОР:
${body}

Верни только текст записи.`;

  try {
    const m = await client().messages.create({
      model: "claude-haiku-4-5-20251001", max_tokens: 500, temperature: 0.6,
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(userId, "day-draft", "haiku", (m as any).usage);
    const t = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
    return t || qa.map((p) => p.a).join(" ");
  } catch {
    return qa.map((p) => p.a).join(" ");
  }
}

// Пары «вопрос — ответ» из плоских буферов (ответ мог прийти на пропущенный вопрос).
function pairs(asked: string[], answers: string[]): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  for (let i = 0; i < answers.length; i++) out.push({ q: asked[i] || "", a: answers[i] });
  return out;
}

// ===== Публичные шаги диалога =====

// Шаг 0: спрашиваем глубину. Один тап — и человек уже внутри.
export function dayDepthAsk(lang: string): { text: string; chips: { label: string; max: number }[] } {
  const l = L(lang);
  return { text: DEPTH_ASK[l], chips: DEPTH_CHIPS[l] };
}

// Шаг 1: включаем режим и задаём первый вопрос.
export async function beginDayCapture(userId: string, lang: string, max: number): Promise<DayTurn> {
  const l = L(lang);
  // 106 — это «поглубже»: шесть вопросов, но про состояние, а не про дела.
  // Кнопка передаёт одно число, поэтому режим закодирован в нём.
  const deep = max === 106;
  if (deep) max = 6;
  const st = await readState(userId);
  const { date } = await localNow(userId);
  const ctx = await dayContext(userId, date);
  const { q, chips } = await nextQuestion(userId, l, ctx, [], [], max, deep);
  await writeState(userId, st.prefs, { active: true, max, deep, asked: [q], chips, answers: [], draft: "", date });
  return {
    text: `${LEAD_FIRST[l]}\n\n${step(1, max)}${q}`,
    chips: chips.map((c) => ({ label: c, value: c })),
    phase: "ask",
  };
}

// Ответ человека: копим в буфер и либо задаём следующий вопрос, либо собираем запись.
// Это замечание про работу бота или всё-таки кусочек дня? Решаем моделью:
// список слов-маркеров тут не работает — «мне не нравится, что ты…» и «мне не
// понравился сегодняшний обед» отличаются только смыслом.
async function looksLikeFeedback(userId: string, text: string): Promise<boolean> {
  const t = (text || "").trim();
  if (t.length < 12 || !process.env.ANTHROPIC_API_KEY) return false;
  try {
    const m = await client().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8,
      temperature: 0,
      system: "Человек сейчас разбирает свой день с ботом и видит черновик записи. Определи, что он написал: ЗАМЕЧАНИЕ О РАБОТЕ БОТА (жалуется на вопросы, на разбор, просит что-то делать иначе) или РАССКАЗ О ДНЕ (дополнение к записи). Ответь одним словом: feedback или day.",
      messages: [{ role: "user", content: t.slice(0, 600) }],
    });
    logClaude(userId, "day-meta", "haiku", (m as any).usage);
    const out = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").toLowerCase();
    return out.includes("feedback");
  } catch {
    return false;
  }
}

// Ответ на замечание: по делу, без оправданий и без обещаний «исправлюсь».
async function replyToFeedback(userId: string, lang: Lang, text: string, asked: string[]): Promise<string> {
  const fallback = "Понял, спасибо — передам это как замечание по продукту.";
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const m = await client().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      temperature: 0.4,
      system: `Человек разбирает свой день с ботом и сделал замечание о том, КАК бот это делает. Ответь ему коротко, 1-3 предложения, на языке ${LANG_NAME[lang]}.\n\nПРАВИЛА: согласись, если он прав, и скажи это прямо — без «извини» и без обещаний «я исправлюсь», ты не можешь себя переписать. Максимум ДВА предложения. НЕ пересказывай черновик и не повторяй его — он уже перед глазами. Если можешь предложить конкретный следующий вопрос — задай его прямо здесь, одной фразой. Если замечание про продукт целиком — скажи, что стоит оформить идеей.`,
      messages: [{ role: "user", content: `Уже задано вопросов: ${asked.length}\nВопросы: ${asked.map((x) => `«${x}»`).join("; ")}\n\nЕго замечание: ${text.slice(0, 600)}` }],
    });
    logClaude(userId, "day-meta-reply", "sonnet", (m as any).usage);
    return m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function dayAnswer(userId: string, lang: string, answer: string): Promise<DayTurn> {
  const l = L(lang);
  const st = await readState(userId);
  const a = (answer || "").trim();

  // Фаза черновика: обычно любой текст — это дополнение к записи.
  //
  // Но человек может говорить не о дне, а о САМОМ разборе: «мне не нравится,
  // что все вопросы про одно и то же». Раньше такое молча вплеталось в
  // черновик — и человек получал в ответ тот же самый текст без единого
  // изменения, будто его не услышали. Замечание о работе бота — это не строчка
  // дневника, на него надо ответить.
  if (st.draft) {
    if (await looksLikeFeedback(userId, a)) {
      // ТОЛЬКО ответ на замечание. Черновик уже на экране выше — повторять его
      // после каждой реплики значит заваливать человека одним и тем же текстом.
      // Кнопки под сообщением остаются, так что сохранить или продолжить можно
      // отсюда же.
      const said = await replyToFeedback(userId, l, a, st.asked);
      return { text: said, phase: "draft" };
    }
    const answers = [...st.answers, a];
    const draft = await buildDraft(userId, l, pairs(st.asked, answers), false);
    await writeState(userId, st.prefs, { answers, draft, chips: [] });
    return { text: `${DRAFT_LEAD[l]}\n\n${draft}${DRAFT_HINT[l]}`, phase: "draft" };
  }

  // Пустышка («.», «ок») — не считаем ответом, просто повторяем текущий вопрос.
  if (a.length < ANSWER_MIN) {
    const cur = st.asked[st.answers.length] || FALLBACK[l][0].q;
    return { text: cur, chips: st.chips.map((c) => ({ label: c, value: c })), phase: "ask" };
  }

  const answers = [...st.answers, a];
  const max = st.max;
  const enough = (max > 0 && answers.length >= max) || answers.length >= MAX_ANSWERS;

  if (enough) return finish(userId, l, st, answers);

  const ctx = await dayContext(userId, st.date || (await localNow(userId)).date);
  const { q, chips } = await nextQuestion(userId, l, ctx, st.asked, answers, max, st.deep);
  const asked = [...st.asked, q];
  await writeState(userId, st.prefs, { asked, chips, answers });
  return { text: `${step(answers.length + 1, max)}${q}`, chips: chips.map((c) => ({ label: c, value: c })), phase: "ask" };
}

// «Пропустить»: вопрос не засчитываем, ответа нет — просто следующий.
export async function daySkipQuestion(userId: string, lang: string): Promise<DayTurn> {
  const l = L(lang);
  const st = await readState(userId);
  const ctx = await dayContext(userId, st.date || (await localNow(userId)).date);
  const { q, chips } = await nextQuestion(userId, l, ctx, st.asked, st.answers, st.max, st.deep);
  // Пропущенный вопрос заменяем новым, чтобы пары «вопрос-ответ» не разъезжались.
  const asked = [...st.asked.slice(0, st.answers.length), q];
  await writeState(userId, st.prefs, { asked, chips });
  return { text: `${step(st.answers.length + 1, st.max)}${q}`, chips: chips.map((c) => ({ label: c, value: c })), phase: "ask" };
}

// «Хватит, собери» — досрочная сборка из того, что уже есть.
export async function dayFinishNow(userId: string, lang: string): Promise<DayTurn> {
  const l = L(lang);
  const st = await readState(userId);
  if (!st.answers.length) return { text: EMPTY[l], phase: "ask" };
  return finish(userId, l, st, st.answers);
}

async function finish(userId: string, l: Lang, st: St, answers: string[]): Promise<DayTurn> {
  const draft = await buildDraft(userId, l, pairs(st.asked, answers), false);
  await writeState(userId, st.prefs, { answers, draft, chips: [] });
  return { text: `${DRAFT_LEAD[l]}\n\n${draft}${DRAFT_HINT[l]}`, phase: "draft" };
}

// «Покороче» — пересобрать тот же материал сжато.
export async function dayShorter(userId: string, lang: string): Promise<DayTurn> {
  const l = L(lang);
  const st = await readState(userId);
  if (!st.answers.length) return { text: EMPTY[l], phase: "ask" };
  const draft = await buildDraft(userId, l, pairs(st.asked, st.answers), true);
  await writeState(userId, st.prefs, { draft });
  return { text: `${DRAFT_LEAD[l]}\n\n${draft}${DRAFT_HINT[l]}`, phase: "draft" };
}

// «Ещё вопрос» из фазы черновика — вернуться и добрать материал.
export async function dayMoreQuestion(userId: string, lang: string): Promise<DayTurn> {
  const l = L(lang);
  const st = await readState(userId);
  const ctx = await dayContext(userId, st.date || (await localNow(userId)).date);
  const { q, chips } = await nextQuestion(userId, l, ctx, st.asked, st.answers, 0, st.deep);
  const asked = [...st.asked.slice(0, st.answers.length), q];
  await writeState(userId, st.prefs, { asked, chips, draft: "" });
  return { text: q, chips: chips.map((c) => ({ label: c, value: c })), phase: "ask" };
}

// «Сохранить»: черновик уходит в дневник обычным путём (разбор + saveEntry),
// поэтому запись ничем не отличается от написанной руками — с настроением,
// задачами, людьми и всем остальным.
export async function daySaveDraft(userId: string, lang: string): Promise<{ text: string; saved: boolean }> {
  const l = L(lang);
  const st = await readState(userId);
  const draft = (st.draft || "").trim();
  if (!draft) return { text: EMPTY[l], saved: false };

  const { date, time } = await localNow(userId);
  try {
    const analysis = await analyze(draft, userId);
    await saveEntry({ userId, raw_text: draft, source: "bot-day", analysis, entry_date: st.date || date, entry_time: time });
  } catch (e) {
    console.error("dayCapture save", e);
    return { text: "Не получилось сохранить, попробуй ещё раз 🙏", saved: false };
  }
  await writeState(userId, st.prefs, { active: false, answers: [], asked: [], chips: [], draft: "" });
  return { text: SAVED[l], saved: true };
}
