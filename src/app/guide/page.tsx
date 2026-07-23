import Sidebar from "@/components/Sidebar";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { guide } from "@/lib/guide";
import { guideExtras, upcoming } from "@/lib/guideExtras";
import GuidePanels from "@/components/GuidePanels";
import GuideAccordion, { type AccItem } from "@/components/GuideAccordion";
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

const SECTIONS: { key: string; icon: string; color: string; label?: string }[] = [
  { key: "today", icon: "ti-home", color: "var(--accent)" },
  { key: "diary", icon: "ti-book", color: "var(--accent)" },
  { key: "wellness", icon: "ti-heartbeat", color: "#ef4444" },
  { key: "plans", icon: "ti-target", color: "#3b82f6" },
  { key: "knowledge", icon: "ti-bookmarks", color: "#0ea5e9" },
  { key: "memory", icon: "ti-camera", color: "#8b5cf6" },
  { key: "analytics", icon: "ti-sparkles", color: "var(--insight)" },
  { key: "lab", icon: "ti-flask-2", color: "var(--insight)" },
  { key: "people", icon: "ti-user-heart", color: "#ec4899" },
  { key: "projects", icon: "ti-briefcase", color: "#3b82f6" },
  { key: "lifebook", icon: "ti-book-2", color: "var(--accent)" },
  { key: "biographer", icon: "ti-messages", color: "var(--insight)" },
  { key: "profile", icon: "ti-user", color: "#6366f1" },
  { key: "intelligence", icon: "ti-brain", color: "var(--insight)", label: "Life Intelligence" },
];

export default async function GuidePage() {
  await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const g = guide(locale);
  const ex = guideExtras(locale);
  const upcomingList = upcoming(locale);
  const botLink = await getBotLink();

  const L = (en: string, uk: string, fr: string, ru: string, es: string) =>
    locale === "en" ? en : locale === "uk" ? uk : locale === "fr" ? fr : locale === "es" ? es : ru;

  const tocLabel = L("Tap a section to expand it — right here, no jumping around.",
    "Натисни розділ — він розкриється тут же, без стрибків.",
    "Touche une section — elle s'ouvre ici, sans saut.",
    "Нажми на раздел — он раскроется прямо здесь, без прыжков по странице.",
    "Toca una sección para expandirla — justo aquí, sin saltos.");
  const aiHelpersLabel = L("Three AI helpers", "Три AI-помічники", "Trois assistants IA", "Три AI-помощника", "Tres ayudantes de IA");
  const aiHelpersSub = L("Analytics, Biographer, Lab — how they differ",
    "Аналітика, Біограф, Лабораторія — чим відрізняються",
    "Analytique, Biographe, Labo — leurs différences",
    "«Что заметил AI», Биограф, Лаборатория — чем отличаются",
    "Análisis, Biógrafo, Laboratorio — en qué se diferencian");
  const botGuideLabel = L("Telegram bot guide", "Інструкція по Telegram-боту", "Guide du bot Telegram", "Инструкция по Telegram-боту", "Guía del bot de Telegram");
  const botGuideSub = L("Everything the bot can do, step by step",
    "Все, що вміє бот, покроково",
    "Tout ce que le bot sait faire, pas à pas",
    "Всё, что умеет бот, по шагам",
    "Todo lo que puede hacer el bot, paso a paso");
  const readMore = L("Read more", "Детальніше", "En savoir plus", "Подробнее", "Leer más");

  const items: AccItem[] = [
    {
      id: "whatsnew", icon: "ti-rocket", color: "var(--positive)", title: `${ex.whatsNew} · ${ex.featuresTitle}`,
      subtitle: ex.whatsNewLead,
      content: <GuidePanels ex={ex} upcoming={upcomingList} />,
    },
    {
      id: "what", icon: "ti-help-circle", color: "var(--accent)", title: g.whatTitle,
      content: <div style={{ fontSize: 14.5, lineHeight: 1.65 }}>{g.what}</div>,
    },
    {
      id: "why", icon: "ti-arrows-diff", color: "#3b82f6", title: g.whyTitle,
      content: (
        <div>
          <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 13, maxWidth: 620 }}>{g.whyLead}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))", gap: 10 }}>
            {g.why.map(([lead, text], i) => (
              <div key={i} className="card" style={{ display: "flex", gap: 11 }}>
                <i className="ti ti-circle-check" style={{ fontSize: 19, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{lead}</div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "how", icon: "ti-route", color: "var(--accent)", title: g.howTitle,
      content: (
        <div>
          {g.how.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 13, marginBottom: 12, alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>{i + 1}</span>
              <span style={{ fontSize: 14.5, lineHeight: 1.6, paddingTop: 2 }}>{step}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "assistant", icon: "ti-message-chatbot", color: "var(--insight)", title: g.assistantTitle,
      content: (
        <div>
          {g.assistant.map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 11, marginBottom: i === g.assistant.length - 1 ? 0 : 11, alignItems: "flex-start" }}>
              <i className="ti ti-message-chatbot" style={{ fontSize: 17, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 14, lineHeight: 1.6 }}>{line}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "bot-guide", icon: "ti-brand-telegram", color: "#0ea5e9", title: botGuideLabel, subtitle: botGuideSub, href: "/guide/bot",
    },
    {
      id: "sections", icon: "ti-layout-grid", color: "#3b82f6", title: g.sectionsTitle,
      content: (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))", gap: 10 }}>
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
      ),
    },
    {
      id: "ai-helpers", icon: "ti-sparkles", color: "var(--insight)", title: aiHelpersLabel, subtitle: aiHelpersSub, href: "/guide/ai-helpers",
    },
    {
      id: "lifehacks", icon: "ti-bulb", color: "var(--energy)", title: g.lifehacksTitle,
      content: (
        <div>
          {g.lifehacks.map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 11, marginBottom: 11, alignItems: "flex-start" }}>
              <i className="ti ti-bulb" style={{ fontSize: 17, color: "var(--energy)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 14.5, lineHeight: 1.6 }}>{tip}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "privacy", icon: "ti-shield-lock", color: "var(--positive)", title: g.privacyTitle,
      content: (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <i className="ti ti-shield-lock" style={{ fontSize: 20, color: "var(--positive)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>{g.privacy}</div>
            <a href="/privacy" style={{ fontSize: 12.5, color: "var(--accent)", display: "inline-block", marginTop: 7 }}>{readMore} →</a>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
          <i className="ti ti-book-2" style={{ fontSize: 24, color: "var(--accent)" }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{g.title}</h1>
        </div>
        <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.6, marginTop: 0, marginBottom: 16, maxWidth: 620 }}>{g.pitch}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
          <a href={botLink} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 12, background: "var(--accent)", color: "#fff", fontSize: 14.5, fontWeight: 500 }}>
            <i className="ti ti-brand-telegram" style={{ fontSize: 18 }} />{g.openBot}
          </a>
          <a href="/features" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14.5, fontWeight: 500 }}>
            <i className="ti ti-list-details" style={{ fontSize: 18, color: "var(--accent)" }} />{L("All features", "Усі можливості", "Toutes les fonctions", "Все возможности", "Todas las funciones")}
          </a>
        </div>

        <GuideAccordion items={items} tocLabel={tocLabel} />
      </main>
    </div>
  );
}
