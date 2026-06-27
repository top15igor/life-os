import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseMoneyOk } from "@/lib/moneyok";

export const runtime = "nodejs";
export const maxDuration = 60;

// Импорт всех операций из CSV-экспорта MoneyOK («MoneyOK.csv») в finance_tx.
// Повторный импорт того же файла безопасен: точные дубли пропускаются.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // Принимаем как файл (multipart), так и сырой текст CSV в теле.
  let text = "";
  const ctype = req.headers.get("content-type") || "";
  if (ctype.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ ok: false, error: "too_big" }, { status: 400 });
    text = await file.text();
  } else {
    text = await req.text();
  }
  if (!text.trim()) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

  const { rows, total, skipped } = parseMoneyOk(text);
  if (!rows.length) return NextResponse.json({ ok: false, error: "no_rows", total, skipped }, { status: 400 });

  const db = supabaseAdmin();

  // Ключ операции для защиты от дублей (идемпотентный повторный импорт).
  const keyOf = (t: { day: string; kind: string; amount: number; currency: string; category: string | null; note: string | null }) =>
    `${t.day}|${t.kind}|${t.amount}|${t.currency}|${t.category || ""}|${t.note || ""}`;

  // Существующие операции пользователя — чтобы не задваивать при повторе.
  const existing = new Set<string>();
  try {
    const { data } = await db
      .from("finance_tx")
      .select("day, kind, amount, currency, category, note")
      .eq("user_id", user.id)
      .limit(20000);
    for (const t of data || []) existing.add(keyOf({ ...t, amount: Number(t.amount) } as any));
  } catch {
    // таблицы может не быть — тогда дублей по определению нет
  }

  const seen = new Set<string>();
  const toInsert = rows
    .filter((t) => {
      const k = keyOf(t);
      if (existing.has(k) || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((t) => ({ user_id: user.id, day: t.day, kind: t.kind, amount: t.amount, currency: t.currency, category: t.category, note: t.note }));

  const duplicates = rows.length - toInsert.length;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 500) {
    const chunk = toInsert.slice(i, i + 500);
    const { error } = await db.from("finance_tx").insert(chunk);
    if (error) return NextResponse.json({ ok: false, error: error.message, inserted }, { status: 500 });
    inserted += chunk.length;
  }

  return NextResponse.json({ ok: true, inserted, duplicates, skipped, total });
}
