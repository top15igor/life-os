import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAnthropicLimits } from "@/lib/anthropicLimits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });
  const limits = await getAnthropicLimits();
  return NextResponse.json({ ok: true, limits });
}
