import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const SPHERES = ["home", "transport", "body", "travel", "family", "business", "money", "growth", "other"];
const STATUSES = ["dream", "progress", "done"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const db = supabaseAdmin();

  if (action === "add") {
    const text = String(body?.text || "").trim().slice(0, 300);
    if (!text) return NextResponse.json({ ok: false }, { status: 400 });
    const sphere = SPHERES.includes(body?.sphere) ? body.sphere : "other";
    const emoji = body?.emoji ? String(body.emoji).slice(0, 8) : null;
    const { data, error } = await db.from("dreams").insert({ user_id: user.id, text, sphere, emoji, status: "dream" }).select("id, sphere, text, emoji, image_url, status, created_at").single();
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true, dream: data });
  }

  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  if (action === "status") {
    const status = STATUSES.includes(body?.status) ? body.status : "dream";
    const patch: any = { status };
    patch.done_at = status === "done" ? new Date().toISOString() : null;
    await db.from("dreams").update(patch).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    await db.from("dreams").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "makeGoal") {
    const { data: dr } = await db.from("dreams").select("text").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!dr) return NextResponse.json({ ok: false }, { status: 404 });
    try {
      await db.from("goals").insert({ user_id: user.id, title: dr.text, year: new Date().getFullYear(), progress: 0 });
      await db.from("dreams").update({ status: "progress" }).eq("id", id).eq("user_id", user.id);
    } catch {}
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
