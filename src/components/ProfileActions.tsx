"use client";

import { useState } from "react";

const STR: Record<string, any> = {
  ru: { copy: "Копировать", copied: "Скопировано", logout: "Выйти", delete: "Удалить аккаунт", confirm1: "Удалить аккаунт и ВСЕ записи без возможности восстановления?", confirm2: "Точно? Это необратимо.", deleting: "Удаляю…" },
  en: { copy: "Copy", copied: "Copied", logout: "Log out", delete: "Delete account", confirm1: "Delete account and ALL entries permanently?", confirm2: "Are you sure? This is irreversible.", deleting: "Deleting…" },
  uk: { copy: "Копіювати", copied: "Скопійовано", logout: "Вийти", delete: "Видалити акаунт", confirm1: "Видалити акаунт і ВСІ записи без можливості відновлення?", confirm2: "Точно? Це незворотно.", deleting: "Видаляю…" },
  fr: { copy: "Copier", copied: "Copié", logout: "Se déconnecter", delete: "Supprimer le compte", confirm1: "Supprimer le compte et TOUTES les entrées définitivement ?", confirm2: "Sûr ? C'est irréversible.", deleting: "Suppression…" },
};

export function CopyLink({ link, locale }: { link: string; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {});
  }
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} style={{ flex: 1, fontSize: 12.5, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-2)", minWidth: 0 }} />
      <button onClick={copy} style={{ flexShrink: 0, fontSize: 13, padding: "0 15px", borderRadius: 10, border: "none", background: copied ? "var(--positive)" : "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: 500 }}>
        <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} style={{ fontSize: 14, verticalAlign: "-2px", marginRight: 4 }} />{copied ? s.copied : s.copy}
      </button>
    </div>
  );
}

export function ProfileButtons({ locale }: { locale: string }) {
  const s = STR[locale] || STR.ru;
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!confirm(s.confirm1)) return;
    if (!confirm(s.confirm2)) return;
    setBusy(true);
    await fetch("/api/account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete" }) }).catch(() => {});
    window.location.href = "/api/logout";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <a href="/api/logout" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
        <i className="ti ti-logout" style={{ fontSize: 17 }} />{s.logout}
      </a>
      <button onClick={del} disabled={busy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 11, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
        <i className="ti ti-trash" style={{ fontSize: 17 }} />{busy ? s.deleting : s.delete}
      </button>
    </div>
  );
}
