"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { dateLabel, intlOf } from "@/lib/i18n";

const CAT_COLOR: Record<string, string> = {
  health: "#ef4444", sport: "#10b981", food: "#84cc16", family: "#ec4899", business: "#3b82f6",
  finance: "#0ea5e9", ideas: "#f59e0b", insight: "#8b5cf6", task: "#6366f1", gratitude: "#14b8a6", travel: "#06b6d4", emotions: "#a78bfa",
};

const STR: Record<string, any> = {
  ru: { periodAll: "Всё время", today: "Сегодня", week: "7 дней", month: "30 дней", moodHigh: "Высокое 8–10", moodMid: "Среднее 5–7", moodLow: "Низкое 1–4", empty: "Ничего не найдено по выбранным фильтрам.", reset: "Сбросить", edit: "Редактировать", del: "Удалить", delConfirm: "Удалить эту запись? Вместе с ней удалятся её задачи, добрые дела и обещания. Действие необратимо.", editTitle: "Редактировать запись", editHint: "Поправь текст — AI заново разложит запись по категориям, тегам и настроению.", save: "Сохранить", cancel: "Отмена", recalc: "Пересчитываю…", emptyText: "Текст не может быть пустым." },
  en: { periodAll: "All time", today: "Today", week: "7 days", month: "30 days", moodHigh: "High 8–10", moodMid: "Mid 5–7", moodLow: "Low 1–4", empty: "Nothing found for the selected filters.", reset: "Reset", edit: "Edit", del: "Delete", delConfirm: "Delete this entry? Its tasks, good deeds and promises will be removed too. This can't be undone.", editTitle: "Edit entry", editHint: "Fix the text — AI will re-sort it into categories, tags and mood.", save: "Save", cancel: "Cancel", recalc: "Recalculating…", emptyText: "Text can't be empty." },
  uk: { periodAll: "Весь час", today: "Сьогодні", week: "7 днів", month: "30 днів", moodHigh: "Високий 8–10", moodMid: "Середній 5–7", moodLow: "Низький 1–4", empty: "Нічого не знайдено за фільтрами.", reset: "Скинути", edit: "Редагувати", del: "Видалити", delConfirm: "Видалити цей запис? Разом із ним зникнуть його завдання, добрі справи й обіцянки. Дію не скасувати.", editTitle: "Редагувати запис", editHint: "Виправ текст — AI заново розкладе запис за категоріями, тегами й настроєм.", save: "Зберегти", cancel: "Скасувати", recalc: "Перераховую…", emptyText: "Текст не може бути порожнім." },
  fr: { periodAll: "Tout", today: "Aujourd'hui", week: "7 jours", month: "30 jours", moodHigh: "Élevé 8–10", moodMid: "Moyen 5–7", moodLow: "Bas 1–4", empty: "Rien trouvé pour ces filtres.", reset: "Réinitialiser", edit: "Modifier", del: "Supprimer", delConfirm: "Supprimer cette entrée ? Ses tâches, bonnes actions et promesses seront aussi supprimées. Irréversible.", editTitle: "Modifier l'entrée", editHint: "Corrige le texte — l'IA reclassera l'entrée par catégories, tags et humeur.", save: "Enregistrer", cancel: "Annuler", recalc: "Recalcul…", emptyText: "Le texte ne peut pas être vide." },
};

const selStyle: any = { fontSize: 12.5, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", color: "var(--text)", background: "var(--surface)", cursor: "pointer", maxWidth: 200 };
const iconBtn: any = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-2)" };
const navBtn: any = { width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const segBtn = (active: boolean): any => ({ fontSize: 12.5, padding: "6px 11px", borderRadius: 8, border: "1px solid " + (active ? "var(--accent)" : "var(--border)"), background: active ? "var(--accent-bg)" : "var(--surface)", color: active ? "var(--accent-text)" : "var(--text-2)", cursor: "pointer" });

const CAL: Record<string, any> = {
  ru: { month: "Месяц", week: "Неделя", today: "Сегодня", dayEmpty: "Записей за этот день нет.", allMonth: "Показать всё за месяц", allWeek: "Показать всё за неделю" },
  en: { month: "Month", week: "Week", today: "Today", dayEmpty: "No entries for this day.", allMonth: "Show all for the month", allWeek: "Show all for the week" },
  uk: { month: "Місяць", week: "Тиждень", today: "Сьогодні", dayEmpty: "Записів за цей день немає.", allMonth: "Показати все за місяць", allWeek: "Показати все за тиждень" },
  fr: { month: "Mois", week: "Semaine", today: "Aujourd'hui", dayEmpty: "Aucune entrée ce jour.", allMonth: "Tout afficher pour le mois", allWeek: "Tout afficher pour la semaine" },
};

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseISO = (iso: string) => { const [y, m, dd] = iso.split("-").map(Number); return new Date(y, m - 1, dd, 12); };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7)); // понедельник

