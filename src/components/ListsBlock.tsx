"use client";

import { useEffect, useMemo, useState } from "react";

// Блок «Списки» на странице /notes: те же чек-листы, что и у бота
// («добавь молоко в список покупок»). Галочка, добавление, удаление,
// чистка вычеркнутого. Списков может быть несколько (покупки, подарки…).

type Item = { id: string; list: string; text: string; done: boolean; created_at: string };

const STR: Record<string, any> = {
  ru: { title: "Списки", shopping: "Покупки", ph: "Добавить пункт…", clearDone: "Убрать вычеркнутое", empty: "Скажи боту «добавь молоко в список покупок» — пункты появятся здесь.", del: "Удалить" },
  en: { title: "Lists", shopping: "Shopping", ph: "Add an item…", clearDone: "Remove checked", empty: "Tell the bot “add milk to the shopping list” — items appear here.", del: "Delete" },
  uk: { title: "Списки", shopping: "Покупки", ph: "Додати пункт…", clearDone: "Прибрати викреслене", empty: "Скажи боту «додай молоко в список покупок» — пункти з'являться тут.", del: "Видалити" },
  fr: { title: "Listes", shopping: "Courses", ph: "Ajouter un élément…", clearDone: "Retirer le rayé", empty: "Dis au bot « ajoute le lait à la liste de courses » — les éléments apparaissent ici.", del: "Supprimer" },
  es: { title: "Listas", shopping: "Compras", ph: "Añadir un punto…", clearDone: "Quitar lo tachado", empty: "Dile al bot «añade leche a la lista de compras» — los puntos aparecen aquí.", del: "Eliminar" },
};

export default function ListsBlock({ locale }: { locale: string }) {
  const s = STR[locale] || STR.ru;
  const [items, setItems] = useState<Item[]>([]);
  const [noTable, setNoTable] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [texts, setTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/list").then((r) => r.json()).then((d) => {
      if (d?.error === "no_table") setNoTable(true);
      setItems(d?.items || []);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const lists = useMemo(() => {
    const keys = [...new Set(items.map((i) => i.list))];
    if (!keys.includes("shopping")) keys.unshift("shopping"); // список покупок показываем всегда
    return keys;
  }, [items]);

  async function post(payload: any) {
    return fetch("/api/list", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()).catch(() => null);
  }
  async function add(list: string) {
    const t = (texts[list] || "").trim();
    if (!t) return;
    setTexts((p) => ({ ...p, [list]: "" }));
    const d = await post({ action: "add", text: t, list });
    if (d?.ok && d.item) setItems((prev) => [...prev, d.item]);
    else if (d?.error === "no_table") setNoTable(true);
  }
  async function toggle(it: Item) {
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, done: !it.done } : x)));
    await post({ action: "toggle", id: it.id, done: !it.done });
  }
  async function del(it: Item) {
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    await post({ action: "del", id: it.id });
  }
  async function clearDone(list: string) {
    setItems((prev) => prev.filter((x) => x.list !== list || !x.done));
    await post({ action: "clearDone", list });
  }
  const title = (key: string) => (key === "shopping" ? s.shopping : key.charAt(0).toUpperCase() + key.slice(1));

  if (noTable || !loaded) return null;

  return (
    <div style={{ marginTop: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <i className="ti ti-list-check" style={{ fontSize: 20, color: "var(--accent)" }} />
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{s.title}</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {lists.map((key) => {
          const rows = items.filter((i) => i.list === key);
          const hasDone = rows.some((i) => i.done);
          return (
            <div key={key} className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🛒 {title(key)}</div>
              {!rows.length && <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 8 }}>{s.empty}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8 }}>
                {rows.map((it) => (
                  <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 2px" }}>
                    <button onClick={() => toggle(it)} aria-label="toggle" style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, border: it.done ? "none" : "1.5px solid var(--border)", background: it.done ? "var(--accent)" : "transparent", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                      {it.done && <i className="ti ti-check" style={{ fontSize: 13 }} />}
                    </button>
                    <span style={{ fontSize: 14, flex: 1, minWidth: 0, textDecoration: it.done ? "line-through" : "none", color: it.done ? "var(--text-3)" : "var(--text)", wordBreak: "break-word" }}>{it.text}</span>
                    <button onClick={() => del(it)} title={s.del} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 3, flexShrink: 0 }}>
                      <i className="ti ti-x" style={{ fontSize: 14 }} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={texts[key] || ""} onChange={(e) => setTexts((p) => ({ ...p, [key]: e.target.value }))} placeholder={s.ph}
                  onKeyDown={(e) => { if (e.key === "Enter") add(key); }}
                  style={{ flex: 1, minWidth: 0, fontSize: 13.5, padding: "8px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)" }} />
                <button onClick={() => add(key)} disabled={!(texts[key] || "").trim()} aria-label="add" style={{ flexShrink: 0, width: 36, borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", opacity: (texts[key] || "").trim() ? 1 : 0.5 }}>
                  <i className="ti ti-plus" style={{ fontSize: 15 }} />
                </button>
              </div>
              {hasDone && (
                <button onClick={() => clearDone(key)} style={{ marginTop: 8, fontSize: 12, background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0 }}>
                  <i className="ti ti-eraser" style={{ fontSize: 13, verticalAlign: "-2px", marginRight: 4 }} />{s.clearDone}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
