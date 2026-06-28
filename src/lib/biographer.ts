import { supabaseAdmin } from "./supabaseAdmin";
import Anthropic from "@anthropic-ai/sdk";
import { logClaude } from "./usage";
import { getFinanceSummary } from "./finance";

// Отвечает на вопрос пользователя по его записям (ассистент «спроси свою жизнь»).
export async function askLife(userId: string, question: string): Promise<string> {
  const db = supabaseAdmin();
  const [{ data: entries }, finance] = await Promise.all([
    db
      .from("entries")
      .select("entry_date, summary, raw_text")
      .eq("user_id", userId)
      .order("entry_date", { ascending: true })
      .limit(200),
    getFinanceSummary(userId).catch(() => ""),
  ]);

  const list = (entries || []).map((e) => `${e.entry_date}: ${(e.raw_text || e.summary || "").slice(0, 800)}`).join("\n") || "(записей пока нет)";

  const prompt = `Ты — личный AI-ассистент в дневнике LIFE OS. Пользователь задаёт вопрос о своей жизни. Ответь ПО СУЩЕСТВУ и по делу, на языке вопроса, опираясь на данные ниже: записи дневника и сводку финансов. Для вопросов про деньги, доходы, расходы, заработок, траты по годам и категориям используй блок ФИНАНСЫ. Если уместно — ссылайся на даты и приводи суммы с валютой. Если данных для ответа нет — честно скажи об этом, не выдумывай. Пиши живо, по-человечески, без воды.

ЗАПИСИ (дата: текст):
${list}

${finance || "ФИНАНСЫ: операций пока нет."}

ВОПРОС: ${question}`;

  const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });
  logClaude(userId, "biographer", "sonnet", (m as any).usage);
  return m.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim();
}

export async function saveChat(userId: string, question: string, answer: string) {
  try {
    await supabaseAdmin().from("biographer_chats").insert({ user_id: userId, question, answer });
  } catch {
    // история необязательна
  }
}
