import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runDiagnosis } from "@/lib/diagnosisAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const OWNER = "00000000-0000-0000-0000-000000000000";

// Ежедневный разбор: что сломалось за сутки и что чинить первым.
//   GET /api/diagnose?key=<CRON_SECRET>[&hours=24]  — по расписанию
//   GET /api/diagnose[?hours=72]                    — вручную владельцем
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const cron = process.env.CRON_SECRET;
  let allowed = !!(key && cron && key === cron);
  if (!allowed) {
    const user = await getCurrentUser();
    allowed = !!user && user.id === OWNER;
  }
  if (!allowed) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const h = Number(req.nextUrl.searchParams.get("hours"));
  const hours = Number.isFinite(h) && h > 0 && h <= 168 ? Math.floor(h) : 24;

  const res = await runDiagnosis(hours);
  return NextResponse.json({ ok: true, hours, ...res });
}
