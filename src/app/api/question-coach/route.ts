import { NextRequest, NextResponse } from "next/server";
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
  let allowed = !!(key && cron && key === cron);
  if (!allowed) {
    const user = await getCurrentUser();
    allowed = !!user && user.id === OWNER;
  }
  if (!allowed) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const d = Number(req.nextUrl.searchParams.get("days"));
  const days = Number.isFinite(d) && d >= 7 && d <= 365 ? Math.floor(d) : 60;

  const res = await runQuestionCoach(days);
  return NextResponse.json({ ok: true, days, ...res }, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
