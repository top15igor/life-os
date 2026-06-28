import { supabaseAdmin } from "./supabaseAdmin";
import Anthropic from "@anthropic-ai/sdk";
import { logClaude } from "./usage";

// Отвечает на вопрос пользователя по его записям (ассистент «спроси свою жизнь»).
export async function askLife(userId: string, question: string): Promise<string> {
  const db = supabaseAdmin();
  const { data: entries } = await db
    .from("entries")
    .select("entry_date, summary, raw_text")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true })
    .limit(200);

  const list = (entries || []).map((e) => `${e.entry_date}: ${(e.raw_text || e.summary || "").slice(0, 800)}`).join("\n") || "(записей пока нет)";

  // Также подмешиваем личную Базу знаний (сохранённое из Instagram: рецепты,
  // тренировки, советы), чтобы ассистент отвечал и по ней, а не только по дневнику.
  let saved = "(пусто)";
  try {
    const { data: items } = await db
      .from("saved_items")
      .select("title, topic, summary, key_points")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (items?.length) {
      saved = items
        .map((it: any) => {
          const pts = Array.isArray(it.key_points) && it.key_points.length ? "; " + it.key_points.join("; ") : "";
          return `• ${it.title || "—"}${it.topic ? ` [${it.topic}]` : ""}: ${(it.summary || "").slice(0, 500)}${pts}`.slice(0, 900);
        })
        .join("\n");
    }
  } catch {
    // таблицы может не быть — не страшно
  }

  const prompt = `Ты — личный AI-ассистент в LIFE OS. Пользователь задаёт вопрос. Ответь ПО СУЩЕСТВУ и по делу, на языке вопроса, опираясь на два источника ниже: ДНЕВНИК (что с пользователем происходило) и БАЗА ЗНАНИЙ (полезные материалы, сохранённые из Instagram/YouTube — рецепты, тренировки, советы).

ВАЖНО:
- НИКОГДА не отвечай, что «не можешь открыть ссылку» или «нет доступа к интернету». Ты НЕ ходишь по ссылкам — весь нужный контент уже извлечён и лежит ниже в БАЗЕ ЗНАНИЙ. Отвечай по нему.
- Если пользователь говорит «это видео / этот пост / этот ролик / отсюда» без уточнения — он почти наверняка про САМЫЙ ПЕРВЫЙ (самый свежий) материал в БАЗЕ ЗНАНИЙ ниже. Бери его.
- Материалы могут быть на другом языке — ты их понимаешь и переводишь смысл.
- «как сделать / дай рецепт / всю информацию из видео» — ищи в БАЗЕ ЗНАНИЙ.
- Если уместно — ссылайся на даты записей дневника.
- Если в обоих источниках реально нет ответа — честно скажи об этом (но не ссылайся на «отсутствие доступа»). Не выдумывай.
Пиши живо, по-человечески, без воды.

ДНЕВНИК (дата: текст):
${list}

БАЗА ЗНАНИЙ (сохранённое из Instagram):
${saved}

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
