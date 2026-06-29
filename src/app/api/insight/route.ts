import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { autosortInsights, isInsightCategory } from "@/lib/insights";

export const runtime = "nodejs";
export const maxDuration = 60; // авто-сортировка делает один AI-проход

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const db = supabaseAdmin();

  if (action === "edit") {
    const id = String(body?.id || "");
    const text = String(body?.text || "").trim();
    if (!id || !text) return NextResponse.json({ ok: false }, { status: 400 });
    const { error } = await db.from("insights").update({ text }).eq("id", id).eq("user_id", user.id);
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    await db.from("insights").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "category") {
    const id = String(body?.id || "");
    const category = body?.category;
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    // null/"" сбрасывает категорию; иначе должен быть валидный ключ.
    const value = category && isInsightCategory(category) ? category : null;
    const { error } = await db.from("insights").update({ category: value }).eq("id", id).eq("user_id", user.id);
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "autosort") {
    const res = await autosortInsights(user.id);
    return NextResponse.json({ ok: true, ...res });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
