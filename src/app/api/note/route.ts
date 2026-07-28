import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Заметки: список и действия (добавить / закрепить / удалить).
// Справочные факты живут отдельно от дневника — см. supabase/notes.sql.

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { data, error } = await supabaseAdmin()
    .from("notes")
    .select("id, text, pinned, created_at")
    .eq("user_id", user.id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ ok: false, error: "no_table" }, { status: 200 });
  return NextResponse.json({ ok: true, notes: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const db = supabaseAdmin();

  if (body?.action === "add") {
    const text = String(body?.text || "").trim().slice(0, 2000);
    if (!text) return NextResponse.json({ ok: false }, { status: 400 });
    const { data, error } = await db.from("notes").insert({ user_id: user.id, text }).select("id, text, pinned, created_at").single();
    if (error) return NextResponse.json({ ok: false, error: "no_table" }, { status: 200 });
    return NextResponse.json({ ok: true, note: data });
  }
  if (body?.action === "pin") {
    const { error } = await db.from("notes").update({ pinned: !!body?.pinned, updated_at: new Date().toISOString() }).eq("id", String(body?.id || "")).eq("user_id", user.id);
    return NextResponse.json({ ok: !error });
  }
  if (body?.action === "edit") {
    const text = String(body?.text || "").trim().slice(0, 2000);
    if (!text) return NextResponse.json({ ok: false }, { status: 400 });
    const { error } = await db.from("notes").update({ text, updated_at: new Date().toISOString() }).eq("id", String(body?.id || "")).eq("user_id", user.id);
    return NextResponse.json({ ok: !error });
  }
  if (body?.action === "del") {
    const { error } = await db.from("notes").delete().eq("id", String(body?.id || "")).eq("user_id", user.id);
    return NextResponse.json({ ok: !error });
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
