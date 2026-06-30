"use client";

import { useState } from "react";

const T: Record<string, any> = {
  ru: {
    title: "Закрепи аккаунт почтой",
    sub: "Сейчас вход — по личной ссылке из Telegram. Привяжи почту и пароль, чтобы заходить с любого устройства и не потерять доступ к дневнику.",
    email: "Почта",
    pass: "Пароль (от 6 символов)",
    save: "Привязать почту",
    saving: "Привязываю…",
    later: "Позже",
    done: "✅ Готово! Теперь можно входить по почте.",
    errs: { invalid_email: "Проверь почту — кажется, адрес неверный.", weak_password: "Пароль слишком короткий — минимум 6 символов.", exists: "Эта почта уже занята другим аккаунтом.", server: "Не получилось, попробуй ещё раз." },
  },
  en: {
    title: "Secure your account with email",
    sub: "Right now you log in via your personal Telegram link. Add an email and password to sign in from any device and never lose access.",
    email: "Email",
    pass: "Password (6+ characters)",
    save: "Link email",
    saving: "Linking…",
    later: "Later",
    done: "✅ Done! You can now sign in with email.",
    errs: { invalid_email: "Check the email — the address looks off.", weak_password: "Password too short — at least 6 characters.", exists: "This email is already taken by another account.", server: "Something went wrong, try again." },
  },
};

export default function BindEmailPrompt({ hasEmail, locale }: { hasEmail: boolean; locale: string }) {
  const t = locale === "en" || locale === "fr" ? T.en : T.ru;
  const dismissedKey = "lifeos_bindemail_dismissed";
  const [hidden, setHidden] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  // Решаем видимость на клиенте, чтобы учесть localStorage-скрытие (без мерцания на сервере).
  const [ready, setReady] = useState(false);
  if (typeof window !== "undefined" && !ready) {
    try { if (sessionStorage.getItem(dismissedKey)) setHidden(true); } catch {}
    setReady(true);
  }

  if (hasEmail || hidden || done) {
    if (done) {
      return <div className="card" style={{ marginBottom: 14, background: "var(--accent-bg)", border: "1px solid var(--border)", fontSize: 13.5 }}>{t.done}</div>;
    }
    return null;
  }

  async function save() {
    if (busy || !email.trim() || pass.length < 6) return;
    setBusy(true); setErr("");
    const r = await fetch("/api/auth/link-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: email.trim(), password: pass }) })
      .then((x) => x.json()).catch(() => ({ ok: false, error: "server" }));
    setBusy(false);
    if (r?.ok) setDone(true);
    else setErr(t.errs[r?.error as string] || t.errs.server);
  }

  function dismiss() {
    setHidden(true);
    try { sessionStorage.setItem(dismissedKey, "1"); } catch {}
  }

  return (
    <div className="card" style={{ marginBottom: 14, border: "1px solid #6d5efc44", background: "var(--accent-bg)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <i className="ti ti-mail-cog" style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{t.title}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginTop: 3 }}>{t.sub}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 11 }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email} autoComplete="email"
              style={{ flex: 1, minWidth: 160, padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13.5, color: "var(--text)" }} />
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder={t.pass} autoComplete="new-password"
              onKeyDown={(e) => { if (e.key === "Enter") save(); }}
              style={{ flex: 1, minWidth: 160, padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13.5, color: "var(--text)" }} />
          </div>
          {err && <div style={{ fontSize: 12.5, color: "#ef4444", marginTop: 7 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 11, alignItems: "center" }}>
            <button onClick={save} disabled={busy || !email.trim() || pass.length < 6}
              style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13.5, fontWeight: 500, cursor: "pointer", opacity: busy || !email.trim() || pass.length < 6 ? 0.6 : 1 }}>
              {busy ? t.saving : t.save}
            </button>
            <button onClick={dismiss} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "none", color: "var(--text-3)", fontSize: 13, cursor: "pointer" }}>{t.later}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
