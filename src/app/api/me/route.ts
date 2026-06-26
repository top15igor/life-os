import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getInviteCode } from "@/lib/users";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

export async function GET() {
  const user = await getCurrentUser();
  const refCode = user ? await getInviteCode(user.id) : null;
  return NextResponse.json({ isOwner: user?.id === OWNER, ref: user?.id || null, refCode });
}
