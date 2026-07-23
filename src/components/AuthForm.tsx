"use client";

import { useState } from "react";
import ResumeSessionLink from "@/components/ResumeSessionLink";

type Mode = "login" | "register";

const T = {
  ru: {
    tagline: "Архив жизни",
    login: "Вход",
    register: "Регистрация",
    google: "Продолжить с Google",
    or: "или по почте",
    email: "Почта",
    password: "Пароль",
    name: "Имя",
    namePh: "Как к тебе обращаться",
    submitLogin: "Войти",
    submitReg: "Создать аккаунт",
    haveAcc: "Уже есть аккаунт? Войти",
    noAcc: "Нет аккаунта? Создать",
    tg: "Войти через Telegram-бот",
    about: "О проекте",
    busy: "Минуту…",
    errors: {
      invalid_email: "Проверь почту — кажется, в адресе ошибка.",
      weak_password: "Пароль слишком короткий — минимум 6 символов.",
      exists: "Аккаунт с такой почтой уже есть. Войди.",
      no_user: "Аккаунта с такой почтой нет. Создай его.",
      bad_password: "Неверный пароль.",
      server: "Что-то пошло не так. Попробуй ещё раз.",
      google: "Не получилось войти через Google. Попробуй ещё раз или войди по почте.",
      net: "Нет связи. Проверь интернет и попробуй снова.",
    } as Record<string, string>,
  },
  en: {
    tagline: "Your life archive",
    login: "Sign in",
    register: "Sign up",
    google: "Continue with Google",
    or: "or with email",
    email: "Email",
    password: "Password",
    name: "Name",
    namePh: "What should we call you",
    submitLogin: "Sign in",
    submitReg: "Create account",
    haveAcc: "Already have an account? Sign in",
    noAcc: "No account? Create one",
    tg: "Sign in via Telegram bot",
    about: "About",
    busy: "One moment…",
    errors: {
      invalid_email: "Check the email — looks off.",
      weak_password: "Password too short — at least 6 characters.",
      exists: "An account with this email already exists. Sign in.",
      no_user: "No account with this email. Create one.",
      bad_password: "Wrong password.",
      server: "Something went wrong. Try again.",
      google: "Couldn't sign in with Google. Try again or use email.",
      net: "No connection. Check your internet and retry.",
    } as Record<string, string>,
  },
};

export default function AuthForm({
  locale,
  botLink,
  googleEnabled,
  initialError,
}: {
  locale: string;
  botLink: string;
  googleEnabled: boolean;
  initialError?: string;
}) {
  const t = locale === "en" || locale === "fr" || locale === "es" ? T.en : T.ru;
  const ref = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("ref") : null;

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>(initialError ? t.errors.google : "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, ref }),
      });
      const data = await r.json().catch(() => ({}));
      if (data?.ok) {
        // Новый вход сбрасывает «скрытие на сессию» плашки подключения бота.
        try { sessionStorage.removeItem("cbBannerHidden"); } catch {}
        // Новичок с почты → сначала экран подключения бота (главный ввод); вход → сразу в портал.
        window.location.href = mode === "register" ? "/just-joined" : "/";
        return;
      }
      setErr(t.errors[data?.error] || t.errors.server);
    } catch {
      setErr(t.errors.net);
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 11,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    fontSize: 15,
    color: "var(--text)",
    outline: "none",
    boxSizing: "border-box",
  };

  // Вход/регистрация — своя светлая палитра (в тон лендингу /about), не зависит
  // от темы посетителя: единый светлый путь «лендинг → вход» + мягкая «аврора».
  const shell = {
    ["--bg" as any]: "#f7f8fc",
    ["--surface" as any]: "#ffffff",
    ["--surface-2" as any]: "#eef1f8",
    ["--text" as any]: "#14161c",
    ["--text-2" as any]: "#4a5261",
    ["--text-3" as any]: "#8b93a3",
    ["--border" as any]: "rgba(20,24,40,0.08)",
    ["--accent" as any]: "#5b5bf5",
    ["--accent-bg" as any]: "#edecff",
    ["--accent-text" as any]: "#4338ca",
    colorScheme: "light",
    color: "var(--text)",
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background:
      "radial-gradient(720px 420px at 18% -12%, rgba(124,92,246,0.20), transparent 60%)," +
      "radial-gradient(720px 420px at 84% -8%, rgba(91,91,245,0.16), transparent 60%)," +
      "#f7f8fc",
  } as React.CSSProperties;

  return (
    <div style={shell}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center", marginBottom: 4 }}>
          <i className="ti ti-flower" style={{ fontSize: 24, color: "var(--accent)" }} />
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>LIFE OS</span>
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", textAlign: "center", marginBottom: 22 }}>{t.tagline}</div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "26px 24px",
            boxShadow: "0 1px 2px rgba(20,24,40,.05), 0 24px 54px -28px rgba(20,24,40,.28)",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: 11, padding: 3, marginBottom: 18 }}>
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErr(""); }}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  background: mode === m ? "var(--surface)" : "transparent",
                  color: mode === m ? "var(--text)" : "var(--text-2)",
                  boxShadow: mode === m ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  transition: "all .15s",
                }}
              >
                {m === "login" ? t.login : t.register}
              </button>
            ))}
          </div>

          {googleEnabled && (
            <>
              <a
                href={`/api/auth/google/start${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 11,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: "none",
                  boxSizing: "border-box",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {t.google}
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>{t.or}</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
            </>
          )}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {mode === "register" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePh}
                autoComplete="name"
                style={inputStyle}
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.email}
              autoComplete="email"
              required
              style={inputStyle}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              style={inputStyle}
            />

            {err && <div style={{ fontSize: 12.5, color: "var(--health, #e11d48)", lineHeight: 1.4 }}>{err}</div>}

            <button
              type="submit"
              disabled={busy}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: "none",
                cursor: busy ? "default" : "pointer",
                background: "linear-gradient(135deg,#6d6bf6,#8b5cf6)",
                color: "#fff",
                fontSize: 15.5,
                fontWeight: 600,
                opacity: busy ? 0.6 : 1,
                marginTop: 4,
                boxShadow: "0 12px 26px -12px rgba(91,91,245,.55)",
              }}
            >
              {busy ? t.busy : mode === "login" ? t.submitLogin : t.submitReg}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
            style={{ width: "100%", marginTop: 14, background: "none", border: "none", color: "var(--accent)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}
          >
            {mode === "login" ? t.noAcc : t.haveAcc}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 18 }}>
          <a href={ref ? `${botLink}${botLink.includes("?") ? "&" : "?"}start=ref_${encodeURIComponent(ref)}` : botLink} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text-2)", fontSize: 13, textDecoration: "none" }}>
            <i className="ti ti-brand-telegram" style={{ fontSize: 16, color: "#229ED9" }} />
            {t.tg}
          </a>
          <ResumeSessionLink locale={locale} />
          <div style={{ display: "flex", gap: 16 }}>
            <a href="/about" style={{ color: "var(--text-3)", fontSize: 12.5, textDecoration: "none" }}>{t.about}</a>
            <a href="/privacy" style={{ color: "var(--text-3)", fontSize: 12.5, textDecoration: "none" }}>🔒 {locale === "en" || locale === "fr" || locale === "es" ? "Privacy" : "Приватность"}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
