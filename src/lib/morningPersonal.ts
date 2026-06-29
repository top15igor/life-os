import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { getStreak, getGoals, getOpenTasks, getInsights } from "./queries";

// Персональное утреннее сообщение, составленное AI под конкретного пользователя:
// опирается на его записи, серию дней, цели, задачи и свежий инсайт.
// Возвращает текст ИЛИ null — если данных мало / нет ключа / ошибка
// (тогда вызывающий код шлёт обычную статичную фразу morningMessage).
export async function personalMorning(userId: string, name: string | null, lang: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const db = supabaseAdmin();
    const [streak, goals, tasks, insights, entriesRes] = await Promise.all([
      getStreak(userId).catch(() => 0),
      getGoals(userId).catch(() => [] as any[]),
      getOpenTasks(userId, 5).catch(() => [] as any[]),
      getInsights(userId).catch(() => [] as any[]),
      db.from("entries").select("entry_date, summary, raw_text").eq("user_id", userId)
        .order("entry_date", { ascending: false }).limit(7),
    ]);
    const entries = (entriesRes as any).data || [];

    // Холодный старт: совсем нечего персонализировать — пусть уйдёт обычная фраза.
    if (!entries.length && !goals.length && !streak) return null;

    const entriesText = entries.length
      ? entries.map((e: any) => `${e.entry_date}: ${(e.summary || e.raw_text || "").slice(0, 300)}`).join("\n")
      : "(записей пока нет)";
    const goalsText = goals.length
      ? goals.slice(0, 5).map((g: any) => `${g.title} — ${g.progress ?? 0}%`).join("; ")
      : "(целей пока нет)";
    const tasksText = tasks.length
      ? tasks.map((t: any) => t.text).filter(Boolean).join("; ")
      : "(открытых задач нет)";
    const insightText = insights.length ? (insights[0].text || "").slice(0, 300) : "(пока нет)";

    const prompt = `Сейчас утро. Составь ОДНО короткое, тёплое и ЛИЧНОЕ утреннее сообщение для пользователя.
Пиши на языке с кодом "${lang}" (ru — русский, en — English, uk — українська, fr — français).
1–3 предложения, живо и по-человечески, как заботливый друг, который помнит контекст. Можно 1–2 эмодзи.
Обопрись на РЕАЛЬНЫЙ контекст ниже — упомяни что-то конкретное (недавнюю запись, цель, задачу или серию дней), чтобы человек почувствовал, что писали именно ему.
Не дави, без чувства вины и без «ты должен». НЕ выдумывай фактов, которых нет в контексте.
Можешь по желанию мягко подбодрить на день или предложить лёгкое движение — но не делай это шаблонным.
Не используй markdown и заголовки. Верни ТОЛЬКО текст сообщения, без кавычек.

КОНТЕКСТ:
Имя: ${name || "—"}
Серия дней подряд: ${streak}
Последние записи (дата: суть):
${entriesText}
Цели (прогресс): ${goalsText}
Открытые задачи: ${tasksText}
Недавний инсайт: ${insightText}`;

    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(userId, "morning", "haiku", (m as any).usage);
    const text = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim();
    return text || null;
  } catch (e) {
    console.error("personalMorning", userId, e);
    return null;
  }
}
