"use client";

import { useState } from "react";

type UserOpt = { id: string; name: string };

// Селект «кто пригласил» в админ-таблице. Меняет users.referred_by через /api/admin/referrer.
export default function AdminReferrerSelect({ id, current, users }: { id: string; current: string | null; users: UserOpt[] }) {
  const [value, setValue] = useState(current || "");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  const options = users.filter((u) => u.id !== id);

  async function change(next: string) {
    if (next === value || busy) return;
    const prev = value;
    setValue(next);
    setBusy(true);
    setOk(false);
    const r = await fetch("/api/admin/referrer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, referrerId: next || null }),
    }).then((x) => x.json()).catch(() => ({ ok: false }));
    setBusy(false);
    if (r?.ok) { setOk(true); setTimeout(() => setOk(false), 1500); }
    else setValue(prev);
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={busy}
        style={{ fontSize: 12, padding: "3px 6px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", color: value ? "var(--text)" : "var(--text-3)", maxWidth: 150, cursor: busy ? "default" : "pointer" }}
      >
        <option value="">— никто</option>
        {options.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
      {ok && <i className="ti ti-check" style={{ fontSize: 14, color: "var(--positive)" }} />}
    </span>
  );
}
