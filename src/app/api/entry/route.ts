import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { analyze } from "@/lib/ai";
import { saveEntry } from "@/lib/saveEntry";

export const runtime = "nodejs";

// Быстрый ввод записи с сайта (тот же AI-разбор, что и в боте).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const text = String(body?.text || "").trim();
  if (!text) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const analysis = await analyze(text, user.id);
    const entry = await saveEntry({ userId: user.id, raw_text: text, source: "web", analysis });
    return NextResponse.json({ ok: true, id: entry.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
