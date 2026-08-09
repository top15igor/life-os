import { NextRequest, NextResponse } from "next/server";
import { backfillShelves } from "@/lib/vaultIndex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Подметает то, что осталось без смыслового указателя.
//
// При сохранении вещь индексируется сразу, но путей сохранения много — бот,
// сайт, импорты, перекладывание с полки на полку, — и какой-нибудь однажды
// забудут. Плюс всё, что человек сложил ДО включения этой памяти. Поэтому раз
// в час проходим и досчитываем: это страховка, а не основной путь.
//
// Ручной запуск владельцем: /api/embed-sweep?key=<TELEGRAM_WEBHOOK_SECRET>
// Расписание: Bearer CRON_SECRET (workflow morning-hourly.yml).

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const auth = req.headers.get("authorization");
  const okKey = !!process.env.TELEGRAM_WEBHOOK_SECRET && key === process.env.TELEGRAM_WEBHOOK_SECRET;
  const okCron = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  if (!okKey && !okCron) return NextResponse.json({ ok: false }, { status: 401 });

  // По сотне на полку за раз: укладываемся в минуту и не жжём лимиты OpenAI.
  const rows = await backfillShelves(100);
  const done = rows.reduce((s, r) => s + r.done, 0);
  const left = rows.reduce((s, r) => s + r.left, 0);
  return NextResponse.json({ ok: true, done, left, shelves: rows });
}
