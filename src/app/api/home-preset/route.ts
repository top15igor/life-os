import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const PRESETS = ["mindful", "focus", "trace", "balance", "minimal"];

// Сохранить «акцент главной» пользователя.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const preset = String(body?.preset || "");
  if (!PRESETS.includes(preset)) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await supabaseAdmin().from("users").update({ home_preset: preset }).eq("id", user.id);
  } catch {
    return NextResponse.json({ ok: false, error: "no_column" }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
