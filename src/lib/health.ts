import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { getEntries, cats, type Entry } from "./queries";

export type HealthTrend = "worsening" | "stable" | "improving";
export type HealthFocus = {
  concern?: { text: string; trend: HealthTrend; note?: string };
  goals: string[];
  note?: string;
  entryCount: number;
};

const HEALTH_VERSION = 1;

const TOOL: Anthropic.Tool = {
  name: "health_focus",
  description: "Главная проблема со здоровьем и цели по здоровью — строго по записям пользователя.",
  input_schema: {
    type: "object",
    properties: {
      concern: {
        type: "object",
        description: "Главная актуальная проблема со здоровьем. Если в записях нет явной проблемы — не заполняй этот объект.",
        properties: {
          text: { type: "string", description: "Краткая формулировка проблемы СЛОВАМИ пользователя (напр. «дисгидроз правой ступни»). Без выдумок." },
          trend: { type: "string", enum: ["worsening", "stable", "improving"], description: "Динамика по словам пользователя: ухудшается / без изменений / улучшается." },
          note: { type: "string", description: "1 тёплое поддерживающее предложение ОТ ПЕРВОГО ЛИЦА, отражающее ситуацию. СТРОГО без медицинских советов, диагнозов и назначений лечения — только отражение того, что человек сам написал." },
        },
        required: ["text", "trend"],
      },
      goals: { type: "array", items: { type: "string" }, description: "Намерения и цели по здоровью, ЯВНО высказанные пользователем (напр. «купить хлорофилл», «питаться простыми овощами»). Коротко, своими словами. Только из записей. Если нет — пустой массив." },
    },
    required: ["goals"],
  },
};

// Главный фокус здоровья: что сейчас беспокоит + куда движется + цели. Кэш на день.
export async function getHealthFocus(userId: string, fresh = false): Promise<HealthFocus> {
  const db = supabaseAdmin();
  const all = await getEntries(userId, 200);
  const rel = all.filter((e: Entry) => cats(e).some((c: any) => ["health", "sport", "food"].includes(c.slug)) || (e as any).health != null);
  const count = rel.length;
  const today = new Date().toISOString().slice(0, 10);

  if (count === 0) return { goals: [], note: "Пока нет записей о здоровье — расскажи боту о самочувствии, и здесь появится главное.", entryCount: 0 };

  if (!fresh) {
    try {
      const { data: cached } = await db.from("health_focus").select("data, entry_count, day").eq("user_id", userId).maybeSingle();
      if (cached?.data && cached.entry_count === count && cached.day === today && (cached.data as any)._v === HEALTH_VERSION) return cached.data as HealthFocus;
    } catch {
      // нет таблицы кэша — считаем вживую
    }
  }

  const save = async (data: HealthFocus) => {
    (data as any)._v = HEALTH_VERSION;
    try {
      await db.from("health_focus").upsert({ user_id: userId, day: today, entry_count: count, data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    } catch {
      // нет таблицы кэша — не страшно
    }
  };

  const context = rel
    .slice(0, 60)
    .map((e: any) => `${e.entry_date}: ${(e.raw_text || e.summary || "").slice(0, 500)}`)
    .join("\n");

  const prompt = `Ты — помощник раздела «Здоровье» в личном дневнике LIFE OS. Перед тобой записи пользователя, связанные со здоровьем, телом, сном, спортом и питанием. Определи ГЛАВНОЕ.

ПРАВИЛА:
- СТРОГО на основе записей. НИКОГДА не выдумывай, не ставь диагнозов и НЕ давай медицинских советов/назначений лечения. Ты только отражаешь то, что человек сам написал.
- Пиши на языке записей, по-человечески, тепло, от первого лица («я»).
- concern: ОДНА главная проблема со здоровьем, если она есть в записях (что сейчас беспокоит больше всего). trend — как она меняется ПО СЛОВАМ человека (ухудшается/без изменений/улучшается). Если явной проблемы нет — не заполняй concern.
- goals: реальные намерения и цели по здоровью, которые человек высказал.

ЗАПИСИ:
${context}`;

  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "health_focus" },
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(userId, "health_focus", "sonnet", (m as any).usage);
    const block = m.content.find((b) => b.type === "tool_use");
    const d = (block && block.type === "tool_use" ? block.input : {}) as any;
    const result: HealthFocus = {
      concern: d.concern?.text ? { text: d.concern.text, trend: (d.concern.trend || "stable") as HealthTrend, note: d.concern.note } : undefined,
      goals: Array.isArray(d.goals) ? d.goals.filter((g: any) => typeof g === "string" && g.trim()).slice(0, 6) : [],
      entryCount: count,
    };
    await save(result);
    return result;
  } catch (e) {
    console.error(e);
    return { goals: [], entryCount: count };
  }
}
