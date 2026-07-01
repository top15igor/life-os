import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

function originOf(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Шаг 1: уводим пользователя на экран согласия Google.
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/login?e=google", req.url));

  const redirectUri = `${originOf(req)}/api/auth/google/callback`;
  const state = randomBytes(16).toString("hex");
  const ref = req.nextUrl.searchParams.get("ref") || "";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  const opts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 600 };
  res.cookies.set("lifeos_oauth_state", state, opts);
  if (ref) res.cookies.set("lifeos_oauth_ref", ref, opts);
  // Режим привязки: ?link=1 — присоединить Google к текущему аккаунту, а не заводить новый.
  if (req.nextUrl.searchParams.get("link") === "1") res.cookies.set("lifeos_oauth_link", "1", opts);
  // Режим приложения: ?mobile=1 — после входа отдать токен сессии в URL для нативного приложения.
  if (req.nextUrl.searchParams.get("mobile") === "1") res.cookies.set("lifeos_oauth_mobile", "1", opts);
  return res;
}
