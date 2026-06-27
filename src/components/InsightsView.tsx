"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { dateLabel, type Locale } from "@/lib/i18n";

type Insight = { text: string; entry_id?: string; entries?: { entry_date?: string } };

const STR: Record<string, any> = {
  ru: { search: "Поиск по инсайтам…", from: "из записи от", empty: "Инсайтов пока нет — они появятся из твоих записей.", nofound: "Ничего не найдено по запросу", list: "Список", cards: "Блоки", total: "Всего", found: "Найдено" },
  en: { search: "Search insights…", from: "from entry on", empty: "No insights yet — they'll appear from your entries.", nofound: "Nothing found for", list: "List", cards: "Cards", total: "Total", found: "Found" },
  uk: { search: "Пошук по інсайтах…", from: "із запису від", empty: "Інсайтів поки немає — з'являться з твоїх записів.", nofound: "Нічого не знайдено за запитом", list: "Список", cards: "Блоки", total: "Всього", found: "Знайдено" },
  fr: { search: "Rechercher des insights…", from: "de l'entrée du", empty: "Pas encore d'insights — ils apparaîtront depuis tes entrées.", nofound: "Rien trouvé pour", list: "Liste", cards: "Cartes", total: "Total", found: "Trouvé" },
};

const toggleBtn = (active: boolean): any => ({
  display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 500, padding: "6px 11px",
  borderRadius: 8, border: "none", cursor: "pointer",
  background: active ? "var(--surface)" : "transparent", color: active ? "var(--text)" : "var(--text-2)",
  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
});

export default function InsightsView({ insights, locale }: { insights: Insight[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [view, setView] = useState<"cards" | "list">("cards");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return insights;
    return insights.filter((i) => (i.text || "").toLowerCase().includes(t));
  }, [insights, q]);

  if (insights.length === 0) {
    return <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>;
  }

  return (
    <div>
      {/* Панель: поиск + переключатель вида */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
          <i className="ti ti-search" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--text-3)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={s.search}
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 32px 9px 33px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, fontFamily: "inherit" }}
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="clear" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2 }}>
              <i className="ti ti-x" style={{ fontSize: 15 }} />
            </button>
          )}
        </div>
        <div style={{ display: "inline-flex", padding: 3, borderRadius: 10, background: "var(--surface-2)", gap: 2, flexShrink: 0 }}>
          <button onClick={() => setView("cards")} style={toggleBtn(view === "cards")}><i className="ti ti-layout-grid" style={{ fontSize: 15 }} />{s.cards}</button>
          <button onClick={() => setView("list")} style={toggleBtn(view === "list")}><i className="ti ti-list" style={{ fontSize: 15 }} />{s.list}</button>
        </div>
      </div>

      {/* Счётчик */}
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 11 }}>
        {q ? `${s.found}: ${filtered.length}` : `${s.total}: ${insights.length}`}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 13.5 }}>{s.nofound} «{q}»</div>
      ) : view === "cards" ? (
        /* ===== БЛОКИ ===== */
        filtered.map((i, k) => (
          <Link key={k} href={i.entry_id ? `/entry/${i.entry_id}` : "#"} className="card" style={{ display: "block", marginBottom: 9 }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, display: "flex", gap: 9 }}>
              <i className="ti ti-bulb" style={{ fontSize: 16, color: "var(--energy)", marginTop: 2, flexShrink: 0 }} />
              <span>{i.text}</span>
            </div>
            {i.entries?.entry_date && (
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6, marginLeft: 25 }}>{s.from} {dateLabel(locale as Locale, i.entries.entry_date)}</div>
            )}
          </Link>
        ))
      ) : (
        /* ===== СПИСОК (компактно) ===== */
        <div className="card" style={{ padding: "2px 14px" }}>
          {filtered.map((i, k) => (
            <Link key={k} href={i.entry_id ? `/entry/${i.entry_id}` : "#"} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 0", borderTop: k ? "1px solid var(--border)" : "none", textDecoration: "none", color: "var(--text)" }}>
              <i className="ti ti-bulb" style={{ fontSize: 15, color: "var(--energy)", flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.text}</span>
              {i.entries?.entry_date && <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>{dateLabel(locale as Locale, i.entries.entry_date)}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
