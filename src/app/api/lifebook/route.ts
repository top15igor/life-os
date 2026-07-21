import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getBookMeta, bookVoicePreamble } from "@/lib/book";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const TOOL: Anthropic.Tool = {
  name: "chapter",
  description: "Глава Книги жизни за месяц по записям пользователя.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Образное название главы на языке записей." },
      themes: { type: "array", items: { type: "string" }, description: "3–5 главных тем месяца." },
      narrative: { type: "string", description: "Тёплый связный рассказ о месяце, 6–10 предложений, строго по фактам из записей." },
    },
    required: ["title", "themes", "narrative"],
  },
};

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month") || "";
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ ok: false }, { status: 400 });

  const db = supabaseAdmin();
  // Граница «< 1-е число следующего месяца»: даты 31 нет в 30-дневных месяцах
  // и феврале, и «<= month-31» отклонялся бы Postgres как invalid date.
  const [my, mm] = month.split("-").map(Number);
  const monthEnd = mm === 12 ? `${my + 1}-01-01` : `${my}-${String(mm + 1).padStart(2, "0")}-01`;
  const { data } = await db
    .from("entries")
    .select("entry_date, summary, raw_text")
    .eq("user_id", user.id)
    .gte("entry_date", `${month}-01`)
    .lt("entry_date", monthEnd)
    .order("entry_date", { ascending: true });

  if (!data?.length) return NextResponse.json({ ok: true, chapter: null });

  // Авторский голос книги (perspective/для кого/tone/посыл) — из настроек года.
  const metaYear = Number(req.nextUrl.searchParams.get("year")) || my;
  let voice = "";
  try { voice = bookVoicePreamble((await getBookMeta(user.id, metaYear)).sections?.__gen); } catch {}

  const list = data.map((e) => `${e.entry_date}: ${(e.raw_text || e.summary || "").slice(0, 800)}`).join("\n");
  const prompt = `Ты — AI-биограф LIFE OS. Напиши главу Книги жизни за месяц по записям ниже. Пиши на языке записей, тепло и по-человечески, строго по фактам (не выдумывай).\n${voice}\n\nВызови инструмент chapter.\n\nЗАПИСИ:\n${list}`;

  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "chapter" },
      messages: [{ role: "user", content: prompt }],
    });
    const block = m.content.find((b) => b.type === "tool_use");
    const chapter = block && block.type === "tool_use" ? block.input : null;
    return NextResponse.json({ ok: true, chapter });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
