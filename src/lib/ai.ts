import Anthropic from "@anthropic-ai/sdk";

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Разрешённые категории (slug совпадают со схемой БД).
export const CATEGORY_SLUGS = [
  "health", "sport", "food", "family", "relationship", "business",
  "finance", "ideas", "insight", "task", "gratitude", "travel",
  "emotions", "problem", "decision", "event",
];

export type Analysis = {
  summary: string;
  focus?: string | null;
  mood?: number | null;
  energy?: number | null;
  health?: number | null;
  importance?: number | null;
  sleep_hours?: number | null;
  weight?: number | null;
  categories: string[];
  tags: string[];
  people: string[];
  places: string[];
  projects: string[];
  tasks: string[];
  insights: string[];
  gratitude: string[];
};

const TOOL: Anthropic.Tool = {
  name: "save_analysis",
  description: "Сохранить структурированный разбор дневниковой записи.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "1–2 спокойных предложения — суть записи." },
      focus: { type: "string", description: "Главный фокус дня, если ясен." },
      mood: { type: "integer", description: "Настроение 1–10." },
      energy: { type: "integer", description: "Энергия 1–10." },
      health: { type: "integer", description: "Здоровье 1–10." },
      importance: { type: "integer", description: "Важность записи 1–5." },
      sleep_hours: { type: "number", description: "Часы сна, если названы." },
      weight: { type: "number", description: "Вес в кг, если назван." },
      categories: { type: "array", items: { type: "string", enum: CATEGORY_SLUGS } },
      tags: { type: "array", items: { type: "string" }, description: "3–7 коротких тегов без #." },
      people: { type: "array", items: { type: "string" } },
      places: { type: "array", items: { type: "string" } },
      projects: { type: "array", items: { type: "string" } },
      tasks: { type: "array", items: { type: "string" } },
      insights: { type: "array", items: { type: "string" } },
      gratitude: { type: "array", items: { type: "string" } },
    },
    required: ["summary", "categories", "tags", "people", "places", "projects", "tasks", "insights", "gratitude"],
  },
};

function prompt(text: string): string {
  return `Ты — аналитик личного дневника LIFE OS. Тебе дают одну дневниковую запись на русском (расшифровка голоса или текст). Разбери её и вызови инструмент save_analysis.

Правила:
- Пиши на русском. Не выдумывай того, чего нет в тексте.
- summary: 1–2 спокойных предложения — суть записи.
- mood/energy/health: 1–10, если упомянуто или ясно из тона; иначе не указывай.
- categories: только из разрешённого списка (slug).
- tags: 3–7 коротких тегов своими словами, без символа #.
- people/places/projects: имена людей, места и проекты, явно упомянутые.
- tasks: конкретные дела, которые человек собирается сделать.
- insights: мысли-осознания. gratitude: за что благодарен.
- sleep_hours/weight: только если названы числом.

Запись:
"""
${text}
"""`;
}

export async function analyze(text: string): Promise<Analysis> {
  const msg = await client().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "save_analysis" },
    messages: [{ role: "user", content: prompt(text) }],
  });
  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("AI не вернул разбор");
  return block.input as Analysis;
}
