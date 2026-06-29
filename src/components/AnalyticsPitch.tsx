import Link from "next/link";

const P: Record<string, any> = {
  ru: {
    lead: "Со стороны видно то, что изнутри не разглядеть.",
    what: "«Что заметил AI» — это взгляд со стороны на твою жизнь. AI читает все твои записи и сам находит главное: на чём ты сейчас горишь, что даёт и забирает энергию, что делает тебя счастливым и какие закономерности повторяются изо дня в день.",
    bullets: [
      { icon: "ti-brain", t: "Видит то, что ты не замечаешь", d: "Закономерности, спрятанные в потоке дней, — их трудно заметить самому." },
      { icon: "ti-mood-smile", t: "Что делает тебя счастливым", d: "Твои настоящие источники радости — по твоим же словам, а не по шаблону." },
      { icon: "ti-bolt", t: "Что даёт и забирает энергию", d: "Конкретные триггеры твоего состояния, а не общие советы из интернета." },
      { icon: "ti-map-2", t: "Карта жизни и динамика", d: "Главные темы твоей жизни и как меняется настроение, энергия, здоровье." },
    ],
    exHead: "Что внутри",
    examples: ["Сегодня AI заметил", "Главное открытие", "Что делает тебя счастливым", "Что даёт и забирает энергию", "Карта жизни"],
    why: "Каждый день AI перечитывает твой дневник и обновляет картину — ты получаешь честное зеркало своей жизни, которое замечает то, что в суете теряется.",
    lockT: "«Что заметил AI» — в подписке Pro",
    lockS: "Глубокий разбор твоей жизни от AI открывается уже на тарифе Pro — вместе с остальными возможностями.",
    cta: "Перейти на Pro",
  },
  en: {
    lead: "From the outside you can see what's invisible from within.",
    what: "“What AI noticed” is an outside view of your life. AI reads all your entries and surfaces what matters: what you're on fire about, what gives and drains your energy, what makes you happy, and the patterns that repeat day after day.",
    bullets: [
      { icon: "ti-brain", t: "Sees what you miss", d: "Patterns hidden in the flow of days are hard to spot yourself." },
      { icon: "ti-mood-smile", t: "What makes you happy", d: "Your real sources of joy — in your own words, not a template." },
      { icon: "ti-bolt", t: "What gives and drains energy", d: "The concrete triggers of your state, not generic internet advice." },
      { icon: "ti-map-2", t: "Life map and trends", d: "The biggest themes of your life and how your mood, energy and health shift." },
    ],
    exHead: "What's inside",
    examples: ["What AI noticed today", "Key discovery", "What makes you happy", "What gives and drains energy", "Life map"],
    why: "Every day AI re-reads your diary and refreshes the picture — an honest mirror of your life that catches what gets lost in the rush.",
    lockT: "“What AI noticed” is a Pro feature",
    lockS: "AI's deep read of your life unlocks on the Pro plan — along with the rest of its features.",
    cta: "Go Pro",
  },
};

export default function AnalyticsPitch({ locale }: { locale: string }) {
  const p = locale === "en" || locale === "fr" ? P.en : P.ru;

  return (
    <div>
      <div className="card" style={{ background: "linear-gradient(135deg, var(--accent-bg), #fdf2f8 60%, #fff7ed)", border: "1px solid var(--border)", marginBottom: 16 }}>
        <div style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em", maxWidth: 560 }}>{p.lead}</div>
        <div style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.6, marginTop: 10, maxWidth: 620 }}>{p.what}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 16 }}>
        {p.bullets.map((b: any, i: number) => (
          <div key={i} className="card" style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
            <i className={`ti ${b.icon}`} style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>{b.t}</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginTop: 2 }}>{b.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13, color: "var(--text-2)", margin: "0 0 9px" }}>{p.exHead}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {p.examples.map((e: string, i: number) => (
          <span key={i} style={{ fontSize: 13, color: "var(--text)", background: "var(--surface-2)", borderRadius: 999, padding: "8px 14px" }}>{e}</span>
        ))}
      </div>

      <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 18, maxWidth: 640 }}>{p.why}</div>

      <div className="card" style={{ background: "var(--accent-bg)", border: "1px solid #6d5efc44", textAlign: "center", padding: "24px 20px" }}>
        <div style={{ width: 52, height: 52, borderRadius: 999, background: "var(--accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <i className="ti ti-lock" style={{ fontSize: 26 }} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 600 }}>{p.lockT}</div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55, marginTop: 7, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>{p.lockS}</div>
        <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 16, padding: "12px 22px", borderRadius: 12, background: "var(--accent)", color: "#fff", fontSize: 14.5, fontWeight: 500, textDecoration: "none" }}>
          <i className="ti ti-sparkles" style={{ fontSize: 17 }} />{p.cta}
        </Link>
      </div>
    </div>
  );
}
