"use client";

import { useMemo, useState } from "react";

type Day = { day: string; anthropic: number; openai: number };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function shiftISO(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

const PRESETS: { key: string; label: string; from: () => string }[] = [
  { key: "today", label: "Сегодня", from: () => todayISO() },
  { key: "7", label: "7 дней", from: () => shiftISO(6) },
  { key: "30", label: "30 дней", from: () => shiftISO(29) },
  { key: "90", label: "90 дней", from: () => shiftISO(89) },
  { key: "all", label: "Всё время", from: () => "0000-00-00" },
];

export default function AdminSpendPeriod({ byDay }: { byDay: Day[] }) {
  const [preset, setPreset] = useState("30");
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState(shiftISO(29));
  const [to, setTo] = useState(todayISO());

  const range = useMemo(() => {
    if (custom) return { from, to };
    const p = PRESETS.find((x) => x.key === preset)!;
    return { from: p.from(), to: todayISO() };
  }, [custom, preset, from, to]);

  const sum = useMemo(() => {
    let a = 0, o = 0, days = 0;
    for (const d of byDay) {
      if (d.day >= range.from && d.day <= range.to) { a += d.anthropic; o += d.openai; days += 1; }
    }
    return { anthropic: a, openai: o, total: a + o, days };
  }, [byDay, range]);

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "6px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
    background: active ? "var(--accent)" : "var(--surface)",
    color: active ? "#fff" : "var(--text-2)",
  });

  return (
    <div className="card" style={{ marginBottom: 12, background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>
        <i className="ti ti-cash" style={{ fontSize: 16, color: "var(--accent)" }} />
        Сколько потрачено за период
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
        {PRESETS.map((p) => (
          <button key={p.key} onClick={() => { setCustom(false); setPreset(p.key); }} style={chip(!custom && preset === p.key)}>
            {p.label}
          </button>
        ))}
        <button onClick={() => setCustom(true)} style={chip(custom)}>
          <i className="ti ti-calendar" style={{ fontSize: 13, verticalAlign: "-2px", marginRight: 4 }} />Свой период
        </button>
      </div>

      {custom && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12, fontSize: 12.5, color: "var(--text-2)" }}>
          <span>с</span>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)}
            style={{ fontSize: 12.5, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} />
          <span>по</span>
          <input type="date" value={to} min={from} max={todayISO()} onChange={(e) => setTo(e.target.value)}
            style={{ fontSize: 12.5, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 34, fontWeight: 750, letterSpacing: "-0.02em", color: "var(--accent)" }}>
          ${(sum.total / 100).toFixed(2)}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>
          Claude ${(sum.anthropic / 100).toFixed(2)} · OpenAI ${(sum.openai / 100).toFixed(2)}
          {sum.days > 0 && ` · дней с расходом: ${sum.days}`}
        </div>
      </div>
    </div>
  );
}
