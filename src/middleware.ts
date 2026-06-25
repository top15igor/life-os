import { NextRequest, NextResponse } from "next/server";

// Пускаем на страницы только при наличии cookie-токена (личная ссылка из бота).
// Реальная проверка токена по базе — в самих страницах (requireUser).
export function middleware(req: NextRequest) {
  const token = req.cookies.get("lifeos_token")?.value;
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  // Защищаем страницы, кроме /login, /u/* (вход по ссылке), /api/* и статики.
  matcher: ["/((?!login|u|api|_next/static|_next/image|favicon.ico).*)"],
};
