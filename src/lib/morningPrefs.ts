// Настройки утреннего пуша, которые пользователь задаёт в профиле:
// тон обращения, темы, время отправки и свободное описание стиля.

export type MorningTone = "friend" | "coach" | "calm" | "mentor" | "funny";
export type MorningTopic = "motivation" | "goals" | "tasks" | "diary" | "insight" | "gratitude" | "movement";

export interface MorningPrefs {
  tone: MorningTone;
  topics: MorningTopic[];
  hour: number | null;   // желаемый локальный час отправки (0–23); null = по умолчанию (~08:00)
  tz: string | null;     // IANA-таймзона пользователя (для расчёта локального часа)
  customStyle: string;   // свободное описание стиля от пользователя (дополняет тон)
}

export const MORNING_TONES: MorningTone[] = ["friend", "coach", "calm", "mentor", "funny"];
export const MORNING_TOPICS: MorningTopic[] = ["motivation", "goals", "tasks", "diary", "insight", "gratitude", "movement"];

// По умолчанию (null в БД / нет колонки): дружеский тон, все темы, время по умолчанию.
export const DEFAULT_MORNING_PREFS: MorningPrefs = { tone: "friend", topics: [...MORNING_TOPICS], hour: null, tz: null, customStyle: "" };

// Привести что угодно из БД/запроса к валидному объекту настроек.
export function normalizeMorningPrefs(raw: any): MorningPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_MORNING_PREFS, topics: [...DEFAULT_MORNING_PREFS.topics] };
  const tone: MorningTone = MORNING_TONES.includes(raw.tone) ? raw.tone : DEFAULT_MORNING_PREFS.tone;
  const topics: MorningTopic[] = Array.isArray(raw.topics)
    ? MORNING_TOPICS.filter((t) => raw.topics.includes(t))
    : [...DEFAULT_MORNING_PREFS.topics];
  const hour: number | null = (typeof raw.hour === "number" && Number.isFinite(raw.hour) && raw.hour >= 0 && raw.hour <= 23) ? Math.floor(raw.hour) : null;
  const tz: string | null = (typeof raw.tz === "string" && raw.tz.length > 0 && raw.tz.length <= 64) ? raw.tz : null;
  const customStyle: string = typeof raw.customStyle === "string" ? raw.customStyle.slice(0, 300).trim() : "";
  return { tone, topics, hour, tz, customStyle };
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
