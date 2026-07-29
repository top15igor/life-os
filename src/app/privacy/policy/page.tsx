import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { PUBLIC_LIGHT_AURORA } from "@/lib/publicShell";
import { policyContent, POLICY_EMAIL } from "@/lib/privacyPolicy";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("policy", "/privacy/policy");
}

// Формальная версия политики. Публичная (middleware пропускает всё, что начинается с /privacy).
// Именно этот адрес отдаём в App Store Connect и в Google OAuth-верификацию.
export default async function PrivacyPolicyPage() {
  const locale = await getLocale();
  const isAuthed = !!(await getCurrentUser());
  const p = policyContent(locale);

  // Своя светлая палитра — как на /privacy: страница не зависит от темы посетителя.
  const shell = PUBLIC_LIGHT_AURORA;

  const para: React.CSSProperties = { fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.65, margin: "0 0 10px" };

  return (
    <div style={shell}>
      <PublicHeader locale={locale} isAuthed={isAuthed} width={680} />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 22px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <i className="ti ti-file-text" style={{ fontSize: 26, color: "var(--accent)" }} />
          <h1 style={{ fontSize: 27, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>{p.title}</h1>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 14 }}>LIFE OS · life-os.today · {p.updated}</div>
        <p style={{ fontSize: 15.5, color: "var(--text-2)", lineHeight: 1.65, marginTop: 0, marginBottom: 16 }}>{p.intro}</p>

        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 26 }}>
          <Link
            href="/privacy"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, textDecoration: "none" }}
          >
            <i className="ti ti-lock" style={{ fontSize: 17, color: "var(--accent)" }} />
            <span>{p.friendly}</span>
          </Link>
          <Link
            href="/terms"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, textDecoration: "none" }}
          >
            <i className="ti ti-scale" style={{ fontSize: 17, color: "var(--accent)" }} />
            <span>{p.termsLink}</span>
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {p.sections.map((s, i) => (
            <section key={i}>
              <h2 style={{ fontSize: 16.5, fontWeight: 600, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{s.h}</h2>
              {s.blocks.map((b, j) =>
                "p" in b ? (
                  <p key={j} style={para}>{b.p}</p>
                ) : (
                  <ul key={j} style={{ ...para, paddingLeft: 20, margin: "0 0 10px" }}>
                    {b.ul.map((li, k) => (
                      <li key={k} style={{ marginBottom: 6 }}>{li}</li>
                    ))}
                  </ul>
                )
              )}
            </section>
          ))}
        </div>

        <div style={{ marginTop: 28, padding: "13px 15px", borderRadius: 12, background: "var(--surface-2)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
          <a href={`mailto:${POLICY_EMAIL}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{POLICY_EMAIL}</a>
          {" · "}
          <a href="https://github.com/top15igor/life-os" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>github.com/top15igor/life-os</a>
        </div>

        <div style={{ marginTop: 22 }}>
          <Link href="/privacy" style={{ fontSize: 14, color: "var(--accent)", fontWeight: 500 }}>← {p.back}</Link>
        </div>
      </div>
      <PublicFooter locale={locale} width={680} />
    </div>
  );
}
