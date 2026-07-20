"use client";

import { useState } from "react";
import { MORNING_TONES, type MorningPrefs, type MorningTone } from "@/lib/morningPrefs";

// Выбор тона общения с AI-другом (чат + голос). Хранится в тех же morning_prefs
// (поле chatTone), но не зависит от утреннего пуша. Пишем ВЕСЬ объект настроек,
// чтобы не затереть остальные поля (API нормализует всё тело запроса).
const STR: Record<string, { title: string; sub: string; saved: string; autoHint: string; tone: Record<string, string> }> = {
  ru: {
    title: "Тон общения с ботом",
    sub: "Как AI-друг разговаривает с тобой — в чате и голосом.",
    saved: "Сохранено",
    autoHint: "Бот подстроится под твою манеру.",
    tone: { auto: "Под мой стиль", friend: "Тёплый", direct: "Прямой", calm: "Спокойный", business: "Деловой", energetic: "Энергичный" },
  },
  en: {
    title: "Bot conversation tone",
    sub: "How the AI friend talks with you — in chat and by voice.",
    saved: "Saved",
    autoHint: "The bot will mirror your manner.",
    tone: { auto: "My style", friend: "Warm", direct: "Direct", calm: "Calm", business: "Business", energetic: "Energetic" },
  },
  uk: {
    title: "Тон спілкування з ботом",
    sub: "Як AI-друг говорить з тобою — у чаті та голосом.",
    saved: "Збережено",
    autoHint: "Бот підлаштується під твою манеру.",
    tone: { auto: "Під мій стиль", friend: "Теплий", direct: "Прямий", calm: "Спокійний", business: "Діловий", energetic: "Енергійний" },
  },
  fr: {
    title: "Ton des échanges avec le bot",
    sub: "Comment l'ami IA te parle — en chat et à la voix.",
    saved: "Enregistré",
    autoHint: "Le bot s'alignera sur ta façon d'écrire.",
    tone: { auto: "Mon style", friend: "Chaleureux", direct: "Direct", calm: "Calme", business: "Pro", energetic: "Énergique" },
  },
};

export default function ChatToneSettings({ locale, initial }: { locale: string; initial: MorningPrefs }) {
  const s = STR[locale] || STR.ru;
  const [prefs, setPrefs] = useState<MorningPrefs>(initial);
  const [saved, setSaved] = useState(false);

  async function pick(t: MorningTone) {
    if (t === prefs.chatTone) return;
    const next = { ...prefs, chatTone: t };
    setPrefs(next);
    setSaved(false);
    try {
      await fetch("/api/morning-pref", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(next) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* тихо — не блокируем UI */ }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 4 }}>
        <i className="ti ti-message-chatbot" style={{ fontSize: 20, color: "var(--accent)", flexShrink: 0 }} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
        {saved && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--positive)", display: "inline-flex", alignItems: "center", gap: 3 }}>
            <i className="ti ti-check" style={{ fontSize: 13 }} />{s.saved}
          </span>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, marginBottom: 12 }}>{s.sub}</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {MORNING_TONES.map((t) => {
          const active = prefs.chatTone === t;
          return (
            <button
              key={t}
              onClick={() => pick(t)}
              style={{
                fontSize: 13,
                fontWeight: 500,
                padding: "7px 14px",
                borderRadius: 999,
                cursor: "pointer",
                border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: active ? "var(--accent-bg)" : "var(--surface)",
                color: active ? "var(--accent-text)" : "var(--text-2)",
              }}
            >
              {s.tone[t]}
            </button>
          );
        })}
      </div>
      {prefs.chatTone === "auto" && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 8 }}>{s.autoHint}</div>}
    </div>
  );
}
