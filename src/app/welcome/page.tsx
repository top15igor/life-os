import Onboarding from "@/components/Onboarding";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

// Страница-«сирота»: слайд-онбординг. На неё намеренно НИЧЕГО не ведёт (гость
// с корня/приглашения видит презентацию сайта), но она открывается по прямому
// адресу /welcome — оставлена как есть, на будущее / для проверки.
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
  if (ref && /^[A-Za-z0-9-]{3,40}$/.test(ref) && botLink.startsWith("https://t.me/")) {
    botLink += `?start=ref_${ref}`;
  }
  return <Onboarding locale={locale} botLink={botLink} />;
}
