import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncGoogleHealth, disconnectGoogleHealth } from "@/lib/googleHealth";

export const runtime = "nodejs";
export const maxDuration = 60;

// «Обновить сейчас».
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const saved = await syncGoogleHealth(user.id, 7);
  if (saved < 0) return NextResponse.json({ ok: false, error: "not_connected" }, { status: 400 });
  return NextResponse.json({ ok: true, saved });
}

// «Отключить».
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  await disconnectGoogleHealth(user.id);
  return NextResponse.json({ ok: true });
}
