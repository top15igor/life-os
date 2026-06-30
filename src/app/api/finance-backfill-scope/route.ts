import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { classifyScope, type Scope } from "@/lib/financeScope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Owner-only: classify existing finance_tx into personal/business/transfer.
// Gated by the webhook secret. Run once after finance_scope.sql.
export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const chat = req.nextUrl.searchParams.get("chat") || process.env.TELEGRAM_ALLOWED_CHAT_ID;
  const onlyEmpty = req.nextUrl.searchParams.get("all") !== "1"; // by default only fill null scope
  const db = supabaseAdmin();

  const { data: u } = await db.from("users").select("id").eq("chat_id", Number(chat)).maybeSingle();
  if (!u) return NextResponse.json({ ok: false, error: "no_user" }, { status: 404 });
  const userId = (u as any).id;

  // Load all rows (id, note, category, scope) page by page.
  const rows: any[] = [];
  for (let from = 0; from < 200000; from += 1000) {
    const { data, error } = await db
      .from("finance_tx")
      .select("id, note, category, scope")
      .eq("user_id", userId)
      .range(from, from + 999);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!data || !data.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }

  // Group ids by target scope (only where it changes).
  const buckets: Record<Scope, string[]> = { personal: [], business: [], transfer: [] };
  for (const r of rows) {
    if (onlyEmpty && r.scope) continue;
    const target = classifyScope({ note: r.note, category: r.category });
    if (r.scope !== target) buckets[target].push(r.id);
  }

  const updated: Record<string, number> = {};
  for (const scope of ["personal", "business", "transfer"] as Scope[]) {
    const ids = buckets[scope];
    updated[scope] = 0;
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const { error } = await db.from("finance_tx").update({ scope }).in("id", chunk);
      if (error) return NextResponse.json({ ok: false, error: error.message, updated }, { status: 500 });
      updated[scope] += chunk.length;
    }
  }

  return NextResponse.json({ ok: true, total: rows.length, updated });
}
