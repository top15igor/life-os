"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

const STR: Record<Locale, { title: string; sub: string }> = {
  ru: { title: "Показывать распознанный текст", sub: "Под голосовыми бот дублирует то, что расслышал — так проще заметить, если что-то распозналось криво (например, суммы). Выключи, если мешает." },
  en: { title: "Show recognized text", sub: "Under voice messages the bot echoes what it heard — easier to spot mistakes (e.g. amounts). Turn off if it's in the way." },
  uk: { title: "Показувати розпізнаний текст", sub: "Під голосовими бот дублює те, що розчув — так легше помітити помилку (напр. суми). Вимкни, якщо заважає." },
  fr: { title: "Afficher le texte reconnu", sub: "Sous les vocaux, le bot répète ce qu'il a entendu — plus facile de repérer une erreur (ex. montants). Désactive si ça gêne." },
  es: { title: "Mostrar texto reconocido", sub: "Bajo los mensajes de voz, el bot repite lo que entendió — así es más fácil notar si algo se reconoció mal (por ejemplo, importes). Desactívalo si te molesta." },
};

export default function VoiceTextToggle({ locale, initial }: { locale: Locale; initial: boolean }) {
  const s = STR[locale] || STR.ru;
  const [on, setOn] = useState(initial);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = !on;
    setOn(next);
    setSaving(true);
    try {
      await fetch("/api/voice-text-pref", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ on: next }) });
    } catch {
      setOn(!next); // откат при сбое
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
      <i className="ti ti-microphone-2" style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>{s.sub}</div>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        aria-pressed={on}
        style={{
          flexShrink: 0,
          width: 46,
          height: 27,
          borderRadius: 99,
          border: "none",
          cursor: "pointer",
          padding: 3,
          background: on ? "var(--accent)" : "var(--border)",
          transition: "background .18s",
          display: "flex",
          justifyContent: on ? "flex-end" : "flex-start",
        }}
      >
        <span style={{ width: 21, height: 21, borderRadius: 99, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }} />
      </button>
    </div>
  );
}
