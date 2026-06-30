import { headers } from "next/headers";
import LogoutOthers from "@/components/LogoutOthers";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { CopyLink } from "@/components/ProfileActions";
import UsernameEditor from "@/components/UsernameEditor";
import LoginMethods from "@/components/LoginMethods";
import { getHandle } from "@/lib/handle";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const STR: Record<string, { title: string; back: string; yourLink: string; linkHint: string }> = {
  ru: { title: "Аккаунт и вход", back: "Профиль", yourLink: "Твоя личная ссылка", linkHint: "Сохрани её — по ней ты входишь в свой дневник на любом устройстве." },
  en: { title: "Account & sign-in", back: "Profile", yourLink: "Your personal link", linkHint: "Save it — it's how you sign in to your diary on any device." },
  uk: { title: "Акаунт і вхід", back: "Профіль", yourLink: "Твоє особисте посилання", linkHint: "Збережи його — за ним ти входиш у щоденник на будь-якому пристрої." },
  fr: { title: "Compte et connexion", back: "Profil", yourLink: "Ton lien personnel", linkHint: "Garde-le — c'est ainsi que tu te connectes sur n'importe quel appareil." },
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ linked?: string; e?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;
  const notice = sp.linked ? "linked" : sp.e === "emailtaken" ? "emailtaken" : undefined;

  const hdrs = await headers();
  const host = hdrs.get("host") || "mylifebookai.vercel.app";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host}`;
  const handle = await getHandle(user.id, user.name);

  // Ссылка входа = текущий ОДНОРАЗОВЫЙ код (users.token), а не cookie (там теперь session_secret).
  let email: string | null = null;
  let loginToken = "";
  try {
    const { data } = await supabaseAdmin().from("users").select("email, token").eq("id", user.id).maybeSingle();
    email = (data as any)?.email || null;
    loginToken = (data as any)?.token || "";
  } catch { /* дефолт */ }
  const link = `${proto}://${host}/u/${loginToken}`;

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 560 }}>
          <Link href="/profile" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", textDecoration: "none", marginBottom: 14 }}>
            <i className="ti ti-chevron-left" style={{ fontSize: 16 }} />{s.back}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
            <i className="ti ti-user-circle" style={{ fontSize: 24, color: "var(--accent)" }} />
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{s.title}</h1>
          </div>

          {/* Личная ссылка — только тем, у кого нет почты/Google (для них это единственный вход) */}
          {!email && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{s.yourLink}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 11, lineHeight: 1.5 }}>{s.linkHint}</div>
              <CopyLink link={link} locale={locale} />
            </div>
          )}

          <UsernameEditor locale={locale} baseUrl={baseUrl} initialHandle={handle} />
          <LoginMethods locale={locale} hasTelegram={!!user.chat_id} email={email} notice={notice} />
          <LogoutOthers locale={locale} />
        </div>
      </main>
    </div>
  );
}
