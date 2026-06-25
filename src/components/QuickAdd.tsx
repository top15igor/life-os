"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickAdd({
  placeholder,
  button,
  saving,
  hint,
}: {
  placeholder: string;
  button: string;
  saving: string;
  hint: string;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (r.ok) {
        setText("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ border: "1px solid var(--border)", borderRadius: 13, padding: "12px 15px", marginBottom: 18 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={2}
        style={{ width: "100%", border: "none", outline: "none", resize: "vertical", background: "transparent", color: "var(--text)", fontSize: 14, fontFamily: "inherit", lineHeight: 1.5 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <i className="ti ti-brand-telegram" style={{ fontSize: 15, color: "var(--text-3)" }} />
        <span style={{ fontSize: 11.5, color: "var(--text-3)", flex: 1 }}>{hint}</span>
        <button
          type="submit"
          disabled={busy || !text.trim()}
          style={{ fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: 9, border: "none", cursor: busy ? "default" : "pointer", background: "var(--accent)", color: "#fff", opacity: busy || !text.trim() ? 0.6 : 1 }}
        >
          {busy ? saving : button}
        </button>
      </div>
    </form>
  );
}
