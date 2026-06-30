import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { embedBatch } from "@/lib/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Backfill embeddings for diary entries (owner by default; ?all=1 for everyone).
// Gated by the webhook secret. Call repeatedly until remaining = 0.
export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const all = req.nextUrl.searchParams.get("all") === "1";
  const batch = Math.min(Number(req.nextUrl.searchParams.get("batch")) || 200, 400);
  const chat = req.nextUrl.searchParams.get("chat") || process.env.TELEGRAM_ALLOWED_CHAT_ID;
  const db = supabaseAdmin();

  let userId = "";
  if (!all) {
    const { data: u } = await db.from("users").select("id").eq("chat_id", Number(chat)).maybeSingle();
    if (!u) return NextResponse.json({ ok: false, error: "no_user" }, { status: 404 });
    userId = (u as any).id;
  }

  let sel = db.from("entries").select("id, raw_text, summary").is("embedding", null).limit(batch);
  if (!all) sel = sel.eq("user_id", userId);
  const { data: rows, error } = await sel;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!rows || !rows.length) return NextResponse.json({ ok: true, done: true, embedded: 0, remaining: 0 });

  const texts = rows.map((r: any) => `${r.summary ? r.summary + ". " : ""}${r.raw_text || ""}`);
  const vecs = await embedBatch(texts);

  let embedded = 0;
  for (let i = 0; i < rows.length; i++) {
    const v = vecs[i];
    if (!v) continue;
    const { error: ue } = await db.from("entries").update({ embedding: v }).eq("id", (rows as any)[i].id);
    if (!ue) embedded++;
  }

  // Count remaining still-null.
  let cnt = db.from("entries").select("*", { count: "exact", head: true }).is("embedding", null);
  if (!all) cnt = cnt.eq("user_id", userId);
  const { count } = await cnt;

  return NextResponse.json({ ok: true, done: (count || 0) === 0, embedded, remaining: count || 0 });
}
