"use client";

import { useState } from "react";

const T = {
  ru: {
    heading: "Способы входа",
    sub: "Привяжи почту или Google — и сможешь входить в ЭТОТ аккаунт любым способом, с любого устройства.",
    tg: "Telegram",
    tgOn: "подключён",
    email: "Почта / Google",
    connected: "подключено",
    addGoogle: "Привязать Google",
    addEmail: "Задать почту и пароль",
    emailPh: "Почта",
    passPh: "Пароль (мин. 6 символов)",
    save: "Привязать",
    busy: "Минуту…",
    okGoogle: "Google привязан ✓",
    okEmail: "Почта и пароль привязаны ✓",
    cancel: "Отмена",
    errors: {
      invalid_email: "Проверь почту — кажется, ошибка в адресе.",
      weak_password: "Пароль слишком короткий — минимум 6 символов.",
      exists: "Эта почта уже привязана к другому аккаунту с записями.",
      emailtaken: "Эта почта уже привязана к другому аккаунту с записями.",
      server: "Что-то пошло не так. Попробуй ещё раз.",
      net: "Нет связи. Попробуй снова.",
    } as Record<string, string>,
  },
  en: {
    heading: "Sign-in methods",
    sub: "Link email or Google — then you can sign in to THIS account any way, from any device.",
    tg: "Telegram",
    tgOn: "connected",
    email: "Email / Google",
    connected: "connected",
    addGoogle: "Link Google",
    addEmail: "Set email and password",
    emailPh: "Email",
    passPh: "Password (min 6 chars)",
    save: "Link",
    busy: "One moment…",
    okGoogle: "Google linked ✓",
    okEmail: "Email and password linked ✓",
    cancel: "Cancel",
    errors: {
      invalid_email: "Check the email — looks off.",
      weak_password: "Password too short — at least 6 characters.",
      exists: "This email is already linked to another account with entries.",
      emailtaken: "This email is already linked to another account with entries.",
      server: "Something went wrong. Try again.",
      net: "No connection. Try again.",
    } as Record<string, string>,
  },
};

export default function LoginMethods({
  locale,
  hasTelegram,
  email,
  notice,
}: {
  locale: string;
  hasTelegram: boolean;
  email: string | null;
  notice?: "linked" | "emailtaken";
}) {
  const t = locale === "en" || locale === "fr" ? T.en : T.ru;
  const [open, setOpen] = useState(false);
  const [em, setEm] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    notice === "linked" ? { kind: "ok", text: t.okGoogle } : notice === "emailtaken" ? { kind: "err", text: t.errors.emailtaken } : null
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/auth/link-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password: pw }),
      });
      const data = await r.json().catch(() => ({}));
      if (data?.ok) {
        window.location.href = "/profile?linked=email";
        return;
      }
      setMsg({ kind: "err", text: t.errors[data?.error] || t.errors.server });
    } catch {
      setMsg({ kind: "err", text: t.errors.net });
    } finally {
      setBusy(false);
    }
  }

  const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 11, padding: "10px 0" };
  const chipOn: React.CSSProperties = { fontSize: 12, color: "var(--positive)", fontWeight: 600, marginLeft: "auto", whiteSpace: "nowrap" };
  const btn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "11px",
    borderRadius: 11,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: 13.5,
    fontWeight: 500,
    textDecoration: "none",
    cursor: "pointer",
  };
  const inp: React.CSSProperties = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    fontSize: 14,
    color: "var(--text)",
    boxSizing: "border-box",
  };

  const linked = !!email;

  return (
    <>
      <div style={{ fontSize: 13, color: "var(--text-2)", margin: "20px 0 10px" }}>{t.heading}</div>
      <div className="card">
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 8 }}>{t.sub}</div>

        {hasTelegram && (
          <div style={row}>
            <i className="ti ti-brand-telegram" style={{ fontSize: 19, color: "#229ED9" }} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>{t.tg}</span>
            <span style={chipOn}>✓ {t.tgOn}</span>
          </div>
        )}

        <div style={{ ...row, borderTop: hasTelegram ? "1px solid var(--border)" : "none" }}>
          <i className="ti ti-mail" style={{ fontSize: 19, color: "var(--accent)" }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{t.email}</span>
          {linked && <span style={chipOn}>✓ {email}</span>}
        </div>

        {!linked && (
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 6 }}>
            <a href="/api/auth/google/start?link=1" style={btn}>
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              {t.addGoogle}
            </a>

            {!open ? (
              <button onClick={() => setOpen(true)} style={btn}>
                <i className="ti ti-key" style={{ fontSize: 16 }} />
                {t.addEmail}
              </button>
            ) : (
              <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input type="email" value={em} onChange={(e) => setEm(e.target.value)} placeholder={t.emailPh} autoComplete="email" required style={inp} />
                <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t.passPh} autoComplete="new-password" required style={inp} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={busy} style={{ ...btn, background: "var(--accent)", color: "#fff", border: "none", opacity: busy ? 0.6 : 1 }}>
                    {busy ? t.busy : t.save}
                  </button>
                  <button type="button" onClick={() => { setOpen(false); setMsg(null); }} style={{ ...btn, width: "auto", padding: "11px 16px" }}>
                    {t.cancel}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {msg && (
          <div style={{ fontSize: 12.5, marginTop: 10, color: msg.kind === "ok" ? "var(--positive)" : "var(--health, #e11d48)", lineHeight: 1.4 }}>
            {msg.text}
          </div>
        )}
      </div>
    </>
  );
}
