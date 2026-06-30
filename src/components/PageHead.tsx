"use client";

import { useRef, useState } from "react";

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
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  function show() {
    const el = btnRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const w = Math.min(360, window.innerWidth - 24);
      // Якорим под иконкой, но не даём вылезти за края экрана (важно на телефоне).
      const left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
      setPos({ top: r.bottom + 7, left });
    }
    setOpen(true);
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 19, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
        <i className={`ti ${icon}`} style={{ color: color || "var(--text)" }} />
        {title}
        {hint && (
          <span style={{ position: "relative", display: "inline-flex" }}>
            <button
              ref={btnRef}
              onClick={() => (open ? setOpen(false) : show())}
              onMouseEnter={show}
              onMouseLeave={() => setOpen(false)}
              aria-label="info"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "inline-flex", padding: 2, lineHeight: 1 }}
            >
              <i className="ti ti-help-circle" style={{ fontSize: 16 }} />
            </button>
            {open && (
              // position: fixed, привязан к иконке (pos), с клампом по краям экрана
              <div style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 30, width: "max-content", maxWidth: "min(360px, calc(100vw - 24px))", fontSize: 12.5, fontWeight: 400, color: "var(--text-2)", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,.12)", borderRadius: 9, padding: "8px 12px", lineHeight: 1.5 }}>
                {hint}
              </div>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
