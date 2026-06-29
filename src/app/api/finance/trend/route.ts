import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMonthlyTrend } from "@/lib/finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Динамика финансов по месяцам (для графика). ?n=12 — сколько последних месяцев.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const n = Math.min(36, Math.max(3, Number(req.nextUrl.searchParams.get("n")) || 12));
  const trend = await getMonthlyTrend(user.id, n);
  return NextResponse.json({ ok: true, trend });
}
