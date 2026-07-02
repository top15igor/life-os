import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setVoiceTextPref } from "@/lib/users";

export const runtime = "nodejs";

// Сохраняет настройку «показывать распознанный текст под голосовыми».
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const on = !!body?.on;
  const res = await setVoiceTextPref(user.id, on);
  if (res === null) return NextResponse.json({ ok: false, error: "no_column" }, { status: 200 });
  return NextResponse.json({ ok: true, on });
}
