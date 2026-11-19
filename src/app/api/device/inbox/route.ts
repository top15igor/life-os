import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listInbox } from "@/lib/devices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Журнал всегда-слушающего устройства: что пришло, что сохранилось,
// а что отсеялось и по какой причине.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const deviceId = req.nextUrl.searchParams.get("device") || undefined;
  return NextResponse.json({ ok: true, rows: await listInbox(user.id, deviceId) });
}
