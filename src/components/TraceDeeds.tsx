"use client";

import { useState } from "react";

type Deed = { id: string; text: string; created_at: string };

export default function TraceDeeds({ deeds, locale, emptyText }: { deeds: Deed[]; locale: string; emptyText: string }) {
  const [items, setItems] = useState<Deed[]>(deeds);

  async function del(id: string) {
    setItems((p) => p.filter((x) => x.id !== id));
    try {
      await fetch("/api/deed", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    } catch {}
  }

  if (!items.length) return <div className="card" style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{emptyText}</div>;

  const dateStr = (s: string) => {
    try {
      return new Date(s).toLocaleDateString(locale === "ru" ? "ru-RU" : locale, { day: "numeric", month: "long" });
    } catch {
      return "";
    }
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((d) => (
        <div key={d.id} className="card" style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
          <i className="ti ti-heart" style={{ fontSize: 17, color: "#ec4899", flexShrink: 0, marginTop: 2 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14.5, lineHeight: 1.45 }}>{d.text}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 3 }}>{dateStr(d.created_at)}</div>
          </div>
          <button onClick={() => del(d.id)} aria-label="delete" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 2, flexShrink: 0, lineHeight: 1 }}>
            <i className="ti ti-x" style={{ fontSize: 16 }} />
          </button>
        </div>
      ))}
    </div>
  );
}
