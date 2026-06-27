import AuthForm from "@/components/AuthForm";
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

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const botLink = await getBotLink();
  const googleEnabled = !!process.env.GOOGLE_CLIENT_ID;

  return (
    <AuthForm
      locale={locale}
      botLink={botLink}
      googleEnabled={googleEnabled}
      initialError={sp.e === "google" ? "google" : undefined}
    />
  );
}
