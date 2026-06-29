"use client";

import { useState } from "react";

const OPTS: { key: string; label: string }[] = [
  { key: "free", label: "Старт" },
  { key: "pro", label: "Pro" },
  { key: "premium", label: "Премиум" },
];

const COLOR: Record<string, string> = { free: "var(--text-3)", pro: "#0ea5e9", premium: "#f59e0b" };

// Селектор тарифа в админ-таблице. Меняет users.plan через /api/admin/plan.
export default function AdminPlanSelect({ id, plan }: { id: string; plan: string }) {
  const [value, setValue] = useState(plan || "free");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  async function change(next: string) {
    if (next === value || busy) return;
    const prev = value;
    setValue(next);
    setBusy(true);
    setOk(false);
    const r = await fetch("/api/admin/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, plan: next }) }).then((x) => x.json()).catch(() => ({ ok: false }));
    setBusy(false);
    if (r?.ok) { setOk(true); setTimeout(() => setOk(false), 1500); }
    else setValue(prev); // откат при ошибке
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={busy}
        style={{ fontSize: 12, padding: "3px 6px", borderRadius: 7, border: `1px solid ${COLOR[value] || "var(--border)"}`, background: "var(--surface)", color: COLOR[value] || "var(--text)", fontWeight: 500, cursor: busy ? "default" : "pointer" }}
      >
        {OPTS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
      {ok && <i className="ti ti-check" style={{ fontSize: 14, color: "var(--positive)" }} />}
    </span>
  );
}
