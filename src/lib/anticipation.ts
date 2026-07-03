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
  const nowLocal = new Date(Date.now() + (typeof tzOffset === "number" ? tzOffset : 0) * 60000).toISOString().slice(11, 16); // HH:MM локально

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
      `Ты — внимательный AI-друг (как Джарвис). СЕГОДНЯ ${day}, сейчас ${nowLocal} по местному времени. По данным пользователя ниже найди МАКСИМУМ ОДНО своевременное, реально полезное наблюдение на СЕГОДНЯ. ` +
      `ВРЕМЯ И СОБЫТИЯ (строго): дату и время встреч/напоминаний бери ТОЧНО из поля «на …» в НАПОМИНАНИЯХ — НИКОГДА не меняй и не придумывай время (если в данных 14:00 — пиши 14:00, а не 12:00). Если точного времени нет — вообще не называй время. Не напоминай о событии, которое уже прошло (его время раньше ${nowLocal} сегодня): про уже прошедшую сегодня встречу либо промолчи (found=false), либо спроси в прошедшем («как прошла встреча у доктора?»), но НЕ подавай её как предстоящую («у тебя сегодня встреча в …»). ` +
      `Типы: привычка под угрозой, приближается повторяющееся/регулярное дело, мягко напомнить про незакрытое обещание человеку, заметная закономерность (настроение/энергия/расходы). ` +
      `КРИТИЧЕСКИ ВАЖНО про даты и логику: ` +
      `1) Записи с сегодняшней датой (${day}) — это происходит СЕГОДНЯ/только что, НЕ прошлое. Никогда не говори «давно не делал», «вернись к привычке» или «последний раз тогда-то», если человек упоминал это сегодня или вчера. ` +
      `2) «Привычка под угрозой» — ТОЛЬКО если её не упоминали 3+ дня подряд. Делал сегодня/вчера = это УСПЕХ: либо похвали кратко, либо вообще не трогай эту тему (found=false). ` +
      `3) НЕ связывай несвязанные вещи. Бытовая покупка (средства для посуды, бытовая химия, хозтовары) НЕ имеет отношения к диете/аскезе/режиму/спорту — не выдумывай такие связи. Связывай только реально связанное по смыслу. ` +
      `4) Если сигнал слабый, надуманный, или ты не уверен в датах/логике — found=false. Лучше промолчать, чем выдать неточность: пользователь не должен ловить тебя на ерунде. ` +
      `При found=true: тёплая, конкретная, КРАТКАЯ подсказка — строго 1-2 коротких предложения на ${LANG_NAME[lang]} языке, от лица друга, по конкретике из записей. Не выдумывай фактов. Всегда вызывай инструмент anticipation.`;
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
