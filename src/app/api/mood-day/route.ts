import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Manually set (or clear) the mood for a given day. Overrides the AI-extracted value.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const day = String(body.day || "");
  const mood = Number(body.mood);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(mood) || mood < 1 || mood > 10) {
    return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from("day_moods")
    .upsert({ user_id: user.id, day, mood: Math.round(mood), source: "manual", updated_at: new Date().toISOString() }, { onConflict: "user_id,day" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
  const day = req.nextUrl.searchParams.get("day") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  const db = supabaseAdmin();
  const { error } = await db.from("day_moods").delete().eq("user_id", user.id).eq("day", day);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
