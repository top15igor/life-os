import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { setRefreshToken } from "@/lib/googleCalendar";

export const runtime = "nodejs";

function originOf(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Resolve current user from the session cookie (session_secret, fallback token).
async function currentUserId(req: NextRequest): Promise<string | null> {
  const c = req.cookies.get("lifeos_token")?.value;
  if (!c) return null;
  const db = supabaseAdmin();
  try {
    const r = await db.from("users").select("id").eq("session_secret", c).maybeSingle();
    if (r.data) return (r.data as any).id;
  } catch {}
  const r2 = await db.from("users").select("id").eq("token", c).maybeSingle();
  return (r2.data as any)?.id || null;
}

function back(req: NextRequest, suffix: string) {
  const dest = req.cookies.get("lifeos_gcal_back")?.value || "/reminders";
  const res = NextResponse.redirect(new URL(dest + suffix, req.url));
  res.cookies.delete("lifeos_gcal_state");
  res.cookies.delete("lifeos_gcal_back");
  return res;
}

// Step 2: Google returned a code. Exchange it for an offline refresh token and
// store it on the current user. One-way calendar writes use it from now on.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("lifeos_gcal_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) return back(req, "?cal=err");

  const userId = await currentUserId(req);
  if (!userId) return back(req, "?cal=nologin");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return back(req, "?cal=noenv");

  const redirectUri = `${originOf(req)}/api/google-calendar/callback`;
  try {
    const tok = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    }).then((r) => r.json());

    const refresh = tok?.refresh_token;
    if (!refresh) return back(req, "?cal=norefresh");

    const ok = await setRefreshToken(userId, refresh);
    return back(req, ok ? "?cal=ok" : "?cal=savefail");
  } catch {
    return back(req, "?cal=err");
  }
}
