import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const PRESETS = ["mindful", "focus", "trace", "balance", "minimal", "custom"];
const BLOCK_KEYS = ["habit", "trace", "promises", "traceWeek", "context", "metrics", "changes", "focus", "stories", "tasks", "gratitude"];

// Сохранить «акцент главной» пользователя (+ кастомный набор блоков).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const preset = String(body?.preset || "");
  if (!PRESETS.includes(preset)) return NextResponse.json({ ok: false }, { status: 400 });

  const update: any = { home_preset: preset };
  if (Array.isArray(body?.blocks)) {
    update.home_blocks = JSON.stringify(body.blocks.filter((b: any) => BLOCK_KEYS.includes(b)));
  }

  try {
    await supabaseAdmin().from("users").update(update).eq("id", user.id);
  } catch {
    return NextResponse.json({ ok: false, error: "no_column" }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
