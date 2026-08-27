import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { xlsxRows, csvRows, parsePrivatStatement, decodeStatementText } from "@/lib/privatStatement";

export const runtime = "nodejs";
export const maxDuration = 60;

// Импорт выписки ПриватБанка по ЛИЧНОЙ карте (.xlsx или .csv из Приват24).
// Повторная загрузка того же файла дублей не создаёт (дедуп по содержимому).
// form-data: file (+ accountId — счёт из «Счетов», куда привязать операции).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ ok: false, error: "too_big" }, { status: 400 });
  const accountIdRaw = String(form?.get("accountId") || "");
  const accountId = /^[0-9a-f-]{36}$/i.test(accountIdRaw) ? accountIdRaw : null;

  const buf = Buffer.from(await file.arrayBuffer());
  const name = (file.name || "").toLowerCase();
  let grid: string[][] = [];
  try {
    if (name.endsWith(".xlsx") || buf.slice(0, 2).toString("latin1") === "PK") grid = await xlsxRows(buf);
    else grid = csvRows(decodeStatementText(buf));
  } catch {
    return NextResponse.json({ ok: false, error: "bad_file" }, { status: 400 });
  }
  const { rows, total, skipped } = parsePrivatStatement(grid);
  if (!rows.length) return NextResponse.json({ ok: false, error: "no_rows", total, skipped }, { status: 400 });

  const db = supabaseAdmin();
  const existing = new Set<string>();
  try {
    const { data } = await db.from("finance_tx").select("ext_id").eq("user_id", user.id).eq("source", "privatcard").limit(20000);
    for (const t of data || []) if ((t as any).ext_id) existing.add((t as any).ext_id);
  } catch { /* нет колонок — дублей нет */ }

  const seen = new Set<string>();
  const toInsert = rows
    .filter((t) => { if (existing.has(t.ext_id) || seen.has(t.ext_id)) return false; seen.add(t.ext_id); return true; })
    .map((t) => ({ user_id: user.id, day: t.day, kind: t.kind, amount: t.amount, currency: t.currency, category: t.category, note: t.note, source: "privatcard", ext_id: t.ext_id, scope: t.scope, ...(t.time ? { op_time: t.time } : {}), ...(accountId ? { account_id: accountId } : {}) }));

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 500) {
    let chunk: any[] = toInsert.slice(i, i + 500);
    let { error } = await db.from("finance_tx").insert(chunk);
    if (error && /ext_id|source|scope|account|op_time|column|schema cache/i.test(error.message)) {
      chunk = chunk.map(({ ext_id, source, scope, account_id, op_time, ...rest }: any) => rest);
      ({ error } = await db.from("finance_tx").insert(chunk));
    }
    if (error) return NextResponse.json({ ok: false, error: error.message, inserted }, { status: 500 });
    inserted += chunk.length;
  }

  return NextResponse.json({ ok: true, inserted, duplicates: rows.length - toInsert.length, skipped, total });
}

// Откат: удалить всё, что пришло из выписок личных карт Привата.
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { data, error } = await supabaseAdmin()
    .from("finance_tx")
    .delete()
    .eq("user_id", user.id)
    .eq("source", "privatcard")
    .select("id");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, removed: (data || []).length });
}
