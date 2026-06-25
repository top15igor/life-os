import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { analyze } from "@/lib/ai";
import { saveEntry } from "@/lib/saveEntry";
import { transcribeFile } from "@/lib/transcribe";
import { logUsage } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Запись голоса с сайта → Whisper → AI-разбор → сохранение (тот же путь, что в боте).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("audio") as File | null;
    if (!file) return NextResponse.json({ ok: false }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const filename = (file as any).name || "voice.m4a";
    const text = await transcribeFile(buf, filename);
    logUsage(user.id, "transcribe", 0, 0, 0.5);
    if (!text || !text.trim()) return NextResponse.json({ ok: false, error: "empty" });

    const analysis = await analyze(text, user.id);
    const entry = await saveEntry({ userId: user.id, raw_text: text, source: "web_voice", analysis });
    return NextResponse.json({ ok: true, text, id: entry.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
