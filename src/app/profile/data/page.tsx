import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import ProfileData from "@/components/ProfileData";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STR: Record<string, { title: string; back: string }> = {
  ru: { title: "Твои данные", back: "Профиль" },
  en: { title: "Your data", back: "Profile" },
  uk: { title: "Твої дані", back: "Профіль" },
  fr: { title: "Tes données", back: "Profil" },
};

export default async function DataPage() {
  await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 560 }}>
          <Link href="/profile" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", textDecoration: "none", marginBottom: 14 }}>
            <i className="ti ti-chevron-left" style={{ fontSize: 16 }} />{s.back}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
            <i className="ti ti-database" style={{ fontSize: 24, color: "var(--accent)" }} />
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{s.title}</h1>
          </div>
          <ProfileData locale={locale} />
        </div>
      </main>
    </div>
  );
}
