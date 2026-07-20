import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const OWNER = process.env.OWNER_USER_ID || "00000000-0000-0000-0000-000000000000";

// «Кнопка подключения» бота к текущему адресу (перенацеливает Telegram webhook).
// Способы вызвать:
//   1) Владельцу — просто открыть https://ТВОЙ-САЙТ/api/setup-webhook , будучи залогиненным
//      (авторизация по сессии владельца, ключ не нужен).
//   2) Либо https://ТВОЙ-САЙТ/api/setup-webhook?key=СЕКРЕТ , где СЕКРЕТ = TELEGRAM_WEBHOOK_SECRET.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const token = process.env.TELEGRAM_BOT_TOKEN;

  // Доступ: либо верный ключ, либо залогиненный владелец (по сессии).
  const keyOk = !!secret && key === secret;
  let ownerOk = false;
  if (!keyOk) {
    try {
      const u = await getCurrentUser();
      ownerOk = !!u && u.id === OWNER;
    } catch { /* нет сессии — ownerOk останется false */ }
  }
  if (!keyOk && !ownerOk) {
    return NextResponse.json(
      { ok: false, error: "Нет доступа. Открой эту ссылку, войдя как владелец, либо добавь ?key=<TELEGRAM_WEBHOOK_SECRET>." },
      { status: 403 }
    );
  }
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Не задан TELEGRAM_WEBHOOK_SECRET в переменных окружения Vercel." },
      { status: 500 }
    );
  }
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Не задан TELEGRAM_BOT_TOKEN в переменных окружения Vercel." },
      { status: 500 }
    );
  }

  const webhookUrl = `${req.nextUrl.origin}/api/telegram`;
  const tg = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    }),
  }).then((r) => r.json());

  return NextResponse.json({
    ok: tg.ok === true,
    message: tg.ok ? "✅ Бот подключён к этому адресу! Напиши боту в Telegram." : "Не удалось подключить — см. detail.",
    via: keyOk ? "key" : "owner-session",
    webhook: webhookUrl,
    detail: tg,
  });
}
