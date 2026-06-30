import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { setSessionCookie } from "@/lib/authCookie";

export const runtime = "nodejs";

function destFrom(req: NextRequest): string {
  const next = req.nextUrl.searchParams.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// Mobile WebView login: the native app's "Ещё" tab loads /m/<session token> to
// authenticate the embedded web app. Unlike /u (one-time bot link), this accepts
// the STABLE session_secret the app already holds and does NOT rotate it — so the
// WebView can navigate the whole site. We just set the standard session cookie.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = supabaseAdmin();

  // Verify the token belongs to a real user (session_secret, or legacy token).
  let ok = false;
  try {
    const { data } = await db.from("users").select("id").eq("session_secret", token).maybeSingle();
    if (data) ok = true;
  } catch {}
  if (!ok) {
    const { data: legacy } = await db.from("users").select("id").eq("token", token).maybeSingle();
    ok = !!legacy;
  }
  if (!ok) return NextResponse.redirect(new URL("/login?e=link", req.url));

  const res = NextResponse.redirect(new URL(destFrom(req), req.url));
  setSessionCookie(res, token);
  return res;
}
