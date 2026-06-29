import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";

// Стабильные ключи категорий инсайтов (язык-независимые, хранятся в БД).
export const INSIGHT_CATEGORIES = [
  "growth", "health", "relationships", "work", "emotions", "habits", "other",
] as const;
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export function isInsightCategory(v: any): v is InsightCategory {
  return typeof v === "string" && (INSIGHT_CATEGORIES as readonly string[]).includes(v);
}

// Краткое описание категорий для модели (что во что складывать).
const CAT_DESC: Record<InsightCategory, string> = {
  growth: "самопознание, личностный рост, обучение, смыслы, ценности, цели",
  health: "тело, здоровье, сон, питание, спорт, энергия, самочувствие",
  relationships: "люди, семья, друзья, любовь, общение, конфликты",
  work: "работа, карьера, проекты, бизнес, деньги, продуктивность в делах",
  emotions: "чувства, настроение, тревога, эмоциональные состояния и реакции",
  habits: "привычки, режим, дисциплина, повседневные практики и ритуалы",
  other: "всё, что не подходит к остальным категориям",
};

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Раскладывает НЕразобранные инсайты пользователя по категориям за один проход (haiku).
// Возвращает число обновлённых. Мягко деградирует (ничего не падает при ошибке).
export async function autosortInsights(userId: string): Promise<{ sorted: number }> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("insights")
    .select("id, text")
    .eq("user_id", userId)
    .is("category", null)
    .limit(300);
  const rows = (data || []).filter((r: any) => (r.text || "").trim());
  if (!rows.length) return { sorted: 0 };

  const cats = INSIGHT_CATEGORIES.map((k) => `${k} — ${CAT_DESC[k]}`).join("\n");
  // Нумеруем, чтобы модель отвечала по индексу (короче и надёжнее, чем по id).
  const list = rows.map((r: any, i: number) => `${i}. ${String(r.text).replace(/\s+/g, " ").slice(0, 200)}`).join("\n");

  const sys =
    "Ты раскладываешь короткие личные инсайты по категориям. " +
    "Категории (ключ — что входит):\n" + cats + "\n\n" +
    "Для КАЖДОГО инсайта верни самую подходящую категорию. Если сомневаешься — other. " +
    "Отвечай ТОЛЬКО через инструмент.";

  let parsed: { i: number; category: string }[] = [];
  try {
    const resp = await client().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: sys,
      messages: [{ role: "user", content: list }],
      tools: [
        {
          name: "categorize",
          description: "Вернуть категорию для каждого инсайта по его номеру.",
          input_schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    i: { type: "integer", description: "номер инсайта из списка" },
                    category: { type: "string", enum: [...INSIGHT_CATEGORIES] },
                  },
                  required: ["i", "category"],
                },
              },
            },
            required: ["items"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "categorize" },
    });
    logClaude(userId, "insights_autosort", "haiku", resp.usage);
    const block: any = resp.content.find((c: any) => c.type === "tool_use");
    parsed = (block?.input?.items || []).filter((x: any) => Number.isInteger(x.i) && isInsightCategory(x.category));
  } catch (e) {
    console.error("autosortInsights", e);
    return { sorted: 0 };
  }

  // Группируем индексы по категории и обновляем пачками.
  const byCat: Record<string, string[]> = {};
  for (const p of parsed) {
    const row = rows[p.i];
    if (!row) continue;
    (byCat[p.category] ||= []).push(row.id);
  }
  let sorted = 0;
  for (const [cat, ids] of Object.entries(byCat)) {
    if (!ids.length) continue;
    const { error } = await db.from("insights").update({ category: cat }).in("id", ids).eq("user_id", userId);
    if (!error) sorted += ids.length;
  }
  return { sorted };
}
