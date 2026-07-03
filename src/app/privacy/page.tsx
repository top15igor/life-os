import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { privacyContent } from "@/lib/privacy";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const locale = await getLocale();
  const p = privacyContent(locale);

  // Своя светлая палитра (в тон лендингу /about и странице входа), не зависит от темы посетителя.
  const shell = {
    ["--bg" as any]: "#f7f8fc",
    ["--surface" as any]: "#ffffff",
    ["--surface-2" as any]: "#eef1f8",
    ["--text" as any]: "#14161c",
    ["--text-2" as any]: "#4a5261",
    ["--text-3" as any]: "#8b93a3",
    ["--border" as any]: "rgba(20,24,40,0.08)",
    ["--accent" as any]: "#5b5bf5",
    ["--accent-bg" as any]: "#edecff",
    ["--accent-text" as any]: "#4338ca",
    ["--shadow" as any]: "0 1px 2px rgba(20,24,40,0.05), 0 12px 32px -20px rgba(20,24,40,0.18)",
    colorScheme: "light",
    color: "var(--text)",
    minHeight: "100dvh",
    background:
      "radial-gradient(720px 420px at 18% -12%, rgba(124,92,246,0.20), transparent 60%)," +
      "radial-gradient(720px 420px at 84% -8%, rgba(91,91,245,0.16), transparent 60%)," +
      "#f7f8fc",
  } as React.CSSProperties;

  return (
    <div style={shell}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 22px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <i className="ti ti-lock" style={{ fontSize: 26, color: "var(--accent)" }} />
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>{p.title}</h1>
      </div>
      <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.6, marginTop: 0, marginBottom: 24 }}>{p.intro}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
        {p.points.map((pt, i) => (
          <div key={i} className="card" style={{ display: "flex", gap: 13 }}>
            <i className={`ti ${pt.icon}`} style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{pt.title}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>{pt.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ background: "var(--surface-2)", border: "none", fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 24, display: "flex", gap: 9 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} />
        <span>{p.note}</span>
      </div>

      <a href="https://github.com/top15igor/life-os" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 15px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14, textDecoration: "none", marginBottom: 24 }}>
        <i className="ti ti-brand-github" style={{ fontSize: 20 }} />
        <span style={{ flex: 1 }}>github.com/top15igor/life-os</span>
        <i className="ti ti-external-link" style={{ fontSize: 16, color: "var(--text-3)" }} />
      </a>

      <Link href="/" style={{ fontSize: 14, color: "var(--accent)", fontWeight: 500 }}>← {p.back}</Link>
      </div>
    </div>
  );
}
