import { headers, cookies } from "next/headers";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import LangSwitcher from "@/components/LangSwitcher";
import { CopyLink, ProfileButtons } from "@/components/ProfileActions";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STR: Record<string, any> = {
  ru: { title: "Профиль", privateT: "Это твой личный кабинет", privateS: "Дневник виден только тебе — по этой личной ссылке. Никто другой его не видит, и в публичном доступе его нет.", yourLink: "Твоя личная ссылка", linkHint: "Сохрани её — по ней ты входишь в свой дневник на любом устройстве.", language: "Язык", privacy: "Подробнее о приватности", danger: "Управление аккаунтом" },
  en: { title: "Profile", privateT: "This is your private space", privateS: "Your diary is visible only to you — via this personal link. No one else can see it, and it's not public.", yourLink: "Your personal link", linkHint: "Save it — it's how you sign in to your diary on any device.", language: "Language", privacy: "More about privacy", danger: "Account" },
  uk: { title: "Профіль", privateT: "Це твій особистий кабінет", privateS: "Щоденник бачиш лише ти — за цим особистим посиланням. Ніхто інший його не бачить, і в публічному доступі його немає.", yourLink: "Твоє особисте посилання", linkHint: "Збережи його — за ним ти входиш у щоденник на будь-якому пристрої.", language: "Мова", privacy: "Докладніше про приватність", danger: "Керування акаунтом" },
  fr: { title: "Profil", privateT: "C'est ton espace privé", privateS: "Ton journal n'est visible que par toi — via ce lien personnel. Personne d'autre ne le voit, il n'est pas public.", yourLink: "Ton lien personnel", linkHint: "Garde-le — c'est ainsi que tu te connectes sur n'importe quel appareil.", language: "Langue", privacy: "En savoir plus sur la confidentialité", danger: "Compte" },
};

export default async function ProfilePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;

  const hdrs = await headers();
  const host = hdrs.get("host") || "mylifebookai.vercel.app";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const token = (await cookies()).get("lifeos_token")?.value || "";
  const link = `${proto}://${host}/u/${token}`;
  const initial = (user.name || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 22 }}>
            <span style={{ width: 52, height: 52, borderRadius: 99, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600 }}>{initial}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{user.name || "—"}</div>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>{s.title} · LIFE OS</div>
            </div>
          </div>

          {/* Приватность — главная плашка */}
          <div className="card" style={{ display: "flex", gap: 13, marginBottom: 16, background: "var(--surface-2)", border: "none" }}>
            <i className="ti ti-lock" style={{ fontSize: 24, color: "var(--positive)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{s.privateT}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55 }}>{s.privateS}</div>
              <Link href="/privacy" style={{ fontSize: 12.5, color: "var(--accent)", display: "inline-block", marginTop: 8 }}>{s.privacy} →</Link>
            </div>
          </div>

          {/* Личная ссылка */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{s.yourLink}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 11, lineHeight: 1.5 }}>{s.linkHint}</div>
            <CopyLink link={link} locale={locale} />
          </div>

          {/* Язык */}
          <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{s.language}</span>
            <LangSwitcher current={locale} />
          </div>

          {/* Управление */}
          <div style={{ fontSize: 13, color: "var(--text-2)", margin: "20px 0 10px" }}>{s.danger}</div>
          <ProfileButtons locale={locale} />
        </div>
      </main>
    </div>
  );
}
