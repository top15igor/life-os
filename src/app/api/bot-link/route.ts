import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Публичная ссылка на Telegram-бота (username берём из getMe). Для кнопки в приложении.
let cache: string | null = null;

export async function GET() {
  if (cache) return NextResponse.json({ ok: true, link: cache });
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const r = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((x) => x.json());
    cache = r?.result?.username ? `https://t.me/${r.result.username}` : "https://t.me";
  } catch {
    cache = "https://t.me";
  }
  return NextResponse.json({ ok: true, link: cache }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
