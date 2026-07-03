"use client";

import { useState } from "react";

type Theme = "auto" | "light" | "dark";

const LABELS: Record<string, Record<Theme, string>> = {
  ru: { auto: "Авто", light: "Светлая", dark: "Тёмная" },
  en: { auto: "Auto", light: "Light", dark: "Dark" },
  uk: { auto: "Авто", light: "Світла", dark: "Темна" },
  fr: { auto: "Auto", light: "Clair", dark: "Sombre" },
};

// Применяет тему на лету: auto → по системной, иначе явно.
function applyTheme(t: Theme) {
  try {
    const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  } catch {}
}

export default function ThemeSwitcher({ current, locale }: { current: Theme; locale: string }) {
  const [val, setVal] = useState<Theme>(current);
  const [busy, setBusy] = useState(false);
  const L = LABELS[locale] || LABELS.ru;
  const opts: Theme[] = ["auto", "light", "dark"];

  const pick = async (t: Theme) => {
    if (t === val || busy) return;
    const prev = val;
    setVal(t);
    applyTheme(t);
    document.cookie = `theme=${t}; path=/; max-age=31536000`;
    setBusy(true);
    try {
      const r = await fetch("/api/theme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: t }) }).then((x) => x.json());
      if (!r?.ok) { setVal(prev); applyTheme(prev); }
    } catch { setVal(prev); applyTheme(prev); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", borderRadius: 8, padding: 3 }}>
      {opts.map((t) => (
        <button
          key={t}
          onClick={() => pick(t)}
          style={{
            fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 6, cursor: "pointer", border: "none",
            background: val === t ? "var(--surface)" : "transparent",
            color: val === t ? "var(--text)" : "var(--text-2)",
            boxShadow: val === t ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
          }}
        >
          {L[t]}
        </button>
      ))}
    </div>
  );
}
