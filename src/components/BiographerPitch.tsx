import Link from "next/link";

const P: Record<string, any> = {
  ru: {
    lead: "Твоя жизнь — это книга. Теперь её можно спросить.",
    what: "AI-Биограф читает все твои записи за всё время и отвечает на любой вопрос о твоей жизни — не выдержкой, а продуманной историей. Как личный биограф, который знает тебя годами и помнит каждую деталь.",
    bullets: [
      { icon: "ti-brain", t: "Память во времени", d: "Помнит то, что ты сам давно забыл — события, людей, решения за месяцы и годы." },
      { icon: "ti-affiliate", t: "Видит связи", d: "Находит закономерности: что влияло на твоё настроение, здоровье, продуктивность." },
      { icon: "ti-book", t: "Превращает записи в смысл", d: "Из тысяч мелочей собирает цельные истории — о проектах, отношениях, пути." },
      { icon: "ti-target", t: "Только правда о тебе", d: "Опирается лишь на твои реальные записи — без выдумок и общих фраз." },
    ],
    exHead: "Что можно спросить",
    examples: ["Расскажи историю моего главного проекта", "Как менялось моё здоровье за год?", "Когда я был счастливее всего и почему?", "Какие решения изменили мою жизнь?"],
    why: "Чем больше ты ведёшь дневник — тем глубже и точнее Биограф. Это твоя личная машина памяти, которая работает только на тебя.",
    lockT: "Биограф — в подписке Премиум",
    lockS: "Это глубокий AI-анализ всей твоей жизни. Открывается в полной подписке вместе с остальными премиальными возможностями.",
    cta: "Перейти на Премиум",
  },
  en: {
    lead: "Your life is a book. Now you can ask it questions.",
    what: "The AI Biographer reads all your entries across all time and answers any question about your life — not a snippet, but a thoughtful story. Like a personal biographer who has known you for years and remembers every detail.",
    bullets: [
      { icon: "ti-brain", t: "Memory across time", d: "Remembers what you've long forgotten — events, people, decisions over months and years." },
      { icon: "ti-affiliate", t: "Sees connections", d: "Finds patterns: what shaped your mood, health, productivity." },
      { icon: "ti-book", t: "Turns entries into meaning", d: "Weaves thousands of small notes into whole stories — of projects, relationships, your path." },
      { icon: "ti-target", t: "Only the truth about you", d: "Draws only on your real entries — no invention, no generic filler." },
    ],
    exHead: "What you can ask",
    examples: ["Tell the story of my main project", "How did my health change this year?", "When was I happiest, and why?", "Which decisions changed my life?"],
    why: "The more you journal, the deeper and sharper the Biographer gets. It's your personal memory engine, working only for you.",
    lockT: "Biographer is a Premium feature",
    lockS: "It's a deep AI analysis of your whole life. It unlocks with the full subscription, along with the other premium features.",
    cta: "Go Premium",
  },
};

export default function BiographerPitch({ locale }: { locale: string }) {
  const p = locale === "en" || locale === "fr" || locale === "es" ? P.en : P.ru;

  return (
    <div>
      <div className="card soft-hero" style={{ border: "1px solid var(--border)", marginBottom: 16 }}>
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
          <span key={i} style={{ fontSize: 13, color: "var(--text)", background: "var(--surface-2)", borderRadius: 999, padding: "8px 14px" }}>«{e}»</span>
        ))}
      </div>

      <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 18, maxWidth: 640 }}>{p.why}</div>

      {/* Замок: премиальная фича */}
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
