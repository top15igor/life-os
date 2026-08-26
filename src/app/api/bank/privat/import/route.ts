import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncPrivat } from "@/lib/privatbank";

export const runtime = "nodejs";
export const maxDuration = 60;

// Ручной импорт операций ПриватБанка (ФОП) за последние 30 дней.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const r = await syncPrivat(user.id, 30);
    if (!r.connections) return NextResponse.json({ ok: false, error: "not_connected" }, { status: 400 });
    return NextResponse.json({ ok: true, inserted: r.inserted, failed: r.failed });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
