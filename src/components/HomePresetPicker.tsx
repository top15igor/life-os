"use client";

import { useState } from "react";
import Link from "next/link";

const ORDER = ["minimal", "mindful", "focus", "trace", "balance", "custom"];
const ICON: Record<string, string> = { mindful: "ti-sun-high", focus: "ti-target", trace: "ti-heart-handshake", balance: "ti-yin-yang", minimal: "ti-minus", custom: "ti-adjustments" };

const BLOCK_ORDER = ["habit", "trace", "promises", "traceWeek", "context", "metrics", "changes", "focus", "stories", "tasks", "gratitude"];
const DEFAULT_BLOCKS = ["habit", "trace", "promises", "focus", "context", "gratitude"];

const STR: Record<string, { hint: string; updated: string; view: string; blocksTitle: string; p: Record<string, [string, string]>; b: Record<string, string> }> = {
  ru: {
    hint: "Под что собрать главную. Применяется сразу.",
    updated: "Главная обновлена",
    view: "Посмотреть главную →",
    blocksTitle: "Какие блоки показывать",
    p: { minimal: ["Минимум", "Спокойный старт без лишнего — по умолчанию"], mindful: ["Осознанность", "Тёплая, с обучающей карточкой"], focus: ["Фокус и цели", "Задачи, цели, проекты, истории"], trace: ["Добрый след", "Добрые дела, обещания, благодарность"], balance: ["Баланс жизни", "Самочувствие, добро, благодарность"], custom: ["Собрать свою", "Сам выбери, какие блоки показывать"] },
    b: { habit: "Серия", trace: "Мой след сегодня", promises: "Обещания", traceWeek: "След за неделю", context: "Контекст дня", metrics: "Самочувствие", changes: "Что изменилось", focus: "Фокус дня", stories: "Истории и проекты", tasks: "Задачи", gratitude: "Благодарность" },
  },
  en: {
    hint: "What to build the home around. Applies right away.",
    updated: "Home updated",
    view: "View home →",
    blocksTitle: "Which blocks to show",
    p: { minimal: ["Minimal", "A calm, clutter-free start — default"], mindful: ["Mindful", "Warm, with a learning card"], focus: ["Focus & goals", "Tasks, goals, projects, stories"], trace: ["Kind trace", "Good deeds, promises, gratitude"], balance: ["Life balance", "Wellbeing, kindness, gratitude"], custom: ["Build your own", "Pick which blocks to show"] },
    b: { habit: "Streak", trace: "My trace today", promises: "Promises", traceWeek: "Trace this week", context: "Day context", metrics: "Wellbeing", changes: "What changed", focus: "Focus", stories: "Stories & projects", tasks: "Tasks", gratitude: "Gratitude" },
  },
  uk: {
    hint: "Під що зібрати головну. Застосовується одразу.",
    updated: "Головну оновлено",
    view: "Переглянути головну →",
    blocksTitle: "Які блоки показувати",
    p: { minimal: ["Мінімум", "Спокійний старт без зайвого — за умовчанням"], mindful: ["Усвідомленість", "Тепла, з навчальною карткою"], focus: ["Фокус і цілі", "Завдання, цілі, проєкти, історії"], trace: ["Добрий слід", "Добрі справи, обіцянки, вдячність"], balance: ["Баланс життя", "Самопочуття, добро, вдячність"], custom: ["Зібрати свою", "Сам обери, які блоки показувати"] },
    b: { habit: "Серія", trace: "Мій слід сьогодні", promises: "Обіцянки", traceWeek: "Слід за тиждень", context: "Контекст дня", metrics: "Самопочуття", changes: "Що змінилося", focus: "Фокус дня", stories: "Історії та проєкти", tasks: "Завдання", gratitude: "Вдячність" },
  },
  fr: {
    hint: "Autour de quoi construire l'accueil. S'applique tout de suite.",
    updated: "Accueil mis à jour",
    view: "Voir l'accueil →",
    blocksTitle: "Quels blocs afficher",
    p: { minimal: ["Minimal", "Un démarrage calme et épuré — par défaut"], mindful: ["Pleine conscience", "Chaleureux, avec une carte d'aide"], focus: ["Focus & objectifs", "Tâches, objectifs, projets, histoires"], trace: ["Belle empreinte", "Bonnes actions, promesses, gratitude"], balance: ["Équilibre de vie", "Bien-être, bonté, gratitude"], custom: ["Composer la mienne", "Choisis les blocs à afficher"] },
    b: { habit: "Série", trace: "Mon empreinte du jour", promises: "Promesses", traceWeek: "Empreinte de la semaine", context: "Contexte du jour", metrics: "Bien-être", changes: "Ce qui a changé", focus: "Focus du jour", stories: "Histoires et projets", tasks: "Tâches", gratitude: "Gratitude" },
  },
  es: {
    hint: "Alrededor de qué armar la principal. Se aplica al instante.",
    updated: "Página principal actualizada",
    view: "Ver la principal →",
    blocksTitle: "Qué bloques mostrar",
    p: { minimal: ["Mínimo", "Un comienzo tranquilo y sin adornos — predeterminado"], mindful: ["Consciencia", "Cálida, con una tarjeta de aprendizaje"], focus: ["Enfoque y metas", "Tareas, metas, proyectos, historias"], trace: ["Buena huella", "Buenas acciones, promesas, gratitud"], balance: ["Equilibrio de vida", "Bienestar, bondad, gratitud"], custom: ["Armar la mía", "Elige tú qué bloques mostrar"] },
    b: { habit: "Racha", trace: "Mi huella de hoy", promises: "Promesas", traceWeek: "Huella de la semana", context: "Contexto del día", metrics: "Bienestar", changes: "Qué cambió", focus: "Enfoque del día", stories: "Historias y proyectos", tasks: "Tareas", gratitude: "Gratitud" },
  },
};

