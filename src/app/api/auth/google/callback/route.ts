import { NextRequest, NextResponse } from "next/server";
import { findOrCreateGoogleUser } from "@/lib/emailAuth";
import { setSessionCookie } from "@/lib/authCookie";

export const runtime = "nodejs";

function originOf(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function fail(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login?e=google", req.url));
  res.cookies.delete("lifeos_oauth_state");
  res.cookies.delete("lifeos_oauth_ref");
  return res;
}

// Шаг 2: Google вернул код. Меняем код на профиль, заводим/находим аккаунт, ставим сессию.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("lifeos_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) return fail(req);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail(req);

  const redirectUri = `${originOf(req)}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
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

    const accessToken = tokenRes?.access_token;
    if (!accessToken) return fail(req);

    const info = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json());

    const email = info?.email;
    const verified = info?.email_verified === true || info?.email_verified === "true";
    if (!email || !verified) return fail(req);

    const ref = req.cookies.get("lifeos_oauth_ref")?.value || null;
    const result = await findOrCreateGoogleUser(email, info?.name, ref);
    if (!result) return fail(req);

    const res = NextResponse.redirect(new URL("/", req.url));
    setSessionCookie(res, result.token);
    res.cookies.delete("lifeos_oauth_state");
    res.cookies.delete("lifeos_oauth_ref");
    return res;
  } catch (e) {
    console.error("google callback", e);
    return fail(req);
  }
}
