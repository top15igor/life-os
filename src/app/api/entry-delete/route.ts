import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { clearDerived } from "@/lib/saveEntry";

export const runtime = "nodejs";

// Удалить запись (только свою) вместе со всеми производными данными.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  const db = supabaseAdmin();
  const { data: e } = await db.from("entries").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!e) return NextResponse.json({ ok: false }, { status: 404 });

  await clearDerived(id);
  await db.from("entries").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
