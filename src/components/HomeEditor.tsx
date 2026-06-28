"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const ORDER = ["minimal", "mindful", "focus", "trace", "balance", "custom"];
const ICON: Record<string, string> = { mindful: "ti-sun-high", focus: "ti-target", trace: "ti-heart-handshake", balance: "ti-yin-yang", minimal: "ti-minus", custom: "ti-adjustments" };
const BLOCK_ORDER = ["book", "habit", "trace", "promises", "traceWeek", "context", "metrics", "changes", "focus", "stories", "tasks", "gratitude"];

const STR: Record<string, { title: string; hint: string; blocksTitle: string; done: string; p: Record<string, string>; b: Record<string, string> }> = {
  ru: { title: "Настроить главную", hint: "Меняется сразу — видно на странице.", blocksTitle: "Какие блоки показывать", done: "Готово", p: { mindful: "Осознанность", focus: "Фокус и цели", trace: "Добрый след", balance: "Баланс жизни", minimal: "Минимум", custom: "Собрать свою" }, b: { book: "Моя книга жизни", habit: "Серия", trace: "Мой след сегодня", promises: "Обещания", traceWeek: "След за неделю", context: "Контекст дня", metrics: "Самочувствие", changes: "Что изменилось", focus: "Фокус дня", stories: "Истории и проекты", tasks: "Задачи", gratitude: "Благодарность" } },
  en: { title: "Customize home", hint: "Applies instantly — see it on the page.", blocksTitle: "Which blocks to show", done: "Done", p: { mindful: "Mindful", focus: "Focus & goals", trace: "Kind trace", balance: "Life balance", minimal: "Minimal", custom: "Build your own" }, b: { book: "My Book of Life", habit: "Streak", trace: "My trace today", promises: "Promises", traceWeek: "Trace this week", context: "Day context", metrics: "Wellbeing", changes: "What changed", focus: "Focus", stories: "Stories & projects", tasks: "Tasks", gratitude: "Gratitude" } },
  uk: { title: "Налаштувати головну", hint: "Змінюється одразу — видно на сторінці.", blocksTitle: "Які блоки показувати", done: "Готово", p: { mindful: "Усвідомленість", focus: "Фокус і цілі", trace: "Добрий слід", balance: "Баланс життя", minimal: "Мінімум", custom: "Зібрати свою" }, b: { book: "Моя книга життя", habit: "Серія", trace: "Мій слід сьогодні", promises: "Обіцянки", traceWeek: "Слід за тиждень", context: "Контекст дня", metrics: "Самопочуття", changes: "Що змінилося", focus: "Фокус дня", stories: "Історії та проєкти", tasks: "Завдання", gratitude: "Вдячність" } },
  fr: { title: "Personnaliser l'accueil", hint: "S'applique tout de suite — visible sur la page.", blocksTitle: "Quels blocs afficher", done: "Terminé", p: { mindful: "Pleine conscience", focus: "Focus & objectifs", trace: "Belle empreinte", balance: "Équilibre de vie", minimal: "Minimal", custom: "Composer la mienne" }, b: { book: "Mon Livre de vie", habit: "Série", trace: "Mon empreinte du jour", promises: "Promesses", traceWeek: "Empreinte de la semaine", context: "Contexte du jour", metrics: "Bien-être", changes: "Ce qui a changé", focus: "Focus du jour", stories: "Histoires et projets", tasks: "Tâches", gratitude: "Gratitude" } },
};

export default function HomeEditor({ locale, preset, blocks, onPreset, onToggleBlock, onClose }: { locale: string; preset: string; blocks: string[]; onPreset: (p: string) => void; onToggleBlock: (k: string) => void; onClose: () => void }) {
  const s = STR[locale] || STR.ru;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.04)" }} />
      <div style={{ position: "fixed", zIndex: 131, top: 64, right: 16, width: "min(360px, calc(100vw - 32px))", maxHeight: "80vh", overflowY: "auto", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 14px 44px rgba(0,0,0,0.20)", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{s.title}</div>
          <button onClick={onClose} aria-label="close" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 2 }}><i className="ti ti-x" style={{ fontSize: 20 }} /></button>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 12, lineHeight: 1.5 }}>{s.hint}</div>

        <div style={{ display: "grid", gap: 7 }}>
          {ORDER.map((p) => {
            const active = preset === p;
            return (
              <button key={p} onClick={() => onPreset(p)} style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 11, cursor: "pointer", border: active ? "2px solid var(--accent)" : "1px solid var(--border)", background: active ? "var(--accent-bg)" : "var(--surface)" }}>
                <i className={`ti ${ICON[p]}`} style={{ fontSize: 18, color: "var(--accent)", flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: active ? "var(--accent-text)" : "var(--text)" }}>{s.p[p]}</span>
              </button>
            );
          })}
        </div>

        {preset === "custom" && (
          <div style={{ marginTop: 13 }}>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 9 }}>{s.blocksTitle}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {BLOCK_ORDER.map((k) => {
                const on = blocks.includes(k);
                return (
                  <button key={k} onClick={() => onToggleBlock(k)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 999, fontSize: 13, cursor: "pointer", border: "1px solid " + (on ? "var(--accent)" : "var(--border)"), background: on ? "var(--accent-bg)" : "var(--surface)", color: on ? "var(--accent-text)" : "var(--text-2)" }}>
                    <i className={`ti ${on ? "ti-check" : "ti-plus"}`} style={{ fontSize: 14 }} />{s.b[k]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={onClose} style={{ width: "100%", marginTop: 16, padding: "11px", borderRadius: 11, background: "var(--accent)", color: "#fff", border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>{s.done}</button>
      </div>
    </>,
    document.body
  );
}
