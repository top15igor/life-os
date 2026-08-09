import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sweepDescribe, backfillPhotoEmbeddings } from "@/lib/photos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Досчёт смысла по фотоархиву: описания (Haiku по миниатюре) + векторы.
//
// Тот же характер, что embed-sweep: каждый вызов делает кусочек и говорит,
// сколько осталось. Крон дёргает по расписанию; владелец может открыть
// /api/photos/sweep в браузере руками — как диагност и ускоритель.

const OWNER = "00000000-0000-0000-0000-000000000000";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  let allowed = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  if (!allowed) {
    const user = await getCurrentUser();
    allowed = !!user && user.id === OWNER;
  }
  if (!allowed) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const described = await sweepDescribe(30);
  const embedded = await backfillPhotoEmbeddings(100);
  return NextResponse.json({ ok: true, described, embedded_backfill: embedded });
}
