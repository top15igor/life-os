import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createDevice, deleteDevice, rotateDevice, listDevices } from "@/lib/devices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Управление носимыми устройствами из «Профиль → Мои устройства».
// Вход по сессии (в отличие от /api/device/voice, куда стучится само устройство).

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, devices: await listDevices(user.id) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const device = await createDevice(user.id, String(body?.name || ""), String(body?.kind || "other"));
  if (!device) return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, device });
}

// Перевыпустить токен (потерял брелок — старый ключ мгновенно мёртв).
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const device = await rotateDevice(user.id, String(body?.id || ""));
  if (!device) return NextResponse.json({ ok: false, error: "rotate_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, device });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id") || "";
  const ok = await deleteDevice(user.id, id);
  return NextResponse.json({ ok });
}
