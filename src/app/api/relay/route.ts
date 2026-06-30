import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { sendRelayToUser } from "@/lib/relay";

export const runtime = "nodejs";

// Веб: отправить сообщение контакту по его id (кнопка «написать» в «Мои приглашённые»).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const targetId = String(body?.targetId || "");
  const message = String(body?.message || "");
  if (!targetId || !message.trim()) return NextResponse.json({ ok: false, error: "bad_args" }, { status: 400 });
  const locale = await getLocale();
  const r = await sendRelayToUser({ id: user.id, name: user.name ?? null }, targetId, message, locale);
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
