import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Массовый перенос операций между категориями: «всё, что лежит в Другое,
// перенеси в Транспорт». Просьба Игоря с живого экрана: в «Другое» скопилось
// 56% расходов, и разносить их по одной операции — наказание.
//
// scope: "month" — только выбранный месяц; "all" — за всё время.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const from = String(body?.from || "").trim().slice(0, 40);
  const to = String(body?.to || "").trim().slice(0, 40);
  const kind = body?.kind === "income" ? "income" : "expense";
  const scope = body?.scope === "all" ? "all" : "month";
  const month = String(body?.month || "").slice(0, 7);
  if (!from || !to || from === to) return NextResponse.json({ ok: false, error: "bad_args" }, { status: 400 });
  if (scope === "month" && !/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ ok: false, error: "bad_month" }, { status: 400 });

  const db = supabaseAdmin();
  let q = db.from("finance_tx").update({ category: to })
    .eq("user_id", user.id).eq("kind", kind).eq("category", from);
  if (scope === "month") q = q.gte("day", `${month}-01`).lte("day", `${month}-31`);
  const { data, error } = await q.select("id");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, moved: (data || []).length });
}
