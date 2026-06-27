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
    .map((t) => ({ user_id: user.id, day: t.day, kind: t.kind, amount: t.amount, currency: t.currency, category: t.category, note: t.note, source: "moneyok" }));

  const duplicates = rows.length - toInsert.length;
  let inserted = 0;
  let tagged = true; // удалось ли пометить операции (есть ли колонка source)
  for (let i = 0; i < toInsert.length; i += 500) {
    let chunk = toInsert.slice(i, i + 500);
    let { error } = await db.from("finance_tx").insert(chunk);
    // Старая база без колонки source — вставляем без метки (откат будет недоступен).
    if (error && /source|column|schema cache/i.test(error.message)) {
      tagged = false;
      chunk = chunk.map(({ source, ...rest }) => rest) as any;
      ({ error } = await db.from("finance_tx").insert(chunk));
    }
    if (error) return NextResponse.json({ ok: false, error: error.message, inserted }, { status: 500 });
    inserted += chunk.length;
  }

  return NextResponse.json({ ok: true, inserted, duplicates, skipped, total, tagged });
}

// Откат: удалить все операции, помеченные как импорт из MoneyOK.
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("finance_tx")
    .delete()
    .eq("user_id", user.id)
    .eq("source", "moneyok")
    .select("id");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, removed: (data || []).length });
}
