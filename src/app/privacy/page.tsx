import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { PUBLIC_LIGHT_AURORA } from "@/lib/publicShell";
import { privacyContent } from "@/lib/privacy";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const locale = await getLocale();
  const isAuthed = !!(await getCurrentUser());
  const p = privacyContent(locale);

  // Своя светлая палитра (в тон лендингу /about и странице входа), не зависит от темы посетителя.
  const shell = PUBLIC_LIGHT_AURORA;

  // Локальная «карточка» вместо глобального .card: тот класс в тёмной теме
  // красится жёстко (html[data-theme=dark] .card), а эта страница всегда светлая.
  const card: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "15px 17px",
    boxShadow: "var(--shadow)",
  };

  return (
    <div style={shell}>
      <PublicHeader locale={locale} isAuthed={isAuthed} width={640} />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 22px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <i className="ti ti-lock" style={{ fontSize: 26, color: "var(--accent)" }} />
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>{p.title}</h1>
      </div>
      <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.6, marginTop: 0, marginBottom: 24 }}>{p.intro}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
        {p.points.map((pt, i) => (
          <div key={i} style={{ ...card, display: "flex", gap: 13 }}>
            <i className={`ti ${pt.icon}`} style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{pt.title}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>{pt.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...card, background: "var(--surface-2)", border: "none", fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 24, display: "flex", gap: 9 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} />
        <span>{p.note}</span>
      </div>

      {/* Формальный документ: его адрес отдаём в App Store и Google OAuth-верификацию. */}
      <Link href="/privacy/policy" style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 15px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14, textDecoration: "none", marginBottom: 12 }}>
        <i className="ti ti-file-text" style={{ fontSize: 20, color: "var(--accent)" }} />
        <span style={{ flex: 1 }}>{p.legal}</span>
        <i className="ti ti-chevron-right" style={{ fontSize: 16, color: "var(--text-3)" }} />
      </Link>

      <a href="https://github.com/top15igor/life-os" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 15px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14, textDecoration: "none", marginBottom: 24 }}>
        <i className="ti ti-brand-github" style={{ fontSize: 20 }} />
        <span style={{ flex: 1 }}>github.com/top15igor/life-os</span>
        <i className="ti ti-external-link" style={{ fontSize: 16, color: "var(--text-3)" }} />
      </a>

      {/* «На главную» = лендинг-презентация, а не приложение: залогиненный
          пользователь со страницы «Приватность» не должен внезапно попадать в аккаунт. */}
      <Link href="/about" style={{ fontSize: 14, color: "var(--accent)", fontWeight: 500 }}>← {p.back}</Link>
      </div>
      <PublicFooter locale={locale} width={640} />
    </div>
  );
}
