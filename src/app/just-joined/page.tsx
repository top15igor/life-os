import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { issueTgLinkToken } from "@/lib/users";
import ConnectBot from "@/components/ConnectBot";

export const dynamic = "force-dynamic";

// Публичная ссылка бота (как на /welcome).
async function getBotBase(): Promise<string> {
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

// Экран сразу после регистрации: подключить бота (главный способ ввода).
// Если бот уже привязан — пропускаем в портал.
export default async function JustJoinedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.chat_id != null) redirect("/");

  const [base, linkToken] = await Promise.all([getBotBase(), issueTgLinkToken(user.id)]);
  const deepLink = linkToken ? `${base}?start=link_${linkToken}` : base;

  return <ConnectBot deepLink={deepLink} />;
}