export default function DiaryView({ entries: initialEntries, t, locale, initial }: any) {
  const s = STR[locale] || STR.ru;
  const [entries, setEntries] = useState<any[]>(initialEntries);
  const [category, setCategory] = useState(initial?.category || "");
  const [tag, setTag] = useState(initial?.tag || "");
  const [person, setPerson] = useState(initial?.person || "");
  const [mood, setMood] = useState("");
  const [calMode, setCalMode] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [editing, setEditing] = useState<any | null>(null); // запись в режиме правки
  const [draft, setDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null); // id записи в работе (правка/удаление)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
  const c = CAL[locale] || CAL.ru;
  const intl = intlOf(locale);
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(intl, { weekday: "short" }).format(addDays(startOfWeek(parseISO("2024-01-06")), i)));

  // Фильтры содержимого (без даты) — для самих записей и для подсветки дней в календаре.
  const baseFiltered = entries.filter((e: any) => {
    if (category && !e.cats.some((c2: any) => c2.slug === category)) return false;
    if (tag && !e.tags.includes(tag)) return false;
    if (person && !e.people.includes(person)) return false;
    if (mood) {
      if (e.mood == null) return false;
      if (mood === "high" && e.mood < 8) return false;
      if (mood === "mid" && (e.mood < 5 || e.mood > 7)) return false;
      if (mood === "low" && e.mood > 4) return false;
    }
    return true;
  });

  const countByDate: Record<string, number> = {};
  for (const e of baseFiltered) countByDate[e.date] = (countByDate[e.date] || 0) + 1;

  const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
  const weekStart = startOfWeek(cursor), weekEnd = addDays(weekStart, 6);
  const inVisible = (d: string) => (calMode === "week" ? d >= toISO(weekStart) && d <= toISO(weekEnd) : d.slice(0, 7) === monthKey);

  const cells: Date[] = [];
  if (calMode === "week") { for (let i = 0; i < 7; i++) cells.push(addDays(weekStart, i)); }
  else { const gs = startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12)); for (let i = 0; i < 42; i++) cells.push(addDays(gs, i)); }
  const calTitle = calMode === "week"
    ? `${new Intl.DateTimeFormat(intl, { day: "numeric", month: "short" }).format(weekStart)} – ${new Intl.DateTimeFormat(intl, { day: "numeric", month: "short" }).format(weekEnd)}`
    : new Intl.DateTimeFormat(intl, { month: "long", year: "numeric" }).format(cursor);

  const visible = baseFiltered.filter((e: any) => (selectedDay ? e.date === selectedDay : inVisible(e.date)));
  const byDate: Record<string, any[]> = {};
  for (const e of visible) (byDate[e.date] ||= []).push(e);
  const dates = Object.keys(byDate).sort().reverse();
  const anyFilter = category || tag || person || mood;

  async function del(e: any) {
    if (busyId) return;
    if (!window.confirm(s.delConfirm)) return;
    setBusyId(e.id);
    try {
      const r = await fetch("/api/entry-delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: e.id }) });
      if (r.ok) setEntries((prev) => prev.filter((x) => x.id !== e.id));
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(e: any) {
    setEditing(e);
    setDraft(e.rawText || e.summary || "");
  }

  async function saveEdit() {
    if (!editing) return;
    const text = draft.trim();
    if (!text) { window.alert(s.emptyText); return; }
    setBusyId(editing.id);
    try {
      const r = await fetch("/api/entry-edit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: editing.id, text }) });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) {
        const u = j.entry;
        setEntries((prev) => prev.map((x) => x.id === editing.id ? {
          ...x,
          rawText: text,
          summary: u.summary,
          mood: u.mood,
          energy: u.energy,
          health: u.health,
          cats: (u.cats || []).map((slug: string) => ({ slug, name: t.cats[slug] || slug })),
          tags: u.tags || [],
          people: u.people || [],
        } : x));
        setEditing(null);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16, alignItems: "center" }}>
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
              <div key={e.id} className="card" style={{ position: "relative", marginBottom: 9, opacity: busyId === e.id ? 0.5 : 1, transition: "opacity .15s" }}>
                <Link href={`/entry/${e.id}`} style={{ display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--text-2)", marginBottom: 6, flexWrap: "wrap", paddingRight: 64 }}>
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
                <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                  <button title={s.edit} aria-label={s.edit} disabled={!!busyId} onClick={() => openEdit(e)} style={iconBtn}>
                    <i className="ti ti-pencil" style={{ fontSize: 15 }} />
                  </button>
                  <button title={s.del} aria-label={s.del} disabled={!!busyId} onClick={() => del(e)} style={{ ...iconBtn, color: "#ef4444" }}>
                    <i className="ti ti-trash" style={{ fontSize: 15 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {mounted && editing && createPortal(
        <div onClick={() => busyId ? null : setEditing(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 }}>
          <div onClick={(ev) => ev.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 16, padding: 20, width: "min(560px, 100%)", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 6 }}>{s.editTitle}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 12, lineHeight: 1.45 }}>{s.editHint}</div>
            <textarea
              value={draft}
              onChange={(ev) => setDraft(ev.target.value)}
              autoFocus
              rows={7}
              style={{ width: "100%", boxSizing: "border-box", fontSize: 14, lineHeight: 1.55, padding: "12px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", resize: "vertical", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button disabled={!!busyId} onClick={() => setEditing(null)} style={{ fontSize: 13.5, padding: "9px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer" }}>{s.cancel}</button>
              <button disabled={!!busyId} onClick={saveEdit} style={{ fontSize: 13.5, padding: "9px 18px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>
                {busyId ? <><i className="ti ti-loader-2 spin" style={{ fontSize: 15 }} />{s.recalc}</> : <><i className="ti ti-sparkles" style={{ fontSize: 15 }} />{s.save}</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
