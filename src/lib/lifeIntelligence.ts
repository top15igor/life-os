import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";

export type Conf = "low" | "medium" | "high";
export type Noticed = { text: string; confidence: Conf; why?: string; refs?: string[] };
export type Discovery = { text: string; confidence: Conf; basis?: string; refs?: string[] };
export type Happy = { emoji: string; label: string; why?: string };
export type Energy = { label: string; strength: number; why?: string };
export type Chain = { steps: string[] };
export type Surprise = { text: string; why?: string };
export type Hypothesis = { text: string; confidence: Conf; observations?: number; why?: string; refs?: string[] };
export type Balance = {
  growing: { emoji?: string; label: string; text: string }[];
  neglected: { emoji?: string; label: string; text?: string }[];
  evolution: { label: string; direction: "up" | "down" | "flat"; why?: string }[];
};

export type LifeOverview = {
  noticed?: Noticed;
  discovery?: Discovery;
  happiness: Happy[];
  energyGivers: Energy[];
  energyDrainers: Energy[];
  chains: Chain[];
  surprise?: Surprise;
  story?: string;
  patterns: string[];
  balance?: Balance;
  hypotheses?: Hypothesis[];
  note?: string;
  entryCount: number;
};

const TOOL: Anthropic.Tool = {
  name: "life_overview",
  description: "Интересные наблюдения о жизни пользователя СТРОГО на основе его записей.",
  input_schema: {
    type: "object",
    properties: {
      noticed: { type: "object", properties: { text: { type: "string" }, confidence: { type: "string", enum: ["low", "medium", "high"] }, why: { type: "string" }, refs: { type: "array", items: { type: "string" } } }, required: ["text", "confidence"] },
      discovery: { type: "object", properties: { text: { type: "string" }, confidence: { type: "string", enum: ["low", "medium", "high"] }, basis: { type: "string" }, refs: { type: "array", items: { type: "string" } } }, required: ["text", "confidence"] },
      happiness: { type: "array", items: { type: "object", properties: { emoji: { type: "string" }, label: { type: "string" }, why: { type: "string" } }, required: ["emoji", "label"] } },
      energyGivers: { type: "array", items: { type: "object", properties: { label: { type: "string" }, strength: { type: "integer" }, why: { type: "string" } }, required: ["label", "strength"] } },
      energyDrainers: { type: "array", items: { type: "object", properties: { label: { type: "string" }, strength: { type: "integer" }, why: { type: "string" } }, required: ["label", "strength"] } },
      chains: { type: "array", items: { type: "object", properties: { steps: { type: "array", items: { type: "string" } } }, required: ["steps"] } },
      surprise: { type: "object", properties: { text: { type: "string" }, why: { type: "string" } }, required: ["text"] },
      story: { type: "string" },
      patterns: { type: "array", items: { type: "string" } },
      balance: {
        type: "object",
        properties: {
          growing: { type: "array", items: { type: "object", properties: { emoji: { type: "string" }, label: { type: "string" }, text: { type: "string" } }, required: ["label", "text"] } },
          neglected: { type: "array", items: { type: "object", properties: { emoji: { type: "string" }, label: { type: "string" }, text: { type: "string" } }, required: ["label"] } },
          evolution: { type: "array", items: { type: "object", properties: { label: { type: "string" }, direction: { type: "string", enum: ["up", "down", "flat"] }, why: { type: "string" } }, required: ["label", "direction"] } },
        },
      },
      hypotheses: { type: "array", items: { type: "object", properties: { text: { type: "string" }, confidence: { type: "string", enum: ["low", "medium", "high"] }, observations: { type: "integer" }, why: { type: "string" }, refs: { type: "array", items: { type: "string" } } }, required: ["text", "confidence"] } },
      note: { type: "string", description: "Заполни честно, если данных мало." },
    },
    required: ["happiness", "energyGivers", "energyDrainers", "chains", "patterns"],
  },
};

// Версия схемы overview — при изменении набора блоков старый кэш игнорируется.
const OVERVIEW_VERSION = 4;

