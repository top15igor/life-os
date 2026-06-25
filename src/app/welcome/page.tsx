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

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  let botLink = await getBotLink();
  const ref = sp.ref;
  // Реферал: передаём пригласившего в бота (start=ref_<id>).
  if (ref && /^[0-9a-f-]{36}$/i.test(ref) && botLink.startsWith("https://t.me/")) {
    botLink += `?start=ref_${ref}`;
  }
  return <Onboarding locale={locale} botLink={botLink} />;
}
