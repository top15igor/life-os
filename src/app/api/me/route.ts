import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getInviteCode } from "@/lib/users";
import { getHandle } from "@/lib/handle";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

export async function GET() {
  const user = await getCurrentUser();
  const refCode = user ? await getInviteCode(user.id) : null;
  const handle = user ? await getHandle(user.id, user.name) : null;
  let tester = false;
  if (user) {
    try {
      const { data } = await supabaseAdmin().from("users").select("tester").eq("id", user.id).maybeSingle();
      tester = !!(data as any)?.tester;
    } catch {}
  }
  return NextResponse.json({ isOwner: user?.id === OWNER, tester, ref: user?.id || null, refCode, handle });
}
