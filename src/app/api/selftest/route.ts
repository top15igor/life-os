import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runSelftest, reportSelftest, type Mode } from "@/lib/botSelftest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Полный прогон трогает AI (разбор записи, ответ ассистента) — 60 секунд не хватает.
// Больше 300 тариф не даёт, поэтому длинный прогон бьётся на части (&part=).
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
  // Часть прогона: ?part=0&of=2. Каждая часть — сама себе прогон со своей
  // историей, поэтому «сломалось / починилось» считается по ней честно.
  const of = Math.min(4, Math.max(1, Number(req.nextUrl.searchParams.get("of") || 1) || 1));
  const i = Math.min(of - 1, Math.max(0, Number(req.nextUrl.searchParams.get("part") || 0) || 0));
  const part = of > 1 ? { i, of } : undefined;

  const res = await runSelftest(req.nextUrl.origin, mode, part);
  // ?report=0 — прогон «для глаз» из админки: в Telegram не пишем, иначе
  // владелец получает уведомление о поломке, на которую сам же сейчас смотрит.
  const quiet = req.nextUrl.searchParams.get("report") === "0";
  const { alerted } = quiet ? { alerted: false } : await reportSelftest(res);

  // Явная кодировка: без неё Safari показывает русские названия сценариев
  // кракозябрами, и отчёт становится нечитаемым именно там, где его читают глазами.
  return NextResponse.json({ ok: res.failed === 0, alerted, ...res }, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
