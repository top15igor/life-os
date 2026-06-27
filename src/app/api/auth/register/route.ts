import { NextRequest, NextResponse } from "next/server";
import { registerWithEmail } from "@/lib/emailAuth";
import { setSessionCookie } from "@/lib/authCookie";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "");
  const password = String(body?.password || "");
  const name = String(body?.name || "");
  const ref = body?.ref ? String(body.ref) : null;

  const result = await registerWithEmail(email, password, name, ref);
  if (result.ok && result.token) {
    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, result.token);
    return res;
  }
  return NextResponse.json({ ok: false, error: result.error || "server" }, { status: 400 });
}
