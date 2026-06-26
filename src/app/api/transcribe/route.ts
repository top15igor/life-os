import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transcribeFile } from "@/lib/transcribe";
import { logUsage } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 60;

// Только расшифровка голоса в текст (без сохранения записи) — для голосовых заметок к фото и т.п.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("audio") as File | null;
  if (!file) return NextResponse.json({ ok: false }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const type = file.type || "";
  const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : type.includes("webm") ? "webm" : "m4a";
  try {
    const text = await transcribeFile(buf, `voice.${ext}`);
    logUsage(user.id, "transcribe", 0, 0, 0.5);
    return NextResponse.json({ ok: true, text: text || "" });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
