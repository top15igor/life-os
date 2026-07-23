import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";

// Ответ по личной Базе знаний: AI отвечает на вопрос, опираясь ТОЛЬКО на
// сохранённые из Instagram материалы пользователя.
const LANG: Record<string, string> = { ru: "русском", en: "English", uk: "українській", fr: "français", es: "español" };

export async function askKnowledge(userId: string, question: string, locale = "ru"): Promise<string> {
  const q = (question || "").trim();
  if (!q) return "Спроси что-нибудь по своим сохранёнкам 🙂";
  const lang = LANG[locale] || LANG.ru;

  const { data } = await supabaseAdmin()
    .from("saved_items")
    .select("title, topic, summary, key_points, tags")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(300);

  if (!data?.length) {
    return "В Базе знаний пока пусто. Пришли боту пару ссылок из Instagram — и я смогу отвечать по ним.";
  }

  const ctx = data
    .map((d: any, i: number) => {
      const pts = Array.isArray(d.key_points) && d.key_points.length ? "\n- " + d.key_points.join("\n- ") : "";
      const tags = Array.isArray(d.tags) && d.tags.length ? `\nтеги: ${d.tags.join(", ")}` : "";
      return `[${i + 1}] ${d.title || "—"}${d.topic ? ` (${d.topic})` : ""}\n${d.summary || ""}${pts}${tags}`;
    })
    .join("\n\n")
    .slice(0, 14000);

  const prompt = `Ты — помощник по личной Базе знаний пользователя. Это его сохранённые из Instagram материалы (рецепты, тренировки, советы и т.п.).
Ответь на вопрос, опираясь ТОЛЬКО на материалы ниже. Отвечай на ${lang} языке (язык интерфейса), по делу и по-человечески — даже если сами материалы на другом языке, ты их понимаешь и переводишь смысл.
Если в материалах нет ответа — честно скажи, что про это сохранёнок нет, и не выдумывай.
Где уместно — ссылайся, из какого сохранения инфа (по заголовку).

Материалы:
"""
${ctx}
"""

Вопрос: ${q}`;

  const msg = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });
  logClaude(userId, "knowledge_ask", "sonnet", (msg as any).usage);
  return msg.content.filter((b) => b.type === "text").map((b: any) => b.text).join("").trim() || "—";
}
