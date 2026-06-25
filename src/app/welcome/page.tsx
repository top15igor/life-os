import Onboarding from "@/components/Onboarding";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

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

export default async function WelcomePage() {
  const locale = await getLocale();
  const botLink = await getBotLink();
  return <Onboarding locale={locale} botLink={botLink} />;
}
