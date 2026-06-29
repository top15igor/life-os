"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { dateLabel, type Locale } from "@/lib/i18n";

type Insight = { id?: string; text: string; category?: string | null; entry_id?: string; entries?: { entry_date?: string } };

// Стабильные ключи категорий (совпадают с lib/insights.ts).
const CATS = ["growth", "health", "relationships", "work", "emotions", "habits", "other"] as const;
type Cat = (typeof CATS)[number];

const CAT_META: Record<Cat, { icon: string; color: string }> = {
  growth: { icon: "ti-seeding", color: "#8b5cf6" },
  health: { icon: "ti-heartbeat", color: "#ef4444" },
  relationships: { icon: "ti-users", color: "#ec4899" },
  work: { icon: "ti-briefcase", color: "#0ea5e9" },
  emotions: { icon: "ti-mood-smile", color: "#10b981" },
  habits: { icon: "ti-repeat", color: "#f59e0b" },
  other: { icon: "ti-dots", color: "#6b7280" },
};

const STR: Record<string, any> = {
  ru: {
    search: "Поиск по инсайтам…", from: "из записи от", nofound: "Ничего не найдено по запросу",
    list: "Список", cards: "Блоки", grouped: "По категориям", total: "Всего", found: "Найдено",
    emptyTitle: "Здесь копятся твои инсайты", emptyHint: "Инсайты — это мысли и осознания, которые AI находит в твоих записях. Просто рассказывай боту о своём дне — и здесь будут появляться твои открытия о себе.",
    edit: "Изменить", del: "Удалить", save: "Сохранить", cancel: "Отмена", delConfirm: "Удалить этот инсайт?",
    setCat: "Категория", noCat: "Без категории",
    autosort: "Разложить по категориям", sorting: "Раскладываю…", sortedN: (n: number) => `Разложено: ${n}`, sortedNone: "Нечего раскладывать",
    catNames: { growth: "Саморазвитие", health: "Здоровье", relationships: "Отношения", work: "Работа и деньги", emotions: "Эмоции", habits: "Привычки", other: "Прочее" },
  },
  en: {
    search: "Search insights…", from: "from entry on", nofound: "Nothing found for",
    list: "List", cards: "Cards", grouped: "By category", total: "Total", found: "Found",
    emptyTitle: "Your insights gather here", emptyHint: "Insights are thoughts and realizations the AI finds in your entries. Just tell the bot about your day — your discoveries about yourself will show up here.",
    edit: "Edit", del: "Delete", save: "Save", cancel: "Cancel", delConfirm: "Delete this insight?",
    setCat: "Category", noCat: "Uncategorized",
    autosort: "Sort into categories", sorting: "Sorting…", sortedN: (n: number) => `Sorted: ${n}`, sortedNone: "Nothing to sort",
    catNames: { growth: "Growth", health: "Health", relationships: "Relationships", work: "Work & money", emotions: "Emotions", habits: "Habits", other: "Other" },
  },
  uk: {
    search: "Пошук по інсайтах…", from: "із запису від", nofound: "Нічого не знайдено за запитом",
    list: "Список", cards: "Блоки", grouped: "За категоріями", total: "Всього", found: "Знайдено",
    emptyTitle: "Тут збираються твої інсайти", emptyHint: "Інсайти — це думки й усвідомлення, які AI знаходить у твоїх записах. Просто розповідай боту про свій день — і тут з'являтимуться твої відкриття про себе.",
    edit: "Змінити", del: "Видалити", save: "Зберегти", cancel: "Скасувати", delConfirm: "Видалити цей інсайт?",
    setCat: "Категорія", noCat: "Без категорії",
    autosort: "Розкласти за категоріями", sorting: "Розкладаю…", sortedN: (n: number) => `Розкладено: ${n}`, sortedNone: "Нема чого розкладати",
    catNames: { growth: "Саморозвиток", health: "Здоров'я", relationships: "Стосунки", work: "Робота і гроші", emotions: "Емоції", habits: "Звички", other: "Інше" },
  },
  fr: {
    search: "Rechercher des insights…", from: "de l'entrée du", nofound: "Rien trouvé pour",
    list: "Liste", cards: "Cartes", grouped: "Par catégorie", total: "Total", found: "Trouvé",
    emptyTitle: "Tes insights s'accumulent ici", emptyHint: "Les insights sont des pensées et prises de conscience que l'IA trouve dans tes entrées. Raconte ta journée au bot — tes découvertes sur toi-même apparaîtront ici.",
    edit: "Modifier", del: "Supprimer", save: "Enregistrer", cancel: "Annuler", delConfirm: "Supprimer cet insight ?",
    setCat: "Catégorie", noCat: "Sans catégorie",
    autosort: "Trier par catégorie", sorting: "Je trie…", sortedN: (n: number) => `Triés : ${n}`, sortedNone: "Rien à trier",
    catNames: { growth: "Développement", health: "Santé", relationships: "Relations", work: "Travail & argent", emotions: "Émotions", habits: "Habitudes", other: "Autre" },
  },
};