export async function buildLifeOverview(userId: string, fresh = false): Promise<LifeOverview> {
  const db = supabaseAdmin();
  const { data: entries } = await db
    .from("entries")
    .select("entry_date, summary, raw_text")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true })
    .limit(200);

  const list = entries || [];
  const count = list.length;
  const today = new Date().toISOString().slice(0, 10);
  const base: LifeOverview = { happiness: [], energyGivers: [], energyDrainers: [], chains: [], patterns: [], entryCount: count };

  // Кэш на день: если за сегодня уже считали при том же числе записей — отдаём мгновенно.
  if (!fresh) {
    try {
      const { data: cached } = await db.from("life_overview").select("data, entry_count, day").eq("user_id", userId).maybeSingle();
      if (cached?.data && cached.entry_count === count && cached.day === today && (cached.data as any)._v === OVERVIEW_VERSION) return cached.data as LifeOverview;
    } catch {
      // таблицы кэша может не быть — просто считаем вживую
    }
  }

  const save = async (data: LifeOverview) => {
    (data as any)._v = OVERVIEW_VERSION;
    try {
      await db.from("life_overview").upsert({ user_id: userId, day: today, entry_count: count, data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    } catch {
      // нет таблицы кэша — не страшно
    }
  };

  if (count === 0) {
    const empty = { ...base, note: "Пока нет записей — наблюдения появятся, как только ты начнёшь писать боту." };
    await save(empty);
    return empty;
  }

  const context = list.map((e) => `${e.entry_date}: ${(e.raw_text || e.summary || "").slice(0, 600)}`).join("\n");

  const prompt = `Ты — Life Intelligence в дневнике LIFE OS. Перед тобой ВСЕ записи пользователя. Найди интересные, тёплые наблюдения о его жизни — то, что помогает человеку лучше понять себя.

ПРАВИЛА:
- СТРОГО на основе записей ниже. НИКОГДА не выдумывай факты, не ставь психологических диагнозов, не выдавай гипотезы за истину.
- Если данных мало — верни пустые массивы/поля и честно заполни note. Лучше меньше, но правда.
- Пиши на языке записей, по-человечески, без канцелярита.
- refs — это даты записей-подтверждений (из списка ниже).
- ЧИСЛА И РЕКОРДЫ (вес, отжимания, дистанция, любые показатели): бери САМЫЕ СВЕЖИЕ или максимальные значения из записей, не устаревшие. Если значение росло — покажи прогресс с датами («в первый день 102, сейчас 120»), а не фиксируйся на старом числе как на текущем рекорде.

Заполни инструмент life_overview:
- noticed: ОДНО самое важное наблюдение последних недель (что всё больше занимает человека, как он меняется).
- discovery: ОДНА закономерность-открытие (напр. «лучшие идеи приходят после прогулок»).
- happiness: 3–6 вещей, что делают человека счастливым (emoji + короткая подпись + why).
- energyGivers / energyDrainers: что даёт и что забирает энергию (label + strength 1–5 + why), по убыванию силы.
- chains: 1–3 причинно-следственные цепочки (steps — короткие шаги по порядку).
- surprise: одна неожиданная закономерность.
- story: тёплый связный рассказ о последних ~30 днях (главная тема, человек, проект, эмоция, решение, инсайт, победа, урок) — это история, а не отчёт.
- patterns: 2–5 замеченных закономерностей.
- balance («зеркало жизни», только по данным): growing — 1–3 сферы жизни, которые сейчас РАСТУТ/развиваются (emoji + label + text: что именно развивается и почему так видно); neglected — 1–4 сферы, которым ДАВНО не уделялось внимания (emoji + label + короткий text); evolution — 2–5 ключевых сфер с направлением (label + direction: up/down/flat + why). Если данных мало — пустые массивы.
- hypotheses: 1–4 ГИПОТЕЗЫ-предположения о связях в жизни человека, которые он мог бы проверить экспериментом (напр. «возможно, после прогулок дольше 40 минут ты спишь лучше»). Каждая: text (как гипотеза, со словами «возможно/вероятно/есть признаки», НЕ как факт), confidence, observations (на скольких записях основано), why, refs (даты). Строго по данным, без выдумок и без медицинских диагнозов; если мало данных — пустой массив.

ЗАПИСИ:
${context}`;

  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2600,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "life_overview" },
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(userId, "overview", "sonnet", (m as any).usage);
    const block = m.content.find((b) => b.type === "tool_use");
    const d = (block && block.type === "tool_use" ? block.input : {}) as any;
    const clampStrength = (x: any) => ({ ...x, strength: Math.max(1, Math.min(5, Math.round(x.strength || 1))) });
    const result: LifeOverview = {
      noticed: d.noticed?.text ? d.noticed : undefined,
      discovery: d.discovery?.text ? d.discovery : undefined,
      happiness: d.happiness || [],
      energyGivers: (d.energyGivers || []).map(clampStrength),
      energyDrainers: (d.energyDrainers || []).map(clampStrength),
      chains: (d.chains || []).filter((c: any) => c.steps?.length),
      surprise: d.surprise?.text ? d.surprise : undefined,
      story: d.story || undefined,
      patterns: d.patterns || [],
      balance: d.balance && (d.balance.growing?.length || d.balance.neglected?.length || d.balance.evolution?.length)
        ? { growing: d.balance.growing || [], neglected: d.balance.neglected || [], evolution: d.balance.evolution || [] }
        : undefined,
      hypotheses: d.hypotheses?.length ? d.hypotheses : [],
      note: d.note,
      entryCount: count,
    };
    await save(result);
    return result;
  } catch (e) {
    console.error(e);
    return { ...base, note: "Не удалось собрать наблюдения, попробуй обновить." };
  }
}
