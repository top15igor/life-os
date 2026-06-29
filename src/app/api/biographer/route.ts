import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { askLife, saveChat } from "@/lib/biographer";
import { isPremium } from "@/lib/plan";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // Биограф — премиальная фича.
  if (!(await isPremium(user.id))) return NextResponse.json({ ok: false, error: "premium" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const question = String(body?.question || "").trim();
  if (!question) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const answer = await askLife(user.id, question);
    await saveChat(user.id, question, answer);
    return NextResponse.json({ ok: true, answer });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
