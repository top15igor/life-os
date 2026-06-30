import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { talkToCompanion, getCompanionHistory } from "@/lib/companion";
import { getLocale } from "@/lib/locale";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Lang } from "@/lib/botActions";

export const runtime = "nodejs";
export const maxDuration = 60; // веб-поиск может занять несколько секунд

// История беседы с AI-другом (сквозная с Telegram).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, messages: [] }, { status: 401 });
  const messages = await getCompanionHistory(user.id, 40);
  return NextResponse.json({ ok: true, messages });
}

// Новая реплика пользователя → ответ друга (с памятью + контекстом + веб-поиском).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const text = String(body?.text || "").trim();
  if (!text) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
  try {
    const locale = (await getLocale()) as Lang;
    let tz: number | null = null;
    try {
      const { data } = await supabaseAdmin().from("users").select("tz_offset").eq("id", user.id).maybeSingle();
      tz = (data as any)?.tz_offset ?? null;
    } catch {}
    const answer = await talkToCompanion(user.id, user.name, text, locale, tz);
    return NextResponse.json({ ok: true, answer });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
