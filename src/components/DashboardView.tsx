"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bandOf, bandMeta } from "@/lib/mood";

type TL = { date: string; mood: number | null; steps: number | null; sleep_hours: number | null; hr_resting: number | null; active_kcal: number | null; hrv: number | null; azm: number | null };
type LatestHealth = { sleep_hours?: number | null; sleep_deep_min?: number | null; sleep_rem_min?: number | null; sleep_light_min?: number | null } | null;
type Dash = {
  name: string | null;
  streak: number;
  totalEntries: number;
  timeline: TL[];
  weekAvg: { mood: number | null; steps: number | null; sleep: number | null; hr_resting: number | null; active_kcal: number | null; hrv: number | null; azm: number | null };
  sleepMood: { r: number; n: number } | null;
  bodyMind: { text: string }[];
  topTags: { name: string; count: number }[];
  healthConnected: boolean;
  latestHealth: LatestHealth;
};

function moodColor(n: number): string {
  if (n >= 8) return "#33c27a";
  if (n >= 6) return "#7fc23f";
  if (n >= 5) return "#d3b23c";
  if (n >= 3) return "#e08a3a";
  return "#d95757";
}

function Spark({ series, color }: { series: (number | null)[]; color: string }) {
  const vals = series.filter((v): v is number => typeof v === "number" && v > 0);
  const max = vals.length ? Math.max(...vals) : 1;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 34, marginTop: 10 }}>
      {series.map((v, i) => (
        <div key={i} style={{ flex: 1, height: v && v > 0 ? Math.max(3, (v / max) * 34) : 3, borderRadius: 2, background: v && v > 0 ? color : "var(--surface-2)" }} />
      ))}
    </div>
  );
}

function Metric({ icon, color, label, value, unit, series, onClick }: { icon: string; color: string; label: string; value: string | null; unit: string; series: (number | null)[]; onClick?: () => void }) {
  return (
    <div className="card" onClick={onClick} style={{ padding: 15, cursor: onClick ? "pointer" : "default", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 17, color }} />
        <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>{label}</span>
        {onClick && <i className="ti ti-chevron-right" style={{ fontSize: 15, color: "var(--text-3)", marginLeft: "auto" }} />}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>
        {value ?? "—"}{value != null && unit ? <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 600 }}> {unit}</span> : null}
      </div>
      <Spark series={series} color={color} />
    </div>
  );
}

function hm(min: number): string {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
}