const toggleBtn = (active: boolean): any => ({
  display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 500, padding: "6px 11px",
  borderRadius: 8, border: "none", cursor: "pointer",
  background: active ? "var(--surface)" : "transparent", color: active ? "var(--text)" : "var(--text-2)",
  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
});

async function api(action: string, payload: any) {
  return fetch("/api/insight", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...payload }) }).then((r) => r.json()).catch(() => ({ ok: false }));
}

export default function InsightsView({ insights, locale }: { insights: Insight[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [items, setItems] = useState<Insight[]>(insights);
  const [view, setView] = useState<"cards" | "list" | "grouped">("cards");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [catMenu, setCatMenu] = useState<string | null>(null);
  const [sorting, setSorting] = useState(false);
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((i) => (i.text || "").toLowerCase().includes(t));
  }, [items, q]);

  function startEdit(i: Insight) { setEditing(i.id || null); setDraft(i.text); setCatMenu(null); }
  async function saveEdit(id: string) {
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, text } : x)));
    setEditing(null);
    await api("edit", { id, text });
  }
  async function remove(id: string) {
    if (!confirm(s.delConfirm)) return;
    setItems((prev) => prev.filter((x) => x.id !== id));
    await api("delete", { id });
  }
  async function setCategory(id: string, category: Cat | null) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, category } : x)));
    setCatMenu(null);
    await api("category", { id, category });
  }
  async function autosort() {
    setSorting(true);
    setToast("");
    const r = await api("autosort", {});
    setSorting(false);
    if (r?.ok && r.sorted > 0) {
      setToast(s.sortedN(r.sorted));
      // Перезагружаем страницу, чтобы подтянуть назначенные категории (проще и надёжнее).
      setTimeout(() => location.reload(), 700);
    } else {
      setToast(s.sortedNone);
      setTimeout(() => setToast(""), 2500);
    }
  }

  if (items.length === 0) {
    return (
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <i className="ti ti-bulb" style={{ fontSize: 22, color: "var(--energy)" }} />
          <div style={{ fontSize: 15.5, fontWeight: 600 }}>{s.emptyTitle}</div>
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55 }}>{s.emptyHint}</div>
      </div>
    );
  }

  const uncategorizedCount = items.filter((i) => !i.category).length;

  // Один инсайт (карточка или строка списка) с действиями.
  function Card({ i, compact }: { i: Insight; compact?: boolean }) {
    const id = i.id || "";
    const cat = (i.category && (CATS as readonly string[]).includes(i.category) ? i.category : null) as Cat | null;
    const cm = cat ? CAT_META[cat] : null;
    const isEditing = editing === id;
    return (
      <div className="card" style={{ marginBottom: 9, position: "relative" }}>
        {isEditing ? (
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, fontFamily: "inherit", lineHeight: 1.5, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: 13, cursor: "pointer" }}>{s.cancel}</button>
              <button onClick={() => saveEdit(id)} disabled={!draft.trim()} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: draft.trim() ? 1 : 0.6 }}>{s.save}</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, display: "flex", gap: 9 }}>
              <i className="ti ti-bulb" style={{ fontSize: 16, color: "var(--energy)", marginTop: 2, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0 }}>{i.text}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, marginLeft: 25, flexWrap: "wrap" }}>
              {/* Категория-чип (клик — выбрать) */}
              {!compact && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setCatMenu(catMenu === id ? null : id)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 500, padding: "3px 9px", borderRadius: 99, cursor: "pointer",
                      border: `1px solid ${cm ? cm.color + "66" : "var(--border)"}`, background: cm ? cm.color + "14" : "var(--surface-2)", color: cm ? cm.color : "var(--text-3)" }}
                  >
                    <i className={`ti ${cm ? cm.icon : "ti-tag"}`} style={{ fontSize: 12.5 }} />
                    {cat ? s.catNames[cat] : s.noCat}
                    <i className="ti ti-chevron-down" style={{ fontSize: 11, opacity: 0.7 }} />
                  </button>
                  {catMenu === id && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 30, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 5, boxShadow: "0 6px 20px rgba(0,0,0,0.12)", minWidth: 170 }}>
                      {CATS.map((c) => (
                        <button key={c} onClick={() => setCategory(id, c)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "7px 9px", borderRadius: 7, border: "none", background: cat === c ? "var(--surface-2)" : "transparent", color: "var(--text)", fontSize: 13, cursor: "pointer" }}>
                          <i className={`ti ${CAT_META[c].icon}`} style={{ fontSize: 14, color: CAT_META[c].color }} />{s.catNames[c]}
                        </button>
                      ))}
                      {cat && (
                        <button onClick={() => setCategory(id, null)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "7px 9px", borderRadius: 7, border: "none", borderTop: "1px solid var(--border)", marginTop: 3, background: "transparent", color: "var(--text-3)", fontSize: 12.5, cursor: "pointer" }}>
                          <i className="ti ti-x" style={{ fontSize: 13 }} />{s.noCat}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {i.entries?.entry_date && (
                <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{s.from} {dateLabel(locale as Locale, i.entries.entry_date)}</span>
              )}
              <span style={{ flex: 1 }} />
              {i.entry_id && (
                <Link href={`/entry/${i.entry_id}`} title={s.from} style={{ color: "var(--text-3)" }}>
                  <i className="ti ti-arrow-up-right" style={{ fontSize: 15 }} />
                </Link>
              )}
              <button onClick={() => startEdit(i)} title={s.edit} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2 }}>
                <i className="ti ti-pencil" style={{ fontSize: 15 }} />
              </button>
              <button onClick={() => remove(id)} title={s.del} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2 }}>
                <i className="ti ti-trash" style={{ fontSize: 15 }} />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Группировка по категориям для вида «По категориям».
  const groups = useMemo(() => {
    const map: Record<string, Insight[]> = {};
    for (const i of filtered) {
      const key = i.category && (CATS as readonly string[]).includes(i.category) ? i.category : "_none";
      (map[key] ||= []).push(i);
    }
    const order = [...CATS, "_none"];
    return order.filter((k) => map[k]?.length).map((k) => ({ key: k, items: map[k] }));
  }, [filtered]);

  return (
    <div>
      {/* Панель: поиск + переключатель вида */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 0 }}>
          <i className="ti ti-search" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--text-3)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={s.search}
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 32px 9px 33px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, fontFamily: "inherit" }} />
          {q && (
            <button onClick={() => setQ("")} aria-label="clear" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2 }}>
              <i className="ti ti-x" style={{ fontSize: 15 }} />
            </button>
          )}
        </div>
        <div style={{ display: "inline-flex", padding: 3, borderRadius: 10, background: "var(--surface-2)", gap: 2, flexShrink: 0 }}>
          <button onClick={() => setView("cards")} style={toggleBtn(view === "cards")}><i className="ti ti-layout-grid" style={{ fontSize: 15 }} />{s.cards}</button>
          <button onClick={() => setView("grouped")} style={toggleBtn(view === "grouped")}><i className="ti ti-category" style={{ fontSize: 15 }} />{s.grouped}</button>
          <button onClick={() => setView("list")} style={toggleBtn(view === "list")}><i className="ti ti-list" style={{ fontSize: 15 }} />{s.list}</button>
        </div>
      </div>

      {/* Счётчик + авто-сортировка */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>{q ? `${s.found}: ${filtered.length}` : `${s.total}: ${items.length}`}</div>
        <span style={{ flex: 1 }} />
        {toast && <span style={{ fontSize: 12, color: "var(--positive)", fontWeight: 500 }}>{toast}</span>}
        {uncategorizedCount > 0 && (
          <button onClick={autosort} disabled={sorting}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, padding: "7px 12px", borderRadius: 9, cursor: sorting ? "default" : "pointer",
              border: "1px solid var(--accent)", background: "var(--accent-bg)", color: "var(--accent)", opacity: sorting ? 0.7 : 1 }}>
            <i className={`ti ${sorting ? "ti-loader-2 spin" : "ti-sparkles"}`} style={{ fontSize: 14 }} />
            {sorting ? s.sorting : `${s.autosort} (${uncategorizedCount})`}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 13.5 }}>{s.nofound} «{q}»</div>
      ) : view === "list" ? (
        <div className="card" style={{ padding: "2px 14px" }}>
          {filtered.map((i, k) => (
            <Link key={i.id || k} href={i.entry_id ? `/entry/${i.entry_id}` : "#"} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 0", borderTop: k ? "1px solid var(--border)" : "none", textDecoration: "none", color: "var(--text)" }}>
              <i className="ti ti-bulb" style={{ fontSize: 15, color: "var(--energy)", flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.text}</span>
              {i.entries?.entry_date && <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>{dateLabel(locale as Locale, i.entries.entry_date)}</span>}
            </Link>
          ))}
        </div>
      ) : view === "grouped" ? (
        groups.map((g) => {
          const meta = g.key === "_none" ? null : CAT_META[g.key as Cat];
          const name = g.key === "_none" ? s.noCat : s.catNames[g.key];
          return (
            <div key={g.key} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                <i className={`ti ${meta ? meta.icon : "ti-tag"}`} style={{ fontSize: 17, color: meta ? meta.color : "var(--text-3)" }} />
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{name}</span>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>· {g.items.length}</span>
              </div>
              {g.items.map((i, k) => <Card key={i.id || k} i={i} />)}
            </div>
          );
        })
      ) : (
        filtered.map((i, k) => <Card key={i.id || k} i={i} />)
      )}
    </div>
  );
}
