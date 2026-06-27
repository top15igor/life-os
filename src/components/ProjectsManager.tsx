"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STR: Record<string, any> = {
  ru: { notes: "записей", open: "Открыть", save: "Сохранить", cancel: "Отмена", confirm: "Удалить проект? Сами записи останутся — исчезнет только проект и его связи.", empty: "Проектов пока нет — они появятся, когда упомянёшь их в записях боту." },
  en: { notes: "entries", open: "Open", save: "Save", cancel: "Cancel", confirm: "Delete project? Your entries stay — only the project and its links are removed.", empty: "No projects yet — they appear when you mention them to the bot." },
  uk: { notes: "записів", open: "Відкрити", save: "Зберегти", cancel: "Скасувати", confirm: "Видалити проєкт? Записи залишаться — зникне лише проєкт і його зв'язки.", empty: "Проєктів поки немає — з'являться, коли згадаєш їх боту." },
  fr: { notes: "entrées", open: "Ouvrir", save: "Enregistrer", cancel: "Annuler", confirm: "Supprimer le projet ? Tes entrées restent — seul le projet et ses liens disparaissent.", empty: "Pas encore de projets — ils apparaissent quand tu les mentionnes au bot." },
};

const COLORS = ["#3b82f6", "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];

export default function ProjectsManager({ initial, locale }: { initial: any[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [items, setItems] = useState<any[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const router = useRouter();

  function startEdit(p: any) { setEditing(p.id); setVal(p.name); }

  async function saveName(id: string) {
    const name = val.trim();
    if (!name) { setEditing(null); return; }
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, name } : x)));
    setEditing(null);
    await fetch("/api/project", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "rename", id, name }) }).catch(() => {});
    router.refresh();
  }

  async function del(id: string) {
    if (!confirm(s.confirm)) return;
    setItems((prev) => prev.filter((x) => x.id !== id));
    await fetch("/api/project", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", id }) }).catch(() => {});
    router.refresh();
  }

  if (items.length === 0) {
    return <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 10 }}>
      {items.map((p, idx) => (
        <div key={p.id} className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8 }}>
            <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--surface-2)", color: COLORS[idx % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="ti ti-briefcase" style={{ fontSize: 18 }} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              {editing === p.id ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveName(p.id); if (e.key === "Escape") setEditing(null); }} style={{ flex: 1, fontSize: 13.5, padding: "5px 8px", borderRadius: 7, border: "1px solid var(--accent)", background: "var(--surface)", color: "var(--text)", minWidth: 0 }} />
                  <button onClick={() => saveName(p.id)} style={{ border: "none", background: "var(--accent)", color: "#fff", borderRadius: 7, padding: "0 9px", cursor: "pointer", fontSize: 12 }}><i className="ti ti-check" /></button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{p.count} {s.notes}</div>
                </>
              )}
            </div>
          </div>

          {p.entries?.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginBottom: 8 }}>
              {p.entries.map((e: any) => (
                <Link key={e.id} href={`/entry/${e.id}`} style={{ display: "block", fontSize: 12.5, color: "var(--text-2)", padding: "3px 0", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {e.summary || e.raw_text}</Link>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
            <Link href={`/projects/${p.id}`} style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 500 }}>{s.open} →</Link>
            <button onClick={() => startEdit(p)} title="rename" style={{ marginLeft: "auto", border: "none", background: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }}><i className="ti ti-pencil" style={{ fontSize: 16 }} /></button>
            <button onClick={() => del(p.id)} title="delete" style={{ border: "none", background: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }}><i className="ti ti-trash" style={{ fontSize: 16 }} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
