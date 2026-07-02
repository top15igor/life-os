import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildVoiceInstructions, voiceActionTools } from "@/lib/companion";

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
// Build the GA session config. noise_reduction and tools are the newest/riskiest
// fields — each can be dropped on retry so the friend still works if an API
// version rejects one of them.
function gaSession(instructions: string, opts: { noiseReduction: boolean; tools: boolean }) {
  const input: any = {
    // Higher threshold keeps a TV in the next room from triggering the model.
    // silence_duration_ms: how long a pause counts as "you finished".
    turn_detection: { type: "server_vad", threshold: 0.6, prefix_padding_ms: 300, silence_duration_ms: 600 },
    // Transcribe the user's speech so the app can show captions.
    transcription: { model: "whisper-1" },
  };
  if (opts.noiseReduction) input.noise_reduction = { type: "near_field" };
  const session: any = {
    type: "realtime",
    model: MODEL,
    instructions,
    audio: { input, output: { voice: VOICE } },
  };
  if (opts.tools) {
    // Action tools (reminders, tasks, weight, …) — same as the bot's Jarvis.
    session.tools = voiceActionTools();
    session.tool_choice = "auto";
  }
  return session;
}

async function postGA(key: string, session: any) {
  const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ session }),
  });
  const d = await r.json().catch(() => null);
  return { ok: r.ok && !!d?.value, value: d?.value as string | undefined, expires_at: d?.expires_at as number | undefined, detail: d?.error?.message || `status ${r.status}` };
}

async function mintSecret(
  key: string,
  instructions: string
): Promise<{ value?: string; expires_at?: number; detail?: string }> {
  // Degrade gracefully: full → drop noise_reduction → drop tools (last resort,
  // keeps the friend talking even if a field is rejected).
  try {
    const a = await postGA(key, gaSession(instructions, { noiseReduction: true, tools: true }));
    if (a.ok) return { value: a.value, expires_at: a.expires_at };

    const b = await postGA(key, gaSession(instructions, { noiseReduction: false, tools: true }));
    if (b.ok) return { value: b.value, expires_at: b.expires_at };

    const c = await postGA(key, gaSession(instructions, { noiseReduction: false, tools: false }));
    if (c.ok) return { value: c.value, expires_at: c.expires_at };

    return { detail: `a: ${a.detail}; b: ${b.detail}; c: ${c.detail}` };
  } catch (e: any) {
    return { detail: String(e?.message || e) };
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
    const { data } = await supabaseAdmin().from("users").select("tz_offset, lang").eq("id", user.id).maybeSingle();
    const vlang = ["ru", "en", "uk", "fr"].includes((data as any)?.lang) ? (data as any).lang : "ru";
    instructions = await buildVoiceInstructions(user.id, user.name, (data as any)?.tz_offset ?? null, vlang);
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
