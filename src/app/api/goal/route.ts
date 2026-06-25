import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const db = supabaseAdmin();

  if (action === "create") {
    const title = String(body?.title || "").trim();
    if (!title) return NextResponse.json({ ok: false }, { status: 400 });
    const year = Number(body?.year) || new Date().getFullYear();
    const { data, error } = await db
      .from("goals")
      .insert({ user_id: user.id, title, year, progress: 0 })
      .select("id, title, progress, year")
      .single();
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true, goal: data });
  }

  if (action === "progress") {
    const id = String(body?.id || "");
    const progress = Math.max(0, Math.min(100, Math.round(Number(body?.progress) || 0)));
    const { error } = await db.from("goals").update({ progress }).eq("id", id).eq("user_id", user.id);
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const id = String(body?.id || "");
    await db.from("goals").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
