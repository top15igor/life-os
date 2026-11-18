import { NextRequest, NextResponse } from "next/server";
import { claimScheduled, releaseScheduled } from "@/lib/scheduleGuard";
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
  // REMINDER_KEY — вход для планировщика Supabase (pg_cron): CRON_SECRET в Vercel
  // помечен Sensitive, вписать его в задание руками нельзя. См. supabase/pg_cron_checks.sql.
  const rk = process.env.REMINDER_KEY;
  const viaKey = !!(key && ((cron && key === cron) || (rk && key === rk)));
  let allowed = viaKey;
  if (!allowed) {
    const user = await getCurrentUser();
    allowed = !!user && user.id === OWNER;
  }
  if (!allowed) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  // По расписанию — не чаще раза в 12 ч: будильников сейчас два (GitHub и
  // Supabase), и без этого отчёт приходил бы дважды. Ручной запуск не ограничен.
  if (viaKey && !(await claimScheduled("diagnose", 12))) {
    return NextResponse.json({ ok: true, skipped: "already ran recently" });
  }

  const h = Number(req.nextUrl.searchParams.get("hours"));
  const hours = Number.isFinite(h) && h > 0 && h <= 168 ? Math.floor(h) : 24;

  const res = await runDiagnosis(hours).catch(async (e) => { if (viaKey) await releaseScheduled("diagnose"); throw e; });
  return NextResponse.json({ ok: true, hours, ...res }, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
