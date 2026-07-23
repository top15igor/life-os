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
    freeT: "Открой бесплатно — за 50 записей",
    freeLead: "Сделай 50 записей в дневнике — и «Что заметил AI» откроется тебе бесплатно, навсегда. Чем больше пишешь, тем точнее AI понимает тебя.",
    freeOf: (a: number, b: number) => `${a} из ${b} записей`,
    freeLeft: (n: number) => `осталось ${n} до открытия`,
    freeDoneT: "Открыто бесплатно — спасибо, что ведёшь дневник!",
    freeDoneLead: (n: number) => `Ты сделал ${n} записей и заслужил «Что заметил AI» бесплатно. Пиши дальше — чем больше записей, тем глубже AI понимает тебя.`,
    freeDoneTag: "доступ открыт ✓",
    recordBtn: "Сделать запись",
    orPro: "Не хочешь ждать? Можно открыть сразу на Pro:",
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
    freeT: "Unlock it free — at 50 entries",
    freeLead: "Make 50 diary entries and “What AI noticed” unlocks for you free, forever. The more you write, the better AI understands you.",
    freeOf: (a: number, b: number) => `${a} of ${b} entries`,
    freeLeft: (n: number) => `${n} to go`,
    freeDoneT: "Unlocked free — thanks for journaling!",
    freeDoneLead: (n: number) => `You've made ${n} entries and earned “What AI noticed” for free. Keep writing — the more entries, the deeper AI understands you.`,
    freeDoneTag: "access granted ✓",
    recordBtn: "Add an entry",
    orPro: "Don't want to wait? You can unlock it on Pro:",
  },
};

export default function AnalyticsPitch({ locale, progress }: { locale: string; progress?: { count: number; need: number } }) {
  const p = locale === "en" || locale === "fr" || locale === "es" ? P.en : P.ru;
  const earnedFree = !!progress && progress.count >= progress.need;
  const left = progress ? Math.max(0, progress.need - progress.count) : 0;
  const pctDone = progress ? Math.min(100, Math.round((progress.count / progress.need) * 100)) : 0;

  return (
    <div>
      {progress && (
        <div className="card" style={{ background: "var(--positive-bg, #ecfdf5)", border: "1px solid var(--positive)", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <i className="ti ti-gift" style={{ fontSize: 24, color: "var(--positive)" }} />
            <div style={{ fontSize: 18, fontWeight: 700 }}>{earnedFree ? p.freeDoneT : p.freeT}</div>
          </div>
          <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 13, maxWidth: 600 }}>{earnedFree ? p.freeDoneLead(progress.count) : p.freeLead}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
            <span style={{ fontWeight: 600 }}>{p.freeOf(progress.count, progress.need)}</span>
            <span style={{ color: "var(--positive)", fontWeight: 600 }}>{earnedFree ? p.freeDoneTag : p.freeLeft(left)}</span>
          </div>
          <div style={{ height: 11, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
            <div style={{ width: `${pctDone}%`, height: "100%", background: "var(--positive)", transition: "width .3s" }} />
          </div>
          {!earnedFree && (
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 15, padding: "11px 20px", borderRadius: 11, background: "var(--positive)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              <i className="ti ti-pencil-plus" style={{ fontSize: 16 }} />{p.recordBtn}
            </Link>
          )}
        </div>
      )}

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
          <span key={i} style={{ fontSize: 13, color: "var(--text)", background: "var(--surface-2)", borderRadius: 999, padding: "8px 14px" }}>{e}</span>
        ))}
      </div>

      <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 18, maxWidth: 640 }}>{p.why}</div>

      <div className="card" style={{ background: "var(--accent-bg)", border: "1px solid #6d5efc44", textAlign: "center", padding: "24px 20px" }}>
        <div style={{ width: 52, height: 52, borderRadius: 999, background: "var(--accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <i className="ti ti-lock" style={{ fontSize: 26 }} />
        </div>
        {progress && !earnedFree && <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 6 }}>{p.orPro}</div>}
        <div style={{ fontSize: 17, fontWeight: 600 }}>{p.lockT}</div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55, marginTop: 7, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>{p.lockS}</div>
        <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 16, padding: "12px 22px", borderRadius: 12, background: "var(--accent)", color: "#fff", fontSize: 14.5, fontWeight: 500, textDecoration: "none" }}>
          <i className="ti ti-sparkles" style={{ fontSize: 17 }} />{p.cta}
        </Link>
      </div>
    </div>
  );
}
