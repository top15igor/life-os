import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { probePrivat } from "@/lib/privatbank";
import { ensureBankAccount } from "@/lib/monoAccount";

export const runtime = "nodejs";

// Подключения ПриватБанка (бизнес/ФОП, API «Автоклиент»). Несколько на пользователя.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const { data, error } = await supabaseAdmin().from("bank_privat").select("id, name").eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true, connections: (data || []).map((r: any) => ({ id: r.id, name: r.name || null })) });
  } catch {
    // Таблицы ещё нет (SQL не применён) — фича не показывается.
    return NextResponse.json({ ok: false, needsSql: true, connections: [] });
  }
}

// Подключить: проверяем пару id+token коротким запросом выписки, сохраняем.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const clientId = String(body?.clientId || "").trim();
  const token = String(body?.token || "").trim();
  const name = String(body?.name || "").trim().slice(0, 60) || null;
  if (!clientId || token.length < 10) return NextResponse.json({ ok: false, error: "bad_token" }, { status: 400 });

  const probe = await probePrivat(clientId, token);
  if (!probe.ok) {
    const error = probe.status === 401 || probe.status === 403 ? "invalid_token" : probe.status === 429 ? "rate_limited" : "privat_error";
    return NextResponse.json({ ok: false, error, status: probe.status }, { status: 400 });
  }

  const db = supabaseAdmin();
  try {
    // Тот же client_id обновляем, новый — отдельной строкой.
    const { data: mine, error: selErr } = await db.from("bank_privat").select("id, client_id").eq("user_id", user.id);
    if (selErr) throw selErr;
    const same = (mine || []).find((m: any) => m.client_id === clientId);
    let rowId: string | null = null;
    if (same) {
      const { error } = await db.from("bank_privat").update({ token, ...(name ? { name } : {}) }).eq("id", (same as any).id);
      if (error) throw error;
      rowId = (same as any).id;
    } else {
      const { data: created, error } = await db.from("bank_privat")
        .insert({ user_id: user.id, client_id: clientId, token, name: name || "Приват ФОП" })
        .select("id").single();
      if (error) throw error;
      rowId = (created as any)?.id || null;
    }
    if (rowId) ensureBankAccount(user.id, { id: rowId, name: name || "Приват ФОП" }, { table: "bank_privat", emoji: "🏛️", fallbackName: "Приват ФОП" }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e), needsSql: /bank_privat|schema cache/i.test(String(e?.message)) }, { status: 500 });
  }
}

// Отключить одно подключение.
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const id = String(req.nextUrl.searchParams.get("id") || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    await supabaseAdmin().from("bank_privat").delete().eq("id", id).eq("user_id", user.id);
  } catch { /* ignore */ }
  return NextResponse.json({ ok: true });
}
