"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const REC: Record<string, any> = {
  ru: { rec: "Идёт запись", transcribing: "Распознаю голос…", mic: "Записать голосом", stop: "Стоп", denied: "Нет доступа к микрофону. Разреши его в настройках браузера.", saved: "Запись сохранена", open: "Открыть запись", empty: "Ничего не расслышал — попробуй ещё раз.", compact: "Записать событие, мысль или обещание…" },
  en: { rec: "Recording", transcribing: "Transcribing…", mic: "Record by voice", stop: "Stop", denied: "No microphone access. Allow it in your browser settings.", saved: "Entry saved", open: "Open entry", empty: "Didn't catch that — try again.", compact: "Note an event, thought or promise…" },
  uk: { rec: "Триває запис", transcribing: "Розпізнаю голос…", mic: "Записати голосом", stop: "Стоп", denied: "Немає доступу до мікрофона. Дозволь його в налаштуваннях браузера.", saved: "Запис збережено", open: "Відкрити запис", empty: "Нічого не розчув — спробуй ще раз.", compact: "Записати подію, думку чи обіцянку…" },
  fr: { rec: "Enregistrement", transcribing: "Transcription…", mic: "Enregistrer à la voix", stop: "Stop", denied: "Pas d'accès au micro. Autorise-le dans les réglages du navigateur.", saved: "Entrée enregistrée", open: "Ouvrir l'entrée", empty: "Je n'ai rien entendu — réessaie.", compact: "Noter un événement, une pensée ou une promesse…" },
};

function mmss(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss < 10 ? "0" : ""}${ss}`;
}

export default function QuickAdd({
  placeholder,
  button,
  saving,
  hint,
  locale,
}: {
  placeholder: string;
  button: string;
  saving: string;
  hint: string;
  locale?: string;
}) {
  const r = REC[locale || "ru"] || REC.ru;
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<{ text: string; id?: string } | null>(null);
  const router = useRouter();
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const dismissRef = useRef<any>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  function openExpand() {
    setExpanded(true);
    setResult(null);
    setTimeout(() => taRef.current?.focus(), 30);
  }

  // «Вопрос для книги» (и другие нудж-карточки) могут раскрыть поле записи.
  useEffect(() => {
    const h = () => openExpand();
    window.addEventListener("lifeos-open-capture", h);
    return () => window.removeEventListener("lifeos-open-capture", h);
  }, []);

  function showResult(res: { text: string; id?: string }) {
    setResult(res);
    if (dismissRef.current) clearTimeout(dismissRef.current);
    dismissRef.current = setTimeout(() => setResult(null), 12000);
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim() || busy) return;
    const sent = text.trim();
    setBusy(true);
    try {
      const res = await fetch("/api/entry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: sent }) });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.ok) { setText(""); setExpanded(false); showResult({ text: sent, id: j.id }); router.refresh(); }
    } finally {
      setBusy(false);
    }
  }

  async function startRec() {
    if (busy || recording) return;
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        uploadVoice(blob);
      };
      mr.start();
      mediaRef.current = mr;
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((x) => x + 1), 1000);
    } catch {
      alert(r.denied);
    }
  }

  function stopRec() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    try { mediaRef.current?.stop(); } catch {}
  }

  async function uploadVoice(blob: Blob) {
    setBusy(true);
    try {
      const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : blob.type.includes("webm") ? "webm" : "m4a";
      const fd = new FormData();
      fd.append("audio", blob, `voice.${ext}`);
      const res = await fetch("/api/capture-voice", { method: "POST", body: fd });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.ok) { showResult({ text: j.text || "", id: j.id }); router.refresh(); }
      else alert(r.empty);
    } finally {
      setBusy(false);
    }
  }

  const open = expanded || busy || !!text;

  return (
    <form onSubmit={submit} style={{ border: "1px solid var(--border)", borderRadius: 13, padding: open || recording ? "12px 15px" : "4px 6px 4px 14px", marginBottom: 18 }}>
      <style>{`@keyframes qapulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>

      {result && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "var(--positive-bg, #ecfdf5)", border: "1px solid var(--positive)", borderRadius: 11, padding: "11px 13px", marginBottom: 10 }}>
          <i className="ti ti-circle-check-filled" style={{ fontSize: 18, color: "var(--positive)", flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{r.saved}</div>
            {result.text && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 3, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{result.text}</div>}
            {result.id && (
              <Link href={`/entry/${result.id}`} style={{ display: "inline-block", marginTop: 6, fontSize: 12.5, fontWeight: 500, color: "var(--accent)" }}>
                {r.open} →
              </Link>
            )}
          </div>
          <button type="button" onClick={() => setResult(null)} aria-label="close" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", flexShrink: 0, padding: 0 }}><i className="ti ti-x" style={{ fontSize: 16 }} /></button>
        </div>
      )}

      {recording ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 2px" }}>
          <span style={{ width: 11, height: 11, borderRadius: 99, background: "#ef4444", animation: "qapulse 1s ease-in-out infinite", flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: "var(--text)" }}>{r.rec}</span>
          <span style={{ fontSize: 14, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>{mmss(seconds)}</span>
          <button type="button" onClick={stopRec} style={{ marginLeft: "auto", fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer", background: "#ef4444", color: "#fff", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-player-stop-filled" style={{ fontSize: 14 }} />{r.stop}
          </button>
        </div>
      ) : !open ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={openExpand} style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, cursor: "text", padding: "8px 0", color: "var(--text-3)", fontSize: 14.5 }}>
            <i className="ti ti-pencil" style={{ fontSize: 16 }} />
            <span>{r.compact}</span>
          </div>
          <button type="button" onClick={startRec} title={r.mic} aria-label={r.mic} style={{ width: 34, height: 34, borderRadius: 99, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--accent)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="ti ti-microphone" style={{ fontSize: 17 }} />
          </button>
        </div>
      ) : (
        <>
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => { if (!text.trim() && !busy) setExpanded(false); }}
            placeholder={busy ? r.transcribing : placeholder}
            rows={2}
            disabled={busy}
            style={{ width: "100%", border: "none", outline: "none", resize: "vertical", background: "transparent", color: "var(--text)", fontSize: 14, fontFamily: "inherit", lineHeight: 1.5 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            {busy ? (
              <><i className="ti ti-loader-2" style={{ fontSize: 15, color: "var(--accent)" }} /><span style={{ fontSize: 12, color: "var(--text-2)", flex: 1 }}>{r.transcribing}</span></>
            ) : (
              <><i className="ti ti-brand-telegram" style={{ fontSize: 15, color: "var(--text-3)" }} /><span style={{ fontSize: 11.5, color: "var(--text-3)", flex: 1 }}>{hint}</span></>
            )}
            <button type="button" onClick={startRec} disabled={busy} title={r.mic} aria-label={r.mic} style={{ width: 36, height: 36, borderRadius: 99, border: "1px solid var(--border)", background: "var(--surface)", color: busy ? "var(--text-3)" : "var(--accent)", cursor: busy ? "default" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="ti ti-microphone" style={{ fontSize: 18 }} />
            </button>
            <button type="submit" disabled={busy || !text.trim()} style={{ fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: 9, border: "none", cursor: busy ? "default" : "pointer", background: "var(--accent)", color: "#fff", opacity: busy || !text.trim() ? 0.6 : 1 }}>
              {busy ? saving : button}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
