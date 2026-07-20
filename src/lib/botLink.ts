// Ссылка на Telegram-бота (юзернейм берём из getMe). Кэш в памяти процесса,
// чтобы не дёргать Telegram на каждый рендер главной.
let cached: { url: string; at: number } | null = null;

export async function getBotLink(startParam?: string): Promise<string> {
  const base = await botBase();
  return startParam ? `${base}?start=${encodeURIComponent(startParam)}` : base;
}

async function botBase(): Promise<string> {
  if (cached && Date.now() - cached.at < 60 * 60 * 1000) return cached.url;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return "https://t.me";
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getMe`, { cache: "no-store" }).then((x) => x.json());
    const url = r?.result?.username ? `https://t.me/${r.result.username}` : "https://t.me";
    cached = { url, at: Date.now() };
    return url;
  } catch {
    return "https://t.me";
  }
}
