import { NextRequest, NextResponse } from "next/server";
import { claimScheduled, releaseScheduled } from "@/lib/scheduleGuard";
import { getCurrentUser } from "@/lib/auth";
import { runQuestionCoach } from "@/lib/questionCoach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const OWNER = "00000000-0000-0000-0000-000000000000";

// Недельный разбор вопросов: что работает, что нет, и предложения на одобрение.
//   GET /api/question-coach?key=<CRON_SECRET>[&days=60]
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

  // По расписанию — не чаще раза в 72 ч: будильников сейчас два (GitHub и
  // Supabase), и без этого отчёт приходил бы дважды. Ручной запуск не ограничен.
  if (viaKey && !(await claimScheduled("questionCoach", 72))) {
    return NextResponse.json({ ok: true, skipped: "already ran recently" });
  }

  const d = Number(req.nextUrl.searchParams.get("days"));
  const days = Number.isFinite(d) && d >= 7 && d <= 365 ? Math.floor(d) : 60;

  const res = await runQuestionCoach(days).catch(async (e) => { if (viaKey) await releaseScheduled("questionCoach"); throw e; });
  return NextResponse.json({ ok: true, days, ...res }, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
