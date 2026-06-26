"use client";

import { useState } from "react";

export default function PageHead({
  icon,
  color,
  title,
  hint,
}: {
  icon: string;
  color?: string;
  title: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 19, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
        <i className={`ti ${icon}`} style={{ color: color || "var(--text)" }} />
        {title}
        {hint && (
          <button
            onClick={() => setOpen((o) => !o)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            aria-label="info"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "inline-flex", padding: 2, lineHeight: 1 }}
          >
            <i className="ti ti-help-circle" style={{ fontSize: 16 }} />
          </button>
        )}
      </div>
      {open && hint && (
        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 7, background: "var(--surface-2)", borderRadius: 9, padding: "8px 12px", lineHeight: 1.5, maxWidth: 540 }}>
          {hint}
        </div>
      )}
    </div>
  );
}
