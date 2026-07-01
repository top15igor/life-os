"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TL = { date: string; mood: number | null; steps: number | null; sleep_hours: number | null; hr_resting: number | null; active_kcal: number | null };
type Dash = {
  name: string | null;
  streak: number;
  totalEntries: number;
  timeline: TL[];
  weekAvg: { mood: number | null; steps: number | null; sleep: number | null; hr_resting: number | null; active_kcal: number | null };
  sleepMood: { r: number; n: number } | null;
  topTags: { name: string; count: number }[];
  healthConnected: boolean;
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

function Metric({ icon, color, label, value, unit, series }: { icon: string; color: string; label: string; value: string | null; unit: string; series: (number | null)[] }) {
  return (
    <div className="card" style={{ padding: 15 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 17, color }} />
        <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>
        {value ?? "—"}{value != null && unit ? <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 600 }}> {unit}</span> : null}
      </div>
      <Spark series={series} color={color} />
    </div>
  );
}

export default function DashboardView() {
  const [d, setD] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="card" style={card}>
        <div style={secLbl}>Настроение · 14 дней</div>
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
          <Metric icon="ti-walk" color="#5b8cff" label="Шаги" unit="" value={fmt(d.weekAvg.steps)} series={tl.map((x) => x.steps)} />
          <Metric icon="ti-moon" color="#9b7dff" label="Сон" unit="ч" value={fmt(d.weekAvg.sleep, 1)} series={tl.map((x) => x.sleep_hours)} />
          <Metric icon="ti-heartbeat" color="#ff6b6b" label="Пульс покоя" unit="уд" value={fmt(d.weekAvg.hr_resting)} series={tl.map((x) => x.hr_resting)} />
          <Metric icon="ti-flame" color="#f0983a" label="Актив. ккал" unit="" value={fmt(d.weekAvg.active_kcal)} series={tl.map((x) => x.active_kcal)} />
        </div>
      ) : (
        <div className="card" style={card}>
          <div style={{ color: "var(--text)" }}>Здоровье не подключено.</div>
          <Link href="/health" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", marginTop: 6, display: "inline-block" }}>Подключить Fitbit / Google Health →</Link>
        </div>
      )}

      {/* Themes */}
      {d.topTags.length > 0 && (
        <div className="card" style={{ ...card, marginTop: 14 }}>
          <div style={secLbl}>Главные темы</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {d.topTags.map((t) => (
              <span key={t.name} style={{ fontSize: 13, padding: "5px 12px", borderRadius: 20, border: "1px solid var(--border)", background: "var(--surface)" }}>{t.name} · {t.count}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
