"use client";

import { useState } from "react";

const STR: Record<string, any> = {
  ru: { title: "Введите PIN", sub: "Доступ к дневнику защищён PIN-кодом.", wrong: "Неверный PIN", unlock: "Войти", forgot: "Забыл PIN?", forgotHint: "Открой бота в Telegram и отправь команду /resetpin — PIN сбросится, и ты сможешь войти.", logout: "Выйти" },
  en: { title: "Enter PIN", sub: "Access to your diary is protected by a PIN.", wrong: "Wrong PIN", unlock: "Unlock", forgot: "Forgot PIN?", forgotHint: "Open the bot in Telegram and send /resetpin — the PIN will be reset and you can sign in.", logout: "Log out" },
  uk: { title: "Введіть PIN", sub: "Доступ до щоденника захищено PIN-кодом.", wrong: "Невірний PIN", unlock: "Увійти", forgot: "Забув PIN?", forgotHint: "Відкрий бота в Telegram і надішли /resetpin — PIN скинеться, і ти зможеш увійти.", logout: "Вийти" },
  fr: { title: "Saisis le PIN", sub: "L'accès à ton journal est protégé par un PIN.", wrong: "PIN incorrect", unlock: "Déverrouiller", forgot: "PIN oublié ?", forgotHint: "Ouvre le bot dans Telegram et envoie /resetpin — le PIN sera réinitialisé.", logout: "Se déconnecter" },
};

export default function LockScreen({ locale }: { locale: string }) {
  const s = STR[locale] || STR.ru;
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !pin) return;
    setBusy(true);
    setErr(false);
    const r = await fetch("/api/pin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "verify", pin }) }).then((x) => x.json()).catch(() => null);
    if (r?.ok) window.location.href = "/";
    else { setErr(true); setPin(""); setBusy(false); }
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 22 }}>
      <div style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 99, background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <i className="ti ti-lock" style={{ fontSize: 30, color: "var(--accent)" }} />
        </div>
        <div style={{ fontSize: 21, fontWeight: 600, marginBottom: 6 }}>{s.title}</div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 20 }}>{s.sub}</div>

        <form onSubmit={submit}>
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 8)); setErr(false); }}
            placeholder="••••"
            style={{ width: "100%", textAlign: "center", letterSpacing: 8, fontSize: 22, padding: "13px", borderRadius: 12, border: `1px solid ${err ? "#ef4444" : "var(--border)"}`, background: "var(--surface)", color: "var(--text)", marginBottom: 10, boxSizing: "border-box" }}
          />
          {err && <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 10 }}>{s.wrong}</div>}
          <button type="submit" disabled={busy || pin.length < 4} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: busy || pin.length < 4 ? 0.6 : 1 }}>{s.unlock}</button>
        </form>

        <button onClick={() => setForgot((f) => !f)} style={{ marginTop: 16, background: "none", border: "none", color: "var(--text-3)", fontSize: 13, cursor: "pointer" }}>{s.forgot}</button>
        {forgot && <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginTop: 8, background: "var(--surface-2)", borderRadius: 10, padding: "10px 12px" }}>{s.forgotHint}</div>}
        <div style={{ marginTop: 14 }}>
          <a href="/api/logout" style={{ fontSize: 12.5, color: "var(--text-3)" }}>{s.logout}</a>
        </div>
      </div>
    </div>
  );
}
