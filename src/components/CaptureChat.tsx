"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Msg = { role: "user" | "assistant"; content: string };

// Лёгкий markdown в ответах друга: **жирный** → <b>. Переносы строк сохраняет pre-wrap.
function fmt(t: string): any {
  return t.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 === 1 ? <b key={i}>{part}</b> : part));
}

const Avatar = () => (
  <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 999, background: "var(--accent-bg)", color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
    <i className="ti ti-sparkles" style={{ fontSize: 14 }} />
  </span>
);

const STR: Record<string, any> = {
  ru: {
    ph: "Запиши событие или спроси AI-друга…", phChat: "Спроси своего AI-друга…",
    write: "Записать", chat: "AI-друг", saved: "Записано", open: "Открыть запись →", openRem: "Открыть напоминания →",
    thinking: "Думаю…", err: "Связь сорвалась, скажи ещё раз 🙂",
    intro: "Привет! Я твой AI-друг — знаю про тебя всё из дневника и заглядываю в интернет за свежим. О чём поговорим?",
    note: "Память общая с Telegram — можно продолжить там же.",
    mic: "Сказать голосом", stop: "Остановить", collapse: "Свернуть чат",
    tipWrite: "Сохранить мысль в дневник", tipChat: "Спроси AI-друга — он знает всё о тебе и заглядывает в интернет за свежим", tipSend: "Отправить",
    reply: "Ответь голосом или текстом…", micChat: "Скажи голосом — так быстрее",
    showAll: (n: number) => `↑ Показать всю переписку (${n})`,
  },
  en: {
    ph: "Note an event or ask your AI friend…", phChat: "Ask your AI friend…",
    write: "Note", chat: "AI friend", saved: "Saved", open: "Open entry →", openRem: "Open reminders →",
    thinking: "Thinking…", err: "Connection dropped, say it again 🙂",
    intro: "Hi! I'm your AI friend — I know all about you from your diary and check the web for fresh facts. What's up?",
    note: "Memory is shared with Telegram — continue there anytime.",
    mic: "Speak", stop: "Stop", collapse: "Collapse chat",
    tipWrite: "Save a thought to your diary", tipChat: "Ask your AI friend — it knows all about you and checks the web", tipSend: "Send",
    reply: "Reply by voice or text…", micChat: "Speak — it's faster",
    showAll: (n: number) => `↑ Show full conversation (${n})`,
  },
  uk: {
    ph: "Запиши подію або запитай AI-друга…", phChat: "Запитай свого AI-друга…",
    write: "Записати", chat: "AI-друг", saved: "Збережено", open: "Відкрити запис →", openRem: "Відкрити нагадування →",
    thinking: "Думаю…", err: "Зв'язок обірвався, скажи ще раз 🙂",
    intro: "Привіт! Я твій AI-друг — знаю про тебе все зі щоденника і заглядаю в інтернет за свіжим. Про що поговоримо?",
    note: "Пам'ять спільна з Telegram — можна продовжити там.",
    mic: "Сказати голосом", stop: "Зупинити", collapse: "Згорнути чат",
    tipWrite: "Зберегти думку у щоденник", tipChat: "Запитай AI-друга — він знає все про тебе і заглядає в інтернет", tipSend: "Надіслати",
    reply: "Відповідай голосом або текстом…", micChat: "Скажи голосом — так швидше",
    showAll: (n: number) => `↑ Показати всю переписку (${n})`,
  },
  fr: {
    ph: "Note un événement ou demande à ton ami IA…", phChat: "Demande à ton ami IA…",
    write: "Noter", chat: "Ami IA", saved: "Enregistré", open: "Ouvrir l'entrée →", openRem: "Ouvrir les rappels →",
    thinking: "Je réfléchis…", err: "Connexion perdue, redis-le 🙂",
    intro: "Salut ! Je suis ton ami IA — je sais tout de toi via ton journal et je consulte le web. De quoi parle-t-on ?",
    note: "La mémoire est partagée avec Telegram — continue là-bas quand tu veux.",
    mic: "Parler", stop: "Arrêter", collapse: "Réduire le chat",
    tipWrite: "Enregistrer dans ton journal", tipChat: "Demande à ton ami IA — il sait tout de toi et consulte le web", tipSend: "Envoyer",
    reply: "Réponds à la voix ou au texte…", micChat: "Parle — c'est plus rapide",
    showAll: (n: number) => `↑ Voir toute la conversation (${n})`,
  },
};

