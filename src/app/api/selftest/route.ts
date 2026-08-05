import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runSelftest, reportSelftest, type Mode } from "@/lib/botSelftest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Полный прогон трогает AI (разбор записи, ответ ассистента) — 60 секунд не хватает.
export const maxDuration = 300;

const OWNER = "00000000-0000-0000-0000-000000000000";

// Прогон самопроверки бота.
//   GET /api/selftest?key=<CRON_SECRET>[&mode=full]  — для расписания
//   GET /api/selftest[?mode=full]                    — вручную, из браузера владельца
//
// mode=light (по умолчанию) — сценарии без AI, дёшево, можно часто.
// mode=full — плюс сохранение мысли и вопрос ассистенту (тратит AI).
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const cron = process.env.CRON_SECRET;
  let allowed = !!(key && cron && key === cron);
  if (!allowed) {
    const user = await getCurrentUser();
    allowed = !!user && user.id === OWNER;
  }
  if (!allowed) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const mode: Mode = req.nextUrl.searchParams.get("mode") === "full" ? "full" : "light";
  const res = await runSelftest(req.nextUrl.origin, mode);
  const { alerted } = await reportSelftest(res);

  return NextResponse.json({ ok: res.failed === 0, alerted, ...res });
}
