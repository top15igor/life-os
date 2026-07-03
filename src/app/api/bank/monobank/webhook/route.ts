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
  // По секрету из URL находим владельца, его счета и токен.
  let userId: string | null = null;
  let accounts: any[] = [];
  let token: string | null = null;
  try {
    const { data } = await db.from("bank_monobank").select("user_id, accounts, token").eq("hook_secret", secret).maybeSingle();
    userId = (data as any)?.user_id || null;
    accounts = Array.isArray((data as any)?.accounts) ? (data as any).accounts : [];
    token = (data as any)?.token || null;
  } catch {
    try { const { data } = await db.from("bank_monobank").select("user_id").eq("hook_secret", secret).maybeSingle(); userId = (data as any)?.user_id || null; } catch { /* нет таблицы */ }
  }
  if (!userId) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  const item = body?.data?.statementItem;
  const accountId = body?.data?.account;
  // accCurrency — валюта СЧЁТА, нужна лишь как fallback: сумму пишем в валюте ОПЕРАЦИИ
  // (item.operationAmount + item.currencyCode), см. mapStatementItem.
  let acc = accounts.find((a: any) => a?.id === accountId);
  // Счёт не найден (старое подключение без списка счетов) → дотягиваем из client-info и сохраняем.
  if (!acc && token) {
    try {
      const r = await fetch("https://api.monobank.ua/personal/client-info", { headers: { "X-Token": token }, cache: "no-store" });
      if (r.ok) {
        const info = await r.json();
        const fresh = (info?.accounts || []).filter((a: any) => a?.id).map((a: any) => ({ id: a.id, currencyCode: a.currencyCode, type: a.type }));
        if (fresh.length) {
          accounts = fresh;
          acc = fresh.find((a: any) => a.id === accountId);
          await db.from("bank_monobank").update({ accounts: fresh }).eq("hook_secret", secret);
        }
      }
    } catch { /* лимит/сеть — упадём на дефолт UAH */ }
  }
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
        source: "monobank", ext_id: mapped.ext_id, scope: mapped.scope,
      };
      let { error } = await db.from("finance_tx").insert(row);
      if (error && /ext_id|source|scope|column|schema cache/i.test(error.message)) {
        const { ext_id, source, scope, ...bare } = row; // старая база без колонок
        await db.from("finance_tx").insert(bare);
      }
    }
  } catch { /* не критично — Monobank повторит */ }

  return NextResponse.json({ ok: true });
}
