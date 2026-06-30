import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";

// Антиципация по паттернам («Джарвис заметил…»): один проход AI над недавними
// записями + открытыми делами/обещаниями + повторяющимися напоминаниями. Возвращает
// МАКСИМУМ одну своевременную, реально полезную подсказку — или null. Кэш на день.

type Lang = "ru" | "en" | "uk" | "fr";

const LANG_NAME: Record<Lang, string> = { ru: "русском", en: "English", uk: "українській", fr: "français" };

function localDay(off?: number | null): string {
  const ms = Date.now() + (typeof off === "number" ? off : 0) * 60000;
  return new Date(ms).toISOString().slice(0, 10);
}

const TOOL = {
  name: "anticipation",
  description: "Вернуть максимум одну своевременную подсказку-наблюдение или признать, что сильного сигнала нет.",
  input_schema: {
    type: "object",
    properties: {
      found: { type: "boolean", description: "true только если есть РЕАЛЬНО полезный своевременный сигнал на сегодня" },
      kind: { type: "string", enum: ["habit_risk", "recurring_due", "promise_followup", "pattern", "other"], description: "тип сигнала" },
      text: { type: "string", description: "тёплая подсказка, 1-2 коротких предложения, на языке пользователя; пусто если found=false" },
    },
    required: ["found"],
  },
};

async function gather(userId: string): Promise<string> {
  const db = supabaseAdmin();
  const since = new Date(Date.now() - 35 * 86400000).toISOString().slice(0, 10);
  const [entries, tasks, promises, reminders] = await Promise.all([
    db.from("entries").select("entry_date, summary, raw_text").eq("user_id", userId).gte("entry_date", since).order("entry_date", { ascending: false }).limit(40),
    db.from("tasks").select("text").eq("user_id", userId).eq("done", false).order("created_at", { ascending: false }).limit(15),
    db.from("promises").select("text, person").eq("user_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(10),
    db.from("reminders").select("text, due_at, recurrence").eq("user_id", userId).eq("done", false).order("due_at", { ascending: true }).limit(12).then((r) => r, () => ({ data: [] as any[] })),
  ]);
  const diary = (entries.data || []).map((e: any) => `${e.entry_date}: ${(e.summary || e.raw_text || "").slice(0, 200)}`).join("\n") || "(нет записей)";
  const tk = (tasks.data || []).map((t: any) => `- ${t.text}`).join("\n") || "(нет)";
  const pr = (promises.data || []).map((p: any) => `- ${p.text}${p.person ? ` (кому: ${p.person})` : ""}`).join("\n") || "(нет)";
  const rm = ((reminders as any).data || []).map((r: any) => `- ${r.text}${r.recurrence ? ` [повтор: ${r.recurrence}]` : ""} на ${String(r.due_at).slice(0, 16)}`).join("\n") || "(нет)";
  return `НЕДАВНИЕ ЗАПИСИ (последние ~35 дней, новые сверху):\n${diary}\n\nОТКРЫТЫЕ ЗАДАЧИ:\n${tk}\n\nАКТИВНЫЕ ОБЕЩАНИЯ:\n${pr}\n\nНАПОМИНАНИЯ:\n${rm}`;
}

// Вычислить подсказку на сегодня (с дневным кэшем). Возвращает текст или null.
export async function getAnticipation(userId: string, lang: Lang = "ru", tzOffset?: number | null): Promise<string | null> {
  const db = supabaseAdmin();
  const day = localDay(tzOffset);

  // Кэш на день (и анти-спам, и анти-COGS).
  try {
    const { data: cached } = await db.from("anticipations").select("text, dismissed").eq("user_id", userId).eq("day", day).maybeSingle();
    if (cached) return (cached as any).dismissed ? null : (cached as any).text || null;
  } catch {
    // нет таблицы — считаем без кэша
  }

  let result: { found: boolean; kind?: string; text?: string } = { found: false };
  try {
    const context = await gather(userId);
    const system =
      `Ты — внимательный AI-друг (как Джарвис). По данным пользователя ниже найди МАКСИМУМ ОДНО своевременное, реально полезное наблюдение-подсказку на СЕГОДНЯ. ` +
      `Типы: привычка под угрозой (регулярное дело давно не упоминается или силы тают — напр. аскеза, зал, витамины, пробежки), приближается повторяющееся/регулярное дело, стоит мягко напомнить про незакрытое обещание человеку, заметная закономерность (настроение/энергия/расходы). ` +
      `Если в данных есть такой уместный сегодня сигнал — found=true и дай подсказку. Если данных мало или ничего подходящего нет — found=false. ` +
      `Будь тёплым, конкретным и КРАТКИМ — строго 1-2 коротких предложения, пиши на ${LANG_NAME[lang]} языке от лица друга. Опирайся на конкретику из записей. Не выдумывай фактов. Всегда вызывай инструмент anticipation.`;
    const resp = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system,
      tools: [TOOL as any],
      tool_choice: { type: "tool", name: "anticipation" },
      messages: [{ role: "user", content: context }],
    });
    logClaude(userId, "anticipation", "haiku", (resp as any).usage);
    const block: any = (resp as any).content.find((b: any) => b.type === "tool_use");
    if (block?.input) result = block.input;
  } catch (e) {
    console.error("anticipation", e);
  }

  const text = result.found && result.text ? String(result.text).trim() : null;
  // Кэшируем результат дня (в т.ч. «ничего» = text null), чтобы не пересчитывать.
  try {
    await db.from("anticipations").upsert({ user_id: userId, day, kind: result.kind || null, text }, { onConflict: "user_id,day" });
  } catch {
    // нет таблицы — просто не кэшируем
  }
  return text;
}

// Снять подсказку (пользователь «понятно/скрыть»).
export async function dismissAnticipation(userId: string, day: string): Promise<void> {
  try {
    await supabaseAdmin().from("anticipations").update({ dismissed: true }).eq("user_id", userId).eq("day", day);
  } catch {
    // ignore
  }
}
