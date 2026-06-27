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
  const note = body?.note ? String(body.note).slice(0, 200) : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isFinite(amount) || amount <= 0 || amount > 1e12) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db.from("finance_tx").insert({ user_id: user.id, day, kind, amount, currency, category, note });
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
