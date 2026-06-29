"use client";

import { useState, useEffect, useRef } from "react";

const STR: Record<string, any> = {
  ru: {
    title: "Твоё имя-ссылка",
    sub: "Это твой адрес в LIFE OS — как @имя в Instagram. По нему работает и приглашение друзей, и твоя публичная страница.",
    label: "Имя-ссылка",
    checking: "Проверяю…",
    available: "Свободно ✓",
    taken: "Уже занято — попробуй другое",
    invalid: "3–30 символов: латиница, цифры, дефис",
    save: "Сохранить",
    saving: "Сохраняю…",
    saved: "Сохранено ✓",
    copy: "Копировать ссылку",
    copied: "Скопировано ✓",
    inviteLbl: "Ссылка-приглашение",
  },
  en: {
    title: "Your link name",
    sub: "This is your address in LIFE OS — like @name on Instagram. It powers both friend invites and your public page.",
    label: "Link name",
    checking: "Checking…",
    available: "Available ✓",
    taken: "Already taken — try another",
    invalid: "3–30 chars: letters, digits, hyphen",
    save: "Save",
    saving: "Saving…",
    saved: "Saved ✓",
    copy: "Copy link",
    copied: "Copied ✓",
    inviteLbl: "Invite link",
  },
  uk: {
    title: "Твоє ім'я-посилання",
    sub: "Це твоя адреса в LIFE OS — як @ім'я в Instagram. За ним працює і запрошення друзів, і твоя публічна сторінка.",
    label: "Ім'я-посилання",
    checking: "Перевіряю…",
    available: "Вільно ✓",
    taken: "Вже зайнято — спробуй інше",
    invalid: "3–30 символів: латиниця, цифри, дефіс",
    save: "Зберегти",
    saving: "Зберігаю…",
    saved: "Збережено ✓",
    copy: "Копіювати посилання",
    copied: "Скопійовано ✓",
    inviteLbl: "Посилання-запрошення",
  },
  fr: {
    title: "Ton nom de lien",
    sub: "C'est ton adresse dans LIFE OS — comme @nom sur Instagram. Il sert pour les invitations et ta page publique.",
    label: "Nom de lien",
    checking: "Vérification…",
    available: "Disponible ✓",
    taken: "Déjà pris — essaie un autre",
    invalid: "3 à 30 caractères : lettres, chiffres, tiret",
    save: "Enregistrer",
    saving: "Enregistrement…",
    saved: "Enregistré ✓",
    copy: "Copier le lien",
    copied: "Copié ✓",
    inviteLbl: "Lien d'invitation",
  },
};

type Status = "idle" | "checking" | "available" | "taken" | "invalid";

export default function UsernameEditor({ locale, baseUrl, initialHandle }: { locale: string; baseUrl: string; initialHandle: string }) {
  const s = STR[locale] || STR.ru;
  const [value, setValue] = useState(initialHandle);
  const [savedHandle, setSavedHandle] = useState(initialHandle);
  const [status, setStatus] = useState<Status>("idle");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<any>(null);

  const dirty = value !== savedHandle;

  useEffect(() => {
    if (!dirty) { setStatus("idle"); return; }
    if (!/^[a-z0-9-]{3,30}$/.test(value)) { setStatus("invalid"); return; }
    setStatus("checking");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch(`/api/handle?u=${encodeURIComponent(value)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!d?.ok || !d.valid) setStatus("invalid");
          else setStatus(d.available ? "available" : "taken");
        })
        .catch(() => setStatus("idle"));
    }, 400);
    return () => clearTimeout(timer.current);
  }, [value, dirty]);

  function onChange(v: string) {
    setSavedMsg(false);
    setValue(v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30));
  }

  async function save() {
    if (status !== "available") return;
    setSaving(true);
    const r = await fetch("/api/handle", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: value }) }).then((x) => x.json()).catch(() => null);
    setSaving(false);
    if (r?.ok) { setSavedHandle(value); setStatus("idle"); setSavedMsg(true); }
    else if (r?.error === "taken") setStatus("taken");
    else setStatus("invalid");
  }

  const link = `${baseUrl}/i/${savedHandle}`;
  function copy() {
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {});
  }

  const hint =
    status === "checking" ? { t: s.checking, c: "var(--text-3)" } :
    status === "available" ? { t: s.available, c: "var(--positive)" } :
    status === "taken" ? { t: s.taken, c: "var(--negative, #dc2626)" } :
    status === "invalid" ? { t: s.invalid, c: "var(--negative, #dc2626)" } :
    savedMsg ? { t: s.saved, c: "var(--positive)" } : null;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{s.title}</div>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 12, lineHeight: 1.5 }}>{s.sub}</div>

      <div style={{ display: "flex", alignItems: "stretch", gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface-2)", overflow: "hidden", minWidth: 0 }}>
          <span style={{ fontSize: 12.5, color: "var(--text-3)", padding: "0 2px 0 11px", whiteSpace: "nowrap" }}>/i/</span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            autoCapitalize="none"
            style={{ flex: 1, fontSize: 13.5, padding: "10px 11px 10px 2px", border: "none", background: "transparent", color: "var(--text)", minWidth: 0, outline: "none" }}
          />
        </div>
        <button
          onClick={save}
          disabled={status !== "available" || saving}
          style={{ flexShrink: 0, fontSize: 13, padding: "0 16px", borderRadius: 10, border: "none", background: status === "available" && !saving ? "var(--accent)" : "var(--surface-2)", color: status === "available" && !saving ? "#fff" : "var(--text-3)", cursor: status === "available" && !saving ? "pointer" : "default", fontWeight: 500 }}
        >
          {saving ? s.saving : s.save}
        </button>
      </div>

      {hint && <div style={{ fontSize: 12, color: hint.c, marginBottom: 10, minHeight: 16 }}>{hint.t}</div>}

      <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.03em", margin: "6px 0 6px" }}>{s.inviteLbl}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} style={{ flex: 1, fontSize: 12.5, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-2)", minWidth: 0 }} />
        <button onClick={copy} style={{ flexShrink: 0, fontSize: 13, padding: "0 14px", borderRadius: 10, border: "none", background: copied ? "var(--positive)" : "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: 500 }}>
          <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} style={{ fontSize: 14, verticalAlign: "-2px", marginRight: 4 }} />{copied ? s.copied : s.copy}
        </button>
      </div>
    </div>
  );
}
