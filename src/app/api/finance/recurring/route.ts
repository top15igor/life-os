import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const CURRENCIES = ["USD", "EUR", "UAH", "RUB", "GBP", "PLN", "KZT", "GEL", "TRY", "AED"];

// Список регулярных платежей пользователя.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const { data } = await supabaseAdmin()
      .from("finance_recurring")
      .select("id, kind, amount, currency, category, subcategory, note, day_of_month, active")
      .eq("user_id", user.id)
      .order("day_of_month", { ascending: true });
    return NextResponse.json({ ok: true, items: (data || []).map((r: any) => ({ ...r, amount: Number(r.amount) })) });
  } catch {
    return NextResponse.json({ ok: true, items: [] }); // таблицы ещё нет
  }
}

// Добавить регулярный платёж.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  const amount = Number(b?.amount);
  const day = Math.round(Number(b?.day_of_month));
  if (!isFinite(amount) || amount <= 0 || amount > 1e12 || !(day >= 1 && day <= 31)) {
    return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  }
  const row = {
    user_id: user.id,
    kind: b?.kind === "income" ? "income" : "expense",
    amount,
    currency: CURRENCIES.includes(String(b?.currency)) ? String(b.currency) : "EUR",
    category: b?.category ? String(b.category).slice(0, 40) : null,
    subcategory: b?.subcategory ? String(b.subcategory).slice(0, 40) : null,
    note: b?.note ? String(b.note).slice(0, 200) : null,
    day_of_month: day,
  };
  const { error } = await supabaseAdmin().from("finance_recurring").insert(row);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Изменить (активность/поля) регулярного платежа.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = String(b?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const upd: any = {};
  if (b?.active != null) upd.active = !!b.active;
  if (b?.amount != null) { const a = Number(b.amount); if (a > 0 && a < 1e12) upd.amount = a; }
  if (b?.day_of_month != null) { const d = Math.round(Number(b.day_of_month)); if (d >= 1 && d <= 31) upd.day_of_month = d; }
  if (b?.kind != null) upd.kind = b.kind === "income" ? "income" : "expense";
  if (b?.currency != null) upd.currency = CURRENCIES.includes(String(b.currency)) ? String(b.currency) : "EUR";
  if (b?.category !== undefined) upd.category = b.category ? String(b.category).slice(0, 40) : null;
  if (b?.subcategory !== undefined) upd.subcategory = b.subcategory ? String(b.subcategory).slice(0, 40) : null;
  if (b?.note !== undefined) upd.note = b.note ? String(b.note).slice(0, 200) : null;
  if (!Object.keys(upd).length) return NextResponse.json({ ok: false, error: "nothing" }, { status: 400 });
  const { error } = await supabaseAdmin().from("finance_recurring").update(upd).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Удалить регулярный платёж.
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = String(b?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  await supabaseAdmin().from("finance_recurring").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
