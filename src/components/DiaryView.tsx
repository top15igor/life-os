"use client";

import { useState } from "react";
import Link from "next/link";
import { dateLabel } from "@/lib/i18n";

const CAT_COLOR: Record<string, string> = {
  health: "#ef4444", sport: "#10b981", food: "#84cc16", family: "#ec4899", business: "#3b82f6",
  finance: "#0ea5e9", ideas: "#f59e0b", insight: "#8b5cf6", task: "#6366f1", gratitude: "#14b8a6", travel: "#06b6d4", emotions: "#a78bfa",
};

const STR: Record<string, any> = {
  ru: { periodAll: "Всё время", today: "Сегодня", week: "7 дней", month: "30 дней", moodHigh: "Высокое 8–10", moodMid: "Среднее 5–7", moodLow: "Низкое 1–4", empty: "Ничего не найдено по выбранным фильтрам.", reset: "Сбросить" },
  en: { periodAll: "All time", today: "Today", week: "7 days", month: "30 days", moodHigh: "High 8–10", moodMid: "Mid 5–7", moodLow: "Low 1–4", empty: "Nothing found for the selected filters.", reset: "Reset" },
  uk: { periodAll: "Весь час", today: "Сьогодні", week: "7 днів", month: "30 днів", moodHigh: "Високий 8–10", moodMid: "Середній 5–7", moodLow: "Низький 1–4", empty: "Нічого не знайдено за фільтрами.", reset: "Скинути" },
  fr: { periodAll: "Tout", today: "Aujourd'hui", week: "7 jours", month: "30 jours", moodHigh: "Élevé 8–10", moodMid: "Moyen 5–7", moodLow: "Bas 1–4", empty: "Rien trouvé pour ces filtres.", reset: "Réinitialiser" },
};

const selStyle: any = { fontSize: 12.5, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", color: "var(--text)", background: "var(--surface)", cursor: "pointer", maxWidth: 200 };

export default function DiaryView({ entries, t, locale, initial }: any) {
  const s = STR[locale] || STR.ru;
  const [period, setPeriod] = useState("");
  const [category, setCategory] = useState(initial?.category || "");
  const [tag, setTag] = useState(initial?.tag || "");
  const [person, setPerson] = useState(initial?.person || "");
  const [mood, setMood] = useState("");

  const catOpts: { slug: string; name: string }[] = [];
  const tagSet = new Set<string>();
  const peopleSet = new Set<string>();
  for (const e of entries) {
    for (const c of e.cats) if (!catOpts.find((x) => x.slug === c.slug)) catOpts.push(c);
    for (const tg of e.tags) tagSet.add(tg);
    for (const p of e.people) peopleSet.add(p);
  }
  const tags = [...tagSet].sort();
  const peopleList = [...peopleSet].sort();

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const filtered = entries.filter((e: any) => {
    if (category && !e.cats.some((c: any) => c.slug === category)) return false;
    if (tag && !e.tags.includes(tag)) return false;
    if (person && !e.people.includes(person)) return false;
    if (mood) {
      if (e.mood == null) return false;
      if (mood === "high" && e.mood < 8) return false;
      if (mood === "mid" && (e.mood < 5 || e.mood > 7)) return false;
      if (mood === "low" && e.mood > 4) return false;
    }
    if (period === "today" && e.date !== today) return false;
    if (period === "week" && e.date < weekAgo) return false;
    if (period === "month" && e.date < monthAgo) return false;
    return true;
  });

  const byDate: Record<string, any[]> = {};
  for (const e of filtered) (byDate[e.date] ||= []).push(e);
  const dates = Object.keys(byDate).sort().reverse();
  const anyFilter = period || category || tag || person || mood;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16, alignItems: "center" }}>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={selStyle}>
          <option value="">{t.filters.date}</option>
          <option value="today">{s.today}</option>
          <option value="week">{s.week}</option>
          <option value="month">{s.month}</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={selStyle}>
          <option value="">{t.filters.category}</option>
          {catOpts.map((c) => (<option key={c.slug} value={c.slug}>{c.name}</option>))}
        </select>
        <select value={tag} onChange={(e) => setTag(e.target.value)} style={selStyle}>
          <option value="">{t.filters.tags}</option>
          {tags.map((tg) => (<option key={tg} value={tg}>#{tg}</option>))}
        </select>
        <select value={mood} onChange={(e) => setMood(e.target.value)} style={selStyle}>
          <option value="">{t.filters.mood}</option>
          <option value="high">{s.moodHigh}</option>
          <option value="mid">{s.moodMid}</option>
          <option value="low">{s.moodLow}</option>
        </select>
        <select value={person} onChange={(e) => setPerson(e.target.value)} style={selStyle}>
          <option value="">{t.filters.people}</option>
          {peopleList.map((p) => (<option key={p} value={p}>{p}</option>))}
        </select>
        {anyFilter && (
          <button onClick={() => { setPeriod(""); setCategory(""); setTag(""); setPerson(""); setMood(""); }} style={{ fontSize: 12.5, padding: "6px 11px", borderRadius: 8, border: "none", background: "var(--surface-2)", color: "var(--text-2)", cursor: "pointer" }}>
            <i className="ti ti-x" style={{ fontSize: 13, verticalAlign: "-2px" }} /> {s.reset}
          </button>
        )}
      </div>

      {dates.length === 0 ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
      ) : (
        dates.map((d) => (
          <div key={d} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", fontWeight: 500, marginBottom: 8 }}>{dateLabel(locale, d)}</div>
            {byDate[d].map((e: any) => (
              <Link key={e.id} href={`/entry/${e.id}`} className="card" style={{ display: "block", marginBottom: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--text-2)", marginBottom: 6, flexWrap: "wrap" }}>
                  <i className={`ti ${e.source === "telegram_voice" ? "ti-microphone" : "ti-message"}`} style={{ fontSize: 13 }} />
                  {e.time} · {e.source === "telegram_voice" ? t.voice : t.text}
                  {e.cats.slice(0, 3).map((c: any) => (<span key={c.slug} style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 7, background: "var(--surface-2)", color: CAT_COLOR[c.slug] || "var(--text-2)" }}>{c.name}</span>))}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 8 }}>{e.summary}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 11.5, color: "var(--text-2)" }}>
                  {e.tags.slice(0, 5).map((tg: string) => (<span key={tg} style={{ color: "var(--accent)" }}>#{tg}</span>))}
                  <span style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
                    {e.mood != null && <span>{t.mood} {e.mood}</span>}
                    {e.energy != null && <span>{t.energy} {e.energy}</span>}
                    {e.health != null && <span>{t.health} {e.health}</span>}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
