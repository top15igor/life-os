import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const MONO = "https://api.monobank.ua";

function originOf(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Статус подключений Monobank. Подключений может быть несколько (например,
// свой аккаунт и аккаунт близкого) — отдаём список; connected/clientName
// остаются для обратной совместимости.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    let rows: any[] = [];
    try {
      const { data, error } = await supabaseAdmin().from("bank_monobank").select("id, client_name, webhook_set").eq("user_id", user.id);
      if (error) throw error;
      rows = data || [];
    } catch {
      // Старая схема без колонки id — одна строка на пользователя.
      const { data } = await supabaseAdmin().from("bank_monobank").select("client_name, webhook_set").eq("user_id", user.id).maybeSingle();
      rows = data ? [data] : [];
    }
    return NextResponse.json({
      ok: true,
      connected: rows.length > 0,
      clientName: rows[0]?.client_name || null,
      webhookSet: !!rows[0]?.webhook_set,
      connections: rows.map((r) => ({ id: r.id || null, clientName: r.client_name || null, webhookSet: !!r.webhook_set })),
    });
  } catch {
    return NextResponse.json({ ok: true, connected: false, connections: [] });
  }
}

// Подключить: проверяем токен, сохраняем, ставим вебхук на наш URL.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const token = String(body?.token || "").trim();
  if (!token || token.length < 20) return NextResponse.json({ ok: false, error: "bad_token" }, { status: 400 });

  // 1) Проверяем токен через client-info (он же отдаёт имя клиента и счета).
  let clientName: string | null = null;
  let clientId: string | null = null;
  let accounts: any[] = [];
  try {
    const r = await fetch(`${MONO}/personal/client-info`, { headers: { "X-Token": token }, cache: "no-store" });
    if (r.status === 403) return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
    if (r.status === 429) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    if (!r.ok) return NextResponse.json({ ok: false, error: "mono_error" }, { status: 400 });
    const info = await r.json();
    clientName = info?.name || null;
    clientId = info?.clientId ? String(info.clientId) : null;
    accounts = (info?.accounts || []).map((a: any) => ({ id: a.id, currencyCode: a.currencyCode, type: a.type })).filter((a: any) => a.id);
  } catch {
    return NextResponse.json({ ok: false, error: "network" }, { status: 502 });
  }

  const db = supabaseAdmin();
  // 2) Сохраняем подключение. Аккаунтов может быть несколько — этот же клиент
  //    (по client_id) обновляется, новый клиент добавляется отдельной строкой.
  let secret: string | null = null;
  try {
    const { data: mine, error: selErr } = await db.from("bank_monobank").select("id, client_id, client_name").eq("user_id", user.id);
    if (selErr) throw selErr;
    const same = (mine || []).find((m: any) => (clientId && m.client_id === clientId) || (!m.client_id && m.client_name && m.client_name === clientName));
    if (same) {
      const { error } = await db.from("bank_monobank").update({ token, client_name: clientName, client_id: clientId, accounts, webhook_set: false }).eq("id", (same as any).id);
      if (error) throw error;
      const { data: row } = await db.from("bank_monobank").select("hook_secret").eq("id", (same as any).id).maybeSingle();
      secret = (row as any)?.hook_secret || null;
    } else {
      const { data: row, error } = await db.from("bank_monobank")
        .insert({ user_id: user.id, token, client_name: clientName, client_id: clientId, accounts, webhook_set: false })
        .select("hook_secret").single();
      if (error) throw error;
      secret = (row as any)?.hook_secret || null;
    }
  } catch {
    // Старая схема (user_id — первичный ключ, нет id/client_id): одно
    // подключение на пользователя, как раньше. Второй аккаунт станет доступен
    // после миграции bank_monobank_multi.sql.
    let { error: upErr } = await db.from("bank_monobank").upsert(
      { user_id: user.id, token, client_name: clientName, accounts, webhook_set: false },
      { onConflict: "user_id" }
    );
    if (upErr && /accounts|column|schema cache/i.test(upErr.message)) {
      ({ error: upErr } = await db.from("bank_monobank").upsert(
        { user_id: user.id, token, client_name: clientName, webhook_set: false },
        { onConflict: "user_id" }
      ));
    }
    if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    const { data: row } = await db.from("bank_monobank").select("hook_secret").eq("user_id", user.id).maybeSingle();
    secret = (row as any)?.hook_secret || null;
  }
  if (!secret) return NextResponse.json({ ok: false, error: "no_secret" }, { status: 500 });

  // 3) Ставим вебхук. Monobank проверит URL GET-запросом (ждёт 200) и начнёт слать операции.
  const webHookUrl = `${originOf(req)}/api/bank/monobank/webhook?s=${secret}`;
  let webhookSet = false;
  try {
    const wr = await fetch(`${MONO}/personal/webhook`, {
      method: "POST",
      headers: { "X-Token": token, "content-type": "application/json" },
      body: JSON.stringify({ webHookUrl }),
      cache: "no-store",
    });
    webhookSet = wr.ok;
  } catch { /* вебхук не встал — подключение всё равно сохранено */ }

  if (webhookSet) await db.from("bank_monobank").update({ webhook_set: true }).eq("hook_secret", secret);
  return NextResponse.json({ ok: true, clientName, webhookSet });
}

// Отключить: убираем вебхук в Monobank и удаляем сохранённый токен.
// ?id=<connection id> отключает одно подключение; без id — все (старое поведение).
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const id = String(req.nextUrl.searchParams.get("id") || "");
  const db = supabaseAdmin();
  try {
    let q: any = db.from("bank_monobank").select("token").eq("user_id", user.id);
    if (id) q = q.eq("id", id);
    const { data } = await q;
    for (const row of (Array.isArray(data) ? data : data ? [data] : [])) {
      const token = (row as any)?.token;
      if (!token) continue;
      await fetch(`${MONO}/personal/webhook`, {
        method: "POST",
        headers: { "X-Token": token, "content-type": "application/json" },
        body: JSON.stringify({ webHookUrl: "" }),
        cache: "no-store",
      }).catch(() => {});
    }
    let del: any = db.from("bank_monobank").delete().eq("user_id", user.id);
    if (id) del = del.eq("id", id);
    await del;
  } catch { /* ignore */ }
  return NextResponse.json({ ok: true });
}
