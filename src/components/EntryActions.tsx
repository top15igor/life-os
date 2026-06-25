"use client";

import { useState } from "react";

const STR: Record<string, { del: string; confirm: string; deleting: string }> = {
  ru: { del: "Удалить запись", confirm: "Удалить эту запись? Вместе с ней удалятся её задачи, добрые дела и обещания. Действие необратимо.", deleting: "Удаляю…" },
  en: { del: "Delete entry", confirm: "Delete this entry? Its tasks, good deeds and promises will be removed too. This can't be undone.", deleting: "Deleting…" },
  uk: { del: "Видалити запис", confirm: "Видалити цей запис? Разом із ним зникнуть його завдання, добрі справи й обіцянки. Дію не скасувати.", deleting: "Видаляю…" },
  fr: { del: "Supprimer l'entrée", confirm: "Supprimer cette entrée ? Ses tâches, bonnes actions et promesses seront aussi supprimées. Irréversible.", deleting: "Suppression…" },
};

export default function EntryActions({ id, locale }: { id: string; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [busy, setBusy] = useState(false);

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

  return (
    <button onClick={del} disabled={busy} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "#ef4444", fontSize: 13.5, cursor: "pointer" }}>
      <i className="ti ti-trash" style={{ fontSize: 16 }} />{busy ? s.deleting : s.del}
    </button>
  );
}
