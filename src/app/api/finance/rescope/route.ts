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
  // Supabase отдаёт максимум 1000 строк за запрос — читаем историю страницами,
  // иначе чистка молча проверяет только первую тысячу и рапортует «готово».
  const all: any[] = [];
  for (let fromRow = 0; ; fromRow += 1000) {
    const { data, error } = await db.from("finance_tx")
      .select("id, note, category, scope")
      .eq("user_id", user.id)
      .order("id", { ascending: true })
      .range(fromRow, fromRow + 999);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    all.push(...((data as any[]) || []));
    if (!data || data.length < 1000) break;
  }

  let toTransfer = 0, toBusiness = 0;
  const updates: { id: string; scope: string }[] = [];
  for (const r of all) {
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
  return NextResponse.json({ ok: true, checked: all.length, toTransfer, toBusiness });
}
