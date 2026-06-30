import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Owner-only finance diagnostics (gated by the webhook secret). Returns raw
// per-currency / per-category breakdown + top transactions for a month, so we
// can spot a miscategorized or wrong-currency transaction. No diary content.
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const month = req.nextUrl.searchParams.get("month") || "2026-06";
  const chat = req.nextUrl.searchParams.get("chat") || process.env.TELEGRAM_ALLOWED_CHAT_ID;
  const db = supabaseAdmin();

  const override = req.nextUrl.searchParams.get("user");
  let userId = override || "";
  if (!userId) {
    const { data: u } = await db.from("users").select("id").eq("chat_id", Number(chat)).maybeSingle();
    if (!u) return NextResponse.json({ ok: false, error: "no_user" }, { status: 404 });
    userId = (u as any).id;
  }

  // Where does finance data actually live? Count tx per user_id.
  let whereData: Record<string, number> = {};
  try {
    const { data: allu } = await db.from("finance_tx").select("user_id").limit(5000);
    for (const r of (allu as any[]) || []) whereData[r.user_id] = (whereData[r.user_id] || 0) + 1;
  } catch {}
  const { count: allTimeCount } = await db.from("finance_tx").select("*", { count: "exact", head: true }).eq("user_id", userId);

  let base = "EUR";
  try {
    const { data: st } = await db.from("finance_settings").select("base_currency").eq("user_id", userId).maybeSingle();
    if ((st as any)?.base_currency) base = (st as any).base_currency;
  } catch {}

  let q: any = await db
    .from("finance_tx")
    .select("day, kind, amount, currency, category, subcategory, note")
    .eq("user_id", userId)
    .like("day", `${month}%`)
    .order("amount", { ascending: false });
  if (q.error) q = await db.from("finance_tx").select("day, kind, amount, currency, category, note").eq("user_id", userId).like("day", `${month}%`);
  const txs = (q.data as any[]) || [];

  const byCur: Record<string, { inc: number; exp: number; n: number }> = {};
  const byCat: Record<string, number> = {};
  let inc = 0, exp = 0;
  for (const t of txs) {
    const a = Number(t.amount) || 0;
    const c = t.currency || "?";
    byCur[c] = byCur[c] || { inc: 0, exp: 0, n: 0 };
    byCur[c].n++;
    if (t.kind === "income") { inc += a; byCur[c].inc += a; }
    else { exp += a; byCur[c].exp += a; const k = t.category || "—"; byCat[k] = (byCat[k] || 0) + a; }
  }
  const top = txs
    .filter((t) => t.kind === "expense")
    .slice(0, 15)
    .map((t) => ({ day: t.day, amount: Number(t.amount), currency: t.currency, category: t.category, sub: t.subcategory || null, note: (t.note || "").slice(0, 40) }));

  return NextResponse.json({
    ok: true,
    month,
    base,
    resolvedUserId: userId,
    allTimeCount: allTimeCount || 0,
    txCountByUser: whereData,
    count: txs.length,
    rawExpenseSum: Math.round(exp),
    rawIncomeSum: Math.round(inc),
    byCurrency: byCur,
    byCategoryRaw: Object.fromEntries(Object.entries(byCat).sort((a, b) => b[1] - a[1])),
    topExpenses: top,
  });
}
