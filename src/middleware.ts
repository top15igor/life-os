import { NextRequest, NextResponse } from "next/server";

// Пускаем на сайт только по паролю — но лишь если APP_PASSWORD задан.
// Пока пароль не настроен, сайт открыт (для первичного просмотра).
export function middleware(req: NextRequest) {
  const pass = process.env.APP_PASSWORD;
  if (!pass) return NextResponse.next();

  const cookie = req.cookies.get("lifeos_auth")?.value;
  if (cookie === pass) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Защищаем страницы, кроме /login, всех /api/*, статики и favicon.
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
