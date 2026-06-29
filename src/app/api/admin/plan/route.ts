import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";
const PLANS = ["free", "pro", "premium"];

// Ручная установка тарифа пользователю. Только владельцу (друзья/тестировщики → премиум).
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me || me.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  const plan = String(body?.plan || "");
  if (!id || !PLANS.includes(plan)) return NextResponse.json({ ok: false }, { status: 400 });

  const { error } = await supabaseAdmin().from("users").update({ plan }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, plan });
}