function SleepStages({ h }: { h: NonNullable<LatestHealth> }) {
  const deep = h.sleep_deep_min || 0, rem = h.sleep_rem_min || 0, light = h.sleep_light_min || 0;
  const total = deep + rem + light;
  if (total <= 0) return null;
  const parts = [
    { k: "Глубокий", v: deep, c: "#5b6cff" },
    { k: "REM", v: rem, c: "#9b7dff" },
    { k: "Лёгкий", v: light, c: "#7fb0ff" },
  ];
  return (
    <div className="card" style={{ padding: 16, marginTop: 14 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-3)" }}>Фазы сна · последняя ночь</div>
      <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", marginTop: 12 }}>
        {parts.map((p) => p.v > 0 && <div key={p.k} style={{ width: `${(p.v / total) * 100}%`, background: p.c }} />)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 12 }}>
        {parts.map((p) => (
          <div key={p.k} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: p.c, display: "inline-block" }} />
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>{p.k}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{hm(p.v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type MetricDef = { key: string; icon: string; color: string; label: string; unit: string; digits: number; get: (x: TL) => number | null; moodColored?: boolean };

const METRICS: MetricDef[] = [
  { key: "mood", icon: "ti-mood-smile", color: "#7fc23f", label: "Настроение", unit: "/10", digits: 1, get: (x) => x.mood, moodColored: true },
  { key: "steps", icon: "ti-walk", color: "#5b8cff", label: "Шаги", unit: "", digits: 0, get: (x) => x.steps },
  { key: "sleep_hours", icon: "ti-moon", color: "#9b7dff", label: "Сон", unit: "ч", digits: 1, get: (x) => x.sleep_hours },
  { key: "hr_resting", icon: "ti-heartbeat", color: "#ff6b6b", label: "Пульс покоя", unit: "уд", digits: 0, get: (x) => x.hr_resting },
  { key: "active_kcal", icon: "ti-flame", color: "#f0983a", label: "Актив. ккал", unit: "", digits: 0, get: (x) => x.active_kcal },
  { key: "hrv", icon: "ti-activity-heartbeat", color: "#2fb6a8", label: "Вариабельность пульса", unit: "мс", digits: 0, get: (x) => x.hrv },
  { key: "azm", icon: "ti-bolt", color: "#e6b800", label: "Зоны активности", unit: "мин", digits: 0, get: (x) => x.azm },
];

const WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
function dayLabel(date: string): string {
  const [y, m, dd] = date.split("-").map(Number);
  const wd = WD[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()];
  return `${wd}, ${dd}.${String(m).padStart(2, "0")}`;
}

function MetricDetail({ def, tl, onClose }: { def: MetricDef; tl: TL[]; onClose: () => void }) {
  const rows = tl.map((x) => ({ date: x.date, v: def.get(x) })).filter((r) => r.v != null) as { date: string; v: number }[];
  const vals = rows.map((r) => r.v);
  const nf = (v: number) => (def.digits ? v.toFixed(def.digits) : String(Math.round(v)));
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  const max = vals.length ? Math.max(...vals) : null;
  const min = vals.length ? Math.min(...vals) : null;
  const chartMax = max ?? 1;
  const barColor = (v: number | null) => (v == null ? "var(--surface-2)" : def.moodColored ? moodColor(v) : def.color);

  const stat = (lbl: string, v: number | null) => (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{v == null ? "—" : nf(v)}<span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>{v != null && def.unit ? ` ${def.unit}` : ""}</span></div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{lbl}</div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 640, maxHeight: "88vh", overflowY: "auto", borderRadius: "18px 18px 0 0", padding: 20, margin: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <i className={`ti ${def.icon}`} style={{ fontSize: 20, color: def.color }} />
          <span style={{ fontSize: 17, fontWeight: 800 }}>{def.label}</span>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "var(--surface-2)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "var(--text-2)", fontSize: 16 }}>✕</button>
        </div>

        {rows.length === 0 ? (
          <div style={{ color: "var(--text-3)", padding: "24px 0", textAlign: "center" }}>Пока нет данных за период.</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, margin: "14px 0 18px" }}>
              {stat("среднее", avg)}
              {stat("максимум", max)}
              {stat("минимум", min)}
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", height: 130, gap: 4, marginBottom: 18 }}>
              {tl.map((x, i) => {
                const v = def.get(x);
                return (
                  <div key={x.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
                    <div style={{ width: "70%", height: v != null && v > 0 ? Math.max(4, (v / chartMax) * 108) : 4, borderRadius: 3, background: barColor(v) }} />
                    <div style={{ fontSize: 9, color: i === tl.length - 1 ? "var(--accent)" : "var(--text-3)", marginTop: 5 }}>{i === tl.length - 1 ? "сег" : x.date.slice(8, 10)}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-3)", marginBottom: 4 }}>По дням</div>
            <div>
              {[...rows].reverse().map((r) => (
                <div key={r.date} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 2px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 14, color: "var(--text-2)" }}>{dayLabel(r.date)}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{nf(r.v)}{def.unit ? <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}> {def.unit}</span> : null}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardView() {
  const [d, setD] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((j) => j?.ok && setD(j))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Загрузка…</div>;
  if (!d) return <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Пока нет данных</div>;

  const tl = d.timeline || [];
  const fmt = (v: number | null, dg = 0) => (v == null ? null : dg ? v.toFixed(dg) : String(Math.round(v)));

  let insight: string | null = null;
  if (d.sleepMood) {
    const r = d.sleepMood.r;
    if (r >= 0.35) insight = "Больше спишь — лучше настроение 😴 → 🙂";
    else if (r <= -0.35) insight = "Чем больше сна, тем ниже настроение — возможно, пересып";
    else insight = "Пока чёткой связи сна и настроения не видно";
  }

  const card: React.CSSProperties = { padding: 16, marginBottom: 14 };
  const secLbl: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-3)" };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        {[
          { v: `🔥 ${d.streak}`, c: "дней подряд" },
          { v: `📖 ${d.totalEntries}`, c: "записей" },
          { v: d.weekAvg.mood != null ? `${d.weekAvg.mood}/10` : "—", c: "настроение недели" },
        ].map((x, i) => (
          <div key={i} className="card" style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{x.v}</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>{x.c}</div>
          </div>
        ))}
      </div>

      {/* Mood chart */}
      <div className="card" style={{ ...card, cursor: "pointer" }} onClick={() => setOpen("mood")}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={secLbl}>Настроение · 14 дней</div>
          <i className="ti ti-chevron-right" style={{ marginLeft: "auto", color: "var(--text-3)", fontSize: 15 }} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", height: 120, gap: 5, marginTop: 12 }}>
          {tl.map((day, i) => (
            <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
              <div style={{ width: "68%", height: day.mood != null ? Math.max(6, (day.mood / 10) * 98) : 6, borderRadius: 4, background: day.mood != null ? moodColor(day.mood) : "var(--surface-2)" }} />
              <div style={{ fontSize: 9.5, color: i === tl.length - 1 ? "var(--accent)" : "var(--text-3)", fontWeight: i === tl.length - 1 ? 700 : 400, marginTop: 5 }}>
                {i === tl.length - 1 ? "сег" : day.date.slice(8, 10)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight */}
      {insight && (
        <div className="card" style={{ ...card, background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
          <div style={{ ...secLbl, color: "var(--accent-text)" }}>✨ Что заметно</div>
          <div style={{ fontSize: 16, marginTop: 6, color: "var(--text)" }}>{insight}</div>
          {d.sleepMood && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3 }}>по {d.sleepMood.n} дн.</div>}
        </div>
      )}

      {/* Health */}
      <div style={{ ...secLbl, margin: "20px 2px 10px" }}>Здоровье · среднее за неделю</div>
      {d.healthConnected ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {METRICS.filter((m) => m.key !== "mood").map((m) => {
            const wk = m.key === "sleep_hours" ? d.weekAvg.sleep : (d.weekAvg as any)[m.key];
            return (
              <Metric key={m.key} icon={m.icon} color={m.color} label={m.label} unit={m.unit} value={fmt(wk, m.digits)} series={tl.map(m.get)} onClick={() => setOpen(m.key)} />
            );
          })}
        </div>
      ) : (
        <div className="card" style={card}>
          <div style={{ color: "var(--text)" }}>Здоровье не подключено.</div>
          <Link href="/health" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", marginTop: 6, display: "inline-block" }}>Подключить Fitbit / Google Health →</Link>
        </div>
      )}

      {/* Sleep stages */}
      {d.healthConnected && d.latestHealth && <SleepStages h={d.latestHealth} />}

      {/* Mood calendar entry */}
      <Link href="/mood" className="card" style={{ ...card, marginTop: 14, display: "block", textDecoration: "none", color: "var(--text)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={secLbl}>Календарь настроения</div>
          <i className="ti ti-chevron-right" style={{ fontSize: 16, color: "var(--text-3)" }} />
        </div>
        <div style={{ display: "flex", gap: 5, marginTop: 12 }}>
          {tl.slice(-12).map((day: any, i: number) => {
            const b = day.mood != null ? bandMeta(bandOf(day.mood)) : null;
            return <div key={i} style={{ flex: 1, height: 22, borderRadius: 6, background: b ? b.color : "var(--surface-2)", border: b ? "none" : "1px dashed var(--border)" }} />;
          })}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 10 }}>Весь месяц, смайлы и ручная правка — тапни</div>
      </Link>

      {/* Body ↔ mind */}
      {d.healthConnected && ((d.bodyMind?.length ?? 0) > 0 ? (
        <div className="card" style={{ ...card, marginTop: 14 }}>
          <div style={secLbl}>Тело и настроение</div>
          {d.bodyMind.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 9, marginTop: 11, alignItems: "flex-start" }}>
              <i className="ti ti-link" style={{ fontSize: 15, color: "var(--accent)", marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 14, lineHeight: 1.45 }}>{c.text}</span>
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 12 }}>по твоим записям за 2 недели</div>
        </div>
      ) : (
        <div className="card" style={{ ...card, marginTop: 14 }}>
          <div style={secLbl}>Тело и настроение</div>
          <div style={{ fontSize: 13.5, color: "var(--text-2)", marginTop: 8, lineHeight: 1.45 }}>
            Пиши в записях, как ты себя чувствуешь — AI сам считывает настроение и энергию из текста. Накопится пара недель таких записей — и здесь появятся связи с твоим сном, шагами и пульсом.
          </div>
        </div>
      ))}

      {open && (() => {
        const def = METRICS.find((m) => m.key === open);
        return def ? <MetricDetail def={def} tl={tl} onClose={() => setOpen(null)} /> : null;
      })()}
    </div>
  );
}
