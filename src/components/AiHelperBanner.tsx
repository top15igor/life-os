import Link from "next/link";

const ROLES: Record<string, any> = {
  ru: {
    analytics: { icon: "ti-eye", t: "Зеркало", d: "Само показывает, что с тобой сейчас — наблюдения, энергия, что радует. Ты ничего не спрашиваешь." },
    biographer: { icon: "ti-messages", t: "Рассказчик", d: "Задай любой вопрос о своей жизни — и получи ответ-историю из всех записей за всё время." },
    lab: { icon: "ti-flask", t: "Учёный", d: "Проверяй гипотезы реальными экспериментами над собой — честное сравнение «до и во время»." },
    more: "Чем отличается от Биографа и Лаборатории?",
    moreA: "Чем отличается от «Что заметил AI» и Лаборатории?",
    moreL: "Чем отличается от «Что заметил AI» и Биографа?",
  },
  en: {
    analytics: { icon: "ti-eye", t: "The mirror", d: "Shows what's happening with you now — observations, energy, what makes you glad. You ask nothing." },
    biographer: { icon: "ti-messages", t: "The storyteller", d: "Ask any question about your life — and get a narrative answer from all your entries across time." },
    lab: { icon: "ti-flask", t: "The scientist", d: "Test hypotheses with real experiments on yourself — an honest before-vs-during comparison." },
    more: "How is it different from the other helpers?",
    moreA: "How is it different from the other helpers?",
    moreL: "How is it different from the other helpers?",
  },
};

export default function AiHelperBanner({ which, locale }: { which: "analytics" | "biographer" | "lab"; locale: string }) {
  const r = ROLES[locale === "en" || locale === "fr" ? "en" : "ru"];
  const role = r[which];
  const more = which === "analytics" ? r.moreA : which === "lab" ? r.moreL : r.more;

  return (
    <Link href="/guide?card=ai-compare" className="card card-hover" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, background: "var(--accent-bg)", border: "1px solid var(--border)", textDecoration: "none", color: "var(--text)" }}>
      <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 999, background: "var(--accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <i className={`ti ${role.icon}`} style={{ fontSize: 20 }} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.5 }}><b style={{ fontWeight: 600 }}>{role.t}.</b> <span style={{ color: "var(--text-2)" }}>{role.d}</span></div>
        <div style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 500, marginTop: 3, display: "inline-flex", alignItems: "center", gap: 3 }}>{more}<i className="ti ti-arrow-right" style={{ fontSize: 14 }} /></div>
      </div>
    </Link>
  );
}
