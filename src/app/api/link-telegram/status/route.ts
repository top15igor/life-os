import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Экран «Подключи бота» опрашивает этот эндпоинт: как только chat_id появился —
// связка прошла, можно впускать в портал.
//
// ?soft=1 — для плашки в шапке: она висит в общем макете и спрашивает статус на
// каждой странице, включая лендинг. Гостю обычный ответ 401 оставлял красную
// ошибку в консоли на каждой публичной странице. В мягком режиме гость получает
// спокойное «неизвестно»; обычный вызов (экран подключения) ведёт себя как раньше.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    if (req.nextUrl.searchParams.get("soft") === "1") return NextResponse.json({ ok: false, connected: null });
    return NextResponse.json({ ok: false, connected: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, connected: user.chat_id != null });
}
