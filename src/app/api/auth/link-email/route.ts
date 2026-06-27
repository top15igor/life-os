import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { attachLoginToUser } from "@/lib/emailAuth";

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
  return NextResponse.json({ ok: true });
}
