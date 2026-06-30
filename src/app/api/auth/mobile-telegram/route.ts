import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Telegram-based login for the native app. The user taps /link in the bot and
// gets a link `<origin>/u/<token>`. The app sends that token (or the whole link)
// here; we look up the user, ensure a stable session_secret, and return it for
// the app to store (SecureStore) and send as the `lifeos_token` cookie.
//
// Unlike the web /u/<token> flow, we deliberately do NOT rotate (burn) the token.
// The app keeps it as a "remember me" credential so it can silently re-mint a
// session if session_secret is ever rotated (e.g. after connecting Google or
// setting a password) — without the user pasting a fresh link every time. The web
// /u route still rotates for one-time security; this endpoint is app-only.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const raw = String(body?.token || "").trim();
  // Tolerate a full pasted link: extract the part after /u/.
  const m = raw.match(/\/u\/([^/?#\s]+)/);
  const token = m ? decodeURIComponent(m[1]) : raw;
  if (!token) return NextResponse.json({ ok: false, error: "no_token" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: user } = await db
    .from("users")
    .select("id, name, token, session_secret")
    .eq("token", token)
    .maybeSingle();

  if (!user) {
    // Token was rotated by a web /u login, or invalid — ask for a fresh /link.
    return NextResponse.json({ ok: false, error: "link_expired" }, { status: 401 });
  }

  let secret: string = (user as any).session_secret || "";
  try {
    if (!secret) {
      const fresh = randomUUID();
      const { error } = await db.from("users").update({ session_secret: fresh }).eq("id", user.id);
      secret = error ? token : fresh; // fall back to token if column is missing
    }
  } catch {
    if (!secret) secret = token;
  }

  return NextResponse.json({ ok: true, token: secret, user: { id: (user as any).id, name: (user as any).name } });
}
