import { NextRequest, NextResponse } from "next/server";
import { deliverDueReminders } from "@/lib/reminderDelivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Доставка напоминаний в Telegram точно в срок. Дёргается GitHub Actions
// каждые ~5 минут (workflow reminders-5min.yml, Bearer CRON_SECRET).
// Самотест владельца: /api/cron-reminders?key=<TELEGRAM_WEBHOOK_SECRET>.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const key = req.nextUrl.searchParams.get("key");
  const okBearer = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  const okKey = !!key && key === process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!okBearer && !okKey) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const stats = await deliverDueReminders();
    return NextResponse.json({ ok: true, ...stats });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
