// Настройки пуш-уведомлений, которые пользователь задаёт в профиле:
// утро (тон, темы, время, стиль, длина, обращение, вкл/выкл), вечер
// («вопросы для книги»), тихие дни и недельный итог.

export type MorningTone = "auto" | "friend" | "direct" | "calm" | "business" | "energetic" | "coach" | "mentor" | "funny";
export type MorningTopic = "motivation" | "goals" | "tasks" | "diary" | "insight" | "gratitude" | "movement";
export type MorningLength = "short" | "normal" | "long";

// Темы вечерних «вопросов для книги» (совпадают с THEMES в bookPrompts.ts).
export const EVENING_THEMES = ["family", "health", "work", "travel", "growth", "gratitude", "emotions"] as const;
export type EveningTheme = (typeof EVENING_THEMES)[number];

export interface EveningPrefs {
  enabled: boolean;        // вечерние «вопросы для книги» вкл/выкл
  ai: boolean;             // генерировать персональный вопрос через AI (иначе из банка)
  themes: EveningTheme[];  // выбранные темы ([] = все темы)
  customPrompts: string[]; // свои вопросы/подсказки, подмешиваются в вечерний пул
}

export interface WeeklyPrefs {
  enabled: boolean; // недельный AI-итог вкл/выкл
  day: number;      // день недели (0=Вс … 6=Сб)
}

export interface MorningPrefs {
  tone: MorningTone;
  chatTone: MorningTone;      // тон общения с ботом (AI-друг: чат + голос + «Спроси жизнь»), независим от утреннего
  chatStyle: string;          // свободное пожелание к стилю общения (дополняет chatTone)
  acquaintActive: boolean;    // идёт ли сейчас режим «Давай познакомимся»
  acquaintPct: number;        // прогресс знакомства 0..100 (растёт по мере ответов)
  acquaintNudgedOn: string;   // дата последнего пинга-возврата к знакомству ("" = не пинговали)
  acquaintNudges: number;     // сколько раз уже пинговали вернуться (кап, чтобы не надоедать)
  acquaintNav: number;        // курсор навигации по вопросам знакомства (0 = последний/живой край, k = k вопросов назад)
  acquaintAt: string;         // ISO последнего шага знакомства — для авто-выхода по бездействию
  // «Помогу зафиксировать день»: пошаговый разбор сегодняшнего дня (dayCapture.ts).
  dayActive: boolean;         // идёт ли сейчас разбор дня
  dayMax: number;             // сколько вопросов человек выбрал (0 = «поговорим», пока не скажет хватит)
  dayAt: string;              // ISO последнего шага — для авто-паузы по бездействию
  dayAsked: string[];         // заданные вопросы (чтобы не повторяться и собрать пары «вопрос-ответ»)
  dayChips: string[];         // варианты быстрого ответа на текущий вопрос (в кнопку уходит номер, не текст)
  dayAnswers: string[];       // ответы человека — буфер, из которого собирается ОДНА запись
  dayDraft: string;           // собранный черновик записи (пока не сохранён)
  dayDate: string;            // за какой местный день фиксируем (YYYY-MM-DD)
  // «Сообщить о проблеме» (problemReport.ts): ждём ли сейчас описание проблемы.
  pbKind: string;             // выбранный тип проблемы ("" = не ждём описание)
  pbAt: string;               // ISO выбора типа — ожидание само сбрасывается через час
  pbTicket: string;           // номер последнего обращения (для кнопки «Добавить детали»)
  // «Хочу, чтобы умел» (capabilityGap.ts): просьба, на которую бот ответил «не умею».
  // Лежит в настройках самого человека и уходит владельцу ТОЛЬКО по тапу кнопки.
  gapText: string;            // текст просьбы ("" = нечего записывать)
  gapAt: string;              // ISO — просьба живёт сутки
  invitePromptedOn: string;   // дата последнего показа «Позвать друга» под записью ("" = не показывали)
  topics: MorningTopic[];
  length: MorningLength;      // длина утреннего сообщения
  address: string;            // как обращаться («капитан», имя…); "" = обычно
  hour: number | null;        // желаемый локальный час в будни (0–23); null = по умолчанию (~08:00)
  hourWeekend: number | null; // час в выходные; null = как в будни
  tz: string | null;          // IANA-таймзона пользователя
  customStyle: string;        // свободное описание стиля (дополняет тон)
  worldNews: boolean;         // «добрая новость дня» в утреннем пуше (реальный позитивный факт из мира)
  morningEnabled: boolean;    // утренний пуш вкл/выкл
  quietDays: number[];        // дни недели без пушей вообще (0=Вс … 6=Сб)
  weekly: WeeklyPrefs;        // недельный итог
  evening: EveningPrefs;      // настройки вечерних пушей
  remindersEnabled: boolean;  // напоминания записать (вечернее «как прошёл день», серия, возврат)
  financeEnabled: boolean;    // месячный финансовый отчёт (1-го числа)
  recurringEnabled: boolean;  // напоминания о регулярных платежах в день списания
  backupEnabled: boolean;     // ежемесячная авто-выгрузка дневника в Obsidian (.zip)
  fullBackupWeekly: boolean;  // еженедельная полная копия ВСЕХ данных (.json) в Telegram — opt-in
  taskHorizons: Record<string, "today" | "week" | "month">; // горизонт каждой задачи (по id): сегодня/неделя/месяц
}

