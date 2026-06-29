"use client";

import { useState, useEffect, useRef } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const STR: Record<string, any> = {
  ru: {
    intro: "Привет! Я твой друг — знаю про тебя всё из дневника и заглядываю в интернет за свежим. О чём поговорим?",
    ph: "Напиши другу…",
    note: "Память общая с Telegram — можно продолжить там же.",
    thinking: "Думаю…",
    mic: "Сказать голосом",
    stop: "Остановить",
    err: "Связь сорвалась, скажи ещё раз 🙂",
    showAll: (n: number) => `↑ Показать всю переписку (${n})`,
  },
  en: {
    intro: "Hi! I'm your friend — I know all about you from your diary and I check the web for fresh facts. What's on your mind?",
    ph: "Message your friend…",
    note: "Memory is shared with Telegram — continue there anytime.",
    thinking: "Thinking…",
    mic: "Speak",
    stop: "Stop",
    err: "Connection dropped, say it again 🙂",
  },
  uk: {
    intro: "Привіт! Я твій друг — знаю про тебе все зі щоденника і заглядаю в інтернет за свіжим. Про що поговоримо?",
    ph: "Напиши другу…",
    note: "Пам'ять спільна з Telegram — можна продовжити там.",
    thinking: "Думаю…",
    mic: "Сказати голосом",
    stop: "Зупинити",
    err: "Зв'язок обірвався, скажи ще раз 🙂",
  },
  fr: {
    intro: "Salut ! Je suis ton ami — je sais tout de toi via ton journal et je consulte le web pour les infos fraîches. De quoi parle-t-on ?",
    ph: "Écris à ton ami…",
    note: "La mémoire est partagée avec Telegram — continue là-bas quand tu veux.",
    thinking: "Je réfléchis…",
    mic: "Parler",
    stop: "Arrêter",
    err: "Connexion perdue, redis-le 🙂",
  },
};

export default function CompanionChat({ locale = "ru" }: { locale?: string }) {
  const s = STR[locale] || STR.ru;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/companion");
        const d = await r.json().catch(() => null);
        if (Array.isArray(d?.messages)) setMsgs(d.messages);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send(raw?: string) {
    const m = (raw ?? text).trim();
    if (!m || busy) return;
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
    if (recording) {
      try { mediaRef.current?.stop(); } catch {}
      return;
    }
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
          setBusy(false);
          if (d?.text) await send(d.text);
        } catch {
          setBusy(false);
        }
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      // нет доступа к микрофону — тихо игнорируем
    }
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div ref={scrollRef} style={{ maxHeight: 380, minHeight: 160, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.length === 0 && (
          <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5, padding: "8px 2px" }}>{s.intro}</div>
        )}
        {!showAll && msgs.length > 2 && (
          <button onClick={() => setShowAll(true)} style={{ alignSelf: "center", background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 12.5, fontWeight: 500, padding: "2px 0" }}>
            {(s.showAll || STR.ru.showAll)(msgs.length - 2)}
          </button>
        )}
        {(showAll ? msgs : msgs.slice(-2)).map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", padding: "9px 13px", borderRadius: 14, fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", background: m.role === "user" ? "var(--accent)" : "var(--surface-2)", color: m.role === "user" ? "#fff" : "var(--text)" }}>
            {m.content}
          </div>
        ))}
        {busy && (
          <div style={{ alignSelf: "flex-start", padding: "9px 13px", borderRadius: 14, fontSize: 13.5, color: "var(--text-3)", background: "var(--surface-2)", display: "inline-flex", alignItems: "center", gap: 7 }}>
            <i className="ti ti-loader-2 spin" style={{ fontSize: 15 }} />{s.thinking}
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", padding: 10, display: "flex", alignItems: "flex-end", gap: 8 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={s.ph}
          rows={1}
          style={{ flex: 1, border: "none", outline: "none", resize: "none", background: "transparent", color: "var(--text)", fontSize: 14, fontFamily: "inherit", lineHeight: 1.5, maxHeight: 110, padding: "7px 4px" }}
        />
        <button onClick={toggleMic} aria-label={recording ? s.stop : s.mic} title={recording ? s.stop : s.mic}
          style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 999, border: "none", cursor: "pointer", background: recording ? "#ef4444" : "var(--surface-2)", color: recording ? "#fff" : "var(--text-2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <i className={`ti ${recording ? "ti-player-stop" : "ti-microphone"}`} style={{ fontSize: 18 }} />
        </button>
        <button onClick={() => send()} disabled={busy || !text.trim()} aria-label="send"
          style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 999, border: "none", cursor: busy || !text.trim() ? "default" : "pointer", background: busy || !text.trim() ? "var(--surface-2)" : "var(--accent)", color: busy || !text.trim() ? "var(--text-3)" : "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-arrow-up" style={{ fontSize: 18 }} />
        </button>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", padding: "0 12px 10px", display: "flex", alignItems: "center", gap: 5 }}>
        <i className="ti ti-brand-telegram" style={{ fontSize: 13 }} />{s.note}
      </div>
    </div>
  );
}
