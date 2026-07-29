import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import PublicHeader from "@/components/PublicHeader";
import { termsContent } from "@/lib/terms";
import { POLICY_EMAIL } from "@/lib/privacyPolicy";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "LIFE OS — Terms of Service",
  description: "Terms of service of LIFE OS: how the service works, account rules, plans and payment, liability.",
};

// Публичная страница (middleware пропускает /terms). Адрес отдаём в App Store Connect.
export default async function TermsPage() {
  const locale = await getLocale();
  const isAuthed = !!(await getCurrentUser());
  const t = termsContent(locale);

  // Своя светлая палитра — как на /privacy и /privacy/policy: не зависит от темы посетителя.
  const shell = {
    ["--bg" as any]: "#f7f8fc",
    ["--surface" as any]: "#ffffff",
    ["--surface-2" as any]: "#eef1f8",
    ["--text" as any]: "#14161c",
    ["--text-2" as any]: "#4a5261",
    ["--text-3" as any]: "#8b93a3",
    ["--border" as any]: "rgba(20,24,40,0.08)",
    ["--accent" as any]: "#5b5bf5",
    colorScheme: "light",
    color: "var(--text)",
    minHeight: "100dvh",
    background:
      "radial-gradient(720px 420px at 18% -12%, rgba(124,92,246,0.20), transparent 60%)," +
      "radial-gradient(720px 420px at 84% -8%, rgba(91,91,245,0.16), transparent 60%)," +
      "#f7f8fc",
  } as React.CSSProperties;

  const para: React.CSSProperties = { fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.65, margin: "0 0 10px" };

  return (
    <div style={shell}>
      <PublicHeader locale={locale} isAuthed={isAuthed} width={680} />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 22px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <i className="ti ti-scale" style={{ fontSize: 26, color: "var(--accent)" }} />
          <h1 style={{ fontSize: 27, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>{t.title}</h1>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 14 }}>LIFE OS · life-os.today · {t.updated}</div>
        <p style={{ fontSize: 15.5, color: "var(--text-2)", lineHeight: 1.65, marginTop: 0, marginBottom: 16 }}>{t.intro}</p>

        <Link
          href="/privacy/policy"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, textDecoration: "none", marginBottom: 26 }}
        >
          <i className="ti ti-lock" style={{ fontSize: 17, color: "var(--accent)" }} />
          <span>{t.privacyLink}</span>
        </Link>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {t.sections.map((s, i) => (
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
          <Link href="/about" style={{ fontSize: 14, color: "var(--accent)", fontWeight: 500 }}>← {t.back}</Link>
        </div>
      </div>
    </div>
  );
}
