"use client";

import { LOCALES, type Locale } from "@/lib/i18n";

export default function LangSwitcher({ current }: { current: Locale }) {
  function set(l: Locale) {
    document.cookie = `locale=${l}; path=/; max-age=31536000`;
    location.reload();
  }
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "0 4px" }}>
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => set(l.code)}
          title={l.label}
          style={{
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 6,
            cursor: "pointer",
            border: "1px solid var(--border)",
            background: current === l.code ? "var(--accent-bg)" : "transparent",
            color: current === l.code ? "var(--accent-text)" : "var(--text-2)",
          }}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
