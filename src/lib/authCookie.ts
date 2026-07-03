import { NextResponse } from "next/server";

// Единая cookie-сессия для всего сайта (та же, что ставит вход из Telegram /u/<token>).
export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set("lifeos_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

// Зеркалит тему аккаунта в куку для SSR при входе → синхрон между устройствами/браузерами.
export function setThemeCookie(res: NextResponse, theme?: string | null) {
  const t = theme === "light" || theme === "dark" || theme === "auto" ? theme : "auto";
  res.cookies.set("theme", t, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
}
