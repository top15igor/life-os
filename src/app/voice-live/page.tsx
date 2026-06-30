"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Live voice conversation with the AI-friend (OpenAI Realtime over WebRTC).
// Loaded inside the native app's WebView at /voice-live?k=<session token>, but
// also works standalone in a browser (cookie session).
//
// Flow: GET /api/realtime-token (mints an ephemeral key) -> WebRTC offer/answer
// with OpenAI -> mic streams up, voice streams down. Barge-in (interruptions)
// is handled by the model's server-side VAD configured in the session.

type Status = "idle" | "connecting" | "live" | "ended" | "error";

export default function VoiceLivePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [speaking, setSpeaking] = useState(false); // assistant is talking
  const [errorMsg, setErrorMsg] = useState<string>("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanup = useCallback(() => {
    try { pcRef.current?.getSenders().forEach((s) => s.track?.stop()); } catch {}
    try { pcRef.current?.close(); } catch {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    pcRef.current = null;
    streamRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async () => {
    setErrorMsg("");
    setStatus("connecting");
    try {
      // 1) Ephemeral token (+ which model to use).
      const k = new URLSearchParams(window.location.search).get("k");
      const tokRes = await fetch(`/api/realtime-token${k ? `?k=${encodeURIComponent(k)}` : ""}`);
      const tok = await tokRes.json();
      if (!tok?.ok || !tok?.value) {
        throw new Error(tok?.detail || tok?.error || "Не удалось получить доступ");
      }

      // 2) WebRTC peer + remote audio playback.
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audioEl = audioRef.current!;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // 3) Microphone up.
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = ms;
      ms.getTracks().forEach((t) => pc.addTrack(t, ms));

      // 4) Events channel — drives the "speaking/listening" UI.
      const dc = pc.createDataChannel("oai-events");
      dc.onmessage = (e) => {
        try {
          const ev = JSON.parse(e.data);
          if (ev.type === "response.audio.delta" || ev.type === "output_audio_buffer.started") {
            setSpeaking(true);
          } else if (
            ev.type === "response.done" ||
            ev.type === "output_audio_buffer.stopped" ||
            ev.type === "response.audio.done"
          ) {
            setSpeaking(false);
          } else if (ev.type === "input_audio_buffer.speech_started") {
            // user started talking — barge-in, model will stop on its own
            setSpeaking(false);
          }
        } catch {}
      };

      // 5) Offer/answer SDP exchange with OpenAI.
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // GA WebRTC endpoint is /v1/realtime/calls; older API used /v1/realtime.
      // Try GA first, fall back so we survive either API version.
      const sdpHeaders = {
        Authorization: `Bearer ${tok.value}`,
        "Content-Type": "application/sdp",
      };
      const model = encodeURIComponent(tok.model);
      let sdpRes = await fetch(`https://api.openai.com/v1/realtime/calls?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: sdpHeaders,
      });
      if (sdpRes.status === 404) {
        sdpRes = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
          method: "POST",
          body: offer.sdp,
          headers: sdpHeaders,
        });
      }
      if (!sdpRes.ok) throw new Error("Не удалось соединиться с голосовым сервисом");
      const answer = { type: "answer" as RTCSdpType, sdp: await sdpRes.text() };
      await pc.setRemoteDescription(answer);

      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        if (st === "connected") setStatus("live");
        else if (st === "failed" || st === "disconnected" || st === "closed") {
          setStatus((s) => (s === "ended" ? s : "error"));
        }
      };
      setStatus("live");
    } catch (err: any) {
      setErrorMsg(String(err?.message || err) || "Ошибка");
      setStatus("error");
      cleanup();
    }
  }, [cleanup]);

  const end = useCallback(() => {
    cleanup();
    setSpeaking(false);
    setStatus("ended");
  }, [cleanup]);

  const label =
    status === "connecting"
      ? "Соединяюсь…"
      : status === "live"
      ? speaking
        ? "Говорит…"
        : "Слушаю тебя…"
      : status === "ended"
      ? "Разговор завершён"
      : status === "error"
      ? "Не получилось"
      : "Готов поговорить";

  return (
    <div style={S.wrap}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} autoPlay />

      <div style={{ ...S.orb, ...(status === "live" ? (speaking ? S.orbSpeak : S.orbListen) : {}) }} />

      <div style={S.label}>{label}</div>
      {status === "error" && errorMsg ? <div style={S.err}>{errorMsg}</div> : null}

      <div style={S.controls}>
        {status === "live" ? (
          <button style={{ ...S.btn, ...S.btnEnd }} onClick={end}>Завершить</button>
        ) : status === "connecting" ? (
          <button style={{ ...S.btn, opacity: 0.6 }} disabled>Соединяюсь…</button>
        ) : (
          <button style={{ ...S.btn, ...S.btnStart }} onClick={start}>
            {status === "idle" ? "Начать разговор" : "Поговорить ещё"}
          </button>
        )}
      </div>

      <div style={S.hint}>Говори свободно — можешь перебивать в любой момент.</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    background: "#0f1115",
    color: "#f2f3f5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    padding: 24,
    fontFamily: "-apple-system, system-ui, sans-serif",
    textAlign: "center",
  },
  orb: {
    width: 160,
    height: 160,
    borderRadius: "50%",
    background: "radial-gradient(circle at 35% 35%, #6f9bff, #3358cc)",
    transition: "transform .25s ease, box-shadow .25s ease",
    boxShadow: "0 0 0 0 rgba(91,140,255,0.4)",
  },
  orbListen: { transform: "scale(1.0)", boxShadow: "0 0 60px 8px rgba(91,140,255,0.35)" },
  orbSpeak: { transform: "scale(1.12)", boxShadow: "0 0 90px 18px rgba(91,140,255,0.55)" },
  label: { fontSize: 22, fontWeight: 700 },
  err: { color: "#ff6b6b", fontSize: 14, maxWidth: 320 },
  controls: { marginTop: 8 },
  btn: {
    border: "none",
    borderRadius: 28,
    padding: "16px 32px",
    fontSize: 17,
    fontWeight: 700,
    color: "#fff",
  },
  btnStart: { background: "#5b8cff" },
  btnEnd: { background: "#d64545" },
  hint: { color: "#9aa0aa", fontSize: 14, maxWidth: 300 },
};
