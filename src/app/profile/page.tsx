import { headers, cookies } from "next/headers";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import LangSwitcher from "@/components/LangSwitcher";
import { CopyLink, ProfileButtons, PinSettings } from "@/components/ProfileActions";
import HomePresetPicker from "@/components/HomePresetPicker";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const STR: Record<string, any> = {
  ru: { title: "Профиль", privateT: "Это твой личный кабинет", privateS: "Дневник виден только тебе — по этой личной ссылке. Никто другой его не видит, и в публичном доступе его нет.", yourLink: "Твоя личная ссылка", linkHint: "Сохрани её — по ней ты входишь в свой дневник на любом устройстве.", language: "Язык", privacy: "Подробнее о приватности", yourData: "Твои данные", exportBtn: "Скачать мои данные", exportHint: "Все твои записи в одном файле — забери в любой момент. А код LIFE OS открыт: можешь сам проверить, что мы делаем с данными.", openCode: "Открытый код на GitHub", accent: "Акцент главной", security: "Безопасность", danger: "Управление аккаунтом" },
  en: { title: "Profile", privateT: "This is your private space", privateS: "Your diary is visible only to you — via this personal link. No one else can see it, and it's not public.", yourLink: "Your personal link", linkHint: "Save it — it's how you sign in to your diary on any device.", language: "Language", privacy: "More about privacy", yourData: "Your data", exportBtn: "Download my data", exportHint: "All your entries in one file — take them anytime. And the LIFE OS code is open: check for yourself what we do with data.", openCode: "Open source on GitHub", accent: "Home accent", security: "Security", danger: "Account" },
  uk: { title: "Профіль", privateT: "Це твій особистий кабінет", privateS: "Щоденник бачиш лише ти — за цим особистим посиланням. Ніхто інший його не бачить, і в публічному доступі його немає.", yourLink: "Твоє особисте посилання", linkHint: "Збережи його — за ним ти входиш у щоденник на будь-якому пристрої.", language: "Мова", privacy: "Докладніше про приватність", yourData: "Твої дані", exportBtn: "Завантажити мої дані", exportHint: "Усі твої записи в одному файлі — забери будь-коли. А код LIFE OS відкритий: можеш сам перевірити, що ми робимо з даними.", openCode: "Відкритий код на GitHub", accent: "Акцент головної", security: "Безпека", danger: "Керування акаунтом" },
  fr: { title: "Profil", privateT: "C'est ton espace privé", privateS: "Ton journal n'est visible que par toi — via ce lien personnel. Personne d'autre ne le voit, il n'est pas public.", yourLink: "Ton lien personnel", linkHint: "Garde-le — c'est ainsi que tu te connectes sur n'importe quel appareil.", language: "Langue", privacy: "En savoir plus sur la confidentialité", yourData: "Tes données", exportBtn: "Télécharger mes données", exportHint: "Toutes tes entrées en un fichier — récupère-les quand tu veux. Et le code de LIFE OS est ouvert : vérifie toi-même ce qu'on fait des données.", openCode: "Code source sur GitHub", accent: "Accent de l'accueil", security: "Sécurité", danger: "Compte" },
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

  let hasPin = false;
  let homePreset = "mindful";
  try {
    const { data } = await supabaseAdmin().from("users").select("pin_hash, home_preset").eq("id", user.id).maybeSingle();
    hasPin = !!data?.pin_hash;
    if (data?.home_preset) homePreset = data.home_preset;
  } catch {}

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

          {/* Акцент главной */}
          <div style={{ fontSize: 13, color: "var(--text-2)", margin: "20px 0 10px" }}>{s.accent}</div>
          <HomePresetPicker current={homePreset} locale={locale} />

          {/* Твои данные */}
          <div style={{ fontSize: 13, color: "var(--text-2)", margin: "20px 0 10px" }}>{s.yourData}</div>
          <div className="card">
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12, lineHeight: 1.55 }}>{s.exportHint}</div>
            <a href="/api/export" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 11, background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", marginBottom: 9 }}>
              <i className="ti ti-download" style={{ fontSize: 17 }} />{s.exportBtn}
            </a>
            <a href="https://github.com/top15igor/life-os" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, textDecoration: "none" }}>
              <i className="ti ti-brand-github" style={{ fontSize: 16 }} />{s.openCode}
            </a>
          </div>

          {/* Безопасность */}
          <div style={{ fontSize: 13, color: "var(--text-2)", margin: "20px 0 10px" }}>{s.security}</div>
          <PinSettings locale={locale} hasPin={hasPin} />

          {/* Управление */}
          <div style={{ fontSize: 13, color: "var(--text-2)", margin: "20px 0 10px" }}>{s.danger}</div>
          <ProfileButtons locale={locale} />
        </div>
      </main>
    </div>
  );
}
