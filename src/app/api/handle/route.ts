import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isValidHandle, isHandleAvailable, setHandle, normalizeHandle } from "@/lib/handle";

export const runtime = "nodejs";

// Проверка доступности @username (живой ввод): /api/handle?u=igor
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const raw = normalizeHandle(req.nextUrl.searchParams.get("u") || "");
  const valid = isValidHandle(raw);
  const available = valid ? await isHandleAvailable(raw, user.id) : false;
  return NextResponse.json({ ok: true, valid, available, handle: raw });
}

// Сохранить новый @username.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const res = await setHandle(user.id, String(body?.handle || ""));
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}
