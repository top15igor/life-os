import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { upsertHealthDays } from "@/lib/healthMetrics";

export const runtime = "nodejs";

// Приём агрегированных дней из архива Apple «Здоровье».
// Сам zip разбирается в браузере (export.xml огромный, а тело запроса на Vercel
// ограничено ~4.5 МБ) — сюда приходит уже компактный JSON: { days: [ {...} ] }.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const days = Array.isArray(body?.days) ? body.days : null;
  if (!days) return NextResponse.json({ ok: false, error: "no_days" }, { status: 400 });

  let saved = 0;
  try {
    saved = await upsertHealthDays(user.id, days, "apple");
  } catch {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, saved });
}
