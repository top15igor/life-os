"use client";

import { useState } from "react";
import type { TesterBug } from "@/lib/admin";

function fmt(d: string | null): string {
  if (!d) return "";
  const dt = new Date(d);
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(dt);
}

export default function AdminBugRater({ bug }: { bug: TesterBug }) {
  const [status, setStatus] = useState(bug.status);
  const [payout, setPayout] = useState(bug.payout);
  const [busy, setBusy] = useState(false);

  const rate = async (nextPayout: number, nextStatus: string) => {
    setBusy(true);
    const prev = { status, payout };
    setStatus(nextStatus); setPayout(nextPayout);
    try {
      const r = await fetch("/api/admin/tester-bug", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bug.id, payout: nextPayout, status: nextStatus }),
      }).then((x) => x.json());
      if (!r?.ok) { setStatus(prev.status); setPayout(prev.payout); }
    } catch { setStatus(prev.status); setPayout(prev.payout); }
    finally { setBusy(false); }
  };

  const rejected = status === "rejected";
  const btn = (val: number) => {
    const active = status === "paid" && payout === val;
    return (
      <button key={val} disabled={busy} onClick={() => rate(val, "paid")}
        style={{ fontSize: 13, fontWeight: 700, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
          border: active ? "1px solid #0e9f6e" : "1px solid var(--border)",
          background: active ? "#0e9f6e" : "transparent", color: active ? "#fff" : "var(--text-2)" }}>${val}</button>
    );
  };

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", background: rejected ? "var(--surface-2)" : status === "paid" ? "#0e9f6e0d" : "var(--surface)", opacity: rejected ? 0.6 : 1 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 7 }}>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{fmt(bug.created_at)}</span>
        {status === "paid" && <span style={{ fontSize: 11.5, fontWeight: 700, color: "#0e9f6e" }}>✓ ${payout}</span>}
        {status === "new" && <span style={{ fontSize: 11.5, fontWeight: 700, color: "#e0533d" }}>● новый</span>}
        {rejected && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>отклонён</span>}
      </div>
      <div style={{ fontSize: 13.5, whiteSpace: "pre-wrap", marginBottom: 9, textDecoration: rejected ? "line-through" : "none" }}>{bug.text}</div>
      <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
        {btn(5)}
        {btn(10)}
        <button disabled={busy} onClick={() => rate(0, "rejected")}
          style={{ fontSize: 13, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
            border: rejected ? "1px solid #e0533d" : "1px solid var(--border)",
            background: rejected ? "#e0533d" : "transparent", color: rejected ? "#fff" : "var(--text-3)" }}>✕ не баг</button>
        {status !== "new" && (
          <button disabled={busy} onClick={() => rate(0, "new")}
            style={{ marginLeft: "auto", fontSize: 12, padding: "6px 10px", borderRadius: 8, cursor: "pointer", border: "none", background: "none", color: "var(--text-3)" }}>сбросить</button>
        )}
      </div>
    </div>
  );
}
