import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const CURRENCIES = ["USD", "EUR", "UAH", "RUB", "GBP", "PLN", "KZT", "GEL", "TRY", "AED"];

// Сохранить основную валюту и курсы остальных валют к ней.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const base = CURRENCIES.includes(String(body?.base_currency)) ? String(body.base_currency) : "USD";

  // rates: {"USD": 41.5, ...} — только валидные положительные числа по известным валютам, кроме base.
  const rates: Record<string, number> = {};
  const inRates = body?.rates && typeof body.rates === "object" ? body.rates : {};
  for (const [k, v] of Object.entries(inRates)) {
    const n = Number(v);
    if (CURRENCIES.includes(k) && k !== base && isFinite(n) && n > 0) rates[k] = n;
  }

  const db = supabaseAdmin();
  const { error } = await db.from("finance_settings").upsert(
    { user_id: user.id, base_currency: base, rates, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
