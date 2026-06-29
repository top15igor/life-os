"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DictationHints from "./DictationHints";

type Msg = { role: "user" | "assistant"; content: string };

const STR: Record<string, any> = {
  ru: {
    ph: "Запиши событие или спроси друга…", phChat: "Напиши другу…",
    write: "Записать", chat: "Поболтать", saved: "Записано", open: "Открыть запись →",
    thinking: "Думаю…", err: "Связь сорвалась, скажи ещё раз 🙂",
    intro: "Привет! Я твой друг — знаю про тебя всё из дневника и заглядываю в интернет за свежим. О чём поговорим?",
    note: "Память общая с Telegram — можно продолжить там же.",
    mic: "Сказать голосом", stop: "Остановить", collapse: "Свернуть чат",
    showAll: (n: number) => `↑ Показать всю переписку (${n})`,
  },
  en: {
    ph: "Note an event or ask your friend…", phChat: "Message your friend…",
    write: "Note", chat: "Chat", saved: "Saved", open: "Open entry →",
    thinking: "Thinking…", err: "Connection dropped, say it again 🙂",
    intro: "Hi! I'm your friend — I know all about you from your diary and check the web for fresh facts. What's up?",
    note: "Memory is shared with Telegram — continue there anytime.",
    mic: "Speak", stop: "Stop", collapse: "Collapse chat",
    showAll: (n: number) => `↑ Show full conversation (${n})`,
  },
  uk: {
    ph: "Запиши подію або запитай друга…", phChat: "Напиши другу…",
    write: "Записати", chat: "Поспілкуватись", saved: "Збережено", open: "Відкрити запис →",
    thinking: "Думаю…", err: "Зв'язок обірвався, скажи ще раз 🙂",
    intro: "Привіт! Я твій друг — знаю про тебе все зі щоденника і заглядаю в інтернет за свіжим. Про що поговоримо?",
    note: "Пам'ять спільна з Telegram — можна продовжити там.",
    mic: "Сказати голосом", stop: "Зупинити", collapse: "Згорнути чат",
    showAll: (n: number) => `↑ Показати всю переписку (${n})`,
  },
  fr: {
    ph: "Note un événement ou demande à ton ami…", phChat: "Écris à ton ami…",
    write: "Noter", chat: "Discuter", saved: "Enregistré", open: "Ouvrir l'entrée →",
    thinking: "Je réfléchis…", err: "Connexion perdue, redis-le 🙂",
    intro: "Salut ! Je suis ton ami — je sais tout de toi via ton journal et je consulte le web. De quoi parle-t-on ?",
    note: "La mémoire est partagée avec Telegram — continue là-bas quand tu veux.",
    mic: "Parler", stop: "Arrêter", collapse: "Réduire le chat",
    showAll: (n: number) => `↑ Voir toute la conversation (${n})`,
  },
};

