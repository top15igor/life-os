import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Вход по личной ссылке из бота: /u/<token> → ставит cookie → дашборд.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await supabaseAdmin().from("users").select("id").eq("token", token).maybeSingle();

  if (!data) {
    return NextResponse.redirect(new URL("/login?e=1", req.url));
  }

  const next = req.nextUrl.searchParams.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const res = NextResponse.redirect(new URL(dest, req.url));
  res.cookies.set("lifeos_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}
