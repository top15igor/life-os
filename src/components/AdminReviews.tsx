"use client";

import { useState } from "react";

// Модерация отзывов: ничего не попадает на лендинг без нажатия «Опубликовать».

type R = { id: string; name: string; role: string | null; rating: number; text: string; status: string; created_at: string; locale: string };

export default function AdminReviews({ initial }: { initial: R[] }) {
  const [list, setList] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "approved" | "rejected" | "delete") {
    setBusy(id);
    const r = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action }),
    }).catch(() => null);
    setBusy(null);
    if (!r || !r.ok) return;
    setList((prev) => (action === "delete" ? prev.filter((x) => x.id !== id) : prev.map((x) => (x.id === id ? { ...x, status: action } : x))));
  }

  if (!list.length) return <div style={{ fontSize: 14, color: "var(--text-3)" }}>Отзывов пока нет.</div>;

  const label: Record<string, { t: string; c: string }> = {
    pending: { t: "ждёт решения", c: "#f59e0b" },
    approved: { t: "на сайте", c: "#10b981" },
    rejected: { t: "отклонён", c: "var(--text-3)" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {list.map((r) => {
        const st = label[r.status] || label.pending;
        return (
          <div key={r.id} className="card" style={{ borderLeft: `3px solid ${st.c}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{ color: "#f5a623", letterSpacing: 1.5 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: st.c }}>{st.t}</span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                {r.locale.toUpperCase()} · {new Date(r.created_at).toLocaleDateString("ru-RU")}
              </span>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 10px" }}>«{r.text}»</p>
            <div style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 12 }}>
              — {r.name}{r.role ? `, ${r.role}` : ""}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {r.status !== "approved" && (
                <button onClick={() => act(r.id, "approved")} disabled={busy === r.id} style={btn("#10b981")}>Опубликовать</button>
              )}
              {r.status !== "rejected" && (
                <button onClick={() => act(r.id, "rejected")} disabled={busy === r.id} style={btn("var(--text-3)")}>Скрыть</button>
              )}
              <button onClick={() => act(r.id, "delete")} disabled={busy === r.id} style={btn("#e11d48", true)}>Удалить</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function btn(color: string, ghost = false): React.CSSProperties {
  return {
    padding: "8px 16px",
    borderRadius: 10,
    border: ghost ? `1px solid ${color}` : "none",
    background: ghost ? "transparent" : color,
    color: ghost ? color : "#fff",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  };
}
