import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createConsent, startAuthorisation, consentStatus, getAccounts, type AbankPsu } from "@/lib/abank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IBAN_RE = /^UA\d{27}$/i;

function plusDays(n: number): string {
  const d = new Date(Date.now() + n * 86400000);
  return d.toISOString().slice(0, 10);
}

// Статус подключения. Если согласие уже подтверждено в àbank24 (consentStatus=valid) —
// дотягиваем resourceId счёта и помечаем connected.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = supabaseAdmin();
  let row: any = null;
  try { const { data } = await db.from("bank_abank").select("*").eq("user_id", user.id).maybeSingle(); row = data; }
  catch { return NextResponse.json({ ok: true, connected: false }); }
  if (!row) return NextResponse.json({ ok: true, connected: false });

  if (!row.connected && row.consent_id) {
    const psu: AbankPsu = { iban: row.iban, corporate: !!row.corporate };
    const st = await consentStatus(psu, row.consent_id);
    if (st === "valid") {
      const accounts = await getAccounts(psu, row.consent_id);
      const acc = accounts.find((a: any) => (a.iban || "").toUpperCase() === row.iban.toUpperCase()) || accounts[0];
      if (acc?.resourceId) {
        await db.from("bank_abank").update({ resource_id: acc.resourceId, connected: true, updated_at: new Date().toISOString() }).eq("user_id", user.id);
        return NextResponse.json({ ok: true, connected: true, iban: row.iban });
      }
    }
    return NextResponse.json({ ok: true, connected: false, pending: true, iban: row.iban });
  }
  return NextResponse.json({ ok: true, connected: !!row.connected, iban: row.iban });
}

// Подключить: создаём согласие + запускаем авторизацию (пользователь подтверждает в àbank24).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const iban = String(body?.iban || "").trim().toUpperCase().replace(/\s/g, "");
  const corporate = !!body?.corporate;
  const currency = /^[A-Z]{3}$/.test(String(body?.currency || "")) ? String(body.currency) : "UAH";
  if (!IBAN_RE.test(iban)) return NextResponse.json({ ok: false, error: "bad_iban" }, { status: 400 });

  const psu: AbankPsu = { iban, corporate };
  const validTo = plusDays(89);
  let consentId: string | null = null;
  try {
    const c = await createConsent(psu, currency, validTo);
    if (!c.ok || !c.data?.consentId) {
      const msg = c.data?.apiClientMessages?.[0]?.text || "consent_failed";
      return NextResponse.json({ ok: false, error: "consent", detail: msg }, { status: 400 });
    }
    consentId = c.data.consentId;
    await startAuthorisation(psu, consentId!);
  } catch {
    return NextResponse.json({ ok: false, error: "network" }, { status: 502 });
  }

  try {
    await supabaseAdmin().from("bank_abank").upsert(
      { user_id: user.id, iban, corporate, currency, consent_id: consentId, consent_valid_to: validTo, resource_id: null, connected: false, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, needsApproval: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  try { await supabaseAdmin().from("bank_abank").delete().eq("user_id", user.id); } catch {}
  return NextResponse.json({ ok: true });
}
