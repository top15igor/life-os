"use client";

import { useState } from "react";

const T: Record<string, any> = {
  ru: {
    title: "Закрепи аккаунт",
    sub: "Сейчас вход — по личной ссылке из Telegram. Привяжи Google или почту, чтобы заходить с любого устройства и не потерять доступ к дневнику.",
    google: "Продолжить с Google",
    or: "или",
    email: "Почта",
    pass: "Пароль (от 6 символов)",
    save: "Привязать почту",
    saving: "Привязываю…",
    later: "Позже",
    done: "✅ Готово! Теперь можно входить по почте.",
    errs: { invalid_email: "Проверь почту — кажется, адрес неверный.", weak_password: "Пароль слишком короткий — минимум 6 символов.", exists: "Эта почта уже занята другим аккаунтом.", server: "Не получилось, попробуй ещё раз." },
  },
  en: {
    title: "Secure your account",
    sub: "Right now you log in via your personal Telegram link. Add Google or an email to sign in from any device and never lose access.",
    google: "Continue with Google",
    or: "or",
    email: "Email",
    pass: "Password (6+ characters)",
    save: "Link email",
    saving: "Linking…",
    later: "Later",
    done: "✅ Done! You can now sign in with email.",
    errs: { invalid_email: "Check the email — the address looks off.", weak_password: "Password too short — at least 6 characters.", exists: "This email is already taken by another account.", server: "Something went wrong, try again." },
  },
};

export default function BindEmailPrompt({ hasEmail, locale, googleEnabled = false }: { hasEmail: boolean; locale: string; googleEnabled?: boolean }) {
  const t = locale === "en" || locale === "fr" || locale === "es" ? T.en : T.ru;
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

          {googleEnabled && (
            <>
              <a href="/api/auth/google/start?link=1" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, fontWeight: 500, textDecoration: "none", marginTop: 12, boxSizing: "border-box" }}>
                <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {t.google}
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "11px 0 1px", color: "var(--text-3)", fontSize: 12 }}>
                <span style={{ flex: 1, height: 1, background: "var(--border)" }} />{t.or}<span style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
            </>
          )}

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
