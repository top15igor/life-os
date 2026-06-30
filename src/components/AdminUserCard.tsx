"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Detail = {
  name: string; email: string | null; telegram: boolean; plan: string; joined: string;
  total: number; voice: number; text: number; first: string; last: string; activeDays: number;
  avgMood: number | null; avgEnergy: number | null;
  days30: { day: string; count: number }[]; costTotal: number;
  byKind: { kind: string; cents: number }[]; referrer: string | null;
  invited: { name: string; entries: number }[];
};

const PLAN_LABEL: Record<string, { t: string; c: string }> = {
  free: { t: "Старт", c: "var(--text-3)" }, pro: { t: "Pro", c: "#0ea5e9" }, premium: { t: "Премиум", c: "#f59e0b" },
};

function Mini({ days }: { days: { day: string; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 44 }}>
      {days.map((d) => (
        <div key={d.day} title={`${d.day}: ${d.count}`} style={{ flex: 1, height: `${Math.round((d.count / max) * 40)}px`, minHeight: d.count ? 3 : 1, background: d.count ? "var(--accent)" : "var(--surface-2)", borderRadius: 2 }} />
      ))}
    </div>
  );
}

export default function AdminUserCard({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/user?id=${encodeURIComponent(id)}`).then((r) => r.json()).then((j) => {
      if (!alive) return;
      if (j?.ok) setD(j); else setErr(true);
    }).catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, [id]);

  const node = (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 560, width: "100%", margin: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{d?.name || name}</div>
          <button onClick={onClose} aria-label="close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}><i className="ti ti-x" style={{ fontSize: 19 }} /></button>
        </div>

        {!d && !err && <div style={{ color: "var(--text-3)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>Загружаю…</div>}
        {err && <div style={{ color: "#ef4444", fontSize: 13 }}>Не удалось загрузить.</div>}

        {d && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Метки */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
              <span style={{ padding: "2px 9px", borderRadius: 99, border: `1px solid ${PLAN_LABEL[d.plan].c}`, color: PLAN_LABEL[d.plan].c, fontWeight: 600 }}>{PLAN_LABEL[d.plan].t}</span>
              {d.telegram && <span style={{ padding: "2px 9px", borderRadius: 99, background: "var(--surface-2)", color: "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 4 }}><i className="ti ti-brand-telegram" style={{ fontSize: 12 }} />Telegram</span>}
              {d.email && <span style={{ padding: "2px 9px", borderRadius: 99, background: "var(--surface-2)", color: "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 4 }}><i className="ti ti-mail" style={{ fontSize: 12 }} />{d.email}</span>}
            </div>

            {/* Числа */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8 }}>
              {[
                ["Записей", String(d.total)],
                ["Активных дней", String(d.activeDays)],
                ["🎙 / ✍️", `${d.voice} / ${d.text}`],
                ["Настроение", d.avgMood != null ? String(d.avgMood) : "—"],
                ["Энергия", d.avgEnergy != null ? String(d.avgEnergy) : "—"],
                ["Расход AI", `$${(d.costTotal / 100).toFixed(2)}`],
              ].map(([l, v]) => (
                <div key={l} style={{ background: "var(--surface-2)", borderRadius: 9, padding: "9px 10px" }}>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Активность 30 дней */}
            <div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 6 }}>Активность за 30 дней</div>
              <Mini days={d.days30} />
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6 }}>
                Пришёл: {d.joined || "—"}{d.first ? ` · первая запись ${d.first}` : ""}{d.last ? ` · последняя ${d.last}` : ""}
              </div>
            </div>

            {/* Рефералы */}
            <div style={{ fontSize: 13 }}>
              <div style={{ color: "var(--text-2)", marginBottom: 4 }}>Пригласил его: <b>{d.referrer || "— (или зашёл сам)"}</b></div>
              <div style={{ color: "var(--text-2)" }}>Пригласил сам: <b>{d.invited.length}</b></div>
              {d.invited.length > 0 && (
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                  {d.invited.map((k, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-2)" }}>
                      <span>{k.name}</span><span style={{ color: "var(--text-3)" }}>{k.entries} зап.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Расход по типам */}
            {d.byKind.length > 0 && (
              <div style={{ fontSize: 12.5 }}>
                <div style={{ color: "var(--text-2)", marginBottom: 5 }}>На что ушёл AI</div>
                {d.byKind.map((k) => (
                  <div key={k.kind} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "var(--text-2)" }}>
                    <span>{k.kind}</span><span style={{ color: "var(--text-3)" }}>${(k.cents / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}
