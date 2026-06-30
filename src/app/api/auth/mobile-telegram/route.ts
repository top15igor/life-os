import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Telegram-based login for the native app. The user taps /link in the bot and
// gets a one-time link `<origin>/u/<token>`. The app sends that token (or the
// whole link) here. We mirror the web /u/<token> flow:
//   - look up the user by the one-time token,
//   - ensure a stable session_secret exists,
//   - rotate the one-time token so the link can't be replayed,
// then return session_secret in JSON for the app to store (SecureStore) and send
// back as the `lifeos_token` cookie on every request — same as the web session.
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
    // Token already used (rotated) or invalid — ask for a fresh /link.
    return NextResponse.json({ ok: false, error: "link_expired" }, { status: 401 });
  }

  let secret: string = (user as any).session_secret || "";
  let canRotate = !!secret;
  try {
    if (!secret) {
      const fresh = randomUUID();
      const { error } = await db.from("users").update({ session_secret: fresh }).eq("id", user.id);
      if (error) { secret = token; canRotate = false; }
      else { secret = fresh; canRotate = true; }
    }
    if (canRotate) {
      // One-time: replace the login token so the pasted link is now burned.
      await db.from("users").update({ token: randomUUID() }).eq("id", user.id);
    }
  } catch {
    if (!secret) secret = token;
  }

  return NextResponse.json({ ok: true, token: secret, user: { id: (user as any).id, name: (user as any).name } });
}
