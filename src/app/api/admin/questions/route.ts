import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { approveCandidate, rejectCandidate, runQuestionCoach } from "@/lib/questionCoach";

export const runtime = "nodejs";
export const maxDuration = 120;

const OWNER = "00000000-0000-0000-0000-000000000000";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const id = String(body?.id || "");

  if (action === "approve") return NextResponse.json({ ok: await approveCandidate(id, String(body?.lang || "ru")) });
  if (action === "reject") return NextResponse.json({ ok: await rejectCandidate(id) });

  // Выключить вопрос, который уже в банке (людям он больше не достаётся).
  if (action === "off") {
    const { error } = await supabaseAdmin().from("question_bank").update({ active: false }).eq("id", id);
    return NextResponse.json({ ok: !error });
  }
  if (action === "on") {
    const { error } = await supabaseAdmin().from("question_bank").update({ active: true }).eq("id", id);
    return NextResponse.json({ ok: !error });
  }
  // Свой вопрос от владельца — минуя агента.
  if (action === "add") {
    const text = String(body?.text || "").trim().slice(0, 300);
    if (!text) return NextResponse.json({ ok: false }, { status: 400 });
    const { data, error } = await supabaseAdmin().from("question_bank")
      .insert({ lang: String(body?.lang || "ru"), theme: String(body?.theme || "growth"), text, source: "owner", active: true })
      .select("id, lang, theme, text, source, active, created_at").single();
    return NextResponse.json({ ok: !error, item: data });
  }
  // Прогнать разбор прямо сейчас, не дожидаясь недельного расписания.
  if (action === "run") return NextResponse.json({ ok: true, ...(await runQuestionCoach(Number(body?.days) || 60)) });

  return NextResponse.json({ ok: false }, { status: 400 });
}