// Для UI профиля (порядок чипов). Старые тоны (coach/mentor/funny) остаются
// валидными для совместимости, но в списке не показываются.
export const MORNING_TONES: MorningTone[] = ["auto", "friend", "direct", "calm", "business", "energetic"];
const ALL_TONES: MorningTone[] = ["auto", "friend", "direct", "calm", "business", "energetic", "coach", "mentor", "funny"];
// Для тона ОБЩЕНИЯ с ботом показываем весь набор, включая фирменные (коуч/наставник/юмор).
export const CHAT_TONES: MorningTone[] = [...ALL_TONES];
export const MORNING_TOPICS: MorningTopic[] = ["motivation", "goals", "tasks", "diary", "insight", "gratitude", "movement"];
export const MORNING_LENGTHS: MorningLength[] = ["short", "normal", "long"];
export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]; // 0=Вс … 6=Сб

export const DEFAULT_EVENING_PREFS: EveningPrefs = { enabled: true, ai: false, themes: [], customPrompts: [] };
export const DEFAULT_WEEKLY_PREFS: WeeklyPrefs = { enabled: true, day: 0 };

export const DEFAULT_MORNING_PREFS: MorningPrefs = {
  tone: "friend", chatTone: "friend", chatStyle: "", acquaintActive: false, acquaintPct: 0, acquaintNudgedOn: "", acquaintNudges: 0, acquaintNav: 0, acquaintAt: "",
  dayActive: false, dayMax: 3, dayAt: "", dayAsked: [], dayChips: [], dayAnswers: [], dayDraft: "", dayDate: "",
  pbKind: "", pbAt: "", pbTicket: "", gapText: "", gapAt: "",
  invitePromptedOn: "", topics: [...MORNING_TOPICS], length: "normal", address: "",
  hour: null, hourWeekend: null, tz: null, customStyle: "", worldNews: true, morningEnabled: true,
  quietDays: [], weekly: { ...DEFAULT_WEEKLY_PREFS }, evening: { ...DEFAULT_EVENING_PREFS },
  remindersEnabled: true, financeEnabled: true, recurringEnabled: true, backupEnabled: true, fullBackupWeekly: false, taskHorizons: {},
};

// Горизонты задач: оставить только валидные пары id→(today|week|month), с капом.
function normalizeTaskHorizons(raw: any): Record<string, "today" | "week" | "month"> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, "today" | "week" | "month"> = {};
  let n = 0;
  for (const [id, h] of Object.entries(raw)) {
    if (n >= 500) break;
    if (typeof id === "string" && id && (h === "today" || h === "week" || h === "month")) { out[id] = h; n++; }
  }
  return out;
}

const validHour = (h: any): number | null =>
  (typeof h === "number" && Number.isFinite(h) && h >= 0 && h <= 23) ? Math.floor(h) : null;
