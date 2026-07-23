import Link from "next/link";

const P: Record<string, any> = {
  ru: {
    lead: "Преврати свою жизнь в эксперимент.",
    what: "Лаборатория замечает закономерности в твоих данных и предлагает гипотезы — а ты проверяешь их реальными экспериментами над собой. Никаких догадок: только честное «до и во время» на твоих собственных цифрах.",
    bullets: [
      { icon: "ti-microscope", t: "AI находит гипотезы", d: "«В дни прогулок настроение выше», «после поздних записей сон хуже» — связи, которые сам не замечаешь." },
      { icon: "ti-flask", t: "Личные эксперименты", d: "«21 день без сладкого», «10 000 шагов в день» — с понятным трекингом прогресса по дням." },
      { icon: "ti-chart-histogram", t: "Честный вывод", d: "AI сравнивает «до» и «во время» и прямо говорит, сработало ли и хватило ли данных — без самообмана." },
      { icon: "ti-target", t: "Решения на фактах", d: "Ты меняешь привычки на основе своих реальных данных, а не на ощущениях и модных советах." },
    ],
    exHead: "Примеры экспериментов",
    examples: ["21 день без сладкого", "10 000 шагов каждый день", "Ложиться спать до 22:30", "Холодный душ по утрам", "Прогулка 40 минут ежедневно"],
    why: "Чем больше ты ведёшь дневник — тем точнее гипотезы и честнее выводы. Это твоя личная лаборатория, где подопытный и учёный — ты сам.",
    lockT: "Лаборатория — в подписке Премиум",
    lockS: "Гипотезы AI и эксперименты над собой — глубокий разбор твоих данных. Открывается в полной подписке вместе с остальными премиальными возможностями.",
    cta: "Перейти на Премиум",
  },
  en: {
    lead: "Turn your life into an experiment.",
    what: "The Lab spots patterns in your data and proposes hypotheses — and you test them with real experiments on yourself. No guessing: just an honest before-and-during on your own numbers.",
    bullets: [
      { icon: "ti-microscope", t: "AI finds hypotheses", d: "“Mood is higher on days you walk”, “sleep is worse after late entries” — links you wouldn't notice yourself." },
      { icon: "ti-flask", t: "Personal experiments", d: "“21 days no sugar”, “10,000 steps a day” — with clear day-by-day progress tracking." },
      { icon: "ti-chart-histogram", t: "An honest verdict", d: "AI compares before vs during and tells you plainly whether it worked and if there was enough data." },
      { icon: "ti-target", t: "Decisions on facts", d: "Change habits based on your real data, not on hunches or trendy advice." },
    ],
    exHead: "Experiment examples",
    examples: ["21 days no sugar", "10,000 steps a day", "Sleep before 10:30 PM", "Cold shower every morning", "A 40-minute walk daily"],
    why: "The more you journal, the sharper the hypotheses and the more honest the conclusions. It's your personal lab — where you're both the scientist and the subject.",
    lockT: "The Lab is a Premium feature",
    lockS: "AI hypotheses and self-experiments — a deep read of your data. It unlocks with the full subscription, along with the other premium features.",
    cta: "Go Premium",
  },
};

export default function LabPitch({ locale }: { locale: string }) {
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
