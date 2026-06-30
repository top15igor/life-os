import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { secureAccountSessions } from "@/lib/emailAuth";
import { setSessionCookie } from "@/lib/authCookie";

export const runtime = "nodejs";

// «Выйти на всех ДРУГИХ устройствах»: ротируем session_secret (старые cookie мгновенно
// перестают работать — выкидывает всех, кто вошёл по пересланной ссылке) + одноразовый token.
// Текущему устройству ставим свежую cookie, чтобы пользователь остался внутри.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  const fresh = await secureAccountSessions(user.id);
  if (fresh) setSessionCookie(res, fresh);
  return res;
}
