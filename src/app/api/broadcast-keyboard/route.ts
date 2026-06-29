import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/telegram";
import { mainKeyboard } from "@/lib/botKeyboard";
import { broadcastKeyboard } from "@/lib/broadcastKeyboard";

export const runtime = "nodejs";
export const maxDuration = 60;

// Разовая рассылка для обновления клавиатуры у всех пользователей.
// Удобнее запускать командой /pushmenu прямо в боте (только владелец) —
// этот эндпоинт оставлен как запасной путь.
//
//   GET /api/broadcast-keyboard?key=<TELEGRAM_WEBHOOK_SECRET>          — всем
//   GET /api/broadcast-keyboard?key=<...>&test=1                       — только владельцу
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Безопасный самотест: отправить только владельцу.
  if (req.nextUrl.searchParams.get("test") !== null) {
    const chat = process.env.TELEGRAM_ALLOWED_CHAT_ID;
    if (!chat) return NextResponse.json({ ok: false, error: "no TELEGRAM_ALLOWED_CHAT_ID" });
    await sendMessage(Number(chat), "✨ Обновили меню! Проверка кнопок 🙂", { reply_markup: mainKeyboard("ru") });
    return NextResponse.json({ ok: true, test: true });
  }

  const res = await broadcastKeyboard();
  return NextResponse.json({ ok: true, ...res });
}
