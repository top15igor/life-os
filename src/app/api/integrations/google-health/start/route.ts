import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { setSessionCookie } from "@/lib/authCookie";
import { googleHealthConfigured, googleHealthAuthUrl } from "@/lib/googleHealth";

export const runtime = "nodejs";

// Resolve the app's session token (?k=) so the OAuth flow can run in the system
// browser (which has no app auth header).
async function userFromK(k: string): Promise<{ id: string } | null> {
  const db = supabaseAdmin();
  try {
    const { data } = await db.from("users").select("id").eq("session_secret", k).maybeSingle();
    if (data) return data as any;
  } catch {}
  const { data: legacy } = await db.from("users").select("id").eq("token", k).maybeSingle();
  return (legacy as any) || null;
}

// Шаг 1 OAuth: «Подключить Google Health (Fitbit)» → экран согласия Google.
export async function GET(req: NextRequest) {
  const k = req.nextUrl.searchParams.get("k");
  const ret = req.nextUrl.searchParams.get("return") || "";
  const isMobile = /^(exp|exps|lifeos):\/\//.test(ret);

  let user = await getCurrentUser();
  let cookieSecret = "";
  if (!user && k) {
    user = (await userFromK(k)) as any;
    cookieSecret = k; // set the app token as a cookie so the callback is authed
  }
  if (!user) return NextResponse.redirect(new URL("/about", req.url));

  if (!googleHealthConfigured()) {
    return NextResponse.redirect(isMobile ? `${ret}?health=notconfigured` : new URL("/health?fitbit=notconfigured", req.url).toString());
  }

  const redirectUri = `${req.nextUrl.origin}/api/integrations/google-health/callback`;
  const state = randomUUID();
  const res = NextResponse.redirect(googleHealthAuthUrl(redirectUri, state));
  const opts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 600 };
  res.cookies.set("gh_state", state, opts);
  if (cookieSecret) setSessionCookie(res, cookieSecret);
  if (isMobile) res.cookies.set("gh_return", ret, opts);
  return res;
}
