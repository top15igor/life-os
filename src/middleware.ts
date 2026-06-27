import { NextRequest, NextResponse } from "next/server";

// Пускаем на страницы только при наличии cookie-токена (личная ссылка из бота).
// Реальная проверка токена по базе — в самих страницах (requireUser).
export function middleware(req: NextRequest) {
  const token = req.cookies.get("lifeos_token")?.value;
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/welcome";
  return NextResponse.redirect(url);
}

export const config = {
  // Защищаем страницы, кроме публичных: /welcome, /login, /about (лендинг), /privacy, /u/* (вход по ссылке),
  // /i/* (приглашение), /p/* (публичная книга-витрина), /path/* (публичный путь), /api/* и статики.
  // Слэш в p/, path/, i/ важен: чтобы не задеть /people, /places, /pricing, /profile, /paths, /insights.
  matcher: ["/((?!welcome|login|about|privacy|u|api|p/|path/|i/|_next/static|_next/image|favicon.ico).*)"],
};
