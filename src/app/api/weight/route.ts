import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Записать вес на дату (одно значение в день — перезапись).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const day = String(body?.day || "").slice(0, 10);
  const kg = Number(body?.kg);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isFinite(kg) || kg < 20 || kg > 400) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const db = supabaseAdmin();
  await db.from("weight_log").upsert({ user_id: user.id, day, kg }, { onConflict: "user_id,day" });
  return NextResponse.json({ ok: true });
}

// Удалить замер за дату.
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const day = String(body?.day || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return NextResponse.json({ ok: false }, { status: 400 });
  await supabaseAdmin().from("weight_log").delete().eq("user_id", user.id).eq("day", day);
  return NextResponse.json({ ok: true });
}
