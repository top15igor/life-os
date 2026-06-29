// Настройки пуш-уведомлений, которые пользователь задаёт в профиле:
// утро (тон, темы, время, стиль, вкл/выкл) и вечер (вопросы для книги).

export type MorningTone = "friend" | "coach" | "calm" | "mentor" | "funny";
export type MorningTopic = "motivation" | "goals" | "tasks" | "diary" | "insight" | "gratitude" | "movement";

// Темы вечерних «вопросов для книги» (совпадают с THEMES в bookPrompts.ts).
export const EVENING_THEMES = ["family", "health", "work", "travel", "growth", "gratitude", "emotions"] as const;
export type EveningTheme = (typeof EVENING_THEMES)[number];

export interface EveningPrefs {
  enabled: boolean;        // вечерние «вопросы для книги» вкл/выкл
  themes: EveningTheme[];  // выбранные темы ([] = все темы)
  customPrompts: string[]; // свои вопросы/подсказки, подмешиваются в вечерний пул
}

export interface MorningPrefs {
  tone: MorningTone;
  topics: MorningTopic[];
  hour: number | null;        // желаемый локальный час в будни (0–23); null = по умолчанию (~08:00)
  hourWeekend: number | null; // час в выходные; null = как в будни
  tz: string | null;          // IANA-таймзона пользователя
  customStyle: string;        // свободное описание стиля (дополняет тон)
  morningEnabled: boolean;    // утренний пуш вкл/выкл
  evening: EveningPrefs;      // настройки вечерних пушей
}

export const MORNING_TONES: MorningTone[] = ["friend", "coach", "calm", "mentor", "funny"];
export const MORNING_TOPICS: MorningTopic[] = ["motivation", "goals", "tasks", "diary", "insight", "gratitude", "movement"];

export const DEFAULT_EVENING_PREFS: EveningPrefs = { enabled: true, themes: [], customPrompts: [] };

// По умолчанию (null в БД / нет колонки): дружеский тон, все темы, время по умолчанию, всё включено.
export const DEFAULT_MORNING_PREFS: MorningPrefs = {
  tone: "friend", topics: [...MORNING_TOPICS], hour: null, hourWeekend: null, tz: null,
  customStyle: "", morningEnabled: true, evening: { ...DEFAULT_EVENING_PREFS },
};

const validHour = (h: any): number | null =>
  (typeof h === "number" && Number.isFinite(h) && h >= 0 && h <= 23) ? Math.floor(h) : null;

function normalizeEvening(raw: any): EveningPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_EVENING_PREFS };
  const themes: EveningTheme[] = Array.isArray(raw.themes) ? EVENING_THEMES.filter((t) => raw.themes.includes(t)) : [];
  const customPrompts: string[] = Array.isArray(raw.customPrompts)
    ? raw.customPrompts.filter((s: any) => typeof s === "string").map((s: string) => s.slice(0, 200).trim()).filter(Boolean).slice(0, 10)
    : [];
  return { enabled: raw.enabled !== false, themes, customPrompts };
}

// Привести что угодно из БД/запроса к валидному объекту настроек.
export function normalizeMorningPrefs(raw: any): MorningPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_MORNING_PREFS, topics: [...DEFAULT_MORNING_PREFS.topics], evening: { ...DEFAULT_EVENING_PREFS } };
  const tone: MorningTone = MORNING_TONES.includes(raw.tone) ? raw.tone : DEFAULT_MORNING_PREFS.tone;
  const topics: MorningTopic[] = Array.isArray(raw.topics)
    ? MORNING_TOPICS.filter((t) => raw.topics.includes(t))
    : [...DEFAULT_MORNING_PREFS.topics];
  const tz: string | null = (typeof raw.tz === "string" && raw.tz.length > 0 && raw.tz.length <= 64) ? raw.tz : null;
  const customStyle: string = typeof raw.customStyle === "string" ? raw.customStyle.slice(0, 300).trim() : "";
  return {
    tone, topics, tz, customStyle,
    hour: validHour(raw.hour),
    hourWeekend: validHour(raw.hourWeekend),
    morningEnabled: raw.morningEnabled !== false,
    evening: normalizeEvening(raw.evening),
  };
}

// Описание тона для промпта (модель сама пишет на языке пользователя).
export const TONE_PROMPT: Record<MorningTone, string> = {
  friend: "как тёплый близкий друг — по-доброму, поддерживающе, на «ты»",
  coach: "как энергичный коуч — заряжаешь, мотивируешь и мягко подталкиваешь к действию",
  calm: "спокойно и осознанно, в духе майндфулнес — без суеты, мягко и умиротворённо",
  mentor: "как мудрый наставник — вдумчиво, по делу, с уважением",
  funny: "с лёгким добрым юмором — улыбчиво, но без сарказма и не нелепо",
};

// Описание тем для промпта.
export const TOPIC_PROMPT: Record<MorningTopic, string> = {
  motivation: "общая поддержка и заряд на день",
  goals: "его цели и прогресс по ним",
  tasks: "его открытые задачи",
  diary: "то, о чём он недавно писал в дневнике",
  insight: "его свежий инсайт/осознание",
  gratitude: "за что он недавно был благодарен",
  movement: "лёгкое движение или зарядку с утра",
};
