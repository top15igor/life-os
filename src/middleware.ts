import { NextRequest, NextResponse } from "next/server";

// Пускаем на страницы только при наличии cookie-токена (личная ссылка из бота).
// Реальная проверка токена по базе — в самих страницах (requireUser).
export function middleware(req: NextRequest) {
  const token = req.cookies.get("lifeos_token")?.value;
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  // Гость на корне — показываем презентацию (контент /about), но АДРЕС остаётся "/".
  // Так сайт открывается по чистому life-os.today, без /about в строке.
  // Query (?ref=...) сохраняется, чтобы реферал не терялся.
  if (url.pathname === "/") {
    url.pathname = "/about";
    return NextResponse.rewrite(url);
  }
  // Прочие защищённые страницы гостю — на чистый корень (там он увидит презентацию).
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Защищаем страницы, кроме публичных: /welcome, /login, /about (лендинг), /privacy, /u/* (вход по ссылке),
  // /i/* (приглашение), /p/* (публичная книга-витрина), /w/* (публичный вишлист), /b/* (публичная библиотека),
  // /path/* (публичный путь), /voice-live (вебвью приложения, авторизуется сама по токену ?k=), /api/* и статики.
  // Слэш в p/, w/, b/, path/, i/ важен: чтобы не задеть /people, /places, /pricing, /profile, /wishlist, /books, /biographer, /paths, /insights.
  matcher: ["/((?!welcome|login|about|privacy|tester|features|heir/|u|m/|api|p/|w/|b/|path/|i/|voice-live|auth/app-done|_next/static|_next/image|favicon.ico).*)"],
};
