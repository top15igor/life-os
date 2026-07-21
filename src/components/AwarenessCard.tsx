"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const TRACK: { icon: string; key: string }[] = [
  { icon: "ti-apple", key: "food" },
  { icon: "ti-run", key: "sport" },
  { icon: "ti-heartbeat", key: "health" },
  { icon: "ti-mood-smile", key: "mood" },
  { icon: "ti-moon", key: "sleep" },
  { icon: "ti-bulb", key: "ideas" },
  { icon: "ti-target", key: "goals" },
  { icon: "ti-heart-handshake", key: "deeds" },
];

const S: Record<string, any> = {
  ru: {
    title: "Просто расскажи — я веду всё за тебя.",
    sub: "Наговаривай день голосом или текстом. Я сам разложу по полочкам и буду следить.",
    examples: [
      { say: "Сегодня съел рыбу и овощи", to: "веду твоё питание" },
      { say: "Пробежал 5 км утром", to: "веду спорт" },
      { say: "Чувствую усталость, болит голова", to: "слежу за здоровьем" },
      { say: "Настроение сегодня отличное", to: "вижу твой эмоциональный фон" },
      { say: "Пришла идея для бизнеса", to: "сохраняю в инсайты" },
      { say: "Помог соседке с продуктами", to: "добавляю в твой след" },
      { say: "Спал 7 часов", to: "веду твой сон" },
    ],
    trackTitle: "Что я отслеживаю",
    labels: { food: "Питание", sport: "Спорт", health: "Здоровье", mood: "Настроение", sleep: "Сон", ideas: "Идеи", goals: "Цели", deeds: "Добрые дела" },
    payoff: "А в конце недели, месяца и года соберу твой отчёт — например: «за год 1 240 км пробежки, 312 записей и 47 добрых дел». Чем больше рассказываешь, тем точнее картина.",
    have: (n: number) => `Уже накоплено: ${n} ${n % 10 === 1 && n % 100 !== 11 ? "день" : "дней"} с записями.`,
    cta: "Что я уже заметил",
  },
  en: {
    title: "Just tell me — I'll track it all for you.",
    sub: "Speak or type your day. I'll sort it out and keep watch.",
    examples: [
      { say: "Had fish and veggies today", to: "I track your food" },
      { say: "Ran 5 km this morning", to: "I track sport" },
      { say: "Feeling tired, headache", to: "I track your health" },
      { say: "Great mood today", to: "I see your emotional state" },
      { say: "Got a business idea", to: "I save it to insights" },
      { say: "Helped my neighbour with groceries", to: "I add it to your trace" },
      { say: "Slept 7 hours", to: "I track your sleep" },
    ],
    trackTitle: "What I track",
    labels: { food: "Food", sport: "Sport", health: "Health", mood: "Mood", sleep: "Sleep", ideas: "Ideas", goals: "Goals", deeds: "Good deeds" },
    payoff: "And at the end of each week, month and year I'll build your report — e.g. “1,240 km run, 312 entries and 47 good deeds this year.” The more you share, the clearer the picture.",
    have: (n: number) => `Already gathered: ${n} day${n === 1 ? "" : "s"} of entries.`,
    cta: "What I've noticed",
  },
  uk: {
    title: "Просто розкажи — я веду все за тебе.",
    sub: "Наговорюй день голосом або текстом. Я сам розкладу й стежитиму.",
    examples: [
      { say: "Сьогодні з'їв рибу й овочі", to: "веду твоє харчування" },
      { say: "Пробіг 5 км зранку", to: "веду спорт" },
      { say: "Відчуваю втому, болить голова", to: "стежу за здоров'ям" },
      { say: "Настрій сьогодні чудовий", to: "бачу твій емоційний фон" },
      { say: "З'явилася ідея для бізнесу", to: "зберігаю в інсайти" },
      { say: "Допоміг сусідці з продуктами", to: "додаю у твій слід" },
      { say: "Спав 7 годин", to: "веду твій сон" },
    ],
    trackTitle: "Що я відстежую",
    labels: { food: "Харчування", sport: "Спорт", health: "Здоров'я", mood: "Настрій", sleep: "Сон", ideas: "Ідеї", goals: "Цілі", deeds: "Добрі справи" },
    payoff: "А наприкінці тижня, місяця й року зберу твій звіт — наприклад: «за рік 1 240 км бігу, 312 записів і 47 добрих справ». Що більше розповідаєш, то точніша картина.",
    have: (n: number) => `Уже накопичено: ${n} днів із записами.`,
    cta: "Що я вже помітив",
  },
  fr: {
    title: "Raconte simplement — je suis tout pour toi.",
    sub: "Dicte ou écris ta journée. Je range tout et je veille.",
    examples: [
      { say: "Mangé du poisson et des légumes", to: "je suis ton alimentation" },
      { say: "Couru 5 km ce matin", to: "je suis le sport" },
      { say: "Fatigué, mal à la tête", to: "je suis ta santé" },
      { say: "Très bonne humeur aujourd'hui", to: "je vois ton état émotionnel" },
      { say: "Une idée de business", to: "je l'enregistre en insights" },
      { say: "Aidé ma voisine avec les courses", to: "je l'ajoute à ton empreinte" },
      { say: "Dormi 7 heures", to: "je suis ton sommeil" },
    ],
    trackTitle: "Ce que je suis",
    labels: { food: "Alimentation", sport: "Sport", health: "Santé", mood: "Humeur", sleep: "Sommeil", ideas: "Idées", goals: "Objectifs", deeds: "Bonnes actions" },
    payoff: "Et à la fin de chaque semaine, mois et année, je ferai ton rapport — par ex. « 1 240 km courus, 312 entrées et 47 bonnes actions cette année ». Plus tu partages, plus l'image est nette.",
    have: (n: number) => `Déjà rassemblé : ${n} jours d'entrées.`,
    cta: "Ce que j'ai remarqué",
  },
};

