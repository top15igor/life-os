import { NextRequest, NextResponse } from "next/server";
import { loginWithEmail } from "@/lib/emailAuth";
import { setSessionCookie, setThemeCookie } from "@/lib/authCookie";
import { allowAttempt, clearAttempts, clientIp } from "@/lib/throttle";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "");
  const password = String(body?.password || "");

  // Считаем попытки и по адресу, и по почте: иначе перебор одного ящика можно
  // размазать по адресам, а перебор ящиков — вести с одного.
  const keys = [`ip:${clientIp(req)}`, `mail:${email.trim().toLowerCase()}`];
  if (!keys.every((k) => allowAttempt(k))) {
    return NextResponse.json({ ok: false, error: "too_many" }, { status: 429 });
  }

  const result = await loginWithEmail(email, password);
  if (result.ok && result.token) {
    keys.forEach(clearAttempts);
    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, result.token);
    setThemeCookie(res, result.theme);
    return res;
  }
  return NextResponse.json({ ok: false, error: result.error || "server" }, { status: 400 });
}
