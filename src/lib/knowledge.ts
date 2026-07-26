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

  // Сначала — отбор по релевантности вопросу, и только потом контекст.
  // Раньше склеивались ВСЕ сохранёнки свежими вперёд и резались на 14к символов:
  // старые (например, рецепты хлеба из гречки) не влезали, и бот честно «не видел» их.
  // Стемминг простейший: первые 4 буквы слова («гречневого» и «гречки» → «греч»).
  const norm = (s: string) => (s || "").toLowerCase().replace(/ё/g, "е");
  const stems = norm(q).split(/[^a-zа-я0-9]+/i).filter((w) => w.length >= 4).map((w) => w.slice(0, 4));
  const itemText = (d: any) =>
    norm([d.title, d.topic, d.summary, ...(Array.isArray(d.key_points) ? d.key_points : []), ...(Array.isArray(d.tags) ? d.tags : [])].join(" "));
  const scored = data.map((d: any, i: number) => ({
    d,
    i, // исходный порядок = свежесть, работает как tiebreak
    score: stems.length ? stems.filter((st) => itemText(d).includes(st)).length : 0,
  }));
  const anyHit = scored.some((x) => x.score > 0);
  // Есть совпадения → релевантные вперёд; нет → как раньше, свежие вперёд.
  const picked = (anyHit ? [...scored].sort((a, b) => b.score - a.score || a.i - b.i) : scored).slice(0, 40);

  const ctx = picked
    .map(({ d }, i: number) => {
      const pts = Array.isArray(d.key_points) && d.key_points.length ? "\n- " + d.key_points.join("\n- ") : "";
      const tags = Array.isArray(d.tags) && d.tags.length ? `\nтеги: ${d.tags.join(", ")}` : "";
      return `[${i + 1}] ${d.title || "—"}${d.topic ? ` (${d.topic})` : ""}\n${d.summary || ""}${pts}${tags}`;
    })
    .join("\n\n")
    .slice(0, 14000);

  const prompt = `Ты — помощник по личной Базе знаний пользователя. Это его сохранённые из Instagram материалы (рецепты, тренировки, советы и т.п.).
Ответь на вопрос, опираясь ТОЛЬКО на материалы ниже. Отвечай на ${lang} языке (язык интерфейса), по делу и по-человечески — даже если сами материалы на другом языке, ты их понимаешь и переводишь смысл.
Если в материалах нет ответа — честно скажи, что про ЭТО (назови конкретно, о чём спросили) сохранёнок нет, и не выдумывай.
ВАЖНО: в этом случае НЕ вываливай вместо ответа другие сохранёнки, которых не просили (спросили рецепт хлеба — не надо перечислять рецепт латте). Максимум — одной строкой упомяни, что есть похожее, если оно реально близко по теме. И предложи: могу найти/подсказать сам — просто спроси меня как AI-друга.
Где уместно — ссылайся, из какого сохранения инфа (по заголовку).

ФОРМАТ (ответ уходит в Telegram):
- Каждый рецепт/материал — отдельный блок: заголовок-строка, затем содержимое; МЕЖДУ блоками обязательно ПУСТАЯ строка (иначе всё сливается в один рецепт).
- Внутри блока разделы («Ингредиенты», «Приготовление») тоже отделяй пустой строкой.
- НИКОГДА не используй markdown-таблицы — Telegram их не показывает, получается каша. Сравнение пиши простыми строками: «Светлая: не промывать» / «Зелёная: промывать».

Материалы:
"""
${ctx}
"""

Вопрос: ${q}`;

  const msg = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
    model: "claude-sonnet-4-6",
    // 800 не хватало на два рецепта — ответ обрывался на полуслове.
    max_tokens: 1600,
    messages: [{ role: "user", content: prompt }],
  });
  logClaude(userId, "knowledge_ask", "sonnet", (msg as any).usage);
  return msg.content.filter((b) => b.type === "text").map((b: any) => b.text).join("").trim() || "—";
}
