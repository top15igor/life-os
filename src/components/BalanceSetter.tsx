"use client";

import { useState } from "react";

// Мини-форма: вписать текущий баланс Anthropic. На успехе перезагружает страницу,
// чтобы серверный рендер показал свежий остаток (не зависим от клиентского стейта).
export default function BalanceSetter() {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    const n = Number(val.replace(",", "."));
    if (!isFinite(n) || n < 0) { setErr("введи число, напр. 100"); return; }
    setBusy(true); setErr(null);
    try {
      const resp = await fetch("/api/admin/anthropic-limits", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ balanceUsd: n }),
      });
      const r = await resp.json().catch(() => ({} as any));
      if (resp.ok && r?.ok) { window.location.reload(); return; }
      setErr(`HTTP ${resp.status} · ${r?.error || "не сохранилось"}`);
    } catch (e: any) {
      setErr("сеть: " + String(e?.message || e));
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
      <input value={val} onChange={(e) => setVal(e.target.value)} inputMode="decimal" placeholder="баланс, напр. 100"
        style={{ width: 150, fontSize: 13.5, padding: "7px 10px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} />
      <button onClick={save} disabled={busy || !val}
        style={{ fontSize: 12.5, fontWeight: 600, padding: "7px 13px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", opacity: busy || !val ? 0.6 : 1 }}>
        {busy ? "…" : "Записать баланс"}
      </button>
      <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>вписывай баланс из Console после пополнения (или командой /balance 100 в боте)</span>
      {err && <span style={{ fontSize: 12, color: "#e11d48", width: "100%" }}>Ошибка: {err}</span>}
    </div>
  );
}
