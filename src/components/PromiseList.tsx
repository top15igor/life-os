"use client";

import { useState } from "react";

const STR: Record<string, { done: string; kept: string; empty: string }> = {
  ru: { done: "Выполнено", kept: "Выполнено ✓", empty: "Обещаний пока нет. Расскажи в записи, что кому-то пообещал — я напомню." },
  en: { done: "Done", kept: "Done ✓", empty: "No promises yet. Mention what you promised someone — I'll remind you." },
  uk: { done: "Виконано", kept: "Виконано ✓", empty: "Обіцянок поки немає. Згадай у записі, що комусь пообіцяв — я нагадаю." },
  fr: { done: "Fait", kept: "Fait ✓", empty: "Pas encore de promesses. Dis ce que tu as promis — je te le rappellerai." },
};

type P = { id: string; text: string; status?: string };

export default function PromiseList({ promises, locale, full }: { promises: P[]; locale: string; full?: boolean }) {
  const s = STR[locale] || STR.ru;
  const [items, setItems] = useState<P[]>(promises);

  async function markDone(id: string) {
    setItems((p) => p.map((x) => (x.id === id ? { ...x, status: "done" } : x)));
    try {
      await fetch("/api/promise", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: "done" }) });
    } catch {}
  }

  async function del(id: string) {
    setItems((p) => p.filter((x) => x.id !== id));
    try {
      await fetch("/api/promise", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, del: true }) });
    } catch {}
  }

  if (!items.length) return full ? <div className="card" style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.5 }}>{s.empty}</div> : null;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((p) => {
        const done = p.status === "done";
        return (
          <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, opacity: done ? 0.55 : 1 }}>
            <span style={{ fontSize: 14.5, lineHeight: 1.4, textDecoration: done ? "line-through" : "none" }}>{p.text}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {done ? (
                <span style={{ fontSize: 12, color: "var(--positive)", whiteSpace: "nowrap" }}>{s.kept}</span>
              ) : (
                <button onClick={() => markDone(p.id)} style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--accent)", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {s.done}
                </button>
              )}
              {full && (
                <button onClick={() => del(p.id)} aria-label="delete" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 2, lineHeight: 1 }}>
                  <i className="ti ti-x" style={{ fontSize: 16 }} />
                </button>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
