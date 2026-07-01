"use client";

import { useState } from "react";

// Спасательный вход для тех, кто УЖЕ пользуется LIFE OS через Telegram, но открыл
// сайт в Safari (где нет сессии из встроенного браузера Telegram). Человек вставляет
// свою личную ссылку из бота (сообщение «Дневник» — адрес вида …/u/<token>) и входит.
const STR: Record<string, any> = {
  ru: {
    q: "Уже заходил через Telegram?",
    hint: "Открой бота → сообщение «Дневник» → скопируй ссылку и вставь её сюда, чтобы войти в свой дневник здесь, в браузере.",
    ph: "Вставь ссылку из бота",
    go: "Войти",
    bad: "Проверь ссылку — вставь адрес из сообщения бота «Дневник».",
  },
  en: {
    q: "Already use it via Telegram?",
    hint: "Open the bot → the «Diary» message → copy the link and paste it here to sign in to your diary in this browser.",
    ph: "Paste the link from the bot",
    go: "Sign in",
    bad: "Check the link — paste the address from the bot's «Diary» message.",
  },
};

export default function ResumeSessionLink({ locale }: { locale: string }) {
  const s = STR[locale] || STR.ru;
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");

  function go() {
    const raw = val.trim();
    // Достаём токен из вставленного адреса (…/u/<token>) или принимаем сам токен.
    const m = raw.match(/\/u\/([A-Za-z0-9_-]{6,})/);
    const token = m ? m[1] : /^[A-Za-z0-9_-]{6,}$/.test(raw) ? raw : "";
    if (!token) { setErr(s.bad); return; }
    window.location.href = `/u/${token}`;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>
        {s.q}
      </button>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 340, marginTop: 2 }}>
      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 8 }}>{s.hint}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={val}
          onChange={(e) => { setVal(e.target.value); setErr(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") go(); }}
          placeholder={s.ph}
          autoFocus
          style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 10, border: `1px solid ${err ? "#ef4444" : "var(--border)"}`, background: "var(--bg)", fontSize: 13.5, color: "var(--text)", boxSizing: "border-box" }}
        />
        <button onClick={go} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13.5, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>{s.go}</button>
      </div>
      {err && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{err}</div>}
    </div>
  );
}
