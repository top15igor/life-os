import Sidebar from "@/components/Sidebar";
import BackLink from "@/components/BackLink";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { botGuide } from "@/lib/botGuide";

export const dynamic = "force-dynamic";

async function getBotLink(): Promise<string> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return "https://t.me";
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getMe`, { cache: "no-store" }).then((x) => x.json());
    return r?.result?.username ? `https://t.me/${r.result.username}` : "https://t.me";
  } catch {
    return "https://t.me";
  }
}

export default async function BotGuidePage() {
  await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const d = botGuide(locale);
  const botLink = await getBotLink();

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 640 }}>
          <BackLink locale={locale} href="/guide" label={d.back} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <i className="ti ti-brand-telegram" style={{ fontSize: 28, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
            <h1 style={{ fontSize: 23, fontWeight: 600, margin: 0 }}>{d.title}</h1>
          </div>
          <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.6, marginTop: 0, marginBottom: 16 }}>{d.intro}</p>

          <a href={botLink} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 12, background: "var(--accent)", color: "#fff", fontSize: 14.5, fontWeight: 500, marginBottom: 22, textDecoration: "none" }}>
            <i className="ti ti-brand-telegram" style={{ fontSize: 18 }} />{d.openBot}
          </a>

          {d.sections.map((s, i) => (
            <div key={i} className="card" style={{ marginBottom: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: "var(--accent)" }} />
                </span>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{s.title}</div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 7 }}>
                {s.lines.map((line, j) => (
                  <li key={j} style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>{line}</li>
                ))}
              </ul>
            </div>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "22px 0 11px" }}>
            <span style={{ width: 4, height: 18, borderRadius: 2, background: "var(--accent)" }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>{d.cmdTitle}</span>
          </div>
          <div className="card" style={{ padding: "6px 14px", marginBottom: 30 }}>
            {d.cmds.map(([cmd, desc], i) => (
              <div key={cmd} style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "9px 0", borderTop: i ? "1px solid var(--border)" : "none", fontSize: 14 }}>
                <code style={{ background: "var(--surface-2)", padding: "2px 9px", borderRadius: 6, color: "var(--accent)", fontSize: 13, minWidth: 72, textAlign: "center" }}>{cmd}</code>
                <span style={{ color: "var(--text-2)", lineHeight: 1.5 }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
