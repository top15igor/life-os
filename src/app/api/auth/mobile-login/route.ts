import { NextRequest, NextResponse } from "next/server";
import { loginWithEmail } from "@/lib/emailAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Mobile login: same email+password check as the web, but returns the session
// token in the JSON body so the native app can store it (SecureStore) and send
// it back as a `Cookie: lifeos_token=<token>` header on every request.
// The web flow (cookie-based /api/auth/login) is untouched.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "");
  const password = String(body?.password || "");

  const result = await loginWithEmail(email, password);
  if (!result.ok || !result.token) {
    return NextResponse.json({ ok: false, error: result.error || "server" }, { status: 400 });
  }

  // Resolve the user behind this token so the app can show a name immediately.
  const me = await resolveUser(result.token);
  return NextResponse.json({ ok: true, token: result.token, user: me });
}

async function resolveUser(token: string) {
  // Lightweight lookup mirroring getCurrentUser, but driven by an explicit token
  // (request cookies aren't set on this POST). Returns minimal public fields.
  const db = supabaseAdmin();
  try {
    const { data } = await db.from("users").select("id, name").eq("session_secret", token).maybeSingle();
    if (data) return data;
  } catch {
    // session_secret column may not exist yet — fall back to token
  }
  const { data: legacy } = await db.from("users").select("id, name").eq("token", token).maybeSingle();
  return legacy || null;
}
