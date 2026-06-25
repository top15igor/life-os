"use client";

import { useEffect, useState } from "react";

const STR: Record<string, any> = {
  ru: { title: "Открой как приложение", text: "Похоже, ты открыл LIFE OS внутри Telegram. Чтобы пользоваться как приложением — скопируй ссылку и открой её в Safari (а потом «Поделиться» → «На экран Домой»).", copy: "Скопировать ссылку для Safari", copied: "Скопировано ✓", close: "Скрыть" },
  en: { title: "Open it as an app", text: "Looks like you opened LIFE OS inside Telegram. To use it as an app — copy the link and open it in Safari (then Share → Add to Home Screen).", copy: "Copy link for Safari", copied: "Copied ✓", close: "Hide" },
  uk: { title: "Відкрий як застосунок", text: "Схоже, ти відкрив LIFE OS усередині Telegram. Щоб користуватися як застосунком — скопіюй посилання й відкрий його в Safari (а потім «Поділитися» → «На екран Додому»).", copy: "Скопіювати посилання для Safari", copied: "Скопійовано ✓", close: "Сховати" },
  fr: { title: "Ouvre-le comme une app", text: "Tu as ouvert LIFE OS dans Telegram. Pour l'utiliser comme une app — copie le lien et ouvre-le dans Safari (puis Partager → Sur l'écran d'accueil).", copy: "Copier le lien pour Safari", copied: "Copié ✓", close: "Masquer" },
};

export default function EnterInBrowser({ link, locale }: { link: string; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("lifeos_safari_tip") === "off") return;
      const ua = navigator.userAgent || "";
      const standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || (navigator as any).standalone;
      if (standalone) return; // уже как приложение
      const iOS = /iP(hone|ad|od)/.test(ua);
      const inApp = (iOS && /AppleWebKit/.test(ua) && !/Safari/.test(ua)) || /Telegram/i.test(ua) || /Instagram|FBAN|FBAV|Line\//i.test(ua);
      if (inApp) setShow(true);
    } catch {}
  }, []);

  if (!show || !link) return null;

  function copy() {
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {});
  }
  function dismiss() {
    try { localStorage.setItem("lifeos_safari_tip", "off"); } catch {}
    setShow(false);
  }

  return (
    <div style={{ borderRadius: 14, padding: "14px 15px", marginBottom: 16, background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <i className="ti ti-device-mobile-share" style={{ fontSize: 18, color: "var(--accent)" }} />
        <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--accent-text)" }}>{s.title}</span>
        <button onClick={dismiss} aria-label="close" style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 0 }}><i className="ti ti-x" style={{ fontSize: 17 }} /></button>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 10 }}>{s.text}</div>
      <button onClick={copy} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: copied ? "var(--positive)" : "var(--accent)", color: "#fff", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
        <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} style={{ fontSize: 15, verticalAlign: "-2px", marginRight: 5 }} />{copied ? s.copied : s.copy}
      </button>
    </div>
  );
}
