import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Отметить задачу выполненной/невыполненной (только свою).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  const done = Boolean(body?.done);
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  const { error } = await supabaseAdmin().from("tasks").update({ done }).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