export default function HomePresetPicker({ current, locale, currentBlocks }: { current: string; locale: string; currentBlocks?: string[] }) {
  const s = STR[locale] || STR.ru;
  const [val, setVal] = useState(current && ORDER.includes(current) ? current : "minimal");
  const [blocks, setBlocks] = useState<string[]>(currentBlocks && currentBlocks.length ? currentBlocks : DEFAULT_BLOCKS);
  const [saved, setSaved] = useState(false);

  async function save(preset: string, bl?: string[]) {
    setSaved(false);
    try {
      await fetch("/api/home-preset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(bl ? { preset, blocks: bl } : { preset }) });
      setSaved(true);
    } catch {}
  }

  function pick(p: string) {
    setVal(p);
    if (p === "custom") save("custom", blocks);
    else save(p);
  }

  function toggleBlock(k: string) {
    const next = blocks.includes(k) ? blocks.filter((x) => x !== k) : [...blocks, k];
    setBlocks(next);
    save("custom", next);
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
            </button>
          );
        })}
      </div>

      {val === "custom" && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 9 }}>{s.blocksTitle}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {BLOCK_ORDER.map((k) => {
              const on = blocks.includes(k);
              return (
                <button key={k} onClick={() => toggleBlock(k)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 999, fontSize: 13, cursor: "pointer", border: "1px solid " + (on ? "var(--accent)" : "var(--border)"), background: on ? "var(--accent-bg)" : "var(--surface)", color: on ? "var(--accent-text)" : "var(--text-2)" }}>
                  <i className={`ti ${on ? "ti-check" : "ti-plus"}`} style={{ fontSize: 14 }} />{s.b[k]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {saved && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, padding: "11px 13px", borderRadius: 11, background: "var(--surface-2)" }}>
          <i className="ti ti-circle-check" style={{ fontSize: 17, color: "var(--positive)" }} />
          <span style={{ fontSize: 13, flex: 1 }}>{s.updated}: {s.p[val][0]}</span>
          <Link href="/" style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)", whiteSpace: "nowrap" }}>{s.view}</Link>
        </div>
      )}
    </div>
  );
}
