import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const CURRENCIES = ["USD", "EUR", "UAH", "RUB", "GBP", "PLN", "KZT", "GEL", "TRY", "AED"];
const clampMoney = (n: any) => { const v = Number(n); return isFinite(v) && v >= 0 && v < 1e12 ? Math.round(v * 100) / 100 : null; };

// Список целей пользователя.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const { data } = await supabaseAdmin()
      .from("finance_goals")
      .select("id, title, target_amount, current_amount, currency, deadline, achieved")
      .eq("user_id", user.id)
      .order("achieved", { ascending: true })
      .order("created_at", { ascending: false });
    return NextResponse.json({ ok: true, items: (data || []).map((g: any) => ({ ...g, target_amount: Number(g.target_amount), current_amount: Number(g.current_amount) })) });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}

// Создать цель.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  const title = String(b?.title || "").trim().slice(0, 80);
  const target = clampMoney(b?.target_amount);
  if (!title || !target || target <= 0) return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(String(b?.deadline || "")) ? String(b.deadline) : null;
  const current = clampMoney(b?.current_amount) ?? 0;
  const row = {
    user_id: user.id, title, target_amount: target, current_amount: current,
    currency: CURRENCIES.includes(String(b?.currency)) ? String(b.currency) : "EUR",
    deadline, achieved: current >= target,
  };
  const { error } = await supabaseAdmin().from("finance_goals").insert(row);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Изменить цель: пополнить (add), задать сумму/цель/срок/название/готовность.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = String(b?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const db = supabaseAdmin();

  // Текущее состояние (нужно для пополнения и пересчёта achieved).
  const { data: cur } = await db.from("finance_goals").select("current_amount, target_amount").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!cur) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const upd: any = {};
  let current = Number((cur as any).current_amount);
  let target = Number((cur as any).target_amount);
  if (b?.add != null) { const a = clampMoney(b.add); if (a != null) current = Math.max(0, Math.round((current + a) * 100) / 100); upd.current_amount = current; }
  if (b?.current_amount != null) { const c = clampMoney(b.current_amount); if (c != null) { current = c; upd.current_amount = c; } }
  if (b?.target_amount != null) { const t = clampMoney(b.target_amount); if (t && t > 0) { target = t; upd.target_amount = t; } }
  if (b?.title != null) { const t = String(b.title).trim().slice(0, 80); if (t) upd.title = t; }
  if (b?.deadline !== undefined) upd.deadline = /^\d{4}-\d{2}-\d{2}$/.test(String(b?.deadline || "")) ? String(b.deadline) : null;
  if (b?.achieved != null) upd.achieved = !!b.achieved;
  else if (upd.current_amount != null || upd.target_amount != null) upd.achieved = current >= target;

  if (!Object.keys(upd).length) return NextResponse.json({ ok: false, error: "nothing" }, { status: 400 });
  const { error } = await db.from("finance_goals").update(upd).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Удалить цель.
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = String(b?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  await supabaseAdmin().from("finance_goals").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
