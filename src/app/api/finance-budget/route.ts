import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Задать/изменить месячный лимит по категории расходов (сумма — в основной валюте).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const category = body?.category ? String(body.category).slice(0, 40) : "";
  const subcategory = body?.subcategory ? String(body.subcategory).slice(0, 40) : "";
  const amount = Number(body?.amount);
  if (!category || !isFinite(amount) || amount <= 0 || amount > 1e12) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const db = supabaseAdmin();
  let { error } = await db.from("finance_budget").upsert(
    { user_id: user.id, category, subcategory, amount, updated_at: new Date().toISOString() },
    { onConflict: "user_id,category,subcategory" }
  );
  // Старая база без колонки/ключа subcategory — лимит только на категорию.
  if (error && /subcategory|column|constraint|conflict|schema cache/i.test(error.message) && !subcategory) {
    ({ error } = await db.from("finance_budget").upsert({ user_id: user.id, category, amount, updated_at: new Date().toISOString() }, { onConflict: "user_id,category" }));
  }
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Убрать лимит по категории или подкатегории.
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const category = body?.category ? String(body.category).slice(0, 40) : "";
  const subcategory = body?.subcategory ? String(body.subcategory).slice(0, 40) : "";
  if (!category) return NextResponse.json({ ok: false }, { status: 400 });
  const db = supabaseAdmin();
  let q = db.from("finance_budget").delete().eq("user_id", user.id).eq("category", category);
  try { await q.eq("subcategory", subcategory); }
  catch { await db.from("finance_budget").delete().eq("user_id", user.id).eq("category", category); }
  return NextResponse.json({ ok: true });
}
