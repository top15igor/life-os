"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

const PSTR: Record<string, any> = {
  ru: { on: "PIN установлен — вход защищён", off: "PIN не установлен", set: "Установить PIN", change: "Изменить PIN", remove: "Убрать PIN", newPin: "Новый PIN (4–8 цифр)", current: "Текущий PIN", save: "Сохранить", cancel: "Отмена", bad: "PIN — от 4 до 8 цифр", wrong: "Неверный текущий PIN", noCol: "Сначала запусти pin.sql в Supabase." },
  en: { on: "PIN is set — access protected", off: "No PIN set", set: "Set PIN", change: "Change PIN", remove: "Remove PIN", newPin: "New PIN (4–8 digits)", current: "Current PIN", save: "Save", cancel: "Cancel", bad: "PIN must be 4–8 digits", wrong: "Wrong current PIN", noCol: "Run pin.sql in Supabase first." },
  uk: { on: "PIN встановлено — вхід захищено", off: "PIN не встановлено", set: "Встановити PIN", change: "Змінити PIN", remove: "Прибрати PIN", newPin: "Новий PIN (4–8 цифр)", current: "Поточний PIN", save: "Зберегти", cancel: "Скасувати", bad: "PIN — від 4 до 8 цифр", wrong: "Невірний поточний PIN", noCol: "Спершу запусти pin.sql у Supabase." },
  fr: { on: "PIN défini — accès protégé", off: "Aucun PIN", set: "Définir un PIN", change: "Changer le PIN", remove: "Retirer le PIN", newPin: "Nouveau PIN (4–8 chiffres)", current: "PIN actuel", save: "Enregistrer", cancel: "Annuler", bad: "Le PIN doit faire 4–8 chiffres", wrong: "PIN actuel incorrect", noCol: "Lance d'abord pin.sql dans Supabase." },
};

export function PinSettings({ locale, hasPin }: { locale: string; hasPin: boolean }) {
  const s = PSTR[locale] || PSTR.ru;
  const [mode, setMode] = useState<null | "set" | "remove">(null);
  const [pin, setPin] = useState("");
  const [current, setCurrent] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  const numInput = (val: string, set: (v: string) => void, ph: string) => (
    <input type="password" inputMode="numeric" value={val} onChange={(e) => { set(e.target.value.replace(/\D/g, "").slice(0, 8)); setErr(""); }} placeholder={ph}
      style={{ width: "100%", fontSize: 14, padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", marginBottom: 8, boxSizing: "border-box" }} />
  );

  async function save() {
    if (busy) return;
    if (!/^\d{4,8}$/.test(pin)) { setErr(s.bad); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/pin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "set", pin, current }) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (r?.ok) { setMode(null); setPin(""); setCurrent(""); router.refresh(); }
    else setErr(r?.error === "wrong" ? s.wrong : r?.error === "no_column" ? s.noCol : s.bad);
  }
  async function remove() {
    if (busy) return;
    setBusy(true); setErr("");
    const r = await fetch("/api/pin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "remove", current }) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (r?.ok) { setMode(null); setCurrent(""); router.refresh(); }
    else setErr(r?.error === "wrong" ? s.wrong : s.noCol);
  }

  const btn = (label: string, onClick: () => void, primary?: boolean) => (
    <button onClick={onClick} disabled={busy} style={{ fontSize: 13, fontWeight: 500, padding: "8px 14px", borderRadius: 9, border: primary ? "none" : "1px solid var(--border)", background: primary ? "var(--accent)" : "var(--surface)", color: primary ? "#fff" : "var(--text)", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{label}</button>
  );

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: mode ? 12 : 0 }}>
        <i className="ti ti-lock" style={{ fontSize: 18, color: hasPin ? "var(--positive)" : "var(--text-3)" }} />
        <span style={{ fontSize: 13.5, flex: 1 }}>{hasPin ? s.on : s.off}</span>
        {!mode && (hasPin ? (
          <div style={{ display: "flex", gap: 6 }}>{btn(s.change, () => setMode("set"))}{btn(s.remove, () => setMode("remove"))}</div>
        ) : btn(s.set, () => setMode("set"), true))}
      </div>

      {mode === "set" && (
        <div>
          {hasPin && numInput(current, setCurrent, s.current)}
          {numInput(pin, setPin, s.newPin)}
          {err && <div style={{ fontSize: 12.5, color: "#ef4444", marginBottom: 8 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8 }}>{btn(s.save, save, true)}{btn(s.cancel, () => { setMode(null); setErr(""); setPin(""); setCurrent(""); })}</div>
        </div>
      )}
      {mode === "remove" && (
        <div>
          {numInput(current, setCurrent, s.current)}
          {err && <div style={{ fontSize: 12.5, color: "#ef4444", marginBottom: 8 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8 }}>{btn(s.remove, remove, true)}{btn(s.cancel, () => { setMode(null); setErr(""); setCurrent(""); })}</div>
        </div>
      )}
    </div>
  );
}

const NOTIF_STR: Record<string, { title: string; sub: string }> = {
  ru: { title: "Уведомления в Telegram", sub: "Утренняя мотивация и вечерние «вопросы для книги». Можно выключить в любой момент." },
  en: { title: "Telegram notifications", sub: "Morning motivation and evening “book questions”. You can turn it off anytime." },
  uk: { title: "Сповіщення в Telegram", sub: "Ранкова мотивація та вечірні «питання для книги». Можна вимкнути будь-коли." },
  fr: { title: "Notifications Telegram", sub: "Motivation du matin et « questions pour ton livre » le soir. Désactivable à tout moment." },
};

export function NotificationToggle({ locale, enabled }: { locale: string; enabled: boolean }) {
  const s = NOTIF_STR[locale] || NOTIF_STR.ru;
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      await fetch("/api/push-pref", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled: next }) });
    } catch {
      setOn(!next);
    }
    setBusy(false);
  }

  return (
    <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{s.title}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, marginTop: 2 }}>{s.sub}</div>
      </div>
      <button onClick={toggle} disabled={busy} role="switch" aria-checked={on} aria-label={s.title}
        style={{ flexShrink: 0, width: 46, height: 28, borderRadius: 999, border: "none", cursor: "pointer", background: on ? "var(--accent)" : "var(--border)", position: "relative", transition: "background .15s", opacity: busy ? 0.7 : 1 }}>
        <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: 999, background: "#fff", transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </button>
    </div>
  );
}
