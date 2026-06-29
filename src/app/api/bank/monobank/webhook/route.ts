import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { mapStatementItem, currencyAlpha } from "@/lib/monobank";

export const runtime = "nodejs";

// Monobank проверяет вебхук GET-запросом — отвечаем 200.
export async function GET() {
  return NextResponse.json({ ok: true });
}

// Приём новой операции от Monobank → создаём запись в finance_tx.
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("s");
  if (!secret) return NextResponse.json({ ok: true }); // всегда 200, чтобы Monobank не отключал вебхук

  const db = supabaseAdmin();
  // По секрету из URL находим владельца и его счета.
  let userId: string | null = null;
  let accounts: any[] = [];
  try {
    const { data } = await db.from("bank_monobank").select("user_id, accounts").eq("hook_secret", secret).maybeSingle();
    userId = (data as any)?.user_id || null;
    accounts = Array.isArray((data as any)?.accounts) ? (data as any).accounts : [];
  } catch {
    try { const { data } = await db.from("bank_monobank").select("user_id").eq("hook_secret", secret).maybeSingle(); userId = (data as any)?.user_id || null; } catch { /* нет таблицы */ }
  }
  if (!userId) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  const item = body?.data?.statementItem;
  const accountId = body?.data?.account;
  // Валюта — по счёту операции (amount у Monobank в валюте счёта).
  const acc = accounts.find((a: any) => a?.id === accountId);
  const accCurrency = acc ? currencyAlpha(Number(acc.currencyCode)) : undefined;
  const mapped = item ? mapStatementItem(item, accCurrency) : null;
  if (!mapped) return NextResponse.json({ ok: true });

  try {
    // Дедуп по внешнему id операции.
    const { data: dup } = await db
      .from("finance_tx")
      .select("id")
      .eq("user_id", userId)
      .eq("ext_id", mapped.ext_id)
      .maybeSingle();
    if (!dup) {
      const row: any = {
        user_id: userId, day: mapped.day, kind: mapped.kind, amount: mapped.amount,
        currency: mapped.currency, category: mapped.category, note: mapped.note,
        source: "monobank", ext_id: mapped.ext_id,
      };
      let { error } = await db.from("finance_tx").insert(row);
      if (error && /ext_id|source|column|schema cache/i.test(error.message)) {
        const { ext_id, source, ...bare } = row; // старая база без колонок
        await db.from("finance_tx").insert(bare);
      }
    }
  } catch { /* не критично — Monobank повторит */ }

  return NextResponse.json({ ok: true });
}
