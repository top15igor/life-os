import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { routeMessage, runAction, type Lang } from "@/lib/botActions";

export const runtime = "nodejs";

// Web voice/text command: "напомни …" -> create a reminder.
// Returns handled=true with a confirmation when it was a reminder command,
// otherwise handled=false so the caller falls back to a normal diary entry.
export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const text = (body.text || "").toString().trim();
  if (!text) return NextResponse.json({ ok: false, handled: false });

  const locale = (await getLocale()) as Lang;
  let tz: number | null = null;
  try {
    const { data } = await supabaseAdmin().from("users").select("tz_offset").eq("id", user.id).maybeSingle();
    tz = (data as any)?.tz_offset ?? null;
  } catch {}

  const route = await routeMessage(text, user.id, tz);
  if (route.kind === "action" && route.name === "set_reminder") {
    const res = await runAction(user.id, "set_reminder", route.input, locale, tz);
    return NextResponse.json({ ok: true, handled: true, kind: "reminder", message: res.text, openNext: res.openNext });
  }
  return NextResponse.json({ ok: true, handled: false });
}
