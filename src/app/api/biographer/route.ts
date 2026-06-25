import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const question = String(body?.question || "").trim();
  if (!question) return NextResponse.json({ ok: false }, { status: 400 });

  const { data: entries } = await supabaseAdmin()
    .from("entries")
    .select("entry_date, summary, raw_text")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: true })
    .limit(200);

  const list = (entries || []).map((e) => `${e.entry_date}: ${e.summary || e.raw_text}`).join("\n") || "(записей пока нет)";

  const prompt = `Ты — AI-биограф личного дневника LIFE OS. Ответь на вопрос пользователя СВЯЗНЫМ, тёплым повествованием на языке вопроса, опираясь ТОЛЬКО на записи ниже. Ссылайся на даты, показывай развитие во времени. НЕ выдумывай того, чего нет в записях. Если данных мало — честно скажи об этом и предложи вести дневник дальше.

ЗАПИСИ (дата: суть):
${list}

ВОПРОС: ${question}`;

  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });
    const text = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim();
    return NextResponse.json({ ok: true, answer: text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
