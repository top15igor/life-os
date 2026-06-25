import Sidebar from "@/components/Sidebar";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { guide } from "@/lib/guide";
import { requireUser } from "@/lib/auth";

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

function SectionTitle({ children }: { children: any }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, marginTop: 6 }}>
      <span style={{ width: 4, height: 19, borderRadius: 2, background: "var(--accent)" }} />
      <span style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{children}</span>
    </div>
  );
}

const SECTIONS: { key: string; icon: string; color: string; label?: string }[] = [
  { key: "today", icon: "ti-home", color: "var(--accent)" },
  { key: "diary", icon: "ti-book", color: "var(--accent)" },
  { key: "health", icon: "ti-heartbeat", color: "#ef4444" },
  { key: "analytics", icon: "ti-chart-line", color: "#3b82f6" },
  { key: "insights", icon: "ti-bulb", color: "var(--energy)" },
  { key: "people", icon: "ti-user-heart", color: "#ec4899" },
  { key: "projects", icon: "ti-briefcase", color: "#3b82f6" },
  { key: "biographer", icon: "ti-messages", color: "var(--insight)" },
  { key: "intelligence", icon: "ti-brain", color: "var(--insight)", label: "Life Intelligence" },
];

export default async function GuidePage() {
  await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const g = guide(locale);
  const botLink = await getBotLink();

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
          <i className="ti ti-book-2" style={{ fontSize: 24, color: "var(--accent)" }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{g.title}</h1>
        </div>
        <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.6, marginTop: 0, marginBottom: 16, maxWidth: 620 }}>{g.pitch}</p>

        <a href={botLink} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 12, background: "var(--accent)", color: "#fff", fontSize: 14.5, fontWeight: 500, marginBottom: 26 }}>
          <i className="ti ti-brand-telegram" style={{ fontSize: 18 }} />{g.openBot}
        </a>

        {/* Что это */}
        <SectionTitle>{g.whatTitle}</SectionTitle>
        <div className="card" style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 14.5, lineHeight: 1.65 }}>{g.what}</div>
        </div>

        {/* Как пользоваться */}
        <SectionTitle>{g.howTitle}</SectionTitle>
        <div style={{ marginBottom: 26 }}>
          {g.how.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 13, marginBottom: 12, alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>{i + 1}</span>
              <span style={{ fontSize: 14.5, lineHeight: 1.6, paddingTop: 2 }}>{step}</span>
            </div>
          ))}
        </div>

        {/* Бот-ассистент */}
        <SectionTitle>{g.assistantTitle}</SectionTitle>
        <div className="card" style={{ marginBottom: 26 }}>
          {g.assistant.map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 11, marginBottom: i === g.assistant.length - 1 ? 0 : 11, alignItems: "flex-start" }}>
              <i className="ti ti-message-chatbot" style={{ fontSize: 17, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 14, lineHeight: 1.6 }}>{line}</span>
            </div>
          ))}
        </div>

        {/* Команды */}
        <SectionTitle>{g.cmdTitle}</SectionTitle>
        <div className="card" style={{ marginBottom: 26, padding: "6px 14px" }}>
          {g.cmds.map(([cmd, desc], i) => (
            <div key={cmd} style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "9px 0", borderTop: i ? "1px solid var(--border)" : "none", fontSize: 14 }}>
              <code style={{ background: "var(--surface-2)", padding: "2px 9px", borderRadius: 6, color: "var(--accent)", fontSize: 13, minWidth: 64 }}>{cmd}</code>
              <span style={{ color: "var(--text-2)" }}>{desc}</span>
            </div>
          ))}
        </div>

        {/* Разделы */}
        <SectionTitle>{g.sectionsTitle}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10, marginBottom: 26 }}>
          {SECTIONS.map((sec) => (
            <div key={sec.key} className="card" style={{ display: "flex", gap: 11 }}>
              <i className={`ti ${sec.icon}`} style={{ fontSize: 20, color: sec.color, flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{sec.label || t.nav[sec.key]}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>{h[sec.key]}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Лайфхаки */}
        <SectionTitle>{g.lifehacksTitle}</SectionTitle>
        <div style={{ marginBottom: 26 }}>
          {g.lifehacks.map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 11, marginBottom: 11, alignItems: "flex-start" }}>
              <i className="ti ti-bulb" style={{ fontSize: 17, color: "var(--energy)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 14.5, lineHeight: 1.6 }}>{tip}</span>
            </div>
          ))}
        </div>

        {/* Приватность */}
        <div className="card" style={{ background: "var(--surface-2)", border: "none", display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
          <i className="ti ti-shield-lock" style={{ fontSize: 20, color: "var(--positive)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{g.privacyTitle}</div>
            <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>{g.privacy}</div>
            <a href="/privacy" style={{ fontSize: 12.5, color: "var(--accent)", display: "inline-block", marginTop: 7 }}>
              {locale === "en" ? "Read more" : locale === "uk" ? "Детальніше" : locale === "fr" ? "En savoir plus" : "Подробнее"} →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
