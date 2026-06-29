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

// Статус подключения Monobank.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const { data } = await supabaseAdmin().from("bank_monobank").select("client_name, webhook_set").eq("user_id", user.id).maybeSingle();
    return NextResponse.json({ ok: true, connected: !!data, clientName: data?.client_name || null, webhookSet: !!data?.webhook_set });
  } catch {
    return NextResponse.json({ ok: true, connected: false });
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
  let accounts: any[] = [];
  try {
    const r = await fetch(`${MONO}/personal/client-info`, { headers: { "X-Token": token }, cache: "no-store" });
    if (r.status === 403) return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
    if (r.status === 429) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    if (!r.ok) return NextResponse.json({ ok: false, error: "mono_error" }, { status: 400 });
    const info = await r.json();
    clientName = info?.name || null;
    accounts = (info?.accounts || []).map((a: any) => ({ id: a.id, currencyCode: a.currencyCode, type: a.type })).filter((a: any) => a.id);
  } catch {
    return NextResponse.json({ ok: false, error: "network" }, { status: 502 });
  }

  const db = supabaseAdmin();
  // 2) Сохраняем токен и счета (hook_secret сгенерируется при первой вставке).
  let { error: upErr } = await db.from("bank_monobank").upsert(
    { user_id: user.id, token, client_name: clientName, accounts, webhook_set: false },
    { onConflict: "user_id" }
  );
  // Старая база без колонки accounts — сохраняем без неё.
  if (upErr && /accounts|column|schema cache/i.test(upErr.message)) {
    ({ error: upErr } = await db.from("bank_monobank").upsert(
      { user_id: user.id, token, client_name: clientName, webhook_set: false },
      { onConflict: "user_id" }
    ));
  }
  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

  const { data: row } = await db.from("bank_monobank").select("hook_secret").eq("user_id", user.id).maybeSingle();
  const secret = (row as any)?.hook_secret;
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

  if (webhookSet) await db.from("bank_monobank").update({ webhook_set: true }).eq("user_id", user.id);
  return NextResponse.json({ ok: true, clientName, webhookSet });
}

// Отключить: убираем вебхук в Monobank и удаляем сохранённый токен.
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = supabaseAdmin();
  try {
    const { data } = await db.from("bank_monobank").select("token").eq("user_id", user.id).maybeSingle();
    const token = (data as any)?.token;
    if (token) {
      await fetch(`${MONO}/personal/webhook`, {
        method: "POST",
        headers: { "X-Token": token, "content-type": "application/json" },
        body: JSON.stringify({ webHookUrl: "" }),
        cache: "no-store",
      }).catch(() => {});
    }
    await db.from("bank_monobank").delete().eq("user_id", user.id);
  } catch { /* ignore */ }
  return NextResponse.json({ ok: true });
}
