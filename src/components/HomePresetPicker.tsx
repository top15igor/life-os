"use client";

import { useState } from "react";

const ORDER = ["mindful", "focus", "trace", "balance", "minimal"];
const ICON: Record<string, string> = { mindful: "ti-sun-high", focus: "ti-target", trace: "ti-heart-handshake", balance: "ti-yin-yang", minimal: "ti-minus" };

const STR: Record<string, { hint: string; saved: string; p: Record<string, [string, string]> }> = {
  ru: {
    hint: "Под что собрать главную. Применится при следующем заходе на главную.",
    saved: "Сохранено ✓",
    p: {
      mindful: ["Осознанность", "Сбалансированная главная по умолчанию"],
      focus: ["Фокус и цели", "Задачи, цели, проекты, истории"],
      trace: ["Добрый след", "Добрые дела, обещания, благодарность"],
      balance: ["Баланс жизни", "Самочувствие, добро, благодарность"],
      minimal: ["Минимум", "Только серия, фокус и мысль дня"],
    },
  },
  en: {
    hint: "What to build the home around. Applies next time you open Today.",
    saved: "Saved ✓",
    p: {
      mindful: ["Mindful", "Balanced default home"],
      focus: ["Focus & goals", "Tasks, goals, projects, stories"],
      trace: ["Kind trace", "Good deeds, promises, gratitude"],
      balance: ["Life balance", "Wellbeing, kindness, gratitude"],
      minimal: ["Minimal", "Just streak, focus and thought"],
    },
  },
  uk: {
    hint: "Під що зібрати головну. Застосується при наступному заході.",
    saved: "Збережено ✓",
    p: {
      mindful: ["Усвідомленість", "Збалансована головна за умовчанням"],
      focus: ["Фокус і цілі", "Завдання, цілі, проєкти, історії"],
      trace: ["Добрий слід", "Добрі справи, обіцянки, вдячність"],
      balance: ["Баланс життя", "Самопочуття, добро, вдячність"],
      minimal: ["Мінімум", "Лише серія, фокус і думка дня"],
    },
  },
  fr: {
    hint: "Autour de quoi construire l'accueil. S'applique au prochain ouverture.",
    saved: "Enregistré ✓",
    p: {
      mindful: ["Pleine conscience", "Accueil équilibré par défaut"],
      focus: ["Focus & objectifs", "Tâches, objectifs, projets, histoires"],
      trace: ["Belle empreinte", "Bonnes actions, promesses, gratitude"],
      balance: ["Équilibre de vie", "Bien-être, bonté, gratitude"],
      minimal: ["Minimal", "Juste série, focus et pensée"],
    },
  },
};

export default function HomePresetPicker({ current, locale }: { current: string; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [val, setVal] = useState(current && ORDER.includes(current) ? current : "mindful");
  const [saved, setSaved] = useState(false);

  async function pick(p: string) {
    if (p === val) return;
    setVal(p);
    setSaved(false);
    try {
      await fetch("/api/home-preset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ preset: p }) });
      setSaved(true);
    } catch {}
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 10, lineHeight: 1.5 }}>{s.hint}</div>
      <div style={{ display: "grid", gap: 8 }}>
        {ORDER.map((p) => {
          const active = val === p;
          return (
            <button key={p} onClick={() => pick(p)} style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "12px 13px", borderRadius: 12, cursor: "pointer", border: active ? "2px solid var(--accent)" : "1px solid var(--border)", background: active ? "var(--accent-bg)" : "var(--surface)" }}>
              <i className={`ti ${ICON[p]}`} style={{ fontSize: 20, color: "var(--accent)", flexShrink: 0 }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: active ? "var(--accent-text)" : "var(--text)" }}>{s.p[p][0]}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--text-3)" }}>{s.p[p][1]}</span>
              </span>
              {active && saved && <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--positive)", flexShrink: 0 }}>{s.saved}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
