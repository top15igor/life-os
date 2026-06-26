"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Point = { day: string; kg: number };
type Goal = { target_kg: number | null; target_date: string | null; start_kg: number | null; start_date: string | null };

const STR: Record<string, any> = {
  ru: { title: "Вес", current: "Текущий вес", noData: "Веса пока нет", on: "от", add: "Записать вес", goalSet: "Задать цель", goalEdit: "Изменить цель", goal: "Цель", to: "к", left: "осталось", reached: "Цель достигнута!", pace: "нужно ≈", perWeek: "кг/нед", date: "Дата", kg: "кг", save: "Сохранить", cancel: "Отмена", targetKg: "Целевой вес, кг", targetDate: "Желаемая дата", gain: "набрать", lose: "сбросить", days: "дн.", chartHint: "Каждая точка — замер" },
  en: { title: "Weight", current: "Current weight", noData: "No weight yet", on: "on", add: "Log weight", goalSet: "Set a goal", goalEdit: "Edit goal", goal: "Goal", to: "by", left: "to go", reached: "Goal reached!", pace: "need ≈", perWeek: "kg/wk", date: "Date", kg: "kg", save: "Save", cancel: "Cancel", targetKg: "Target weight, kg", targetDate: "Target date", gain: "to gain", lose: "to lose", days: "days", chartHint: "Each dot is a measurement" },
  uk: { title: "Вага", current: "Поточна вага", noData: "Ваги поки немає", on: "від", add: "Записати вагу", goalSet: "Задати ціль", goalEdit: "Змінити ціль", goal: "Ціль", to: "до", left: "залишилось", reached: "Ціль досягнута!", pace: "треба ≈", perWeek: "кг/тиж", date: "Дата", kg: "кг", save: "Зберегти", cancel: "Скасувати", targetKg: "Цільова вага, кг", targetDate: "Бажана дата", gain: "набрати", lose: "скинути", days: "дн.", chartHint: "Кожна точка — замір" },
  fr: { title: "Poids", current: "Poids actuel", noData: "Pas encore de poids", on: "le", add: "Noter le poids", goalSet: "Définir un objectif", goalEdit: "Modifier l'objectif", goal: "Objectif", to: "pour le", left: "restant", reached: "Objectif atteint !", pace: "besoin ≈", perWeek: "kg/sem", date: "Date", kg: "kg", save: "Enregistrer", cancel: "Annuler", targetKg: "Poids cible, kg", targetDate: "Date cible", gain: "à prendre", lose: "à perdre", days: "j", chartHint: "Chaque point est une mesure" },
};

const todayISO = () => new Date().toISOString().slice(0, 10);
function fmt(locale: string, d: string) {
  try { return new Date(d + "T00:00:00").toLocaleDateString(locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : locale === "uk" ? "uk-UA" : "ru-RU", { day: "numeric", month: "long" }); }
  catch { return d; }
}

