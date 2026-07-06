import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAnthropicLimits } from "@/lib/anthropicLimits";
import { getAiSpend, setAiBalance } from "@/lib/aiSpend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });
  const [limits, spend] = await Promise.all([getAnthropicLimits(), getAiSpend()]);
  return NextResponse.json({ ok: true, limits, spend });
}

// Владелец вписал текущий баланс счёта после пополнения — сохраняем снимок.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const usd = Number(body?.balanceUsd);
  if (!isFinite(usd) || usd < 0) return NextResponse.json({ ok: false, error: "bad amount" }, { status: 400 });
  const saved = await setAiBalance(usd);
  const spend = await getAiSpend();
  return NextResponse.json({ ok: saved, spend });
}
