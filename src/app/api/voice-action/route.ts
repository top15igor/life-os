import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { runAction } from "@/lib/botActions";
import { voiceActionTools } from "@/lib/companion";

export const runtime = "nodejs";

// Only the agent action tools may be run via voice (no delete/save/etc.).
const ALLOWED = new Set(voiceActionTools().map((t) => t.name));

// Resolve the user from the web cookie or the app's session token (?k=),
// same as /api/realtime-token (the /voice-live WebView passes ?k=).
async function resolveUser(req: NextRequest): Promise<{ id: string } | null> {
  const fromCookie = await getCurrentUser();
  if (fromCookie) return { id: fromCookie.id };
  const k = req.nextUrl.searchParams.get("k");
  if (!k) return null;
  const db = supabaseAdmin();
  try {
    const { data } = await db.from("users").select("id").eq("session_secret", k).maybeSingle();
    if (data) return data as any;
  } catch {}
  const { data: legacy } = await db.from("users").select("id").eq("token", k).maybeSingle();
  return (legacy as any) || null;
}

// Execute an action the voice friend requested (set_reminder, add_task, …) and
// return a short confirmation the model reads back aloud.
export async function POST(req: NextRequest) {
  const user = await resolveUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = String(body?.name || "");
  const input = body?.arguments && typeof body.arguments === "object" ? body.arguments : {};
  if (!ALLOWED.has(name)) {
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  }

  // Local time offset so reminders parse "завтра в 9" correctly.
  let tz: number | null = null;
  try {
    const { data } = await supabaseAdmin().from("users").select("tz_offset").eq("id", user.id).maybeSingle();
    tz = (data as any)?.tz_offset ?? null;
  } catch {}

  try {
    const r = await runAction(user.id, name, input, "ru", tz);
    return NextResponse.json({ ok: true, result: r.text });
  } catch (e: any) {
    console.error("voice-action", name, e);
    return NextResponse.json({ ok: false, error: "action_failed" }, { status: 500 });
  }
}
