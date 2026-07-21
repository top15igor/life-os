"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mapsLink } from "@/lib/geocode";

type Item = { id?: number; name: string; hidden: boolean; meta: string; entries: { id: string; text: string }[]; lat?: number | null; lng?: number | null };

const STR: Record<string, any> = {
  ru: { manage: "Изменить", rename: "Переименовать", merge: "Объединить", hide: "Скрыть", unhide: "Вернуть", save: "Сохранить", cancel: "Отмена", mergeInto: "Объединить с:", mergeNote: "Все упоминания перейдут к выбранному, дубль исчезнет.", noOthers: "Нет других для объединения", hiddenSec: "Скрытые", needSql: "Чтобы скрывать — запусти SQL (entities_hidden.sql).", renamePh: "Имя", onMap: "На карте" },
  en: { manage: "Edit", rename: "Rename", merge: "Merge", hide: "Hide", unhide: "Restore", save: "Save", cancel: "Cancel", mergeInto: "Merge into:", mergeNote: "All mentions move to the chosen one, the duplicate disappears.", noOthers: "Nothing else to merge with", hiddenSec: "Hidden", needSql: "To hide — run the SQL (entities_hidden.sql).", renamePh: "Name", onMap: "On map" },
  uk: { manage: "Змінити", rename: "Перейменувати", merge: "Об'єднати", hide: "Сховати", unhide: "Повернути", save: "Зберегти", cancel: "Скасувати", mergeInto: "Об'єднати з:", mergeNote: "Усі згадки перейдуть до обраного, дубль зникне.", noOthers: "Немає інших для об'єднання", hiddenSec: "Сховані", needSql: "Щоб ховати — запусти SQL (entities_hidden.sql).", renamePh: "Ім'я", onMap: "На карті" },
  fr: { manage: "Modifier", rename: "Renommer", merge: "Fusionner", hide: "Masquer", unhide: "Restaurer", save: "Enregistrer", cancel: "Annuler", mergeInto: "Fusionner dans :", mergeNote: "Toutes les mentions vont vers l'élément choisi, le doublon disparaît.", noOthers: "Rien d'autre à fusionner", hiddenSec: "Masqués", needSql: "Pour masquer — lance le SQL (entities_hidden.sql).", renamePh: "Nom", onMap: "Sur la carte" },
};

const COLORS = ["#4f46e5", "#ec4899", "#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6"];

