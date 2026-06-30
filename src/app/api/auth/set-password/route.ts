import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { attachLoginToUser, secureAccountSessions } from "@/lib/emailAuth";

export const runtime = "nodejs";

// Mobile: a logged-in user (e.g. came in via Telegram/Google, so has no password)
// sets an email + password so they can also log in with email+password later.
// Mirrors /api/auth/link-email, but returns the fresh session token in the body
// (linking rotates the session, so the app must store the new token to stay in).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const email = String(body?.email || "");
  const password = String(body?.password || "");

  const result = await attachLoginToUser(user.id, email, password);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "server" }, { status: 400 });
  }

  // Linking secures the account → old link sessions die, a fresh secret is issued.
  const fresh = await secureAccountSessions(user.id);
  return NextResponse.json({ ok: true, token: fresh });
}
