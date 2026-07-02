"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TesterToggle({ initial }: { initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async (next: boolean) => {
    setBusy(true);
    setOn(next);
    try {
      await fetch("/api/tester", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mode", on: next }) });
      router.refresh();
    } catch {
      setOn(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Режим тестировщика</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 3, lineHeight: 1.5 }}>
            Включи — и в меню появится раздел «Тесты», где ты каждый день отмечаешь, что проверил(а), и сдаёшь отчёт.
          </div>
        </div>
        <button
          onClick={() => toggle(!on)}
          disabled={busy}
          aria-pressed={on}
          style={{
            flexShrink: 0, width: 52, height: 30, borderRadius: 999, border: "none", cursor: busy ? "default" : "pointer",
            background: on ? "var(--accent)" : "var(--border)", position: "relative", transition: "background .15s",
          }}>
          <span style={{ position: "absolute", top: 3, left: on ? 25 : 3, width: 24, height: 24, borderRadius: 999, background: "#fff", transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }} />
        </button>
      </div>
      {on && (
        <Link href="/tests" className="card" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, background: "var(--accent-bg)", border: "1px solid var(--accent)", color: "var(--accent-text)", padding: "12px 14px" }}>
          <i className="ti ti-checklist" style={{ fontSize: 20 }} />
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>Открыть «Тесты» — сдать отчёт за сегодня →</span>
        </Link>
      )}
    </div>
  );
}
