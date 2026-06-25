import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";

export type Ref = { id: string; date: string; summary: string };
export type Link = { text: string; confidence: string; refs: string[] };
export type Intel = {
  causes: Link[];
  consequences: Link[];
  related: { entryId: string; why: string }[];
  decisions: string[];
  patterns: string[];
  note?: string;
  refsInfo: Record<string, Ref>;
};

const TOOL: Anthropic.Tool = {
  name: "life_intelligence",
  description: "Причинно-следственные связи записи СТРОГО на основе предоставленных записей.",
  input_schema: {
    type: "object",
    properties: {
      causes: {
        type: "array",
        items: { type: "object", properties: { text: { type: "string" }, confidence: { type: "string", enum: ["low", "medium", "high"] }, refs: { type: "array", items: { type: "string" } } }, required: ["text", "confidence", "refs"] },
      },
      consequences: {
        type: "array",
        items: { type: "object", properties: { text: { type: "string" }, confidence: { type: "string", enum: ["low", "medium", "high"] }, refs: { type: "array", items: { type: "string" } } }, required: ["text", "confidence", "refs"] },
      },
      related: {
        type: "array",
        items: { type: "object", properties: { entryId: { type: "string" }, why: { type: "string" } }, required: ["entryId", "why"] },
      },
      decisions: { type: "array", items: { type: "string" } },
      patterns: { type: "array", items: { type: "string" } },
      note: { type: "string", description: "Заполни, если данных мало для связей." },
    },
    required: ["causes", "consequences", "related", "decisions", "patterns"],
  },
};

export async function buildIntelligence(userId: string, entryId: string): Promise<Intel> {
  const db = supabaseAdmin();
  const { data: target } = await db
    .from("entries")
    .select("id, entry_date, raw_text, summary")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) throw new Error("not found");

  const { data: others } = await db
    .from("entries")
    .select("id, entry_date, summary, raw_text")
    .eq("user_id", userId)
    .neq("id", entryId)
    .order("entry_date", { ascending: true })
    .limit(80);

  const list = others || [];
  const refsInfo: Record<string, Ref> = {};
  for (const e of list) refsInfo[e.id] = { id: e.id, date: e.entry_date, summary: e.summary || "" };

  const context = list.length
    ? list.map((e) => `[${e.id}] ${e.entry_date}: ${(e.raw_text || e.summary || "").slice(0, 400)}`).join("\n")
    : "(других записей пока нет)";

  const prompt = `Ты — аналитик причинно-следственных связей в личном дневнике LIFE OS.

ЦЕЛЕВАЯ ЗАПИСЬ (id ${target.id}, ${target.entry_date}):
"""${target.raw_text || target.summary || ""}"""

ДРУГИЕ ЗАПИСИ пользователя (формат [id] дата: суть):
${context}

Построй связи СТРОГО на основе приведённых записей. НЕ выдумывай связей, которых нет в данных. Поле refs — это id записей из списка выше, которые подтверждают связь. confidence: low/medium/high. Если данных недостаточно — верни пустые массивы и заполни note. Все тексты пиши на языке целевой записи. Вызови инструмент life_intelligence.`;

  const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1600,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "life_intelligence" },
    messages: [{ role: "user", content: prompt }],
  });

  logClaude(userId, "intelligence", "sonnet", (m as any).usage);
  const block = m.content.find((b) => b.type === "tool_use");
  const data = (block && block.type === "tool_use" ? block.input : {}) as any;

  const valid = (ids: string[] = []) => (ids || []).filter((id) => refsInfo[id]);
  const usedIds = new Set<string>();
  const causes = (data.causes || []).map((c: any) => ({ ...c, refs: valid(c.refs) }));
  const consequences = (data.consequences || []).map((c: any) => ({ ...c, refs: valid(c.refs) }));
  const related = (data.related || []).filter((r: any) => refsInfo[r.entryId]);
  [...causes, ...consequences].forEach((c: any) => c.refs.forEach((id: string) => usedIds.add(id)));
  related.forEach((r: any) => usedIds.add(r.entryId));

  const trimmed: Record<string, Ref> = {};
  usedIds.forEach((id) => (trimmed[id] = refsInfo[id]));

  return {
    causes,
    consequences,
    related,
    decisions: data.decisions || [],
    patterns: data.patterns || [],
    note: data.note,
    refsInfo: trimmed,
  };
}
