import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStreak } from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Lightweight header data for the native app's feed: greeting name, streak, total.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const [streak, countRes] = await Promise.all([
    getStreak(user.id).catch(() => 0),
    supabaseAdmin().from("entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return NextResponse.json({
    ok: true,
    name: user.name,
    streak,
    total: countRes.count || 0,
  });
}
