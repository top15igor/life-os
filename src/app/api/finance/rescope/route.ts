import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { classifyScope } from "@/lib/financeScope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Разовая чистка задним числом: прогнать классификатор личное/бизнес/перевод
// по операциям, которые до сих пор числятся «личными». Меняем только вверх —
// personal → transfer/business по консервативным приметам; руками выставленное
// (business/transfer) не трогаем, обратно в personal ничего не переводим.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = supabaseAdmin();
  const { data, error } = await db.from("finance_tx")
    .select("id, note, category, scope")
    .eq("user_id", user.id)
    .limit(20000);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  let toTransfer = 0, toBusiness = 0;
  const updates: { id: string; scope: string }[] = [];
  for (const r of (data as any[]) || []) {
    const cur = r.scope || "personal";
    if (cur !== "personal") continue;
    const want = classifyScope({ note: r.note, category: r.category });
    if (want !== "personal") {
      updates.push({ id: r.id, scope: want });
      if (want === "transfer") toTransfer++; else toBusiness++;
    }
  }
  for (const u of updates) {
    await db.from("finance_tx").update({ scope: u.scope }).eq("id", u.id).eq("user_id", user.id);
  }
  return NextResponse.json({ ok: true, checked: (data || []).length, toTransfer, toBusiness });
}