const validDay = (d: any, def: number): number =>
  (typeof d === "number" && Number.isFinite(d) && d >= 0 && d <= 6) ? Math.floor(d) : def;

function normalizeEvening(raw: any): EveningPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_EVENING_PREFS };
  const themes: EveningTheme[] = Array.isArray(raw.themes) ? EVENING_THEMES.filter((t) => raw.themes.includes(t)) : [];
  const customPrompts: string[] = Array.isArray(raw.customPrompts)
    ? raw.customPrompts.filter((s: any) => typeof s === "string").map((s: string) => s.slice(0, 200).trim()).filter(Boolean).slice(0, 10)
    : [];
  return { enabled: raw.enabled !== false, ai: raw.ai === true, themes, customPrompts };
}

// Привести что угодно из БД/запроса к валидному объекту настроек.
export function normalizeMorningPrefs(raw: any): MorningPrefs {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_MORNING_PREFS, topics: [...DEFAULT_MORNING_PREFS.topics], quietDays: [], weekly: { ...DEFAULT_WEEKLY_PREFS }, evening: { ...DEFAULT_EVENING_PREFS } };
  }
  const tone: MorningTone = ALL_TONES.includes(raw.tone) ? raw.tone : DEFAULT_MORNING_PREFS.tone;
  const chatTone: MorningTone = ALL_TONES.includes(raw.chatTone) ? raw.chatTone : DEFAULT_MORNING_PREFS.chatTone;
  const chatStyle: string = typeof raw.chatStyle === "string" ? raw.chatStyle.slice(0, 300).trim() : "";
  const acquaintActive: boolean = raw.acquaintActive === true;
  const acquaintPct: number = (typeof raw.acquaintPct === "number" && raw.acquaintPct >= 0 && raw.acquaintPct <= 100) ? Math.floor(raw.acquaintPct) : 0;
  const acquaintNudgedOn: string = (typeof raw.acquaintNudgedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.acquaintNudgedOn)) ? raw.acquaintNudgedOn : "";
  const acquaintNudges: number = (typeof raw.acquaintNudges === "number" && raw.acquaintNudges >= 0) ? Math.floor(raw.acquaintNudges) : 0;
  const acquaintNav: number = (typeof raw.acquaintNav === "number" && raw.acquaintNav >= 0) ? Math.floor(raw.acquaintNav) : 0;
  const acquaintAt: string = typeof raw.acquaintAt === "string" ? raw.acquaintAt.slice(0, 40) : "";
  const dayActive: boolean = raw.dayActive === true;
  const dayMax: number = (typeof raw.dayMax === "number" && raw.dayMax >= 0 && raw.dayMax <= 20) ? Math.floor(raw.dayMax) : 3;
  const dayAt: string = typeof raw.dayAt === "string" ? raw.dayAt.slice(0, 40) : "";
  const strList = (v: any, maxLen: number): string[] =>
    Array.isArray(v) ? v.filter((s: any) => typeof s === "string").map((s: string) => s.slice(0, maxLen)).slice(-20) : [];
  const dayAsked: string[] = strList(raw.dayAsked, 300);
  const dayChips: string[] = strList(raw.dayChips, 60).slice(0, 3);
  const dayAnswers: string[] = strList(raw.dayAnswers, 2000);
  const dayDraft: string = typeof raw.dayDraft === "string" ? raw.dayDraft.slice(0, 4000) : "";
  const dayDate: string = (typeof raw.dayDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.dayDate)) ? raw.dayDate : "";
  const pbKind: string = typeof raw.pbKind === "string" ? raw.pbKind.slice(0, 20) : "";
  const pbAt: string = typeof raw.pbAt === "string" ? raw.pbAt.slice(0, 40) : "";
  const pbTicket: string = typeof raw.pbTicket === "string" ? raw.pbTicket.slice(0, 12) : "";
  const gapText: string = typeof raw.gapText === "string" ? raw.gapText.slice(0, 500) : "";
  const gapAt: string = typeof raw.gapAt === "string" ? raw.gapAt.slice(0, 40) : "";
  const invitePromptedOn: string = (typeof raw.invitePromptedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.invitePromptedOn)) ? raw.invitePromptedOn : "";
  const topics: MorningTopic[] = Array.isArray(raw.topics) ? MORNING_TOPICS.filter((t) => raw.topics.includes(t)) : [...DEFAULT_MORNING_PREFS.topics];
  const length: MorningLength = MORNING_LENGTHS.includes(raw.length) ? raw.length : "normal";
  const address: string = typeof raw.address === "string" ? raw.address.slice(0, 40).trim() : "";
  const tz: string | null = (typeof raw.tz === "string" && raw.tz.length > 0 && raw.tz.length <= 64) ? raw.tz : null;
  const customStyle: string = typeof raw.customStyle === "string" ? raw.customStyle.slice(0, 300).trim() : "";
  const quietDays: number[] = Array.isArray(raw.quietDays)
    ? [...new Set(raw.quietDays.filter((d: any) => typeof d === "number" && d >= 0 && d <= 6).map((d: number) => Math.floor(d)))] as number[]
    : [];
  const weekly: WeeklyPrefs = (raw.weekly && typeof raw.weekly === "object")
    ? { enabled: raw.weekly.enabled !== false, day: validDay(raw.weekly.day, 0) }
    : { ...DEFAULT_WEEKLY_PREFS };
  return {
    tone, chatTone, chatStyle, acquaintActive, acquaintPct, acquaintNudgedOn, acquaintNudges, acquaintNav, acquaintAt,
    dayActive, dayMax, dayAt, dayAsked, dayChips, dayAnswers, dayDraft, dayDate,
    pbKind, pbAt, pbTicket, gapText, gapAt,
    invitePromptedOn, topics, length, address, tz, customStyle,
    hour: validHour(raw.hour), hourWeekend: validHour(raw.hourWeekend),
    worldNews: raw.worldNews !== false,
    morningEnabled: raw.morningEnabled !== false, quietDays, weekly,
    evening: normalizeEvening(raw.evening),
    remindersEnabled: raw.remindersEnabled !== false,
    financeEnabled: raw.financeEnabled !== false,
    recurringEnabled: raw.recurringEnabled !== false,
    backupEnabled: raw.backupEnabled !== false,
    fullBackupWeekly: raw.fullBackupWeekly === true,
    taskHorizons: normalizeTaskHorizons(raw.taskHorizons),
  };
}

