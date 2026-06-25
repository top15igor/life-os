import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const id = String(body?.id || "");
  const db = supabaseAdmin();
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  // Проверяем, что проект принадлежит пользователю.
  const { data: proj } = await db.from("projects").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!proj) return NextResponse.json({ ok: false }, { status: 404 });

  if (action === "rename") {
    const name = String(body?.name || "").trim();
    if (!name) return NextResponse.json({ ok: false }, { status: 400 });
    await db.from("projects").update({ name }).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    // Удаляем только связи и сам проект — записи остаются.
    await db.from("entry_projects").delete().eq("project_id", id);
    await db.from("projects").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
