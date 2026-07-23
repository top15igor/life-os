import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setHorizon, HORIZONS, type Horizon } from "@/lib/taskHorizon";

export const runtime = "nodejs";

// Переместить задачу в горизонт «Сегодня / Неделя / Месяц» (только свою).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  const horizon = String(body?.horizon || "") as Horizon;
  if (!id || !HORIZONS.includes(horizon)) return NextResponse.json({ ok: false }, { status: 400 });

  await setHorizon(user.id, id, horizon);
  return NextResponse.json({ ok: true });
}
