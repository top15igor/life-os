import Onboarding from "@/components/Onboarding";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

// Короткая реф-ссылка: mylifebookai.vercel.app/i/<code>
// Та же страница приветствия, что и /welcome, но с аккуратным URL.

async function getBotLink(): Promise<string> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return "https://t.me";
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getMe`, { cache: "no-store" }).then((x) => x.json());
    const u = r?.result?.username;
    return u ? `https://t.me/${u}` : "https://t.me";
  } catch {
    return "https://t.me";
  }
}

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const locale = await getLocale();
  let botLink = await getBotLink();
  if (code && /^[A-Za-z0-9-]{3,40}$/.test(code) && botLink.startsWith("https://t.me/")) {
    botLink += `?start=ref_${code}`;
  }
  return <Onboarding locale={locale} botLink={botLink} />;
}
