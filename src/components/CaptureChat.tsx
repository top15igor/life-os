"use client";

import { useState, useEffect } from "react";
import QuickAdd from "./QuickAdd";
import CompanionChat from "./CompanionChat";
import DictationHints from "./DictationHints";

const LBL: Record<string, { write: string; chat: string }> = {
  ru: { write: "Записать", chat: "Поболтать" },
  en: { write: "Note", chat: "Chat" },
  uk: { write: "Записати", chat: "Поспілкуватись" },
  fr: { write: "Noter", chat: "Discuter" },
};

// Поле захвата с двумя режимами: «Записать» (в дневник) и «Поболтать» (AI-друг).
// Выбранный режим запоминается (localStorage), чтобы «оставался активным».
export default function CaptureChat({ qa, locale = "ru" }: { qa: any; locale?: string }) {
  const l = LBL[locale] || LBL.ru;
  const [mode, setMode] = useState<"write" | "chat">("write");

  useEffect(() => {
    try { if (localStorage.getItem("lifeos_capture_mode") === "chat") setMode("chat"); } catch {}
    // «Вопрос для книги» зовёт в режим записи — переключаемся к полю записи.
    const h = () => set("write");
    window.addEventListener("lifeos-open-capture", h);
    return () => window.removeEventListener("lifeos-open-capture", h);
  }, []);

  function set(m: "write" | "chat") {
    setMode(m);
    try { localStorage.setItem("lifeos_capture_mode", m); } catch {}
  }

  const pill = (active: boolean): any => ({
    display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 500,
    padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer",
    background: active ? "var(--surface)" : "transparent", color: active ? "var(--text)" : "var(--text-2)",
  });

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "inline-flex", gap: 2, background: "var(--surface-2)", borderRadius: 11, padding: 3, marginBottom: 10 }}>
        <button onClick={() => set("write")} style={pill(mode === "write")}><i className="ti ti-pencil" style={{ fontSize: 16 }} />{l.write}</button>
        <button onClick={() => set("chat")} style={pill(mode === "chat")}><i className="ti ti-message-circle" style={{ fontSize: 16 }} />{l.chat}</button>
      </div>
      {mode === "write" ? (
        <>
          <QuickAdd placeholder={qa.placeholder} button={qa.button} saving={qa.saving} hint={qa.hint} locale={locale} />
          <DictationHints locale={locale} />
        </>
      ) : (
        <CompanionChat locale={locale} />
      )}
    </div>
  );
}