export default function CaptureChat({ locale = "ru" }: { qa?: any; locale?: string }) {
  const s = STR[locale] || STR.ru;
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [recSrc, setRecSrc] = useState<null | "bar" | "reply">(null);
  const [saved, setSaved] = useState<{ id?: string; msg?: string; href?: string; reaction?: string } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const recording = recSrc !== null;

  const taRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const savedTimer = useRef<any>(null);

  // Сообщить серверу таймзону (минуты к UTC) — чтобы записи из бота тоже были по местному.
  useEffect(() => {
    try {
      fetch("/api/tz", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ offset: -new Date().getTimezoneOffset() }) });
    } catch {}
  }, []);

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

  // Авто-рост поля ввода: высота подстраивается под текст (до 140px, дальше прокрутка),
  // чтобы было видно всё написанное, а не одну строку. Срабатывает и при наборе,
  // и при заполнении голосом, и при очистке.
  function autosize(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }
  useEffect(() => { autosize(taRef.current); }, [text, chatOpen]);
  useEffect(() => { autosize(replyRef.current); }, [replyText, replyOpen]);

  async function loadHistory() {
    if (loaded) return;
    setLoaded(true);
    try {
      const r = await fetch("/api/companion");
      const d = await r.json().catch(() => null);
      // Подмешиваем историю ПЕРЕД локальными (только что отправленными) репликами,
      // чтобы не затереть оптимистично добавленное сообщение пользователя.
      if (Array.isArray(d?.messages)) setMsgs((prev) => [...d.messages, ...prev]);
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

  // Reminder voice/text command: "напомни …" -> create a reminder instead of an entry.
  const REMIND_RE = /^\s*(напомни|напоминай|нагадай|нагадуй|remind|rappelle)/i;

  async function saveEntry() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      if (REMIND_RE.test(t)) {
        const rr = await fetch("/api/voice-command", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t }) })
          .then((x) => x.json())
          .catch(() => null);
        if (rr?.handled) {
          setText("");
          setSaved({ msg: rr.message, href: rr.openNext || "/reminders" });
          router.refresh();
          if (savedTimer.current) clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setSaved(null), 12000);
          return;
        }
        // not recognized as a reminder -> fall through to a normal entry
      }
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const r = await fetch("/api/entry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t, date, time }) });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok) {
        setText("");
        setSaved({ id: d.id, reaction: d.reaction });
        router.refresh();
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaved(null), 10000);
      }
    } finally {
      setBusy(false);
    }
  }

  // Ядро: отправить реплику другу (используется и верхней строкой, и нижним полем).
  async function postToFriend(m: string) {
    const t = m.trim();
    if (!t) return;
    if (!chatOpen) openChat();
    setMsgs((p) => [...p, { role: "user", content: t }]);
    setBusy(true);
    try {
      const r = await fetch("/api/companion", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t }) });
      const d = await r.json().catch(() => null);
      setMsgs((p) => [...p, { role: "assistant", content: d?.answer || s.err }]);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", content: s.err }]);
    }
    setBusy(false);
  }

  function sendChat() {
    const m = text.trim();
    if (!m || busy) return;
    setText("");
    postToFriend(m);
  }
  function sendReply(raw?: string) {
    const m = (raw ?? replyText).trim();
    if (!m || busy) return;
    setReplyText("");
    postToFriend(m);
  }

  // Запись голоса. src — какой микрофон, onDone — что сделать с расшифровкой
  // (верхняя строка заполняет поле; нижнее поле сразу отправляет — упор на голос).
  async function startRec(src: "bar" | "reply", onDone: (t: string) => void) {
    if (recSrc) { try { mediaRef.current?.stop(); } catch {} return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecSrc(null);
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : blob.type.includes("webm") ? "webm" : "m4a";
        const fd = new FormData();
        fd.append("audio", blob, `voice.${ext}`);
        setBusy(true);
        try {
          const r = await fetch("/api/transcribe", { method: "POST", body: fd });
          const d = await r.json().catch(() => null);
          setBusy(false);
          if (d?.text) onDone(d.text);
        } catch {
          setBusy(false);
        }
      };
      mediaRef.current = mr;
      mr.start();
      setRecSrc(src);
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

  const shown = showAll ? msgs : msgs.slice(-6);
  const canSend = !!text.trim() && !busy;

  const bar = (
    <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-end", gap: 8, border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface-2)", padding: "9px 12px", minHeight: 88 }}>
        <textarea
          ref={taRef}
          id="lifeos-capture-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={chatOpen ? s.phChat : s.ph}
          rows={1}
          disabled={busy && recording}
          style={{ flex: 1, alignSelf: "stretch", border: "none", outline: "none", resize: "none", background: "transparent", color: "var(--text)", fontSize: 14, fontFamily: "inherit", lineHeight: 1.5, overflowY: "auto" }}
        />
        <span className="cc-tip" data-tip={recSrc === "bar" ? s.stop : s.mic}>
          <button onClick={() => startRec("bar", (t) => { setText((p) => (p ? p + " " : "") + t); setTimeout(() => taRef.current?.focus(), 20); })} aria-label={recSrc === "bar" ? s.stop : s.mic}
            style={{ background: "none", border: "none", cursor: "pointer", color: recSrc === "bar" ? "#ef4444" : "var(--accent)", padding: 0, display: "inline-flex" }}>
            <i className={`ti ${recSrc === "bar" ? "ti-player-stop-filled" : "ti-microphone"}`} style={{ fontSize: 19 }} />
          </button>
        </span>
      </div>

      {/* Две кнопки в столбик; поле ввода слева тянется на их высоту. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" }}>
        <span className="cc-tip" data-tip={s.tipWrite} style={{ display: "flex" }}>
          <button onClick={saveEntry} disabled={!canSend} aria-label={s.write} className="cc-act"
            style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, height: 40, padding: "0 16px", borderRadius: 11, border: "none", background: canSend ? "var(--accent)" : "var(--surface-2)", color: canSend ? "#fff" : "var(--text-3)", fontSize: 13, fontWeight: 600, cursor: canSend ? "pointer" : "default", whiteSpace: "nowrap" }}>
            <i className="ti ti-pencil" style={{ fontSize: 16 }} /><span className="cc-lbl">{s.write}</span>
          </button>
        </span>

        {chatOpen ? (
          <span className="cc-tip cc-tip-r" data-tip={s.tipSend} style={{ display: "flex" }}>
            <button onClick={() => sendChat()} disabled={!canSend} aria-label={s.tipSend}
              style={{ flex: 1, height: 40, borderRadius: 11, border: "none", background: canSend ? "var(--accent)" : "var(--surface-2)", color: canSend ? "#fff" : "var(--text-3)", cursor: canSend ? "pointer" : "default", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-arrow-up" style={{ fontSize: 18 }} />
            </button>
          </span>
        ) : (
          <span className="cc-tip cc-tip-r" data-tip={s.tipChat} style={{ display: "flex" }}>
            <button onClick={() => sendChat()} disabled={!canSend} aria-label={s.chat} className="cc-act"
              style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, height: 40, padding: "0 14px", borderRadius: 11, border: "1px solid var(--accent)", background: "var(--surface)", color: canSend ? "var(--accent)" : "var(--text-3)", fontSize: 13, fontWeight: 500, cursor: canSend ? "pointer" : "default", whiteSpace: "nowrap", opacity: canSend ? 1 : 0.6 }}>
              <i className="ti ti-sparkles" style={{ fontSize: 16 }} /><span className="cc-lbl">{s.chat}</span>
            </button>
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: 16 }}>
      {bar}

      {chatOpen && (
        <div className="card" style={{ padding: 0, marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: 999, background: "var(--accent-bg)", color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{s.chat}</span>
            </span>
            <span className="cc-tip cc-tip-br" data-tip={s.collapse}>
              <button onClick={closeChat} aria-label={s.collapse} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2 }}>
                <i className="ti ti-x" style={{ fontSize: 17 }} />
              </button>
            </span>
          </div>
          <div ref={scrollRef} style={{ maxHeight: 340, minHeight: 120, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.length === 0 && <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5, padding: "6px 2px" }}>{s.intro}</div>}
            {!showAll && msgs.length > 6 && (
              <button onClick={() => setShowAll(true)} style={{ alignSelf: "center", background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 12.5, fontWeight: 500 }}>
                {s.showAll(msgs.length - 6)}
              </button>
            )}
            {shown.map((m, i) => (
              m.role === "user" ? (
                <div key={i} className="cc-in" style={{ alignSelf: "flex-end", display: "flex", gap: 8, maxWidth: "90%", flexDirection: "row-reverse" }}>
                  <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 999, background: "var(--accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 2, fontSize: 11, fontWeight: 600 }}>
                    <i className="ti ti-user" style={{ fontSize: 14 }} />
                  </span>
                  <div style={{ padding: "9px 13px", borderRadius: 16, borderTopRightRadius: 5, fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", background: "var(--accent)", color: "#fff" }}>
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="cc-in" style={{ alignSelf: "flex-start", display: "flex", gap: 8, maxWidth: "92%" }}>
                  <Avatar />
                  <div style={{ padding: "9px 13px", borderRadius: 16, borderTopLeftRadius: 5, fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", background: "var(--surface-2)", color: "var(--text)" }}>
                    {fmt(m.content)}
                  </div>
                </div>
              )
            ))}
            {busy && !recording && (
              <div className="cc-in" style={{ alignSelf: "flex-start", display: "flex", gap: 8, alignItems: "center" }}>
                <Avatar />
                <div style={{ padding: "12px 14px", borderRadius: 16, borderTopLeftRadius: 5, background: "var(--surface-2)" }}>
                  <span className="cc-dots"><i /><i /><i /></span>
                </div>
              </div>
            )}
          </div>
          {/* Ответ прямо здесь, внизу — не нужно подниматься к верхней строке. Упор на голос. */}
          <div style={{ borderTop: "1px solid var(--border)", padding: "10px 12px", display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, border: "1px solid var(--border)", borderRadius: 20, background: "var(--surface-2)", display: "flex", alignItems: "flex-end" }}>
              {replyOpen ? (
                <textarea ref={replyRef} value={replyText} onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  onBlur={() => { if (!replyText.trim()) setReplyOpen(false); }}
                  placeholder={s.reply} rows={1}
                  style={{ flex: 1, border: "none", outline: "none", resize: "none", background: "transparent", color: "var(--text)", fontSize: 14, fontFamily: "inherit", lineHeight: 1.5, maxHeight: 110, padding: "10px 14px" }} />
              ) : (
                <button onClick={() => { setReplyOpen(true); setTimeout(() => replyRef.current?.focus(), 20); }}
                  style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "text", color: "var(--text-3)", fontSize: 14, padding: "11px 14px" }}>{s.reply}</button>
              )}
              {replyOpen && replyText.trim() && (
                <button onClick={() => sendReply()} disabled={busy} aria-label={s.tipSend}
                  style={{ flexShrink: 0, margin: 4, width: 32, height: 32, borderRadius: 999, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="ti ti-arrow-up" style={{ fontSize: 16 }} />
                </button>
              )}
            </div>
            <span className="cc-tip cc-tip-r" data-tip={recSrc === "reply" ? s.stop : s.micChat}>
              <button onClick={() => startRec("reply", (t) => sendReply(t))} aria-label={recSrc === "reply" ? s.stop : s.micChat}
                style={{ width: 44, height: 44, borderRadius: 999, border: "none", background: recSrc === "reply" ? "#ef4444" : "var(--accent)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(79,70,229,.35)" }}>
                <i className={`ti ${recSrc === "reply" ? "ti-player-stop-filled" : "ti-microphone"}`} style={{ fontSize: 21 }} />
              </button>
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", padding: "6px 12px 9px", display: "flex", alignItems: "center", gap: 5 }}>
            <i className="ti ti-brand-telegram" style={{ fontSize: 13 }} />{s.note}
          </div>
        </div>
      )}

      {saved && !chatOpen && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, color: "var(--positive)", display: "inline-flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <i className="ti ti-circle-check" style={{ fontSize: 16 }} />
            {saved.msg ? saved.msg : s.saved}
            {saved.msg
              ? <Link href={saved.href || "/reminders"} style={{ color: "var(--accent)", fontWeight: 500 }}>{s.openRem}</Link>
              : saved.id && <Link href={`/entry/${saved.id}`} style={{ color: "var(--accent)", fontWeight: 500 }}>{s.open}</Link>}
          </div>
          {saved.reaction && (
            <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, display: "flex", gap: 6, alignItems: "flex-start" }}>
              <i className="ti ti-message-chatbot" style={{ fontSize: 15, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontStyle: "italic" }}>{saved.reaction}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
