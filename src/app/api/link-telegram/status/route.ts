import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Экран «Подключи бота» опрашивает этот эндпоинт: как только chat_id появился —
// связка прошла, можно впускать в портал.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, connected: false }, { status: 401 });
  return NextResponse.json({ ok: true, connected: user.chat_id != null });
}
