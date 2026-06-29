import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { getStreak, getGoals, getOpenTasks, getInsights, getRecentGratitude } from "./queries";
import {
  type MorningPrefs, type MorningTopic,
  DEFAULT_MORNING_PREFS, normalizeMorningPrefs, TONE_PROMPT, TOPIC_PROMPT,
} from "./morningPrefs";

// Загрузить настройки утреннего пуша пользователя (мягкий фолбэк, если колонки нет).
export async function loadMorningPrefs(userId: string): Promise<MorningPrefs> {
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    return normalizeMorningPrefs((data as any)?.morning_prefs);
  } catch {
    return { ...DEFAULT_MORNING_PREFS };
  }
}

// Персональное утреннее сообщение, составленное AI под конкретного пользователя
// с учётом его настроек (тон + темы). Опирается на его записи, серию дней, цели,
// задачи, инсайты и благодарность — но только по выбранным темам.
// Возвращает текст ИЛИ null (нет ключа / мало данных / ошибка / темы выключены) —
// тогда вызывающий код шлёт обычную статичную фразу morningMessage.
export async function personalMorning(
  userId: string, name: string | null, lang: string, prefs?: MorningPrefs,
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const p = prefs || (await loadMorningPrefs(userId));
    const want = new Set<MorningTopic>(p.topics);
    if (want.size === 0) return null; // всё выключено → обычная короткая фраза

    const db = supabaseAdmin();
    const [streak, goals, tasks, insights, gratitude, entriesRes] = await Promise.all([
      getStreak(userId).catch(() => 0),
      want.has("goals") ? getGoals(userId).catch(() => [] as any[]) : Promise.resolve([] as any[]),
      want.has("tasks") ? getOpenTasks(userId, 5).catch(() => [] as any[]) : Promise.resolve([] as any[]),
      want.has("insight") ? getInsights(userId).catch(() => [] as any[]) : Promise.resolve([] as any[]),
      want.has("gratitude") ? getRecentGratitude(userId, 3).catch(() => [] as string[]) : Promise.resolve([] as string[]),
      want.has("diary")
        ? db.from("entries").select("entry_date, summary, raw_text").eq("user_id", userId).order("entry_date", { ascending: false }).limit(7)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const entries = (entriesRes as any).data || [];

    // Какие темы реально «есть о чём сказать». motivation и movement не требуют данных.
    const effective: MorningTopic[] = [];
    if (want.has("motivation")) effective.push("motivation");
    if (want.has("movement")) effective.push("movement");
    if (want.has("goals") && goals.length) effective.push("goals");
    if (want.has("tasks") && tasks.length) effective.push("tasks");
    if (want.has("diary") && entries.length) effective.push("diary");
    if (want.has("insight") && insights.length) effective.push("insight");
    if (want.has("gratitude") && gratitude.length) effective.push("gratitude");
    if (!effective.length) return null; // нечего сказать по выбранным темам → статичная фраза

    const ctx: string[] = [`Имя: ${name || "—"}`, `Серия дней подряд: ${streak}`];
    if (effective.includes("diary"))
      ctx.push("Последние записи (дата: суть):\n" + entries.map((e: any) => `${e.entry_date}: ${(e.summary || e.raw_text || "").slice(0, 300)}`).join("\n"));
    if (effective.includes("goals"))
      ctx.push("Цели (прогресс): " + goals.slice(0, 5).map((g: any) => `${g.title} — ${g.progress ?? 0}%`).join("; "));
    if (effective.includes("tasks"))
      ctx.push("Открытые задачи: " + tasks.map((t: any) => t.text).filter(Boolean).join("; "));
    if (effective.includes("insight"))
      ctx.push("Недавний инсайт: " + (insights[0]?.text || "").slice(0, 300));
    if (effective.includes("gratitude"))
      ctx.push("Недавняя благодарность: " + gratitude.slice(0, 3).join("; "));

    const focus = effective.map((t) => TOPIC_PROMPT[t]).join("; ");

    const styleLine = p.customStyle
      ? `\nДополнительно учитывай пожелание пользователя по стилю: «${p.customStyle}». Если оно противоречит правилам про факты ниже — правила про факты важнее.`
      : "";

    const prompt = `Сейчас утро. Составь ОДНО короткое личное утреннее сообщение для пользователя.
Тон: ${TONE_PROMPT[p.tone]}.${styleLine}
Пиши на языке с кодом "${lang}" (ru — русский, en — English, uk — українська, fr — français).
1–3 предложения, живо и по-человечески. Можно 1–2 эмодзи.
Сообщение должно касаться ТОЛЬКО этих тем (и ничего лишнего): ${focus}.

СТРОГО про факты (это важно — пользователь не должен ловить тебя на выдумках):
- Пиши ТОЛЬКО о том, что прямо есть в КОНТЕКСТЕ ниже. Ничего не додумывай, не обобщай и не «угадывай».
- Цели, задачи и инсайты упоминай так, как они записаны. НЕ переименовывай и НЕ превращай одно в другое — например, не называй задачу «письмами клиентам», «звонками» или «встречами», если именно так не написано.
- Не придумывай несуществующих дел, людей, сроков и цифр. Если по теме данных мало — напиши общо и тепло, без выдуманной конкретики.
- Не нагнетай: «висят и ждут», «срочно», «горит» — нельзя, если этого нет в данных.
- Лучше упомянуть одну реальную деталь точно, чем много и приблизительно.

Без давления и без «ты должен». Без markdown и заголовков. Верни ТОЛЬКО текст сообщения, без кавычек.

КОНТЕКСТ:
${ctx.join("\n")}`;

    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      temperature: 0.4, // ниже дефолта — меньше «фантазии», ближе к фактам
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
