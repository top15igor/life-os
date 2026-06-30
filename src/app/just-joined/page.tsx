import JustJoined from "@/components/JustJoined";

export const dynamic = "force-dynamic";

// Resolve the bot's public link (same approach as the onboarding /welcome page).
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

export default async function JustJoinedPage() {
  const botLink = await getBotLink();
  return <JustJoined botLink={botLink} />;
}