export default function CaptureChat({ locale = "ru" }: { qa?: any; locale?: string }) {
  const s = STR[locale] || STR.ru;
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState<{ id?: string } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const savedTimer = useRef<any>(null);

  // Восстановить «активный» чат + реагировать на «Вопрос для книги» (зовёт в запись).
  useEffect(() => {
    try { if (localStorage.getItem("lifeos_chat_open") === "1") openChat(); } catch {}
    const h = () => { setChatOpen(false); try { localStorage.setItem("lifeos_chat_open", "0"); } catch {} setTimeout(() => taRef.current?.focus(), 30); };
    window.addEventListener("lifeos-open-capture", h);
    return () => window.removeEventListener("lifeos-open-capture", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatOpen) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, chatOpen]);

  async function loadHistory() {
    if (loaded) return;
    setLoaded(true);
    try {
      const r = await fetch("/api/companion");
      const d = await r.json().catch(() => null);
      if (Array.isArray(d?.messages)) setMsgs(d.messages);
    } catch {}
  }

  function openChat() {
    setChatOpen(true);
    try { localStorage.setItem("lifeos_chat_open", "1"); } catch {}
    loadHistory();
  }
  function closeChat() {
    setChatOpen(false);
    try { localStorage.setItem("lifeos_chat_open", "0"); } catch {}
  }

  async function saveEntry() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/entry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t }) });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok) {
        setText("");
        setSaved({ id: d.id });
        router.refresh();
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaved(null), 10000);
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendChat(raw?: string) {
    const m = (raw ?? text).trim();
    if (!m || busy) return;
    if (!chatOpen) openChat();
    setText("");
    setMsgs((p) => [...p, { role: "user", content: m }]);
    setBusy(true);
    try {
      const r = await fetch("/api/companion", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: m }) });
      const d = await r.json().catch(() => null);
      setMsgs((p) => [...p, { role: "assistant", content: d?.answer || s.err }]);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", content: s.err }]);
    }
    setBusy(false);
  }

  async function toggleMic() {
    if (recording) { try { mediaRef.current?.stop(); } catch {} return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : blob.type.includes("webm") ? "webm" : "m4a";
        const fd = new FormData();
        fd.append("audio", blob, `voice.${ext}`);
        setBusy(true);
        try {
          const r = await fetch("/api/transcribe", { method: "POST", body: fd });
          const d = await r.json().catch(() => null);
          if (d?.text) { setText((prev) => (prev ? prev + " " : "") + d.text); setTimeout(() => taRef.current?.focus(), 20); }
        } catch {}
        setBusy(false);
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      // нет доступа к микрофону
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatOpen) sendChat();
      else saveEntry();
    }
  }

  const shown = showAll ? msgs : msgs.slice(-2);
  const canSend = !!text.trim() && !busy;

  const bar = (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-end", gap: 8, border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface-2)", padding: "9px 12px" }}>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={chatOpen ? s.phChat : s.ph}
          rows={1}
          disabled={busy && recording}
          style={{ flex: 1, border: "none", outline: "none", resize: "none", background: "transparent", color: "var(--text)", fontSize: 14, fontFamily: "inherit", lineHeight: 1.5, maxHeight: 120 }}
        />
        <button onClick={toggleMic} aria-label={recording ? s.stop : s.mic} title={recording ? s.stop : s.mic}
          style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: recording ? "#ef4444" : "var(--accent)", padding: 0, display: "inline-flex" }}>
          <i className={`ti ${recording ? "ti-player-stop-filled" : "ti-microphone"}`} style={{ fontSize: 19 }} />
        </button>
      </div>

      <button onClick={saveEntry} disabled={!canSend} title={s.write}
        style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, padding: "9px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: canSend ? "var(--text)" : "var(--text-3)", fontSize: 13, fontWeight: 500, cursor: canSend ? "pointer" : "default", whiteSpace: "nowrap" }}>
        <i className="ti ti-pencil" style={{ fontSize: 16 }} /><span className="cc-lbl">{s.write}</span>
      </button>

      {chatOpen ? (
        <button onClick={() => sendChat()} disabled={!canSend} aria-label={s.chat}
          style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, border: "none", background: canSend ? "var(--accent)" : "var(--surface-2)", color: canSend ? "#fff" : "var(--text-3)", cursor: canSend ? "pointer" : "default", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-arrow-up" style={{ fontSize: 18 }} />
        </button>
      ) : (
        <button onClick={() => { if (text.trim()) sendChat(); else openChat(); }} title={s.chat}
          style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, padding: "9px 13px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
          <i className="ti ti-message-circle" style={{ fontSize: 16 }} /><span className="cc-lbl">{s.chat}</span>
        </button>
      )}
    </div>
  );

  return (
    <div style={{ marginBottom: 16 }}>
      {chatOpen && (
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 12.5, color: "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-message-circle" style={{ fontSize: 15, color: "var(--accent)" }} />AI-друг
            </span>
            <button onClick={closeChat} aria-label={s.collapse} title={s.collapse} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2 }}>
              <i className="ti ti-x" style={{ fontSize: 17 }} />
            </button>
          </div>
          <div ref={scrollRef} style={{ maxHeight: 340, minHeight: 120, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.length === 0 && <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5, padding: "6px 2px" }}>{s.intro}</div>}
            {!showAll && msgs.length > 2 && (
              <button onClick={() => setShowAll(true)} style={{ alignSelf: "center", background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 12.5, fontWeight: 500 }}>
                {s.showAll(msgs.length - 2)}
              </button>
            )}
            {shown.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", padding: "9px 13px", borderRadius: 14, fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", background: m.role === "user" ? "var(--accent)" : "var(--surface-2)", color: m.role === "user" ? "#fff" : "var(--text)" }}>
                {m.content}
              </div>
            ))}
            {busy && !recording && (
              <div style={{ alignSelf: "flex-start", padding: "9px 13px", borderRadius: 14, fontSize: 13.5, color: "var(--text-3)", background: "var(--surface-2)", display: "inline-flex", alignItems: "center", gap: 7 }}>
                <i className="ti ti-loader-2 spin" style={{ fontSize: 15 }} />{s.thinking}
              </div>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", padding: "6px 12px 9px", display: "flex", alignItems: "center", gap: 5, borderTop: "1px solid var(--border)" }}>
            <i className="ti ti-brand-telegram" style={{ fontSize: 13 }} />{s.note}
          </div>
        </div>
      )}

      {bar}

      {saved && !chatOpen && (
        <div style={{ marginTop: 8, fontSize: 13, color: "var(--positive)", display: "inline-flex", alignItems: "center", gap: 7 }}>
          <i className="ti ti-circle-check" style={{ fontSize: 16 }} />{s.saved}
          {saved.id && <Link href={`/entry/${saved.id}`} style={{ color: "var(--accent)", fontWeight: 500 }}>{s.open}</Link>}
        </div>
      )}

      {!chatOpen && <DictationHints locale={locale} />}
    </div>
  );
}
