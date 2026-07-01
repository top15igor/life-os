"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STR: Record<string, any> = {
  ru: { notes: "записей", open: "Открыть", save: "Сохранить", cancel: "Отмена", confirm: "Удалить проект? Сами записи останутся — исчезнет только проект и его связи.", empty: "Проектов пока нет — они появятся, когда упомянёшь их в записях боту.",
    mergeMode: "Объединить", mergeExit: "Готово", selectHint: "Отметь проекты, которые нужно слить в один.", keep: "Оставить:", mergeBtn: "Объединить", selected: (n: number) => `Выбрано: ${n}`,
    mergeConfirm: (n: number, name: string) => `Слить ${n} проект(ов) в «${name}»? Записи переедут в него, лишние карточки удалятся. Сами записи не пропадут.` },
  en: { notes: "entries", open: "Open", save: "Save", cancel: "Cancel", confirm: "Delete project? Your entries stay — only the project and its links are removed.", empty: "No projects yet — they appear when you mention them to the bot.",
    mergeMode: "Merge", mergeExit: "Done", selectHint: "Pick the projects to merge into one.", keep: "Keep:", mergeBtn: "Merge", selected: (n: number) => `Selected: ${n}`,
    mergeConfirm: (n: number, name: string) => `Merge ${n} project(s) into “${name}”? Their entries move there, the extra cards are removed. Entries themselves stay.` },
  uk: { notes: "записів", open: "Відкрити", save: "Зберегти", cancel: "Скасувати", confirm: "Видалити проєкт? Записи залишаться — зникне лише проєкт і його зв'язки.", empty: "Проєктів поки немає — з'являться, коли згадаєш їх боту.",
    mergeMode: "Об'єднати", mergeExit: "Готово", selectHint: "Познач проєкти, які треба злити в один.", keep: "Залишити:", mergeBtn: "Об'єднати", selected: (n: number) => `Обрано: ${n}`,
    mergeConfirm: (n: number, name: string) => `Злити ${n} проєкт(ів) у «${name}»? Записи переїдуть до нього, зайві картки видаляться. Самі записи не зникнуть.` },
  fr: { notes: "entrées", open: "Ouvrir", save: "Enregistrer", cancel: "Annuler", confirm: "Supprimer le projet ? Tes entrées restent — seul le projet et ses liens disparaissent.", empty: "Pas encore de projets — ils apparaissent quand tu les mentionnes au bot.",
    mergeMode: "Fusionner", mergeExit: "Terminé", selectHint: "Choisis les projets à fusionner en un.", keep: "Garder :", mergeBtn: "Fusionner", selected: (n: number) => `Sélectionnés : ${n}`,
    mergeConfirm: (n: number, name: string) => `Fusionner ${n} projet(s) dans « ${name} » ? Leurs entrées y sont déplacées, les cartes en trop sont supprimées. Les entrées restent.` },
};

