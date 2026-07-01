import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStreak } from "@/lib/queries";
import { getHandle } from "@/lib/handle";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

// Lightweight header data for the native app's feed: greeting name, streak, total,
// plus owner flag (admin access) and the personal invite link.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const [streak, countRes, handle] = await Promise.all([
    getStreak(user.id).catch(() => 0),
    supabaseAdmin().from("entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    getHandle(user.id, user.name).catch(() => null),
  ]);

  return NextResponse.json({
    ok: true,
    name: user.name,
    streak,
    total: countRes.count || 0,
    isOwner: user.id === OWNER,
    inviteLink: handle ? `https://mylifebookai.vercel.app/i/${handle}` : null,
  });
}
