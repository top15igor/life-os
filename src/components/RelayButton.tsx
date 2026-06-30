"use client";

import { useState } from "react";

const T: Record<string, any> = {
  ru: { write: "Написать", ph: "Сообщение…", sent: "Отправлено ✓", err: "Не удалось" },
  en: { write: "Message", ph: "Message…", sent: "Sent ✓", err: "Failed" },
};

export default function RelayButton({ targetId, locale }: { targetId: string; locale: string }) {
  const t = locale === "en" || locale === "fr" ? T.en : T.ru;
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    if (!val.trim() || busy) return;
    setBusy(true); setMsg(null);
    const r = await fetch("/api/relay", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ targetId, message: val }) })
      .then((x) => x.json()).catch(() => ({ ok: false }));
    setBusy(false);
    if (r?.ok) { setMsg(t.sent); setVal(""); setTimeout(() => { setMsg(null); setOpen(false); }, 1600); }
    else setMsg(r?.error || t.err);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", padding: "2px 0", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <i className="ti ti-send" style={{ fontSize: 13 }} />{t.write}
      </button>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
      <input
        autoFocus value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") send(); if (e.key === "Escape") setOpen(false); }}
        placeholder={t.ph}
        style={{ flex: 1, minWidth: 150, padding: "7px 10px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13, color: "var(--text)" }}
      />
      <button onClick={send} disabled={busy || !val.trim()} style={{ border: "none", background: "var(--accent)", color: "#fff", borderRadius: 9, padding: "7px 11px", cursor: "pointer", fontSize: 13 }}>
        <i className="ti ti-send" />
      </button>
      <button onClick={() => { setOpen(false); setMsg(null); }} style={{ border: "none", background: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 13 }}>✕</button>
      {msg && <span style={{ fontSize: 12, color: msg === t.sent ? "var(--positive)" : "#ef4444", width: "100%" }}>{msg}</span>}
    </div>
  );
}
