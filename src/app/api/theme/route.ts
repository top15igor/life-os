import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const VALID = ["auto", "light", "dark"];
const YEAR = 60 * 60 * 24 * 365;

// Сохраняет тему в аккаунт (синхрон между устройствами) и зеркалит в куку для SSR.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const theme = VALID.includes(String(body?.theme)) ? String(body.theme) : "auto";
  try {
    await supabaseAdmin().from("users").update({ theme }).eq("id", user.id);
  } catch {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true, theme });
  res.cookies.set("theme", theme, { path: "/", maxAge: YEAR, sameSite: "lax" });
  return res;
}
