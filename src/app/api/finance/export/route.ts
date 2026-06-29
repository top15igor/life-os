import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Экранирование значения для CSV (кавычки + запятые/переводы строк).
function csv(v: any): string {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Экспорт всех финансовых операций пользователя в CSV.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = supabaseAdmin();

  // Постранично — чтобы выгрузить все операции (PostgREST отдаёт ~1000 за раз).
  const rows: any[] = [];
  const cols = "day, kind, amount, currency, category, subcategory, note";
  for (let from = 0; from < 200000; from += 1000) {
    let { data, error } = await db
      .from("finance_tx")
      .select(cols)
      .eq("user_id", user.id)
      .order("day", { ascending: false })
      .range(from, from + 999);
    if (error && /subcategory|column|schema cache/i.test(error.message)) {
      ({ data, error } = (await db
        .from("finance_tx")
        .select("day, kind, amount, currency, category, note")
        .eq("user_id", user.id)
        .order("day", { ascending: false })
        .range(from, from + 999)) as any);
    }
    if (error || !data || !data.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }

  const header = ["Дата", "Тип", "Сумма", "Валюта", "Категория", "Подкатегория", "Комментарий"];
  const lines = [header.join(",")];
  for (const r of rows as any[]) {
    lines.push([
      csv(r.day),
      csv(r.kind === "income" ? "Доход" : "Расход"),
      csv(r.amount),
      csv(r.currency),
      csv(r.category),
      csv(r.subcategory ?? ""),
      csv(r.note),
    ].join(","));
  }
  // BOM, чтобы Excel корректно открыл кириллицу в UTF-8.
  const body = "﻿" + lines.join("\r\n");
  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="life-os-finance.csv"`,
    },
  });
}
