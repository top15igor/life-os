import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { setRefreshToken } from "@/lib/googleCalendar";

export const runtime = "nodejs";

// Disconnect: forget the stored refresh token. Existing events stay in the
// user's Google Calendar; we just stop creating/removing new ones.
export async function POST() {
  const user = await requireUser();
  await setRefreshToken(user.id, null);
  return NextResponse.json({ ok: true });
}
