import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
const OWNER = "00000000-0000-0000-0000-000000000000";

// Владелец оценивает баг: payout 0/5/10, status new|paid|rejected.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });
  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  const payout = [0, 5, 10].includes(Number(body?.payout)) ? Number(body.payout) : 0;
  const status = ["new", "paid", "rejected"].includes(String(body?.status)) ? String(body.status) : "new";
  if (!id) return NextResponse.json({ ok: false, error: "no_id" }, { status: 400 });
  try {
    await supabaseAdmin().from("tester_bugs").update({ payout, status, reviewed_at: new Date().toISOString() }).eq("id", id);
  } catch {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, payout, status });
}
