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
  const year = 60 * 60 * 24 * 365;
  // Флаг «внутри приложения» (нативные мелочи: скрытие веб-помощника и т.п.).
  res.cookies.set("app", "1", { path: "/", maxAge: year });
  // Нативное приложение тёмное → задаём тему явно (тема больше НЕ завязана на куку app).
  res.cookies.set("theme", "dark", { path: "/", maxAge: year });
  // solo=1 — одиночный раздел (прячем веб-навигацию); solo=0 — «Открыть сайт полностью».
  res.cookies.set("solo", req.nextUrl.searchParams.get("solo") === "0" ? "0" : "1", { path: "/", maxAge: year });
  // Язык из приложения → cookie locale, чтобы веб-разделы рендерились на выбранном языке.
  const loc = req.nextUrl.searchParams.get("locale");
  if (loc && ["ru", "en", "uk", "fr", "es"].includes(loc)) {
    res.cookies.set("locale", loc, { path: "/", maxAge: year });
  }
  return res;
}
