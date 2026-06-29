import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Одноразовая «кнопка подключения» бота к этому адресу.
// Открой в браузере:  https://ТВОЙ-САЙТ/api/setup-webhook?key=СЕКРЕТ
// где СЕКРЕТ = значение TELEGRAM_WEBHOOK_SECRET.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!secret || key !== secret) {
    return NextResponse.json({ ok: false, error: "Неверный ключ (key)." }, { status: 403 });
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
    message: tg.ok ? "✅ Бот подключён! Напиши боту в Telegram." : "Не удалось подключить — см. detail.",
    webhook: webhookUrl,
    detail: tg,
  });
}