// Описание тона для промпта (модель сама пишет на языке пользователя).
export const TONE_PROMPT: Record<MorningTone, string> = {
  auto: "в манере самого пользователя — говори примерно как он сам (см. блок про его слова ниже)",
  friend: "тёплый и поддерживающий — по-доброму, как близкий человек, на «ты»",
  direct: "прямой и мотивирующий — по делу, коротко, подталкиваешь к одному конкретному действию, без воды",
  calm: "спокойный и нейтральный — ровно, без лишних эмоций и пафоса",
  business: "деловой и структурный — конкретно, по приоритетам, спокойно и без сантиментов",
  energetic: "энергичный — бодро и заряжающе, но без наигранности и кринжа",
  coach: "как энергичный коуч — заряжаешь, мотивируешь и мягко подталкиваешь к действию",
  mentor: "как мудрый наставник — вдумчиво, по делу, с уважением",
  funny: "с лёгким добрым юмором — улыбчиво, но без сарказма и не нелепо",
};

export const TOPIC_PROMPT: Record<MorningTopic, string> = {
  motivation: "общая поддержка и заряд на день",
  goals: "его цели и прогресс по ним",
  tasks: "его открытые задачи",
  diary: "то, о чём он недавно писал в дневнике",
  insight: "его свежий инсайт/осознание",
  gratitude: "за что он недавно был благодарен",
  movement: "лёгкое движение или зарядку с утра",
};

export const LENGTH_PROMPT: Record<MorningLength, string> = {
  short: "Уложись в ОДНО короткое предложение.",
  normal: "1–3 коротких предложения.",
  long: "3–5 предложений — чуть подробнее, но без воды.",
};
