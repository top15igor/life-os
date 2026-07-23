"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

const STR: Record<string, any> = {
  ru: { open: "Обратная связь", title: "Сообщить / Предложить", sub: "Нашли проблему или есть идея — напишите. Я читаю всё лично.", idea: "💡 Идея", bug: "🐞 Проблема", other: "💬 Другое", ph: "Ваше сообщение…", send: "Отправить", sending: "Отправляю…", thanks: "Спасибо! 🙏", thanksSub: "Я прочитаю это лично и учту.", done: "Готово" },
  en: { open: "Feedback", title: "Report / Suggest", sub: "Found a problem or have an idea — write to me. I read everything personally.", idea: "💡 Idea", bug: "🐞 Problem", other: "💬 Other", ph: "Your message…", send: "Send", sending: "Sending…", thanks: "Thank you! 🙏", thanksSub: "I'll read this personally.", done: "Done" },
  uk: { open: "Зворотний зв'язок", title: "Повідомити / Запропонувати", sub: "Знайшли проблему чи є ідея — напишіть. Я читаю все особисто.", idea: "💡 Ідея", bug: "🐞 Проблема", other: "💬 Інше", ph: "Ваше повідомлення…", send: "Надіслати", sending: "Надсилаю…", thanks: "Дякую! 🙏", thanksSub: "Я прочитаю це особисто.", done: "Готово" },
  fr: { open: "Retour", title: "Signaler / Suggérer", sub: "Un problème ou une idée — écris-moi. Je lis tout personnellement.", idea: "💡 Idée", bug: "🐞 Problème", other: "💬 Autre", ph: "Ton message…", send: "Envoyer", sending: "Envoi…", thanks: "Merci ! 🙏", thanksSub: "Je lirai cela personnellement.", done: "Fait" },
  es: { open: "Comentarios", title: "Informar / Sugerir", sub: "¿Encontraste un problema o tienes una idea? Escríbeme. Lo leo todo personalmente.", idea: "💡 Idea", bug: "🐞 Problema", other: "💬 Otro", ph: "Tu mensaje…", send: "Enviar", sending: "Enviando…", thanks: "¡Gracias! 🙏", thanksSub: "Lo leeré personalmente.", done: "Listo" },
};

export default function Feedback({ locale, variant = "sidebar" }: { locale: string; variant?: "sidebar" | "drawer" }) {
  const s = STR[locale] || STR.ru;
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("idea");
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function send() {
    if (!text.trim() || state === "sending") return;
    setState("sending");
    try {
      await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, text }) });
      setState("done");
    } catch {
      setState("idle");
    }
  }
  function close() {
    setOpen(false);
    setTimeout(() => { setState("idle"); setText(""); setKind("idea"); }, 200);
  }

  const triggerStyle: any =
    variant === "drawer"
      ? { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 12px", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", border: "none", cursor: "pointer", fontSize: 13.5, marginBottom: 14 }
      : { display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 10px", borderRadius: 9, background: "none", color: "var(--text-2)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 13, marginBottom: 10 };

  const chip = (k: string, label: string) => (
    <button
      key={k}
      onClick={() => setKind(k)}
      style={{ padding: "8px 12px", borderRadius: 999, fontSize: 13, cursor: "pointer", border: "1px solid " + (kind === k ? "var(--accent)" : "var(--border)"), background: kind === k ? "var(--accent-bg)" : "var(--surface)", color: kind === k ? "var(--accent-text)" : "var(--text-2)", fontWeight: kind === k ? 500 : 400 }}
    >
      {label}
    </button>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} style={triggerStyle}>
        <i className="ti ti-message-circle-heart" style={{ fontSize: variant === "drawer" ? 19 : 17 }} />
        <span>{s.open}</span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: "var(--bg)", borderRadius: "18px 18px 0 0", padding: "20px 20px calc(22px + env(safe-area-inset-bottom))", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}>
              {state === "done" ? (
                <div style={{ textAlign: "center", padding: "18px 0 8px" }}>
                  <div style={{ fontSize: 38, marginBottom: 8 }}>🙏</div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 5 }}>{s.thanks}</div>
                  <div style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 18 }}>{s.thanksSub}</div>
                  <button onClick={close} style={{ padding: "12px 28px", borderRadius: 12, background: "var(--accent)", color: "#fff", border: "none", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>{s.done}</button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>{s.title}</div>
                    <button onClick={close} aria-label="close" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 2 }}><i className="ti ti-x" style={{ fontSize: 20 }} /></button>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 14 }}>{s.sub}</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    {chip("idea", s.idea)}
                    {chip("bug", s.bug)}
                    {chip("other", s.other)}
                  </div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={s.ph}
                    rows={4}
                    autoFocus
                    style={{ width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 15, resize: "vertical", marginBottom: 13, fontFamily: "inherit", lineHeight: 1.5 }}
                  />
                  <button
                    onClick={send}
                    disabled={!text.trim() || state === "sending"}
                    style={{ width: "100%", padding: "13px", borderRadius: 12, background: text.trim() ? "var(--accent)" : "var(--surface-2)", color: text.trim() ? "#fff" : "var(--text-3)", border: "none", fontSize: 15, fontWeight: 500, cursor: text.trim() ? "pointer" : "default" }}
                  >
                    {state === "sending" ? s.sending : s.send}
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
