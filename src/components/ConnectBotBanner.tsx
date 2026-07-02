"use client";

import { useEffect, useState } from "react";

// Плашка-напоминалка вверху портала: показывается, пока бот не подключён
// (chat_id пустой). Ведёт на экран подключения. Скрыта в мобильном webview,
// на экране подключения и для незалогиненных (статус вернёт 401).
const HIDE_ON = ["/just-joined", "/login", "/about", "/privacy", "/welcome"];

export default function ConnectBotBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // В мобильном приложении (webview) — не показываем.
    if (document.documentElement.dataset.app === "1") return;
    const path = window.location.pathname;
    if (HIDE_ON.some((p) => path === p || path.startsWith(p + "/"))) return;
    if (sessionStorage.getItem("cbBannerHidden") === "1") return;

    let alive = true;
    fetch("/api/link-telegram/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j && j.connected === false) setShow(true); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!show) return null;

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 200, background: "#229ED9", color: "#fff", display: "flex", alignItems: "center", gap: 12, padding: "9px 16px", fontSize: 13.5 }}>
      <i className="ti ti-brand-telegram" style={{ fontSize: 19, flex: "none" }} aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
        <b style={{ fontWeight: 700 }}>Подключи Telegram-бота</b>
        <span style={{ opacity: 0.9 }}> — главный способ вести дневник: голосом на ходу.</span>
      </div>
      <a href="/just-joined" style={{ flex: "none", background: "#fff", color: "#177fb0", fontWeight: 700, fontSize: 13, textDecoration: "none", padding: "6px 13px", borderRadius: 9, whiteSpace: "nowrap" }}>
        Подключить
      </a>
      <button
        onClick={() => { sessionStorage.setItem("cbBannerHidden", "1"); setShow(false); }}
        aria-label="Скрыть"
        style={{ flex: "none", background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, lineHeight: 1, opacity: 0.85, padding: "0 2px" }}
      >
        ×
      </button>
    </div>
  );
}
