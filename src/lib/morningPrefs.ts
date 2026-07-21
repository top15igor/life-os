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
  topics: MorningTopic[];
  length: MorningLength;      // длина утреннего сообщения
  address: string;            // как обращаться («капитан», имя…); "" = обычно
  hour: number | null;        // желаемый локальный час в будни (0–23); null = по умолчанию (~08:00)
  hourWeekend: number | null; // час в выходные; null = как в будни
  tz: string | null;          // IANA-таймзона пользователя
  customStyle: string;        // свободное описание стиля (дополняет тон)
  morningEnabled: boolean;    // утренний пуш вкл/выкл
  quietDays: number[];        // дни недели без пушей вообще (0=Вс … 6=Сб)
  weekly: WeeklyPrefs;        // недельный итог
  evening: EveningPrefs;      // настройки вечерних пушей
  remindersEnabled: boolean;  // напоминания записать (вечернее «как прошёл день», серия, возврат)
  financeEnabled: boolean;    // месячный финансовый отчёт (1-го числа)
  recurringEnabled: boolean;  // напоминания о регулярных платежах в день списания
  backupEnabled: boolean;     // ежемесячная авто-выгрузка дневника в Obsidian (.zip)
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
  tone: "friend", chatTone: "friend", chatStyle: "", acquaintActive: false, acquaintPct: 0, acquaintNudgedOn: "", acquaintNudges: 0, topics: [...MORNING_TOPICS], length: "normal", address: "",
  hour: null, hourWeekend: null, tz: null, customStyle: "", morningEnabled: true,
  quietDays: [], weekly: { ...DEFAULT_WEEKLY_PREFS }, evening: { ...DEFAULT_EVENING_PREFS },
  remindersEnabled: true, financeEnabled: true, recurringEnabled: true, backupEnabled: true,
};

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
    tone, chatTone, chatStyle, acquaintActive, acquaintPct, acquaintNudgedOn, acquaintNudges, topics, length, address, tz, customStyle,
    hour: validHour(raw.hour), hourWeekend: validHour(raw.hourWeekend),
    morningEnabled: raw.morningEnabled !== false, quietDays, weekly,
    evening: normalizeEvening(raw.evening),
    remindersEnabled: raw.remindersEnabled !== false,
    financeEnabled: raw.financeEnabled !== false,
    recurringEnabled: raw.recurringEnabled !== false,
    backupEnabled: raw.backupEnabled !== false,
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
