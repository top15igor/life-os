import { NextRequest, NextResponse } from "next/server";

const COOKIE = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 180,
};

// Похоже на встроенный браузер приложения (Telegram/Instagram/…), а не на полноценный Safari/Chrome.
function isInAppBrowser(ua: string): boolean {
  if (/Telegram|Instagram|FBAN|FBAV|Line\//i.test(ua)) return true;
  // На iOS встроенные WebView не содержат токен "Safari" в UA, в отличие от настоящего Safari.
  if (/iP(hone|ad|od)/.test(ua) && /AppleWebKit/.test(ua) && !/Safari/.test(ua)) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Вход по личной ссылке: /u/<token>
  const m = pathname.match(/^\/u\/([^/]+)\/?$/);
  if (m) {
    const token = m[1];
    const nextParam = req.nextUrl.searchParams.get("next");
    const dest = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
    const ua = req.headers.get("user-agent") || "";

    if (isInAppBrowser(ua)) {
      // Внутри Telegram: ставим cookie и БЕЗ редиректа показываем дашборд,
      // оставляя URL /u/<token> — чтобы «Открыть в Safari» перенесло вход в другой браузер.
      const headers = new Headers(req.headers);
      const existing = headers.get("cookie");
      headers.set("cookie", `${existing ? existing + "; " : ""}lifeos_token=${token}`);
      const res = NextResponse.rewrite(new URL(dest, req.url), { request: { headers } });
      res.cookies.set("lifeos_token", token, COOKIE);
      return res;
    }

    // Обычный браузер (Safari/Chrome): чистый редирект — токен в адресе не светится.
    const res = NextResponse.redirect(new URL(dest, req.url));
    res.cookies.set("lifeos_token", token, COOKIE);
    return res;
  }

  // Остальные страницы — только при наличии cookie-токена.
  const token = req.cookies.get("lifeos_token")?.value;
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/welcome";
  return NextResponse.redirect(url);
}

export const config = {
  // Под middleware попадают все страницы и /u/<token>, кроме /welcome, /login, /privacy, /api и статики.
  matcher: ["/((?!welcome|login|privacy|api|_next/static|_next/image|favicon.ico).*)"],
};
