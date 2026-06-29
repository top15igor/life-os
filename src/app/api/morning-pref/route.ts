import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeMorningPrefs } from "@/lib/morningPrefs";

export const runtime = "nodejs";

// Сохранить персональные настройки утреннего пуша (тон + темы).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const prefs = normalizeMorningPrefs(body); // валидируем и отбрасываем мусор

  try {
    await supabaseAdmin().from("users").update({ morning_prefs: prefs }).eq("id", user.id);
  } catch {
    return NextResponse.json({ ok: false, error: "no_column" }, { status: 200 });
  }
  return NextResponse.json({ ok: true, prefs });
}
