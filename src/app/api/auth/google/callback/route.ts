import { NextRequest, NextResponse } from "next/server";
import { findOrCreateGoogleUser, attachLoginToUser, secureAccountSessions } from "@/lib/emailAuth";
import { setSessionCookie } from "@/lib/authCookie";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
  res.cookies.delete("lifeos_oauth_link");
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

    // Режим привязки: присоединяем Google к уже залогиненному аккаунту.
    if (req.cookies.get("lifeos_oauth_link")?.value === "1") {
      const token = req.cookies.get("lifeos_token")?.value;
      // cookie хранит session_secret (новая схема); фолбэк на token (старые сессии/до миграции).
      let cur: { id: string } | null = null;
      if (token) {
        try {
          const r = await supabaseAdmin().from("users").select("id").eq("session_secret", token).maybeSingle();
          cur = (r.data as any) || null;
        } catch {}
        if (!cur) {
          const r2 = await supabaseAdmin().from("users").select("id").eq("token", token).maybeSingle();
          cur = (r2.data as any) || null;
        }
      }
      let linkedOk = false;
      const dest = !cur
        ? "/login" // сессия истекла — обычный вход
        : (linkedOk = (await attachLoginToUser((cur as any).id, email)).ok)
        ? "/profile/account?linked=google"
        : "/profile/account?e=emailtaken";
      const res = NextResponse.redirect(new URL(dest, req.url));
      // Безопасность: после привязки Google сбрасываем старые ссылочные сессии (кто вошёл по
      // пересланной ссылке — вылетит), а себе ставим свежую cookie.
      if (cur && linkedOk) {
        const fresh = await secureAccountSessions((cur as any).id);
        if (fresh) setSessionCookie(res, fresh);
      }
      res.cookies.delete("lifeos_oauth_state");
      res.cookies.delete("lifeos_oauth_ref");
      res.cookies.delete("lifeos_oauth_link");
      return res;
    }

    const ref = req.cookies.get("lifeos_oauth_ref")?.value || null;
    const result = await findOrCreateGoogleUser(email, info?.name, ref);
    if (!result) return fail(req);

    // Brand-new Google account → ask if they already kept a diary in Telegram,
    // so they don't end up confused on an empty duplicate. Existing → straight in.
    const dest = result.created ? "/just-joined" : "/";
    const res = NextResponse.redirect(new URL(dest, req.url));
    setSessionCookie(res, result.token);
    res.cookies.delete("lifeos_oauth_state");
    res.cookies.delete("lifeos_oauth_ref");
    res.cookies.delete("lifeos_oauth_link");
    return res;
  } catch (e) {
    console.error("google callback", e);
    return fail(req);
  }
}
