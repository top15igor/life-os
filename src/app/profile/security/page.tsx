import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import ProfileSecurity from "@/components/ProfileSecurity";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const STR: Record<string, { title: string; back: string }> = {
  ru: { title: "Безопасность", back: "Профиль" },
  en: { title: "Security", back: "Profile" },
  uk: { title: "Безпека", back: "Профіль" },
  fr: { title: "Sécurité", back: "Profil" },
};

export default async function SecurityPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;

  let hasPin = false;
  let email: string | null = null;
  try {
    const { data } = await supabaseAdmin().from("users").select("pin_hash, email").eq("id", user.id).maybeSingle();
    hasPin = !!data?.pin_hash;
    email = (data as any)?.email || null;
  } catch { /* дефолты */ }

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 560 }}>
          <Link href="/profile" className="app-back" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", textDecoration: "none", marginBottom: 14 }}>
            <i className="ti ti-chevron-left" style={{ fontSize: 16 }} />{s.back}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
            <i className="ti ti-shield-lock" style={{ fontSize: 24, color: "var(--positive)" }} />
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{s.title}</h1>
          </div>
          <ProfileSecurity locale={locale} hasPin={hasPin} email={email} />
        </div>
      </main>
    </div>
  );
}
