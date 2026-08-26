import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsdPerUnit } from "@/lib/fx";

export const runtime = "nodejs";

// Счета (карты, кошельки, наличные) раздела «Деньги».
//
// Баланс счёта = стартовый остаток («сколько на карте сейчас», задаёт человек)
// + все привязанные операции С ДАТЫ задания остатка. Так не нужно вносить всю
// историю с нуля: сказал «на белой карте 12 000 ₴» — и дальше баланс живёт сам.
// Валюты операций приводятся к валюте счёта по месячному курсу НБУ.

type Acc = {
  id: string; name: string; emoji: string | null; currency: string;
  opening_balance: number; opening_date: string; archived: boolean;
};

const monthOf = (day: string) => String(day || "").slice(0, 7);

async function listWithBalances(userId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("finance_accounts")
    .select("id, name, emoji, currency, opening_balance, opening_date, archived")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const accounts = (data || []) as Acc[];
  if (!accounts.length) return [];

  // Привязанные операции — страницами: supabase режет 1000 строк на запрос.
  const legs: any[] = [];
  for (let from = 0; from < 100000; from += 1000) {
    const { data: page, error: e2 } = await db
      .from("finance_tx")
      .select("day, kind, amount, currency, scope, account_id, account2_id")
      .eq("user_id", userId)
      .or("account_id.not.is.null,account2_id.not.is.null")
      .range(from, from + 999);
    if (e2) break;
    legs.push(...(page || []));
    if ((page || []).length < 1000) break;
  }

  // Курсы: месяц каждой операции × (валюты операций + валюты счетов).
  const months = [...new Set(legs.map((l) => monthOf(l.day)))];
  const curs = [...new Set([...legs.map((l) => String(l.currency || "UAH")), ...accounts.map((a) => a.currency)])];
  const fx = months.length ? await getUsdPerUnit(db, months, curs) : new Map<string, number>();
  const conv = (amount: number, cur: string, toCur: string, month: string): number => {
    if (cur === toCur) return amount;
    const a = fx.get(`${month}|${cur}`);
    const b = fx.get(`${month}|${toCur}`);
    if (!a || !b) return amount; // курса нет — считаем 1:1, лучше приблизительно, чем никак
    return (amount * a) / b;
  };

  return accounts.map((acc) => {
    let bal = Number(acc.opening_balance) || 0;
    for (const l of legs) {
      if (String(l.day) < String(acc.opening_date)) continue;
      const amt = Number(l.amount) || 0;
      const m = monthOf(l.day);
      const v = conv(amt, String(l.currency || "UAH"), acc.currency, m);
      if (l.scope === "transfer" && l.account2_id) {
        // Перевод одной строкой: минус с источника, плюс на назначение.
        if (l.account_id === acc.id) bal -= v;
        if (l.account2_id === acc.id) bal += v;
      } else if (l.account_id === acc.id) {
        bal += l.kind === "income" ? v : -v;
      }
    }
    return { ...acc, opening_balance: Number(acc.opening_balance) || 0, balance: Math.round(bal * 100) / 100 };
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const accounts = await listWithBalances(user.id);
    return NextResponse.json({ ok: true, accounts });
  } catch (e: any) {
    // Таблицы ещё нет (SQL не применён) — фича просто не показывается.
    return NextResponse.json({ ok: false, error: String(e?.message || e), needsSql: true });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim().slice(0, 60);
  if (!name) return NextResponse.json({ ok: false }, { status: 400 });
  const emoji = body?.emoji ? String(body.emoji).slice(0, 8) : null;
  const currency = String(body?.currency || "UAH").slice(0, 3).toUpperCase();
  const opening = Number(body?.opening_balance);
  const row = {
    user_id: user.id, name, emoji, currency,
    opening_balance: isFinite(opening) ? opening : 0,
    opening_date: /^\d{4}-\d{2}-\d{2}$/.test(String(body?.opening_date || "")) ? body.opening_date : new Date().toISOString().slice(0, 10),
  };
  const { data, error } = await supabaseAdmin().from("finance_accounts").insert(row).select("*").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, account: { ...data, balance: (data as any).opening_balance } });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const upd: any = {};
  if (body?.name !== undefined) { const n = String(body.name).trim().slice(0, 60); if (n) upd.name = n; }
  if (body?.emoji !== undefined) upd.emoji = body.emoji ? String(body.emoji).slice(0, 8) : null;
  if (body?.currency !== undefined) upd.currency = String(body.currency).slice(0, 3).toUpperCase();
  // Задание нового остатка «на сейчас»: вместе с суммой сдвигается и дата отсчёта.
  if (body?.opening_balance !== undefined) {
    const v = Number(body.opening_balance);
    if (isFinite(v)) { upd.opening_balance = v; upd.opening_date = new Date().toISOString().slice(0, 10); }
  }
  if (body?.archived !== undefined) upd.archived = body.archived === true;
  if (!Object.keys(upd).length) return NextResponse.json({ ok: false }, { status: 400 });
  const { error } = await supabaseAdmin().from("finance_accounts").update(upd).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const id = String(req.nextUrl.searchParams.get("id") || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const db = supabaseAdmin();
  // Отвязываем операции, потом удаляем счёт: операции остаются целыми.
  await db.from("finance_tx").update({ account_id: null }).eq("user_id", user.id).eq("account_id", id);
  await db.from("finance_tx").update({ account2_id: null }).eq("user_id", user.id).eq("account2_id", id);
  const { error } = await db.from("finance_accounts").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
