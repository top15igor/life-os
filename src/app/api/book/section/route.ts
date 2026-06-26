import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getBookMeta, cacheSection } from "@/lib/book";
import Anthropic from "@anthropic-ai/sdk";
import { logClaude } from "@/lib/usage";

export const runtime = "nodejs";

// Какие разделы книги пишет AI и с какой «ролью».
const SECTIONS: Record<string, { task: string }> = {
  overview: { task: "Раздел «Год в одном взгляде»: тёплый связный рассказ обо всём годе целиком — каким он был, что наполняло, как человек менялся. 8–12 предложений." },
  self: { task: "Раздел «Что я понял о себе»: вдумчивая рефлексия о характере, ценностях и внутренних изменениях человека за период. От первого лица. 6–10 предложений." },
  lessons: { task: "Раздел «Главные уроки»: 5–8 коротких уроков, которые человек вынес за период. Каждый урок — отдельная строка, начинается с «— ». Только по фактам из записей." },
  people: { task: "Раздел «Люди, которым я благодарен»: тёплый рассказ о людях, которые были рядом и что они значили. По именам из записей. 6–10 предложений." },
};

const TOOL: Anthropic.Tool = {
  name: "section",
  description: "Раздел книги жизни по записям пользователя.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Образный заголовок раздела на языке записей." },
      body: { type: "string", description: "Текст раздела по заданию, строго по фактам из записей, тёпло и по-человечески." },
    },
    required: ["title", "body"],
  },
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const type = String(body.type || "");
  const year = Number(body.year || 0);
  const fresh = !!body.fresh;
  if (!SECTIONS[type]) return NextResponse.json({ ok: false, error: "bad type" }, { status: 400 });

  // Кэш (если есть таблица и не запрошена пересборка)
  if (!fresh) {
    const meta = await getBookMeta(user.id, year);
    const cached = meta.sections?.[type];
    if (cached?.body) return NextResponse.json({ ok: true, section: cached, cached: true });
  }

  const db = supabaseAdmin();
  let q = db.from("entries").select("entry_date, summary, raw_text").eq("user_id", user.id);
  if (year) q = q.gte("entry_date", `${year}-01-01`).lte("entry_date", `${year}-12-31`);
  const { data } = await q.order("entry_date", { ascending: true }).limit(400);
  if (!data?.length) return NextResponse.json({ ok: true, section: null });

  const list = data.map((e) => `${e.entry_date}: ${(e.raw_text || e.summary || "").slice(0, 600)}`).join("\n");
  const period = year ? `за ${year} год` : "за всю жизнь по записям";
  const prompt = `Ты — AI-биограф LIFE OS. Пиши раздел персональной книги-летописи ${period}. Пиши на языке записей, тепло и по-человечески, СТРОГО по фактам из записей (ничего не выдумывай, не приписывай эмоции). ${SECTIONS[type].task}\n\nЗАПИСИ (дата: текст):\n${list}\n\nВызови инструмент section.`;

  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1400,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "section" },
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(user.id, "book_section", "sonnet", (m as any).usage);
    const block = m.content.find((b) => b.type === "tool_use");
    const section = block && block.type === "tool_use" ? block.input : null;
    if (section) await cacheSection(user.id, year, type, section);
    return NextResponse.json({ ok: true, section });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
