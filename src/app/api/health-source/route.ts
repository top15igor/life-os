import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const ALLOWED = ["auto", "google", "apple"];

// Основной источник данных о здоровье, когда подключены и Fitbit/Google, и Apple.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const source = String(body?.source || "").toLowerCase();
  if (!ALLOWED.includes(source)) return NextResponse.json({ ok: false, error: "bad_source" }, { status: 400 });
  try {
    await supabaseAdmin().from("users").update({ health_source: source }).eq("id", user.id);
  } catch {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, source });
}
