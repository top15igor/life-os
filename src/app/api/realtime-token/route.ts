import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildVoiceInstructions } from "@/lib/companion";

export const runtime = "nodejs";

// OpenAI Realtime model + voice (overridable via env if the API changes).
const MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime";
const VOICE = process.env.OPENAI_REALTIME_VOICE || "alloy";

// Resolve the user either from the web session cookie or from a token passed by
// the native app (the /voice-live WebView appends ?k=<session token>).
async function resolveUser(req: NextRequest): Promise<{ id: string; name: string | null } | null> {
  const fromCookie = await getCurrentUser();
  if (fromCookie) return { id: fromCookie.id, name: fromCookie.name };

  const k = req.nextUrl.searchParams.get("k");
  if (!k) return null;
  const db = supabaseAdmin();
  try {
    const { data } = await db.from("users").select("id, name").eq("session_secret", k).maybeSingle();
    if (data) return data as any;
  } catch {}
  const { data: legacy } = await db.from("users").select("id, name").eq("token", k).maybeSingle();
  return (legacy as any) || null;
}

// Mint a short-lived ephemeral token. Tries the GA endpoint first, then falls
// back to the older sessions endpoint, so it works whichever the account is on.
async function mintSecret(
  key: string,
  instructions: string
): Promise<{ value?: string; expires_at?: number; detail?: string }> {
  let gaDetail = "ga unknown";
  // 1) GA: POST /v1/realtime/client_secrets with a nested session config.
  try {
    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: MODEL,
          instructions,
          audio: {
            input: { turn_detection: { type: "server_vad" } },
            output: { voice: VOICE },
          },
        },
      }),
    });
    const d = await r.json().catch(() => null);
    if (r.ok && d?.value) return { value: d.value, expires_at: d.expires_at };
    gaDetail = d?.error?.message || `ga status ${r.status}`;
  } catch (e: any) {
    gaDetail = `ga ${String(e?.message || e)}`;
  }

  // 2) Legacy: POST /v1/realtime/sessions (flat config, beta header).
  try {
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1",
      },
      body: JSON.stringify({
        model: MODEL,
        voice: VOICE,
        turn_detection: { type: "server_vad" },
        instructions,
      }),
    });
    const d = await r.json().catch(() => null);
    if (r.ok && d?.client_secret?.value) {
      return { value: d.client_secret.value, expires_at: d.client_secret.expires_at };
    }
    return { detail: `${gaDetail}; legacy ${d?.error?.message || `status ${r.status}`}` };
  } catch (e: any) {
    return { detail: `${gaDetail}; legacy ${String(e?.message || e)}` };
  }
}

export async function GET(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "no_openai_key" }, { status: 500 });

  const user = await resolveUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  // Personality + everything we know about the user, tuned for spoken conversation.
  let instructions = "";
  try {
    const { data } = await supabaseAdmin().from("users").select("tz_offset").eq("id", user.id).maybeSingle();
    instructions = await buildVoiceInstructions(user.id, user.name, (data as any)?.tz_offset ?? null);
  } catch {
    instructions = await buildVoiceInstructions(user.id, user.name, null);
  }

  const minted = await mintSecret(key, instructions);
  if (!minted.value) {
    return NextResponse.json(
      { ok: false, error: "openai_session_failed", detail: minted.detail || "unknown" },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, value: minted.value, expires_at: minted.expires_at, model: MODEL });
}
