import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { computeResult } from "@/lib/lab";
import { isPremium } from "@/lib/plan";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // Лаборатория — премиальная фича.
  if (!(await isPremium(user.id))) return NextResponse.json({ ok: false, error: "premium" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const db = supabaseAdmin();

  if (action === "create") {
    const title = String(body?.title || "").trim();
    if (!title) return NextResponse.json({ ok: false }, { status: 400 });
    const hypothesis = body?.hypothesis ? String(body.hypothesis).slice(0, 500) : null;
    const duration = Math.max(1, Math.min(365, Math.round(Number(body?.duration) || 21)));
    const { data, error } = await db
      .from("experiments")
      .insert({ user_id: user.id, title: title.slice(0, 200), hypothesis, duration_days: duration, start_date: new Date().toISOString().slice(0, 10), status: "active" })
      .select("id, title, hypothesis, duration_days, start_date, status, result, created_at")
      .single();
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true, experiment: data });
  }

  if (action === "finish") {
    const id = String(body?.id || "");
    const { data: exp } = await db.from("experiments").select("id, start_date").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!exp) return NextResponse.json({ ok: false }, { status: 404 });
    const result = await computeResult(user.id, exp.start_date);
    await db.from("experiments").update({ status: "done", result }).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true, result });
  }

  if (action === "delete") {
    await db.from("experiments").delete().eq("id", String(body?.id || "")).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