const COLORS = ["#3b82f6", "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];

export default function ProjectsManager({ initial, locale }: { initial: any[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [items, setItems] = useState<any[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [merging, setMerging] = useState(false);
  const [selected, setSelected] = useState<Set<any>>(new Set());
  const [target, setTarget] = useState<any>(null);
  const [busy, setBusy] = useState(false);
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

  function toggleMergeMode() {
    setMerging((m) => !m);
    setSelected(new Set());
    setTarget(null);
    setEditing(null);
  }

  function toggleSelect(p: any) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
      // Цель по умолчанию — выбранный проект с наибольшим числом записей.
      const chosen = items.filter((x) => next.has(x.id));
      if (!target || !next.has(target)) {
        const best = chosen.slice().sort((a, b) => (b.count || 0) - (a.count || 0))[0];
        setTarget(best ? best.id : null);
      }
      return next;
    });
  }

  async function doMerge() {
    const sourceIds = [...selected].filter((id) => id !== target);
    if (!target || sourceIds.length === 0) return;
    const targetName = items.find((x) => x.id === target)?.name || "";
    if (!confirm(s.mergeConfirm(sourceIds.length, targetName))) return;
    setBusy(true);
    const res = await fetch("/api/project", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "merge", targetId: target, sourceIds }),
    }).then((r) => r.json()).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      const srcSet = new Set(sourceIds);
      setItems((prev) => prev.filter((x) => !srcSet.has(x.id)));
      setSelected(new Set());
      setTarget(null);
      setMerging(false);
      router.refresh();
    }
  }

  if (items.length === 0) {
    return <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>;
  }

  const selCount = selected.size;

  return (
    <div>
      {/* Панель: включить режим объединения */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <button
          onClick={toggleMergeMode}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 9, cursor: "pointer",
            color: merging ? "#fff" : "var(--accent)",
            background: merging ? "var(--accent)" : "color-mix(in srgb, var(--accent) 10%, var(--surface))",
            border: `1px solid ${merging ? "var(--accent)" : "color-mix(in srgb, var(--accent) 35%, transparent)"}`,
          }}
        >
          <i className={`ti ${merging ? "ti-check" : "ti-arrows-join"}`} style={{ fontSize: 16 }} /> {merging ? s.mergeExit : s.mergeMode}
        </button>
        {merging && <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{s.selectHint}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 10 }}>
        {items.map((p, idx) => {
          const isSel = selected.has(p.id);
          return (
            <div key={p.id} className="card"
              onClick={merging ? () => toggleSelect(p) : undefined}
              style={{
                position: "relative", cursor: merging ? "pointer" : "default",
                border: merging && isSel ? "2px solid var(--accent)" : undefined,
                background: merging && isSel ? "color-mix(in srgb, var(--accent) 7%, var(--surface))" : undefined,
              }}
            >
              {merging && (
                <span style={{
                  position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1.5px solid ${isSel ? "var(--accent)" : "var(--border)"}`, background: isSel ? "var(--accent)" : "var(--surface)", color: "#fff",
                }}>
                  {isSel && <i className="ti ti-check" style={{ fontSize: 14 }} />}
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8 }}>
                <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--surface-2)", color: COLORS[idx % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-briefcase" style={{ fontSize: 18 }} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {editing === p.id && !merging ? (
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

              {!merging && p.entries?.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginBottom: 8 }}>
                  {p.entries.map((e: any) => (
                    <Link key={e.id} href={`/entry/${e.id}`} style={{ display: "block", fontSize: 12.5, color: "var(--text-2)", padding: "3px 0", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {e.summary || e.raw_text}</Link>
                  ))}
                </div>
              )}

              {!merging && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                  <Link href={`/projects/${p.id}`} style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 500 }}>{s.open} →</Link>
                  <button onClick={() => startEdit(p)} title="rename" style={{ marginLeft: "auto", border: "none", background: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }}><i className="ti ti-pencil" style={{ fontSize: 16 }} /></button>
                  <button onClick={() => del(p.id)} title="delete" style={{ border: "none", background: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }}><i className="ti ti-trash" style={{ fontSize: 16 }} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Плавающая панель объединения */}
      {merging && selCount >= 2 && (
        <div style={{
          position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 24, zIndex: 50,
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", maxWidth: "calc(100vw - 32px)",
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "10px 14px",
          boxShadow: "0 10px 30px rgba(0,0,0,.18)",
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{s.selected(selCount)}</span>
          <label style={{ fontSize: 12.5, color: "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            {s.keep}
            <select value={target ?? ""} onChange={(e) => setTarget(isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
              style={{ fontSize: 12.5, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", maxWidth: 200 }}>
              {items.filter((x) => selected.has(x.id)).map((x) => (
                <option key={x.id} value={x.id}>{x.name} ({x.count})</option>
              ))}
            </select>
          </label>
          <button disabled={busy || !target} onClick={doMerge}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 9, border: "none", cursor: busy ? "default" : "pointer", background: "var(--accent)", color: "#fff", opacity: busy ? 0.7 : 1 }}>
            <i className="ti ti-arrows-join" style={{ fontSize: 15 }} /> {s.mergeBtn}
          </button>
        </div>
      )}
    </div>
  );
}
