import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Изменить статус обещания (только своего).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const db = supabaseAdmin();

  if (body?.del) {
    await db.from("promises").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  const status = String(body?.status || "");
  if (!["active", "done"].includes(status)) return NextResponse.json({ ok: false }, { status: 400 });
  const { error } = await db.from("promises").update({ status }).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
