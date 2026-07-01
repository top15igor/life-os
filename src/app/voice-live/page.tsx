"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Live voice conversation with the AI-friend (OpenAI Realtime over WebRTC).
// Loaded inside the native app's WebView at /voice-live?k=<session token>, but
// also works standalone in a browser (cookie session).
//
// Shows live status (listening / thinking / speaking), running captions of both
// sides, and a small latency readout so we can see how fast turns are handled.

type Status = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "ended" | "error";
type Line = { id: string; role: "user" | "assistant" | "system"; text: string };

export default function VoiceLivePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [lines, setLines] = useState<Line[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [events, setEvents] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stoppedAt = useRef<number | null>(null); // when the user finished speaking
  const asstId = useRef<string | null>(null); // current assistant line being built
  const pendingUserId = useRef<string | null>(null); // user bubble awaiting its transcript
  const counter = useRef(0);
  const dcRef = useRef<RTCDataChannel | null>(null); // events channel (to send tool results)
  const callNames = useRef<Record<string, string>>({}); // call_id -> function name

  const cleanup = useCallback(() => {
    try { pcRef.current?.getSenders().forEach((s) => s.track?.stop()); } catch {}
    try { pcRef.current?.close(); } catch {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    pcRef.current = null;
    streamRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  // Keep captions scrolled to the newest line.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  // Reserve a user bubble at the moment the user stops talking, so it keeps its
  // chronological place even though the transcript text arrives later.
  const reserveUser = () => {
    const id = `u-${counter.current++}`;
    pendingUserId.current = id;
    setLines((ls) => [...ls, { id, role: "user", text: "…" }]);
  };

  const fillUser = (text: string) => {
    const id = pendingUserId.current;
    pendingUserId.current = null;
    const txt = text.trim() || "(не расслышал)";
    setLines((ls) => {
      if (id && ls.some((l) => l.id === id)) return ls.map((l) => (l.id === id ? { ...l, text: txt } : l));
      return [...ls, { id: `u-${counter.current++}`, role: "user", text: txt }];
    });
  };

  const appendAssistant = (delta: string) => {
    setLines((ls) => {
      const id = asstId.current;
      const idx = id ? ls.findIndex((l) => l.id === id) : -1;
      if (idx >= 0) {
        const copy = ls.slice();
        copy[idx] = { ...copy[idx], text: copy[idx].text + delta };
        return copy;
      }
      const newId = `a-${counter.current++}`;
      asstId.current = newId;
      return [...ls, { id: newId, role: "assistant", text: delta }];
    });
  };

  const pushSystem = (text: string) => {
    setLines((ls) => [...ls, { id: `s-${counter.current++}`, role: "system", text }]);
  };

  // Execute a tool the model requested (set_reminder, add_task, …) on the server,
  // then hand the result back so the model can confirm it aloud.
  const runVoiceAction = async (callId: string, name: string, argsJson: string) => {
    let args: any = {};
    try { args = JSON.parse(argsJson || "{}"); } catch {}
    const k = new URLSearchParams(window.location.search).get("k");
    let resultText = "Готово";
    try {
      const r = await fetch(`/api/voice-action${k ? `?k=${encodeURIComponent(k)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, arguments: args }),
      });
      const d = await r.json().catch(() => null);
      resultText = d?.result || (d?.ok ? "Готово" : "Не получилось выполнить");
    } catch {
      resultText = "Не получилось выполнить";
    }
    pushSystem(`✓ ${resultText}`);
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") {
      dc.send(JSON.stringify({
        type: "conversation.item.create",
        item: { type: "function_call_output", call_id: callId, output: resultText },
      }));
      dc.send(JSON.stringify({ type: "response.create" }));
    }
  };

  const handleEvent = useCallback((ev: any) => {
    setEvents((n) => n + 1);
    const t = ev?.type as string;
    if (!t) return;
    // Visible in browser devtools — lets us trace the turn-by-turn event flow.
    if (typeof console !== "undefined") console.log("[voice]", t);

    // User started/stopped talking (server VAD).
    if (t === "input_audio_buffer.speech_started") {
      setStatus("listening");
    } else if (t === "input_audio_buffer.speech_stopped") {
      stoppedAt.current = performance.now();
      reserveUser(); // place the user's bubble now; fill text when it arrives
      setStatus("thinking");
    }
    // The model began a response.
    else if (t === "response.created") {
      asstId.current = null;
      setStatus("thinking");
    }
    // User's speech transcribed (caption) — fills the reserved bubble in place.
    else if (t === "conversation.item.input_audio_transcription.completed") {
      fillUser(ev.transcript || "");
    }
    // The model wants to run a tool — remember its name by call_id.
    else if (t === "response.output_item.added" && ev.item?.type === "function_call") {
      if (ev.item.call_id && ev.item.name) callNames.current[ev.item.call_id] = ev.item.name;
    }
    // Tool arguments are complete — execute the action, then feed the result back.
    else if (t === "response.function_call_arguments.done") {
      const name = ev.name || callNames.current[ev.call_id];
      if (name) {
        setStatus("thinking");
        runVoiceAction(ev.call_id, name, ev.arguments || "{}");
      }
    }
    // Assistant's spoken words streaming in (caption) — names vary by API version.
    else if (
      t === "response.output_audio_transcript.delta" ||
      t === "response.audio_transcript.delta"
    ) {
      if (stoppedAt.current != null && latency == null) {
        setLatency(Math.round(performance.now() - stoppedAt.current));
      }
      setStatus("speaking");
      appendAssistant(ev.delta || "");
    } else if (t === "response.audio.delta" || t === "output_audio_buffer.started") {
      if (stoppedAt.current != null && latency == null) {
        setLatency(Math.round(performance.now() - stoppedAt.current));
      }
      setStatus("speaking");
    }
    // Turn finished.
    else if (t === "response.done" || t === "response.audio.done" || t === "output_audio_buffer.stopped") {
      asstId.current = null;
      stoppedAt.current = null;
      setLatency(null);
      setStatus((s) => (s === "ended" || s === "error" ? s : "listening"));
    }
  }, [latency]);

  const start = useCallback(async () => {
    setErrorMsg("");
    setLines([]);
    setLatency(null);
    setEvents(0);
    setStatus("connecting");
    try {
      const k = new URLSearchParams(window.location.search).get("k");
      const tokRes = await fetch(`/api/realtime-token${k ? `?k=${encodeURIComponent(k)}` : ""}`);
      const tok = await tokRes.json();
      if (!tok?.ok || !tok?.value) throw new Error(tok?.detail || tok?.error || "Не удалось получить доступ");

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.ontrack = (e) => { if (audioRef.current) audioRef.current.srcObject = e.streams[0]; };

      // Echo cancellation + noise suppression keep the TV in the next room (and
      // the assistant's own voice) out of the mic.
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = ms;
      ms.getTracks().forEach((track) => pc.addTrack(track, ms));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => { try { handleEvent(JSON.parse(e.data)); } catch {} };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpHeaders = { Authorization: `Bearer ${tok.value}`, "Content-Type": "application/sdp" };
      const model = encodeURIComponent(tok.model);
      let sdpRes = await fetch(`https://api.openai.com/v1/realtime/calls?model=${model}`, {
        method: "POST", body: offer.sdp, headers: sdpHeaders,
      });
      if (sdpRes.status === 404) {
        sdpRes = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
          method: "POST", body: offer.sdp, headers: sdpHeaders,
        });
      }
      if (!sdpRes.ok) throw new Error("Не удалось соединиться с голосовым сервисом");
      await pc.setRemoteDescription({ type: "answer" as RTCSdpType, sdp: await sdpRes.text() });

      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        if (st === "connected") setStatus((s) => (s === "connecting" ? "listening" : s));
        else if (st === "failed" || st === "disconnected" || st === "closed")
          setStatus((s) => (s === "ended" ? s : "error"));
      };
      setStatus("listening");
    } catch (err: any) {
      setErrorMsg(String(err?.message || err) || "Ошибка");
      setStatus("error");
      cleanup();
    }
  }, [cleanup, handleEvent]);

  const end = useCallback(() => {
    cleanup();
    setStatus("ended");
  }, [cleanup]);

  const live = status === "listening" || status === "thinking" || status === "speaking";
  const label =
    status === "connecting" ? "Соединяюсь…"
    : status === "listening" ? "Слушаю тебя…"
    : status === "thinking" ? "Думаю…"
    : status === "speaking" ? "Говорит…"
    : status === "ended" ? "Разговор завершён"
    : status === "error" ? "Не получилось"
    : "Готов поговорить";

  return (
    <div style={S.wrap}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} autoPlay />

      <div style={S.top}>
        <div
          style={{
            ...S.orb,
            ...(status === "speaking" ? S.orbSpeak : live ? S.orbListen : S.orbIdle),
          }}
        >
          {status === "thinking" && <div style={S.spinner} />}
        </div>
        <div style={S.label}>{label}</div>
        {live && (
          <div style={S.meta}>
            {latency != null ? `ответ за ${latency} мс · ` : ""}событий: {events}
          </div>
        )}
        {status === "error" && errorMsg ? <div style={S.err}>{errorMsg}</div> : null}
      </div>

      <div ref={scrollRef} style={S.transcript}>
        {lines.length === 0 && !live ? (
          <div style={S.ideas}>
            <div style={S.ideasTitle}>Можешь спросить или попросить:</div>
            {[
              "Как прошёл мой день?",
              "Что ты заметил обо мне за эту неделю?",
              "Напомни завтра в 9 позвонить маме",
              "Мне тревожно — поддержи и посоветуй",
            ].map((t) => (
              <div key={t} style={S.ideaChip}>{t}</div>
            ))}
          </div>
        ) : lines.length === 0 && live ? (
          <div style={S.placeholder}>Здесь появится расшифровка разговора…</div>
        ) : (
          lines.map((l) =>
            l.role === "system" ? (
              <div key={l.id} style={S.systemNote}>{l.text}</div>
            ) : (
              <div key={l.id} style={{ ...S.bubble, ...(l.role === "user" ? S.bubbleUser : S.bubbleAsst) }}>
                {l.text}
              </div>
            )
          )
        )}
      </div>

      <div style={S.controls}>
        {live ? (
          <button style={{ ...S.btn, ...S.btnEnd }} onClick={end}>Завершить</button>
        ) : status === "connecting" ? (
          <button style={{ ...S.btn, opacity: 0.6 }} disabled>Соединяюсь…</button>
        ) : (
          <button style={{ ...S.btn, ...S.btnStart }} onClick={start}>
            {status === "idle" ? "Начать разговор" : "Поговорить ещё"}
          </button>
        )}
        <div style={S.hint}>Говори свободно — можешь перебивать в любой момент.</div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes breathe {
          0%, 100% { transform: scale(1); box-shadow: 0 0 40px 4px rgba(91,140,255,0.25); }
          50% { transform: scale(1.06); box-shadow: 0 0 70px 12px rgba(91,140,255,0.45); }
        }
      `}</style>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    height: "100vh",
    background: "#0f1115",
    color: "#f2f3f5",
    display: "flex",
    flexDirection: "column",
    fontFamily: "-apple-system, system-ui, sans-serif",
  },
  top: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 28 },
  orb: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "radial-gradient(circle at 35% 35%, #6f9bff, #3358cc)",
    transition: "transform .25s ease, box-shadow .25s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  orbListen: { boxShadow: "0 0 50px 6px rgba(91,140,255,0.35)" },
  orbSpeak: { transform: "scale(1.1)", boxShadow: "0 0 80px 16px rgba(91,140,255,0.55)" },
  orbIdle: { animation: "breathe 3.4s ease-in-out infinite" },
  ideas: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 8 },
  ideasTitle: { color: "#7e848e", fontSize: 13, marginBottom: 4 },
  ideaChip: {
    maxWidth: "90%",
    background: "#1a1d24",
    border: "1px solid #262a33",
    color: "#d7dbe2",
    borderRadius: 18,
    padding: "10px 15px",
    fontSize: 14.5,
    textAlign: "center",
  },
  spinner: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.35)",
    borderTopColor: "#fff",
    animation: "spin 0.8s linear infinite",
  },
  label: { fontSize: 21, fontWeight: 700 },
  meta: { fontSize: 12, color: "#7e848e" },
  err: { color: "#ff6b6b", fontSize: 13, maxWidth: 320, textAlign: "center", padding: "0 16px" },
  transcript: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  placeholder: { color: "#5c626c", textAlign: "center", marginTop: 24, fontSize: 14 },
  bubble: { maxWidth: "82%", padding: "10px 13px", borderRadius: 16, fontSize: 15, lineHeight: 1.4, whiteSpace: "pre-wrap" },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "#27406e", color: "#eaf0ff" },
  bubbleAsst: { alignSelf: "flex-start", background: "#1a1d24", border: "1px solid #262a33" },
  systemNote: { alignSelf: "center", color: "#7fd18b", fontSize: 13, fontWeight: 600, padding: "4px 10px" },
  controls: { padding: "12px 16px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  btn: { border: "none", borderRadius: 26, padding: "15px 30px", fontSize: 17, fontWeight: 700, color: "#fff" },
  btnStart: { background: "#5b8cff" },
  btnEnd: { background: "#d64545" },
  hint: { color: "#7e848e", fontSize: 13, textAlign: "center", maxWidth: 300 },
};
