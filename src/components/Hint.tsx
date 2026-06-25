"use client";

import { useState } from "react";

export default function Hint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        title={text}
        aria-label="info"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "inline-flex", padding: 2, lineHeight: 1 }}
      >
        <i className="ti ti-help-circle" style={{ fontSize: 16 }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 6, zIndex: 20, width: 260, fontSize: 12.5, color: "var(--text-2)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", lineHeight: 1.5 }}>
          {text}
        </div>
      )}
    </span>
  );
}
