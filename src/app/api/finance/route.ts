import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const CURRENCIES = ["USD", "EUR", "UAH", "RUB", "GBP", "PLN", "KZT", "GEL", "TRY", "AED"];

// Добавить операцию: доход или расход.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const day = String(body?.day || "").slice(0, 10);
  const kind = body?.kind === "income" ? "income" : "expense";
  const amount = Number(body?.amount);
  const currency = CURRENCIES.includes(String(body?.currency)) ? String(body.currency) : "USD";
  const category = body?.category ? String(body.category).slice(0, 40) : null;
  const subcategory = body?.subcategory ? String(body.subcategory).slice(0, 40) : null;
  const note = body?.note ? String(body.note).slice(0, 200) : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isFinite(amount) || amount <= 0 || amount > 1e12) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const db = supabaseAdmin();
  const row: any = { user_id: user.id, day, kind, amount, currency, category, subcategory, note };
  let { error } = await db.from("finance_tx").insert(row);
  // Старая база без колонки subcategory — вставляем без неё.
  if (error && /subcategory|column|schema cache/i.test(error.message)) {
    const { subcategory: _s, ...bare } = row;
    ({ error } = await db.from("finance_tx").insert(bare));
  }
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Изменить операцию по id (только свою): сумма, тип, валюта, дата, категория,
// подкатегория, заметка. Меняются только переданные поля.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  const upd: any = {};
  if (body?.day != null) {
    const day = String(body.day).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return NextResponse.json({ ok: false, error: "bad_day" }, { status: 400 });
    upd.day = day;
  }
  if (body?.kind != null) upd.kind = body.kind === "income" ? "income" : "expense";
  if (body?.amount != null) {
    const amount = Number(body.amount);
    if (!isFinite(amount) || amount <= 0 || amount > 1e12) return NextResponse.json({ ok: false, error: "bad_amount" }, { status: 400 });
    upd.amount = amount;
  }
  if (body?.currency != null) upd.currency = CURRENCIES.includes(String(body.currency)) ? String(body.currency) : "USD";
  if (body?.category !== undefined) upd.category = body.category ? String(body.category).slice(0, 40) : null;
  if (body?.subcategory !== undefined) upd.subcategory = body.subcategory ? String(body.subcategory).slice(0, 40) : null;
  if (body?.note !== undefined) upd.note = body.note ? String(body.note).slice(0, 200) : null;

  if (!Object.keys(upd).length) return NextResponse.json({ ok: false, error: "nothing" }, { status: 400 });

  const db = supabaseAdmin();
  let { error } = await db.from("finance_tx").update(upd).eq("id", id).eq("user_id", user.id);
  // Старая база без колонки subcategory — повторяем без неё.
  if (error && /subcategory|column|schema cache/i.test(error.message)) {
    const { subcategory, ...bare } = upd;
    if (Object.keys(bare).length) ({ error } = await db.from("finance_tx").update(bare).eq("id", id).eq("user_id", user.id));
    else error = null as any;
  }
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Удалить операцию по id (только свою).
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const db = supabaseAdmin();
  await db.from("finance_tx").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
