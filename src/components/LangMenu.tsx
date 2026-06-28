"use client";

import { useState } from "react";
import { LOCALES, type Locale } from "@/lib/i18n";

// Компактный переключатель языка «глобус + код» с выпадающим списком. Удобно показать на другом языке в один тап.
export default function LangMenu({ current }: { current: Locale }) {
  const [open, setOpen] = useState(false);
  const cur = LOCALES.find((l) => l.code === current) || LOCALES[0];

  function set(l: Locale) {
    document.cookie = `locale=${l}; path=/; max-age=31536000`;
    location.reload();
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Language"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
      >
        <i className="ti ti-world" style={{ fontSize: 16 }} />
        {cur.short}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 41, minWidth: 168, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,.16)", padding: 5 }}>
            {LOCALES.map((l) => {
              const on = l.code === current;
              return (
                <button
                  key={l.code}
                  onClick={() => set(l.code)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", padding: "9px 11px", borderRadius: 8, border: "none", cursor: "pointer", background: on ? "var(--accent-bg)" : "transparent", color: on ? "var(--accent-text)" : "var(--text)", fontSize: 13.5, fontWeight: on ? 600 : 400, textAlign: "left" }}
                >
                  <span>{l.label}</span>
                  <span style={{ fontSize: 11, color: on ? "var(--accent-text)" : "var(--text-3)" }}>{l.short}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
