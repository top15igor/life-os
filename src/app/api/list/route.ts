import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Списки (чек-листы): те же данные, что у бота («добавь молоко в список покупок»).
// Веб-блок живёт на странице /notes под заметками.

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { data, error } = await supabaseAdmin()
    .from("list_items")
    .select("id, list, text, done, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) return NextResponse.json({ ok: false, error: "no_table" }, { status: 200 });
  return NextResponse.json({ ok: true, items: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const db = supabaseAdmin();

  if (body?.action === "add") {
    const text = String(body?.text || "").trim().slice(0, 200);
    const list = String(body?.list || "shopping").trim().toLowerCase().slice(0, 60) || "shopping";
    if (!text) return NextResponse.json({ ok: false }, { status: 400 });
    const { data, error } = await db.from("list_items").insert({ user_id: user.id, list, text }).select("id, list, text, done, created_at").single();
    if (error) return NextResponse.json({ ok: false, error: "no_table" }, { status: 200 });
    return NextResponse.json({ ok: true, item: data });
  }
  if (body?.action === "toggle") {
    const { error } = await db.from("list_items").update({ done: !!body?.done }).eq("id", String(body?.id || "")).eq("user_id", user.id);
    return NextResponse.json({ ok: !error });
  }
  if (body?.action === "del") {
    const { error } = await db.from("list_items").delete().eq("id", String(body?.id || "")).eq("user_id", user.id);
    return NextResponse.json({ ok: !error });
  }
  if (body?.action === "clearDone") {
    const list = String(body?.list || "shopping");
    const { error } = await db.from("list_items").delete().eq("user_id", user.id).eq("list", list).eq("done", true);
    return NextResponse.json({ ok: !error });
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