// Точный график веса: масштаб по диапазону значений (а не от нуля).
function WeightChart({ points, target }: { points: Point[]; target: number | null }) {
  const W = 640, H = 150, padL = 30, padR = 12, padT = 12, padB = 24;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const vals = points.map((p) => p.kg).concat(target != null ? [target] : []);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.15 || 1;
  lo -= pad; hi += pad;
  const n = points.length;
  const xAt = (i: number) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - ((v - lo) / (hi - lo)) * plotH;
  const line = points.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.kg).toFixed(1)}`).join(" ");
  const labels = [lo + (hi - lo) * 0, lo + (hi - lo) * 0.5, hi].map((v) => Math.round(v));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", color: "var(--text)" }}>
      {labels.map((v, i) => {
        const y = yAt(v);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
            <text x={padL - 5} y={y + 3} textAnchor="end" fontSize={8.5} fill="var(--text-3)">{v}</text>
          </g>
        );
      })}
      {target != null && target >= lo && target <= hi && (
        <line x1={padL} y1={yAt(target)} x2={W - padR} y2={yAt(target)} stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 4" />
      )}
      {n > 1 && <polyline points={line} fill="none" stroke="#0ea5e9" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => <circle key={i} cx={xAt(i)} cy={yAt(p.kg)} r={3} fill="#0ea5e9" />)}
      {points.map((p, i) => {
        const step = n <= 7 ? 1 : Math.ceil(n / 7);
        if (i % step !== 0 && i !== n - 1) return null;
        const x = Math.max(padL + 10, Math.min(W - padR - 10, xAt(i)));
        const [, m, d] = p.day.split("-");
        return <text key={`l${i}`} x={x} y={H - 7} textAnchor="middle" fontSize={8.5} fill="var(--text-3)">{d}.{m}</text>;
      })}
    </svg>
  );
}

export default function WeightTracker({ data, locale }: { data: { points: Point[]; current: Point | null; goal: Goal | null }; locale: string }) {
  const s = STR[locale] || STR.ru;
  const router = useRouter();
  const { points, current, goal } = data;

  const [addOpen, setAddOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [day, setDay] = useState(todayISO());
  const [kg, setKg] = useState("");
  const [tKg, setTKg] = useState(goal?.target_kg ? String(goal.target_kg) : "");
  const [tDate, setTDate] = useState(goal?.target_date || "");

  async function saveWeight() {
    const v = parseFloat(kg.replace(",", "."));
    if (!isFinite(v) || v < 20 || v > 400) return;
    setBusy(true);
    const r = await fetch("/api/weight", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ day, kg: v }) });
    setBusy(false);
    if (r.ok) { setAddOpen(false); setKg(""); router.refresh(); }
  }

  async function saveGoal() {
    const v = parseFloat(tKg.replace(",", "."));
    if (!isFinite(v) || v < 20 || v > 400) return;
    setBusy(true);
    const r = await fetch("/api/weight-goal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target_kg: v, target_date: tDate || null }) });
    setBusy(false);
    if (r.ok) { setGoalOpen(false); router.refresh(); }
  }

  // Прогресс к цели.
  let progress: any = null;
  if (goal?.target_kg != null && current) {
    const start = goal.start_kg ?? points[0]?.kg ?? current.kg;
    const target = goal.target_kg;
    const losing = start >= target;
    const total = Math.abs(start - target);
    const done = losing ? Math.max(0, start - current.kg) : Math.max(0, current.kg - start);
    const pct = total > 0 ? Math.max(0, Math.min(100, (done / total) * 100)) : (current.kg === target ? 100 : 0);
    const remaining = Math.round((current.kg - target) * 10) / 10; // >0 надо сбросить, <0 надо набрать
    const reached = (losing && current.kg <= target) || (!losing && current.kg >= target);
    let perWeek: number | null = null, daysLeft: number | null = null;
    if (goal.target_date) {
      const ms = new Date(goal.target_date + "T00:00:00").getTime() - new Date(todayISO() + "T00:00:00").getTime();
      daysLeft = Math.round(ms / 86400000);
      if (daysLeft > 0 && !reached) perWeek = Math.round((Math.abs(remaining) / (daysLeft / 7)) * 10) / 10;
    }
    progress = { start, target, losing, pct, remaining, reached, perWeek, daysLeft };
  }

  const inputStyle: any = { fontSize: 14, padding: "8px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" };
  const btnPrimary: any = { fontSize: 13.5, padding: "8px 16px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer" };
  const btnGhost: any = { fontSize: 13.5, padding: "8px 14px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer" };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      {/* Текущий вес + действия */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}>
            <i className="ti ti-scale" style={{ fontSize: 14, color: "#0ea5e9" }} />{s.current}
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, marginTop: 2, lineHeight: 1.1 }}>
            {current ? <>{current.kg}<span style={{ fontSize: 14, color: "var(--text-3)", fontWeight: 400 }}> {s.kg}</span></> : "—"}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{current ? `${s.on} ${fmt(locale, current.day)}` : s.noData}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setAddOpen((o) => !o); setGoalOpen(false); }} style={btnPrimary}>
            <i className="ti ti-plus" style={{ fontSize: 14, verticalAlign: "-2px" }} /> {s.add}
          </button>
        </div>
      </div>

      {/* Форма записи веса */}
      {addOpen && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <input type="date" value={day} max={todayISO()} onChange={(e) => setDay(e.target.value)} style={inputStyle} />
          <input type="number" inputMode="decimal" step="0.1" placeholder={s.targetKg.replace(/[^,]*,\s*/, "")} value={kg} onChange={(e) => setKg(e.target.value)} style={{ ...inputStyle, width: 110 }} />
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>{s.kg}</span>
          <button disabled={busy} onClick={saveWeight} style={btnPrimary}>{s.save}</button>
          <button disabled={busy} onClick={() => setAddOpen(false)} style={btnGhost}>{s.cancel}</button>
        </div>
      )}

      {/* Цель */}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
        {progress ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13.5 }}>
                <i className="ti ti-target" style={{ fontSize: 15, color: "#10b981", verticalAlign: "-2px" }} /> <b>{s.goal}: {progress.target} {s.kg}</b>
                {goal?.target_date && <span style={{ color: "var(--text-3)" }}> · {s.to} {fmt(locale, goal.target_date)}</span>}
              </div>
              <button onClick={() => { setGoalOpen((o) => !o); setAddOpen(false); }} style={{ ...btnGhost, padding: "5px 11px", fontSize: 12.5 }}>{s.goalEdit}</button>
            </div>
            <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 6, marginTop: 9, overflow: "hidden" }}>
              <div style={{ width: `${progress.pct}%`, height: "100%", background: progress.reached ? "#10b981" : "#0ea5e9", borderRadius: 6, transition: "width .3s" }} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 7 }}>
              {progress.reached ? (
                <span style={{ color: "#10b981" }}>✓ {s.reached}</span>
              ) : (
                <>
                  {s.left} <b>{Math.abs(progress.remaining)} {s.kg}</b> ({progress.remaining > 0 ? s.lose : s.gain})
                  {progress.perWeek != null && <span style={{ color: "var(--text-3)" }}> · {s.pace} {progress.perWeek} {s.perWeek}{progress.daysLeft != null ? ` · ${progress.daysLeft} ${s.days}` : ""}</span>}
                </>
              )}
            </div>
          </>
        ) : (
          !goalOpen && (
            <button onClick={() => { setGoalOpen(true); setAddOpen(false); }} style={btnGhost}>
              <i className="ti ti-target" style={{ fontSize: 14, verticalAlign: "-2px" }} /> {s.goalSet}
            </button>
          )
        )}

        {/* Форма цели */}
        {goalOpen && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: progress ? 12 : 0 }}>
            <label style={{ fontSize: 12.5, color: "var(--text-2)", display: "flex", flexDirection: "column", gap: 3 }}>
              {s.targetKg}
              <input type="number" inputMode="decimal" step="0.1" value={tKg} onChange={(e) => setTKg(e.target.value)} style={{ ...inputStyle, width: 120 }} />
            </label>
            <label style={{ fontSize: 12.5, color: "var(--text-2)", display: "flex", flexDirection: "column", gap: 3 }}>
              {s.targetDate}
              <input type="date" value={tDate} min={todayISO()} onChange={(e) => setTDate(e.target.value)} style={inputStyle} />
            </label>
            <button disabled={busy} onClick={saveGoal} style={{ ...btnPrimary, alignSelf: "flex-end" }}>{s.save}</button>
            <button disabled={busy} onClick={() => setGoalOpen(false)} style={{ ...btnGhost, alignSelf: "flex-end" }}>{s.cancel}</button>
          </div>
        )}
      </div>

      {/* График веса */}
      {points.length >= 2 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <WeightChart points={points} target={goal?.target_kg ?? null} />
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{s.chartHint}</div>
        </div>
      )}
    </div>
  );
}
