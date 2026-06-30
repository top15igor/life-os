import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

// Ручное указание «кто пригласил» пользователя. Только владельцу.
// body: { id, referrerId }  (referrerId пустой/null = убрать пригласившего)
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me || me.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  const referrerId = body?.referrerId ? String(body.referrerId) : null;
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  if (referrerId === id) return NextResponse.json({ ok: false, error: "self" }, { status: 400 });

  // Защита от прямого цикла: нельзя назначить пригласившим того, кого пригласил сам этот юзер.
  if (referrerId) {
    const { data: ref } = await supabaseAdmin().from("users").select("referred_by").eq("id", referrerId).maybeSingle();
    if ((ref as any)?.referred_by === id) return NextResponse.json({ ok: false, error: "cycle" }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("users").update({ referred_by: referrerId }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
