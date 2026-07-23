"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STR: Record<string, any> = {
  ru: { title: "Поставь PIN-код", text: "Защити дневник: вход в веб будет под кодом. Можно сейчас или позже в «Профиле».", set: "Поставить", later: "Позже", placeholder: "Придумай PIN (4–8 цифр)", save: "Готово", cancel: "Отмена", bad: "PIN — от 4 до 8 цифр" },
  en: { title: "Set a PIN", text: "Protect your diary: web access will need a code. Now or later in Profile.", set: "Set", later: "Later", placeholder: "Choose a PIN (4–8 digits)", save: "Done", cancel: "Cancel", bad: "PIN must be 4–8 digits" },
  uk: { title: "Постав PIN-код", text: "Захисти щоденник: вхід у веб буде під кодом. Зараз або пізніше у «Профілі».", set: "Поставити", later: "Пізніше", placeholder: "Придумай PIN (4–8 цифр)", save: "Готово", cancel: "Скасувати", bad: "PIN — від 4 до 8 цифр" },
  fr: { title: "Définis un PIN", text: "Protège ton journal : l'accès web demandera un code. Maintenant ou plus tard dans Profil.", set: "Définir", later: "Plus tard", placeholder: "Choisis un PIN (4–8 chiffres)", save: "OK", cancel: "Annuler", bad: "Le PIN doit faire 4–8 chiffres" },
  es: { title: "Crea un PIN", text: "Protege tu diario: el acceso web pedirá un código. Ahora o más tarde en «Perfil».", set: "Crear", later: "Más tarde", placeholder: "Elige un PIN (4–8 dígitos)", save: "Listo", cancel: "Cancelar", bad: "El PIN debe tener entre 4 y 8 dígitos" },
};

export default function PinPrompt({ hasPin, locale, hasEmail = false }: { hasPin: boolean; locale: string; hasEmail?: boolean }) {
  const s = STR[locale] || STR.ru;
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    try {
      // Есть почта/Google — полноценный вход уже защищает аккаунт, PIN не навязываем.
      if (hasPin || hasEmail) return;
      if (localStorage.getItem("lifeos_pin_prompt") === "off") return;
      setShow(true);
    } catch {}
  }, [hasPin, hasEmail]);

  if (!show || hasPin || hasEmail) return null;

  function later() {
    try { localStorage.setItem("lifeos_pin_prompt", "off"); } catch {}
    setShow(false);
  }
  async function save() {
    if (busy) return;
    if (!/^\d{4,8}$/.test(pin)) { setErr(s.bad); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/pin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "set", pin }) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (r?.ok) { try { localStorage.setItem("lifeos_pin_prompt", "off"); } catch {} router.refresh(); }
    else setErr(s.bad);
  }

  return (
    <div style={{ borderRadius: 14, padding: "14px 15px", marginBottom: 16, background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: editing ? 10 : 8 }}>
        <i className="ti ti-lock" style={{ fontSize: 19, color: "var(--accent)" }} />
        <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--accent-text)" }}>{s.title}</span>
        {!editing && <button onClick={later} aria-label="close" style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 0 }}><i className="ti ti-x" style={{ fontSize: 17 }} /></button>}
      </div>
      {!editing ? (
        <>
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 11 }}>{s.text}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setEditing(true)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>{s.set}</button>
            <button onClick={later} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: 13.5, cursor: "pointer" }}>{s.later}</button>
          </div>
        </>
      ) : (
        <>
          <input autoFocus type="password" inputMode="numeric" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 8)); setErr(""); }} placeholder={s.placeholder}
            style={{ width: "100%", fontSize: 15, padding: "11px 12px", borderRadius: 10, border: `1px solid ${err ? "#ef4444" : "var(--border)"}`, background: "var(--surface)", color: "var(--text)", marginBottom: 8, boxSizing: "border-box", letterSpacing: 3 }} />
          {err && <div style={{ fontSize: 12.5, color: "#ef4444", marginBottom: 8 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={busy || pin.length < 4} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13.5, fontWeight: 500, cursor: "pointer", opacity: busy || pin.length < 4 ? 0.6 : 1 }}>{s.save}</button>
            <button onClick={() => { setEditing(false); setPin(""); setErr(""); }} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: 13.5, cursor: "pointer" }}>{s.cancel}</button>
          </div>
        </>
      )}
    </div>
  );
}
