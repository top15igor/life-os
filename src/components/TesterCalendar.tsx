"use client";

import { useMemo, useState } from "react";
import { TESTER_FEATURES } from "@/lib/testerFeatures";

export type CalDay = {
  day: string;                 // YYYY-MM-DD
  entries: number | null;
  okCount: number;             // чек-лист: «работает»
  bugCount: number;            // чек-лист: «баг»
  checklist?: { key: string; result: string }[] | null;
  notes?: string | null;
  bugs: { text: string; status: string; payout: number }[]; // дискретные баги за день
};

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const FEAT = new Map(TESTER_FEATURES.map((f) => [f.key, f]));
const pad = (n: number) => String(n).padStart(2, "0");

const GREEN = "#0e9f6e", RED = "#e0533d", AMBER = "#e0a23d";

function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default function TesterCalendar({ days }: { days: CalDay[] }) {
  const byDay = useMemo(() => {
    const m = new Map<string, CalDay>();
    for (const d of days) m.set(d.day, d);
    return m;
  }, [days]);

  const today = todayStr();
  const initial = useMemo(() => {
    const latest = days.map((d) => d.day).sort().pop() || today;
    const [y, mo] = latest.split("-").map(Number);
    return { y, m: mo - 1 };
  }, [days, today]);

  const [view, setView] = useState(initial);
  const [sel, setSel] = useState<string | null>(null);

  const firstWd = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Пн = 0
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWd; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${view.y}-${pad(view.m + 1)}-${pad(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (delta: number) => {
    setSel(null);
    setView((v) => {
      const nm = v.m + delta;
      return { y: v.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
    });
  };

  const selDay = sel ? byDay.get(sel) : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{MONTHS[view.m]} {view.y}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => shift(-1)} aria-label="Предыдущий месяц" style={navBtn}>‹</button>
          <button onClick={() => shift(1)} aria-label="Следующий месяц" style={navBtn}>›</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 6 }}>
        {WD.map((w) => <div key={w} style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-3)" }}>{w}</div>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          const d = byDay.get(c);
          const isToday = c === today;
          const isSel = c === sel;
          const entries = d?.entries ?? 0;
          const nBugs = d?.bugs.length || 0;
          let bg = "var(--surface-2)", border = "1px solid var(--border)";
          if (d && entries >= 10) { bg = GREEN + "1f"; border = `1px solid ${GREEN}55`; }
          else if (d && (entries > 0 || d.bugCount > 0)) { bg = AMBER + "1f"; border = `1px solid ${AMBER}55`; }
          if (isSel) border = `2px solid var(--accent)`;
          else if (isToday) border = `2px solid ${GREEN}`;
          const dnum = Number(c.slice(8, 10));
          return (
            <button key={i} onClick={() => setSel(isSel ? null : c)}
              style={{ position: "relative", minHeight: 56, borderRadius: 10, background: bg, border, padding: "5px 6px", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: d ? "pointer" : "default", textAlign: "left" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{dnum}</span>
              {nBugs > 0 && (
                <span style={{ position: "absolute", top: 4, right: 5, fontSize: 10.5, fontWeight: 700, color: RED }}>🐞{nBugs}</span>
              )}
              {entries > 0 && <span style={{ fontSize: 11, color: "var(--text-2)" }}>{entries} зап.</span>}
            </button>
          );
        })}
      </div>

      {selDay && (
        <div style={{ marginTop: 14, border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", background: "var(--surface-2)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Отчёт · {Number(sel!.slice(8, 10))} {MONTHS[Number(sel!.slice(5, 7)) - 1].toLowerCase()}</span>
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>📖 {selDay.entries ?? 0} записей</span>
            {selDay.okCount > 0 && <span style={{ fontSize: 13, color: GREEN }}>✓ {selDay.okCount}</span>}
            {selDay.bugs.length > 0 && <span style={{ fontSize: 13, color: RED }}>🐞 {selDay.bugs.length}</span>}
          </div>

          {selDay.checklist && selDay.checklist.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: selDay.bugs.length || selDay.notes ? 12 : 0 }}>
              {selDay.checklist.filter((c) => c.result !== "skip").map((c) => {
                const f = FEAT.get(c.key);
                if (!f) return null;
                const ok = c.result === "ok";
                return (
                  <div key={c.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13.5 }}>
                    <span>{f.icon} {f.label}</span>
                    <span style={{ color: ok ? GREEN : RED, fontWeight: 600 }}>{ok ? "✓ работает" : "🐞 баг"}</span>
                  </div>
                );
              })}
            </div>
          )}

          {selDay.bugs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: selDay.notes ? 12 : 0 }}>
              {selDay.bugs.map((b, j) => {
                const st = b.status === "paid" ? { t: `$${b.payout}`, c: GREEN } : b.status === "rejected" ? { t: "не баг", c: "var(--text-3)" } : { t: "на проверке", c: AMBER };
                return (
                  <div key={j} style={{ fontSize: 13, background: RED + "12", border: `1px solid ${RED}33`, borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                      <span style={{ color: RED, fontWeight: 700, fontSize: 11.5 }}>🐞 баг</span>
                      <span style={{ color: st.c, fontWeight: 700, fontSize: 11.5 }}>{st.t}</span>
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{b.text}</div>
                  </div>
                );
              })}
            </div>
          )}

          {selDay.notes && <div style={{ fontSize: 13, color: "var(--text-2)", whiteSpace: "pre-wrap" }}>📝 {selDay.notes}</div>}
        </div>
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer", fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
};
