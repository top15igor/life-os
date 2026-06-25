"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const REC: Record<string, any> = {
  ru: { rec: "Идёт запись", transcribing: "Распознаю голос…", mic: "Записать голосом", stop: "Стоп", denied: "Нет доступа к микрофону. Разреши его в настройках браузера." },
  en: { rec: "Recording", transcribing: "Transcribing…", mic: "Record by voice", stop: "Stop", denied: "No microphone access. Allow it in your browser settings." },
  uk: { rec: "Триває запис", transcribing: "Розпізнаю голос…", mic: "Записати голосом", stop: "Стоп", denied: "Немає доступу до мікрофона. Дозволь його в налаштуваннях браузера." },
  fr: { rec: "Enregistrement", transcribing: "Transcription…", mic: "Enregistrer à la voix", stop: "Stop", denied: "Pas d'accès au micro. Autorise-le dans les réglages du navigateur." },
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
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const router = useRouter();
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/entry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      if (res.ok) { setText(""); router.refresh(); }
    } finally {
      setBusy(false);
    }
  }

  async function startRec() {
    if (busy || recording) return;
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
      if (res.ok && j?.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ border: "1px solid var(--border)", borderRadius: 13, padding: "12px 15px", marginBottom: 18 }}>
      <style>{`@keyframes qapulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>

      {recording ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 2px" }}>
          <span style={{ width: 11, height: 11, borderRadius: 99, background: "#ef4444", animation: "qapulse 1s ease-in-out infinite", flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: "var(--text)" }}>{r.rec}</span>
          <span style={{ fontSize: 14, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>{mmss(seconds)}</span>
          <button type="button" onClick={stopRec} style={{ marginLeft: "auto", fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer", background: "#ef4444", color: "#fff", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-player-stop-filled" style={{ fontSize: 14 }} />{r.stop}
          </button>
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={busy ? r.transcribing : placeholder}
          rows={2}
          disabled={busy}
          style={{ width: "100%", border: "none", outline: "none", resize: "vertical", background: "transparent", color: "var(--text)", fontSize: 14, fontFamily: "inherit", lineHeight: 1.5 }}
        />
      )}

      {!recording && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <i className="ti ti-brand-telegram" style={{ fontSize: 15, color: "var(--text-3)" }} />
          <span style={{ fontSize: 11.5, color: "var(--text-3)", flex: 1 }}>{hint}</span>
          <button type="button" onClick={startRec} disabled={busy} title={r.mic} aria-label={r.mic} style={{ width: 36, height: 36, borderRadius: 99, border: "1px solid var(--border)", background: "var(--surface)", color: busy ? "var(--text-3)" : "var(--accent)", cursor: busy ? "default" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="ti ti-microphone" style={{ fontSize: 18 }} />
          </button>
          <button type="submit" disabled={busy || !text.trim()} style={{ fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: 9, border: "none", cursor: busy ? "default" : "pointer", background: "var(--accent)", color: "#fff", opacity: busy || !text.trim() ? 0.6 : 1 }}>
            {busy ? saving : button}
          </button>
        </div>
      )}
    </form>
  );
}
