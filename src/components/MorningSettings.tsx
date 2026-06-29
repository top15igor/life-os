"use client";

import { useState } from "react";
import { MORNING_TONES, MORNING_TOPICS, type MorningPrefs, type MorningTone, type MorningTopic } from "@/lib/morningPrefs";

const STR: Record<string, {
  title: string; sub: string; toneLabel: string; topicsLabel: string; saved: string; off: string;
  tone: Record<MorningTone, string>; topic: Record<MorningTopic, string>;
}> = {
  ru: {
    title: "Что присылать утром", sub: "Выбери тон и темы — ИИ соберёт утреннее сообщение под тебя.",
    toneLabel: "Тон", topicsLabel: "Темы", saved: "Сохранено", off: "Темы выключены — придёт короткое тёплое приветствие.",
    tone: { friend: "Друг", coach: "Коуч", calm: "Спокойный", mentor: "Наставник", funny: "С юмором" },
    topic: { motivation: "Мотивация", goals: "Цели", tasks: "Задачи", diary: "Дневник", insight: "Инсайты", gratitude: "Благодарность", movement: "Зарядка" },
  },
  en: {
    title: "Your morning message", sub: "Pick the tone and topics — the AI will tailor your morning message.",
    toneLabel: "Tone", topicsLabel: "Topics", saved: "Saved", off: "Topics off — you'll get a short warm greeting.",
    tone: { friend: "Friend", coach: "Coach", calm: "Calm", mentor: "Mentor", funny: "Witty" },
    topic: { motivation: "Motivation", goals: "Goals", tasks: "Tasks", diary: "Diary", insight: "Insights", gratitude: "Gratitude", movement: "Movement" },
  },
  uk: {
    title: "Що надсилати вранці", sub: "Обери тон і теми — ІІ збере ранкове повідомлення під тебе.",
    toneLabel: "Тон", topicsLabel: "Теми", saved: "Збережено", off: "Теми вимкнені — прийде коротке тепле привітання.",
    tone: { friend: "Друг", coach: "Коуч", calm: "Спокійний", mentor: "Наставник", funny: "З гумором" },
    topic: { motivation: "Мотивація", goals: "Цілі", tasks: "Завдання", diary: "Щоденник", insight: "Інсайти", gratitude: "Вдячність", movement: "Зарядка" },
  },
  fr: {
    title: "Ton message du matin", sub: "Choisis le ton et les thèmes — l'IA composera ton message du matin.",
    toneLabel: "Ton", topicsLabel: "Thèmes", saved: "Enregistré", off: "Thèmes désactivés — tu recevras un petit mot chaleureux.",
    tone: { friend: "Ami", coach: "Coach", calm: "Calme", mentor: "Mentor", funny: "Avec humour" },
    topic: { motivation: "Motivation", goals: "Objectifs", tasks: "Tâches", diary: "Journal", insight: "Insights", gratitude: "Gratitude", movement: "Mouvement" },
  },
};

export default function MorningSettings({ locale, initial }: { locale: string; initial: MorningPrefs }) {
  const s = STR[locale] || STR.ru;
  const [tone, setTone] = useState<MorningTone>(initial.tone);
  const [topics, setTopics] = useState<MorningTopic[]>(initial.topics);
  const [saved, setSaved] = useState(false);

  async function save(next: MorningPrefs) {
    try {
      await fetch("/api/morning-pref", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(next) });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch { /* не критично — попробует при следующем изменении */ }
  }
  function pickTone(t: MorningTone) { if (t === tone) return; setTone(t); save({ tone: t, topics }); }
  function toggleTopic(t: MorningTopic) {
    const next = topics.includes(t) ? topics.filter((x) => x !== t) : [...topics, t];
    setTopics(next);
    save({ tone, topics: next });
  }

  const chip = (label: string, active: boolean, onClick: () => void, icon?: string) => (
    <button key={label} onClick={onClick}
      style={{
        fontSize: 13, fontWeight: 500, padding: "7px 13px", borderRadius: 999, cursor: "pointer",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--accent-bg)" : "var(--surface)",
        color: active ? "var(--accent-text)" : "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 5,
      }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 14 }} />}{label}
    </button>
  );

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 3 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>☀️ {s.title}</div>
        {saved && <span style={{ fontSize: 12, color: "var(--positive)", display: "inline-flex", alignItems: "center", gap: 3 }}><i className="ti ti-check" style={{ fontSize: 13 }} />{s.saved}</span>}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, marginBottom: 13 }}>{s.sub}</div>

      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 7 }}>{s.toneLabel}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 15 }}>
        {MORNING_TONES.map((t) => chip(s.tone[t], tone === t, () => pickTone(t)))}
      </div>

      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 7 }}>{s.topicsLabel}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {MORNING_TOPICS.map((t) => chip(s.topic[t], topics.includes(t), () => toggleTopic(t), topics.includes(t) ? "ti-check" : "ti-plus"))}
      </div>

      {topics.length === 0 && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 11, lineHeight: 1.45 }}>{s.off}</div>}
    </div>
  );
}