export default function EntityManager({ kind, locale, items }: { kind: "people" | "places"; locale: string; items: Item[] }) {
  const s = STR[locale] || STR.ru;
  const router = useRouter();
  const [menuId, setMenuId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [mergeId, setMergeId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const visible = items.filter((i) => !i.hidden);
  const hidden = items.filter((i) => i.hidden);

  async function call(action: string, item: Item, extra: any = {}) {
    if (!item.id) return;
    setBusy(true);
    const res = await fetch("/api/entities", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, id: item.id, action, ...extra }) }).then((r) => r.json()).catch(() => null);
    setBusy(false);
    setMenuId(null); setEditId(null); setMergeId(null);
    if (res?.error === "no_hidden_column") { alert(s.needSql); return; }
    router.refresh();
  }

  function Avatar({ name, idx }: { name: string; idx: number }) {
    if (kind === "places") return <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--surface-2)", color: COLORS[idx % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><i className="ti ti-map-pin" style={{ fontSize: 18 }} /></span>;
    return <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-2)", color: COLORS[idx % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 15, flexShrink: 0 }}>{name.trim().slice(0, 1).toUpperCase()}</span>;
  }

  const Card = (p: Item, idx: number) => {
    const editing = editId === p.id;
    const merging = mergeId === p.id;
    const open = menuId === p.id;
    return (
      <div key={p.id ?? p.name} className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8 }}>
          <Avatar name={p.name} idx={idx} />
          <div style={{ minWidth: 0, flex: 1 }}>
            {editing ? (
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={s.renamePh} autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") call("rename", p, { name: draft }); if (e.key === "Escape") setEditId(null); }}
                style={{ width: "100%", boxSizing: "border-box", padding: "6px 9px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14 }} />
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{p.meta}</div>
              </>
            )}
          </div>
          {p.id && !editing && !merging && (
            <button onClick={() => setMenuId(open ? null : p.id!)} aria-label="edit" style={{ background: "none", border: "none", cursor: "pointer", color: open ? "var(--accent)" : "var(--text-3)", padding: 4, flexShrink: 0 }}><i className="ti ti-dots-vertical" style={{ fontSize: 18 }} /></button>
          )}
        </div>

        {editing && (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 8 }}>
            <button onClick={() => setEditId(null)} style={ghost}>{s.cancel}</button>
            <button onClick={() => call("rename", p, { name: draft })} disabled={busy || !draft.trim()} style={primary}>{s.save}</button>
          </div>
        )}

        {open && !editing && !merging && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 9 }}>
            <button onClick={() => { setEditId(p.id!); setDraft(p.name); setMenuId(null); }} style={chip}><i className="ti ti-pencil" style={{ fontSize: 13 }} />{s.rename}</button>
            <button onClick={() => { setMergeId(p.id!); setMenuId(null); }} style={chip}><i className="ti ti-arrows-join-2" style={{ fontSize: 13 }} />{s.merge}</button>
            <button onClick={() => call("hide", p)} style={chip}><i className="ti ti-eye-off" style={{ fontSize: 13 }} />{s.hide}</button>
            {kind === "places" && (
              <a href={mapsLink(p.name, p.lat, p.lng)} target="_blank" rel="noreferrer" style={{ ...chip, textDecoration: "none" }}>
                <i className="ti ti-map-2" style={{ fontSize: 13 }} />{s.onMap}
              </a>
            )}
          </div>
        )}

        {merging && (
          <div style={{ marginBottom: 9, background: "var(--surface-2)", borderRadius: 10, padding: "10px 11px" }}>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 7 }}>{s.mergeInto}</div>
            {visible.filter((o) => o.id && o.id !== p.id).length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{s.noOthers}</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {visible.filter((o) => o.id && o.id !== p.id).map((o) => (
                  <button key={o.id} onClick={() => call("merge", p, { targetId: o.id })} disabled={busy} style={chip}>{o.name}</button>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8, lineHeight: 1.45 }}>{s.mergeNote}</div>
            <button onClick={() => setMergeId(null)} style={{ ...ghost, marginTop: 8 }}>{s.cancel}</button>
          </div>
        )}

        {p.entries.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
            {p.entries.slice(0, 3).map((e) => (
              <Link key={e.id} href={`/entry/${e.id}`} style={{ display: "block", fontSize: 12.5, color: "var(--text-2)", padding: "3px 0", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {e.text}</Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
        {visible.map((p, idx) => Card(p, idx))}
      </div>

      {hidden.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setShowHidden((v) => !v)} style={{ background: "none", border: "none", color: "var(--text-2)", fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}>
            <i className={`ti ti-chevron-${showHidden ? "down" : "right"}`} style={{ fontSize: 15 }} /><i className="ti ti-eye-off" style={{ fontSize: 14 }} />{s.hiddenSec} ({hidden.length})
          </button>
          {showHidden && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
              {hidden.map((p) => (
                <div key={p.id ?? p.name} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface-2)", borderRadius: 999, padding: "5px 6px 5px 12px", fontSize: 13 }}>
                  <span style={{ color: "var(--text-2)" }}>{p.name}</span>
                  <button onClick={() => call("unhide", p)} disabled={busy} style={{ ...chip, padding: "3px 9px" }}><i className="ti ti-eye" style={{ fontSize: 12 }} />{s.unhide}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const chip: any = { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: 12.5, cursor: "pointer" };
const ghost: any = { background: "none", border: "none", color: "var(--text-2)", fontSize: 13, cursor: "pointer", padding: "6px 10px" };
const primary: any = { padding: "6px 14px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
