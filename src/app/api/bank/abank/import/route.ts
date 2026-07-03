import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTransactions, mapAbankTx, type AbankPsu } from "@/lib/abank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isoDay(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
}

// Импорт операций А-Банка за ~30 дней в «Деньги» (дедуп по ext_id).
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = supabaseAdmin();

  let row: any = null;
  try { const { data } = await db.from("bank_abank").select("*").eq("user_id", user.id).maybeSingle(); row = data; } catch {}
  if (!row?.connected || !row.consent_id || !row.resource_id) {
    return NextResponse.json({ ok: false, error: "not_connected" }, { status: 400 });
  }

  const psu: AbankPsu = { iban: row.iban, corporate: !!row.corporate };
  const { booked } = await getTransactions(psu, row.consent_id, row.resource_id, isoDay(-30), isoDay(0));

  // Уже сохранённые ext_id — анти-дубль.
  const existing = new Set<string>();
  try {
    const { data } = await db.from("finance_tx").select("ext_id").eq("user_id", user.id).eq("source", "abank").limit(20000);
    for (const t of data || []) if ((t as any).ext_id) existing.add((t as any).ext_id);
  } catch {}

  const toInsert: any[] = [];
  for (const t of booked) {
    const m = mapAbankTx(t);
    if (!m || existing.has(m.ext_id)) continue;
    existing.add(m.ext_id);
    toInsert.push({ user_id: user.id, day: m.day, kind: m.kind, amount: m.amount, currency: m.currency, category: m.category, note: m.note, source: "abank", ext_id: m.ext_id, scope: m.scope });
  }

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 500) {
    const chunk = toInsert.slice(i, i + 500);
    let { error } = await db.from("finance_tx").insert(chunk);
    if (error && /ext_id|source|scope|column|schema cache/i.test(error.message)) {
      const bare = chunk.map(({ ext_id, source, scope, ...rest }) => rest);
      ({ error } = await db.from("finance_tx").insert(bare));
    }
    if (error) return NextResponse.json({ ok: false, error: error.message, inserted }, { status: 500 });
    inserted += chunk.length;
  }
  return NextResponse.json({ ok: true, inserted });
}
