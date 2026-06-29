import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Сохранить таймзону пользователя (минуты к UTC для местного времени).
// Шлёт веб-клиент; используется для записей из бота/сервера.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const off = Number(body?.offset);
  if (!Number.isFinite(off) || Math.abs(off) > 16 * 60) return NextResponse.json({ ok: false });
  try {
    await supabaseAdmin().from("users").update({ tz_offset: Math.round(off) }).eq("id", user.id);
  } catch {
    // нет колонки — мягко игнорируем
  }
  return NextResponse.json({ ok: true });
}