export default function AwarenessCard({ locale, totalDays }: { locale: string; totalDays: number }) {
  const s = S[locale] || S.ru;
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setI((p) => (p + 1) % s.examples.length);
        setShow(true);
      }, 240);
    }, 3000);
    return () => clearInterval(t);
  }, [s.examples.length]);

  const ex = s.examples[i];

  return (
    <div className="soft-hero" style={{ borderRadius: 18, padding: "22px", marginBottom: 16, border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em", maxWidth: 560 }}>{s.title}</div>
      <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5, marginTop: 7, maxWidth: 540 }}>{s.sub}</div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 13px", marginTop: 14, minHeight: 44, display: "flex", alignItems: "center", gap: 10 }}>
        <i className="ti ti-microphone" style={{ fontSize: 18, color: "var(--accent)", flexShrink: 0 }} />
        <div style={{ opacity: show ? 1 : 0, transition: "opacity .24s", minWidth: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>«{ex.say}»</span>
          <span style={{ fontSize: 13, color: "var(--accent-text)" }}> → {ex.to}</span>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-3)", margin: "14px 0 8px" }}>{s.trackTitle}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {TRACK.map((t) => (
          <span key={t.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 11px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12.5, color: "var(--text-2)" }}>
            <i className={`ti ${t.icon}`} style={{ fontSize: 14, color: "var(--accent)" }} />{s.labels[t.key]}
          </span>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55, marginTop: 14, paddingTop: 13, borderTop: "1px solid var(--border)" }}>
        <i className="ti ti-chart-line" style={{ fontSize: 14, color: "var(--accent)", verticalAlign: "-2px", marginRight: 6 }} />{s.payoff}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        {totalDays > 0 ? <span style={{ fontSize: 12, color: "var(--text-3)" }}>{s.have(totalDays)}</span> : <span />}
        <Link href="/analytics" style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)", whiteSpace: "nowrap" }}>{s.cta} →</Link>
      </div>
    </div>
  );
}
