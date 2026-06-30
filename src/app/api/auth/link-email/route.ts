import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { attachLoginToUser, secureAccountSessions } from "@/lib/emailAuth";
import { setSessionCookie } from "@/lib/authCookie";

export const runtime = "nodejs";

// Привязка почты+пароля к текущему (уже залогиненному) аккаунту.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const email = String(body?.email || "");
  const password = String(body?.password || "");

  const result = await attachLoginToUser(user.id, email, password);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error || "server" }, { status: 400 });

  // Безопасность: привязка пароля = «закрываю аккаунт». Сбрасываем все старые ссылочные сессии
  // (кто вошёл по пересланной ссылке — вылетит), а себе ставим свежую cookie, чтобы остаться внутри.
  const res = NextResponse.json({ ok: true });
  const fresh = await secureAccountSessions(user.id);
  if (fresh) setSessionCookie(res, fresh);
  return res;
}
