"use client";

import { useMemo, useState } from "react";

// ===== Календарь путешествий =====
//
// Год целиком, двенадцатью месяцами. Дни, проведённые в поездке, закрашены
// цветом этой поездки: полоса тянется от первого дня до последнего, у краёв
// скруглена — видно не только «где был», но и «сколько это длилось». Под
// каждым месяцем подписаны сами поездки, чтобы название читалось без наведения.

type Trip = {
  id: string;
  title: string;
  destination: string | null;
  emoji: string | null;
  date_start: string | null;
  date_end: string | null;
  status: string;
  cover_url: string | null;
};

const STR: Record<string, any> = {
  ru: { title: "Календарь путешествий", days: (n: number) => `${n} ${plural(n, ["день", "дня", "дней"])} в пути`, tripsN: (n: number) => `${n} ${plural(n, ["поездка", "поездки", "поездок"])}`, planned: "запланирована", empty: "В этом году поездок пока нет.", week: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] },
  en: { title: "Travel calendar", days: (n: number) => `${n} days away`, tripsN: (n: number) => `${n} trips`, planned: "planned", empty: "No trips this year yet.", week: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] },
  uk: { title: "Календар подорожей", days: (n: number) => `${n} ${plural(n, ["день", "дні", "днів"])} у дорозі`, tripsN: (n: number) => `${n} ${plural(n, ["подорож", "подорожі", "подорожей"])}`, planned: "запланована", empty: "Цього року поїздок ще немає.", week: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"] },
  fr: { title: "Calendrier des voyages", days: (n: number) => `${n} jours en voyage`, tripsN: (n: number) => `${n} voyages`, planned: "prévu", empty: "Aucun voyage cette année.", week: ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"] },
  es: { title: "Calendario de viajes", days: (n: number) => `${n} días de viaje`, tripsN: (n: number) => `${n} viajes`, planned: "planeado", empty: "Aún no hay viajes este año.", week: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"] },
};

function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

// Палитра поездок. Цвет закреплён за поездкой навсегда (считается из её id),
// чтобы Исландия не перекрашивалась при каждом заходе.
const COLORS = [
  { bg: "#0ea5e9", soft: "#e0f2fe" }, { bg: "#22c55e", soft: "#dcfce7" },
  { bg: "#f59e0b", soft: "#fef3c7" }, { bg: "#a855f7", soft: "#f3e8ff" },
  { bg: "#ef4444", soft: "#fee2e2" }, { bg: "#14b8a6", soft: "#ccfbf1" },
  { bg: "#6366f1", soft: "#e0e7ff" }, { bg: "#ec4899", soft: "#fce7f3" },
  { bg: "#84cc16", soft: "#ecfccb" }, { bg: "#f97316", soft: "#ffedd5" },
];
function colorOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string | null) => {
  if (!s) return null;
  const d = new Date(`${s.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const CSS = `
.tc-wrap { border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px 16px; background: var(--surface); }
.tc-months { display: grid; grid-template-columns: repeat(auto-fit, minmax(196px, 1fr)); gap: 14px; margin-top: 12px; }
.tc-m { }
.tc-mname { font-size: 12.5px; font-weight: 650; color: var(--text-2); text-transform: capitalize; margin-bottom: 6px; }
.tc-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.tc-wd { font-size: 9.5px; color: var(--text-3); text-align: center; padding-bottom: 2px; }
.tc-d { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 10.5px; color: var(--text-2); border-radius: 4px; position: relative; }
.tc-d.on { color: #fff; font-weight: 600; cursor: pointer; }
.tc-d.plan { color: var(--text); font-weight: 600; cursor: pointer; }
.tc-d.today { outline: 1.5px solid var(--accent, #6366f1); outline-offset: -1.5px; }
.tc-d.dim { opacity: .45; }
.tc-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.tc-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; padding: 2px 7px; border-radius: 999px; cursor: pointer; border: 1px solid transparent; max-width: 100%; }
.tc-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tc-chip.mute { opacity: .35; }
.tc-year { padding: 4px 11px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 12.5px; cursor: pointer; }
.tc-year.on { background: var(--accent, #6366f1); border-color: var(--accent, #6366f1); color: #fff; }
`;

export default function TravelCalendar({ locale, trips }: { locale: string; trips: Trip[] }) {
  const s = STR[locale] || STR.ru;
  const sunFirst = locale === "en" || locale === "es";

  // Годы, в которых что-то было. Поездка на стыке лет попадает в оба.
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const t of trips) {
      const a = parse(t.date_start), b = parse(t.date_end) || parse(t.date_start);
      if (!a) continue;
      for (let y = a.getFullYear(); y <= (b || a).getFullYear(); y++) set.add(y);
    }
    return [...set].sort((x, y) => y - x);
  }, [trips]);

  // Открываем на текущем годе, если в нём что-то было: чаще всего человек
  // смотрит «а что у меня было в этом году», а не заглядывает в планы.
  const now = new Date().getFullYear();
  const [year, setYear] = useState<number>(years.includes(now) ? now : years[0] || now);
  const [sel, setSel] = useState<string | null>(null);

  // День → поездки, которые его накрывают.
  const { byDay, inYear, daysAway } = useMemo(() => {
    const map = new Map<string, Trip[]>();
    const list: Trip[] = [];
    for (const t of trips) {
      const a = parse(t.date_start);
      if (!a) continue;
      const b = parse(t.date_end) || a;
      let touches = false;
      const d = new Date(a);
      // Предохранитель от кривых дат: больше двух лет одной поездкой не рисуем.
      for (let i = 0; i <= 800 && d <= b; i++) {
        if (d.getFullYear() === year) {
          touches = true;
          const k = key(d);
          map.set(k, [...(map.get(k) || []), t]);
        }
        d.setDate(d.getDate() + 1);
      }
      if (touches) list.push(t);
    }
    return { byDay: map, inYear: list, daysAway: map.size };
  }, [trips, year]);

  const today = key(new Date());
  const months = Array.from({ length: 12 }, (_, m) => m);

  const monthName = (m: number) => {
    try { return new Date(year, m, 1).toLocaleDateString(locale === "ru" ? "ru-RU" : locale, { month: "long" }); }
    catch { return String(m + 1); }
  };
  const dateStr = (t: Trip) => {
    const a = parse(t.date_start), b = parse(t.date_end);
    const f = (d: Date) => d.toLocaleDateString(locale === "ru" ? "ru-RU" : locale, { day: "numeric", month: "short" });
    if (!a) return "";
    return b && key(b) !== key(a) ? `${f(a)} — ${f(b)}` : f(a);
  };

  if (!years.length) return null;

  return (
    <div className="tc-wrap">
      <style>{CSS}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--text)", display: "flex", alignItems: "center", gap: 7 }}>
          <i className="ti ti-calendar-heart" style={{ fontSize: 17, color: "#06b6d4" }} />{s.title}
        </div>
        <span style={{ flex: 1 }} />
        {years.map((y) => (
          <button key={y} className={`tc-year ${y === year ? "on" : ""}`} onClick={() => { setYear(y); setSel(null); }}>{y}</button>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 6 }}>
        {inYear.length ? `${s.tripsN(inYear.length)} · ${s.days(daysAway)}` : s.empty}
      </div>

      <div className="tc-months">
        {months.map((m) => {
          const first = new Date(year, m, 1);
          const total = new Date(year, m + 1, 0).getDate();
          const shift = sunFirst ? first.getDay() : (first.getDay() + 6) % 7;
          const monthTrips: Trip[] = [];
          const cells: any[] = [];
          for (let i = 0; i < shift; i++) cells.push(null);
          for (let day = 1; day <= total; day++) {
            const d = new Date(year, m, day);
            const k = key(d);
            const on = byDay.get(k) || [];
            for (const t of on) if (!monthTrips.some((x) => x.id === t.id)) monthTrips.push(t);
            cells.push({ day, k, on });
          }
          return (
            <div className="tc-m" key={m}>
              <div className="tc-mname">{monthName(m)}</div>
              <div className="tc-grid">
                {(sunFirst ? [s.week[6], ...s.week.slice(0, 6)] : s.week).map((w: string) => (
                  <div className="tc-wd" key={w}>{w}</div>
                ))}
                {cells.map((c, i) => {
                  if (!c) return <div key={`e${i}`} />;
                  const trip = c.on[0] as Trip | undefined;
                  const col = trip ? colorOf(trip.id) : null;
                  const planned = trip?.status === "planned";
                  const dim = sel && trip && trip.id !== sel;
                  // Скругляем края полосы: у первого и последнего дня поездки.
                  const prevOn = c.on.length && (byDay.get(key(new Date(year, m, c.day - 1))) || []).some((t: Trip) => t.id === trip!.id);
                  const nextOn = c.on.length && (byDay.get(key(new Date(year, m, c.day + 1))) || []).some((t: Trip) => t.id === trip!.id);
                  const radius = trip ? `${prevOn ? 4 : 9}px ${nextOn ? 4 : 9}px ${nextOn ? 4 : 9}px ${prevOn ? 4 : 9}px` : undefined;
                  return (
                    <div
                      key={c.k}
                      className={`tc-d ${trip ? (planned ? "plan" : "on") : ""} ${c.k === today ? "today" : ""} ${dim ? "dim" : ""}`}
                      title={trip ? `${trip.emoji || "✈️"} ${trip.title} · ${dateStr(trip)}${planned ? ` · ${s.planned}` : ""}` : undefined}
                      onClick={trip ? () => setSel(sel === trip.id ? null : trip.id) : undefined}
                      style={trip ? {
                        background: planned ? col!.soft : col!.bg,
                        border: planned ? `1px dashed ${col!.bg}` : undefined,
                        borderRadius: radius,
                      } : undefined}
                    >
                      {c.day}
                    </div>
                  );
                })}
              </div>
              {monthTrips.length > 0 && (
                <div className="tc-chips">
                  {monthTrips.map((t) => {
                    const col = colorOf(t.id);
                    return (
                      <button
                        key={t.id}
                        className={`tc-chip ${sel && sel !== t.id ? "mute" : ""}`}
                        style={{ background: col.soft, color: col.bg, borderColor: sel === t.id ? col.bg : "transparent" }}
                        title={dateStr(t)}
                        onClick={() => setSel(sel === t.id ? null : t.id)}
                      >
                        {t.emoji || "✈️"}<span>{t.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
