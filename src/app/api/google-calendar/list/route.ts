import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listCalendars } from "@/lib/googleCalendar";

export const runtime = "nodejs";

// GET: the current user's writable Google calendars (for the target picker).
export async function GET() {
  const user = await requireUser();
  const calendars = await listCalendars(user.id);
  return NextResponse.json({ ok: true, calendars });
}
