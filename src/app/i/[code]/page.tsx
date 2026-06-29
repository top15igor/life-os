import Onboarding from "@/components/Onboarding";
import Sidebar from "@/components/Sidebar";
import ProfileBody from "@/components/ProfileBody";
import { getCurrentUser } from "@/lib/auth";
import { resolveRefToId } from "@/lib/users";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Умная ссылка-имя: mylifebookai.vercel.app/i/<username>
//  - владелец (вошёл в свой аккаунт)  -> открывается его профиль (как @имя в Instagram);
//  - кто угодно другой / гость         -> экран приветствия с переходом в бота (приглашение).

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

  // Если это сам владелец ссылки и он вошёл — показываем его профиль (URL остаётся /i/<username>).
  const me = await getCurrentUser();
  if (me) {
    const ownerId = await resolveRefToId(code);
    if (ownerId && ownerId === me.id) {
      const t = getDict(locale);
      return (
        <div className="shell">
          <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
          <main className="main">
            <ProfileBody user={me} locale={locale} />
          </main>
        </div>
      );
    }
  }

  // Иначе — приветствие/приглашение (как было).
  let botLink = await getBotLink();
  if (code && /^[A-Za-z0-9-]{3,40}$/.test(code) && botLink.startsWith("https://t.me/")) {
    botLink += `?start=ref_${code}`;
  }
  return <Onboarding locale={locale} botLink={botLink} />;
}
