"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MOOD_BANDS, bandMeta, BAND_TO_MOOD, type MoodBand } from "@/lib/mood";

type Day = { date: string; day: number; mood: number | null; band: number | null; source: string | null; future: boolean };
type Data = {
  month: string;
  monthLabel: string;
  firstWeekday: number;
  today: string;
  days: Day[];
  distribution: Record<number, number>;
  noData: number;
  average: number | null;
  connections: { text: string }[];
};

const WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = ["янв.", "февр.", "март", "апр.", "май", "июнь", "июль", "авг.", "сент.", "окт.", "нояб.", "дек."];

function ymAdd(month: string, delta: number): string {
  const y = Number(month.slice(0, 4)), m = Number(month.slice(5, 7)) - 1;
  const d = new Date(y, m + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MoodCalendar() {
  const [month, setMonth] = useState<string | null>(null);
  const [d, setD] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [faces, setFaces] = useState(false);
  const [sel, setSel] = useState<Day | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try { setFaces(localStorage.getItem("lifeos_mood_style") === "faces"); } catch {}
  }, []);

  const load = useCallback((m: string | null) => {
    setLoading(true);
    fetch("/api/mood-calendar" + (m ? `?month=${m}` : ""))
      .then((r) => r.json())
      .then((j) => { if (j?.ok) { setD(j); setMonth(j.month); } })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(null); }, [load]);

  const toggleStyle = () => {
    setFaces((f) => { const nf = !f; try { localStorage.setItem("lifeos_mood_style", nf ? "faces" : "dots"); } catch {} return nf; });
  };

  const setMood = async (day: string, band: MoodBand) => {
    setSaving(true);
    await fetch("/api/mood-day", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ day, mood: BAND_TO_MOOD[band] }) }).catch(() => {});
    setSaving(false);
    setSel(null);
    load(month);
  };
  const clearMood = async (day: string) => {
    setSaving(true);
    await fetch(`/api/mood-day?day=${day}`, { method: "DELETE" }).catch(() => {});
    setSaving(false);
    setSel(null);
    load(month);
  };

  const cardStyle: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, marginBottom: 14 };
  const secLbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: "var(--text-2)", textTransform: "uppercase" };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {/* Month header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={() => month && load(ymAdd(month, -1))} aria-label="Прошлый месяц" style={navBtn}><i className="ti ti-chevron-left" style={{ fontSize: 18 }} /></button>
        <div style={{ fontSize: 17, fontWeight: 600, textTransform: "capitalize" }}>{d?.monthLabel || "…"}</div>
        <button onClick={() => month && load(ymAdd(month, 1))} aria-label="Следующий месяц" style={navBtn}><i className="ti ti-chevron-right" style={{ fontSize: 18 }} /></button>
      </div>

      {loading && !d ? (
        <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Загрузка…</div>
      ) : !d ? (
        <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Пока нет данных</div>
      ) : (
        <>
          {/* Average + style toggle */}
          <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>среднее</span>
              <span style={{ fontSize: 24, fontWeight: 800 }}>{d.average ?? "—"}</span>
              {d.average != null && <span style={{ fontSize: 13, color: "var(--text-3)" }}>/10</span>}
            </div>
            <button onClick={toggleStyle} style={{ ...navBtn, width: "auto", padding: "6px 12px", gap: 6, fontSize: 13, color: "var(--text-2)" }}>
              <i className={`ti ${faces ? "ti-circle-filled" : "ti-mood-smile"}`} style={{ fontSize: 16 }} />
              {faces ? "Кружки" : "Смайлы"}
            </button>
          </div>

          {/* Calendar grid */}
          <div style={cardStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
              {WD.map((w) => <div key={w} style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>{w}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
              {Array.from({ length: d.firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
              {d.days.map((day) => <Cell key={day.date} day={day} faces={faces} isToday={day.date === d.today} onTap={() => !day.future && setSel(day)} />)}
            </div>
          </div>

          {/* Distribution */}
          <div style={cardStyle}>
            <div style={secLbl}>Настроения месяца</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px 16px", marginTop: 12 }}>
              {MOOD_BANDS.map((b) => (
                <Row key={b.band} color={b.color} label={b.label} n={d.distribution[b.band] || 0} faces={faces} icon={b.icon} />
              ))}
              <Row color={null} label="нет записи" n={d.noData} faces={faces} icon="ti-minus" />
            </div>
          </div>

          {/* Connections */}
          {d.connections.length > 0 && (
            <div style={cardStyle}>
              <div style={secLbl}>Тело и настроение</div>
              {d.connections.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 9, marginTop: 11, alignItems: "flex-start" }}>
                  <i className="ti ti-link" style={{ fontSize: 15, color: "var(--accent)", marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, lineHeight: 1.45 }}>{c.text}</span>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 12 }}>по твоим записям за 30 дней</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-3)", fontSize: 12.5, padding: "2px 4px 20px" }}>
            <i className="ti ti-wand" style={{ fontSize: 15 }} />
            <span>Дни заполняются сами из записей. Тап по дню — поправить или добавить настроение.</span>
          </div>
        </>
      )}

      {/* Day editor sheet */}
      {sel && (
        <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: "18px 18px 0 0", padding: "18px 18px 26px", width: "100%", maxWidth: 560, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{new Date(sel.date + "T00:00:00").toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</div>
              <button onClick={() => setSel(null)} style={navBtn} aria-label="Закрыть"><i className="ti ti-x" style={{ fontSize: 18 }} /></button>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 16 }}>
              {sel.mood == null ? "Оценки пока нет" : sel.source === "ai" ? `AI считал из записей: ${sel.mood}/10` : `Твоя оценка: ${sel.mood}/10`}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
              {MOOD_BANDS.map((b) => {
                const active = sel.band === b.band;
                return (
                  <button key={b.band} onClick={() => setMood(sel.date, b.band)} disabled={saving} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 2px", borderRadius: 14, border: active ? `2px solid ${b.color}` : "1px solid var(--border)", background: active ? b.color + "1a" : "var(--surface)", cursor: "pointer", color: "var(--text)" }}>
                    <i className={`ti ${b.icon}`} style={{ fontSize: 28, color: b.color }} />
                    <span style={{ fontSize: 10.5, color: "var(--text-2)", lineHeight: 1.1, textAlign: "center" }}>{b.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center", justifyContent: "space-between" }}>
              <Link href="/diary" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <i className="ti ti-book-2" style={{ fontSize: 15 }} />Записи дня
              </Link>
              {sel.source && sel.source !== "ai" && (
                <button onClick={() => clearMood(sel.date)} disabled={saving} style={{ fontSize: 13, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer" }}>Убрать оценку</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer" };

function Cell({ day, faces, isToday, onTap }: { day: Day; faces: boolean; isToday: boolean; onTap: () => void }) {
  const meta = day.band ? bandMeta(day.band as MoodBand) : null;
  const ring = isToday ? "0 0 0 2px var(--accent)" : "none";
  let mark: React.ReactNode;
  if (day.future) {
    mark = <div style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px dashed var(--border)", opacity: 0.5 }} />;
  } else if (!meta) {
    mark = <div style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px dashed var(--border)", boxShadow: ring }} />;
  } else if (faces) {
    mark = <div style={{ width: 30, height: 30, borderRadius: "50%", background: meta.color + "22", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: ring }}><i className={`ti ${meta.icon}`} style={{ fontSize: 20, color: meta.color }} /></div>;
  } else {
    mark = <div style={{ width: 30, height: 30, borderRadius: "50%", background: meta.color, boxShadow: ring }} />;
  }
  return (
    <button onClick={onTap} disabled={day.future} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "3px 0", background: "none", border: "none", cursor: day.future ? "default" : "pointer" }}>
      {mark}
      <span style={{ fontSize: 10.5, color: isToday ? "var(--accent)" : "var(--text-3)", fontWeight: isToday ? 700 : 400 }}>{day.day}</span>
    </button>
  );
}

function Row({ color, label, n, faces, icon }: { color: string | null; label: string; n: number; faces: boolean; icon: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {color ? (
        faces ? <i className={`ti ${icon}`} style={{ fontSize: 18, color, width: 18, textAlign: "center" }} />
          : <span style={{ width: 14, height: 14, borderRadius: "50%", background: color, flexShrink: 0 }} />
      ) : <span style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px dashed var(--border)", flexShrink: 0 }} />}
      <span style={{ fontSize: 13, color: "var(--text-2)", flex: 1 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{n}</span>
    </div>
  );
}
