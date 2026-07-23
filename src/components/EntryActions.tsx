"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STR: Record<string, any> = {
  ru: { edit: "Редактировать", del: "Удалить запись", confirm: "Удалить эту запись? Вместе с ней удалятся её задачи, добрые дела и обещания. Действие необратимо.", deleting: "Удаляю…", editTitle: "Редактировать запись", editHint: "Поправь текст — AI заново разложит запись по категориям, тегам и настроению.", save: "Сохранить", cancel: "Отмена", recalc: "Пересчитываю…", emptyText: "Текст не может быть пустым." },
  en: { edit: "Edit", del: "Delete entry", confirm: "Delete this entry? Its tasks, good deeds and promises will be removed too. This can't be undone.", deleting: "Deleting…", editTitle: "Edit entry", editHint: "Fix the text — AI will re-sort it into categories, tags and mood.", save: "Save", cancel: "Cancel", recalc: "Recalculating…", emptyText: "Text can't be empty." },
  uk: { edit: "Редагувати", del: "Видалити запис", confirm: "Видалити цей запис? Разом із ним зникнуть його завдання, добрі справи й обіцянки. Дію не скасувати.", deleting: "Видаляю…", editTitle: "Редагувати запис", editHint: "Виправ текст — AI заново розкладе запис за категоріями, тегами й настроєм.", save: "Зберегти", cancel: "Скасувати", recalc: "Перераховую…", emptyText: "Текст не може бути порожнім." },
  fr: { edit: "Modifier", del: "Supprimer l'entrée", confirm: "Supprimer cette entrée ? Ses tâches, bonnes actions et promesses seront aussi supprimées. Irréversible.", deleting: "Suppression…", editTitle: "Modifier l'entrée", editHint: "Corrige le texte — l'IA reclassera l'entrée par catégories, tags et humeur.", save: "Enregistrer", cancel: "Annuler", recalc: "Recalcul…", emptyText: "Le texte ne peut pas être vide." },
  es: { edit: "Editar", del: "Eliminar entrada", confirm: "¿Eliminar esta entrada? Sus tareas, buenas acciones y promesas también se eliminarán. Esta acción no se puede deshacer.", deleting: "Eliminando…", editTitle: "Editar entrada", editHint: "Corrige el texto — la IA volverá a clasificarlo por categorías, etiquetas y estado de ánimo.", save: "Guardar", cancel: "Cancelar", recalc: "Recalculando…", emptyText: "El texto no puede estar vacío." },
};

const btnBase: any = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13.5, cursor: "pointer" };

export default function EntryActions({ id, locale, rawText }: { id: string; locale: string; rawText: string }) {
  const s = STR[locale] || STR.ru;
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rawText || "");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function del() {
    if (!window.confirm(s.confirm)) return;
    setBusy(true);
    try {
      await fetch("/api/entry-delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      window.location.href = "/diary";
    } catch {
      setBusy(false);
    }
  }

  function openEdit() {
    setDraft(rawText || "");
    setEditing(true);
  }

  async function saveEdit() {
    const text = draft.trim();
    if (!text) { window.alert(s.emptyText); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/entry-edit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, text }) });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) { window.location.reload(); return; }
      setBusy(false);
    } catch {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <button onClick={openEdit} disabled={busy} style={btnBase}>
          <i className="ti ti-pencil" style={{ fontSize: 16 }} />{s.edit}
        </button>
        <button onClick={del} disabled={busy} style={{ ...btnBase, color: "#ef4444" }}>
          <i className="ti ti-trash" style={{ fontSize: 16 }} />{busy && !editing ? s.deleting : s.del}
        </button>
      </div>

      {mounted && editing && createPortal(
        <div onClick={() => busy ? null : setEditing(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 }}>
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
              <button disabled={busy} onClick={() => setEditing(false)} style={{ fontSize: 13.5, padding: "9px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer" }}>{s.cancel}</button>
              <button disabled={busy} onClick={saveEdit} style={{ fontSize: 13.5, padding: "9px 18px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>
                {busy ? <><i className="ti ti-loader-2 spin" style={{ fontSize: 15 }} />{s.recalc}</> : <><i className="ti ti-sparkles" style={{ fontSize: 15 }} />{s.save}</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
