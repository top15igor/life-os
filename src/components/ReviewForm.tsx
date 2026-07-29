"use client";

import { useState } from "react";

// Форма отзыва: звёзды, текст, подпись и явное согласие на публикацию.
// Без согласия кнопка не работает — публиковать чужие слова молча нельзя.

type Existing = { rating: number; text: string; name: string; role: string | null; status: string } | null;

const T: Record<string, any> = {
  ru: {
    rate: "Насколько LIFE OS тебе зашёл?", ph: "Что изменилось с LIFE OS? Чем пользуешься чаще всего? Пиши своими словами — как другу.",
    name: "Как подписать", namePh: "Имя", role: "Чем занимаешься", rolePh: "например: инженер, мама в декрете — можно не заполнять",
    consent: "Разрешаю опубликовать этот отзыв и подпись на сайте LIFE OS", send: "Отправить отзыв", sending: "Отправляю…",
    okTitle: "Спасибо!", okText: "Отзыв ушёл на проверку. Как только Игорь его одобрит — он появится на главной странице.",
    again: "Написать заново", pending: "Твой отзыв ждёт проверки", approved: "Твой отзыв опубликован на сайте", rejected: "Этот отзыв не опубликован",
    errShort: "Напиши хотя бы пару предложений.", errConsent: "Поставь галочку — без разрешения публиковать нельзя.", errAny: "Не получилось отправить. Попробуй ещё раз.",
    counter: "символов",
  },
  en: {
    rate: "How is LIFE OS working out for you?", ph: "What changed with LIFE OS? What do you use most? In your own words — like telling a friend.",
    name: "Sign it as", namePh: "Name", role: "What you do", rolePh: "e.g. engineer, new mum — optional",
    consent: "I allow publishing this review and signature on the LIFE OS site", send: "Send review", sending: "Sending…",
    okTitle: "Thank you!", okText: "Your review is in review. Once it's approved it will appear on the home page.",
    again: "Write a new one", pending: "Your review is waiting for approval", approved: "Your review is published", rejected: "This review was not published",
    errShort: "Please write at least a couple of sentences.", errConsent: "Tick the box — we can't publish without permission.", errAny: "Couldn't send. Please try again.",
    counter: "characters",
  },
};

export default function ReviewForm({ locale, defaultName, existing }: { locale: string; defaultName: string; existing: Existing }) {
  const s = T[locale] || T.ru;
  const [rating, setRating] = useState(existing?.rating || 5);
  const [text, setText] = useState(existing?.text || "");
  const [name, setName] = useState(existing?.name || defaultName || "");
  const [role, setRole] = useState(existing?.role || "");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(!existing);

  async function send() {
    setErr("");
    if (text.trim().length < 12) return setErr(s.errShort);
    if (!consent) return setErr(s.errConsent);
    setBusy(true);
    const r = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating, text, name, role, consent }),
    }).catch(() => null);
    setBusy(false);
    if (r && r.ok) setDone(true);
    else setErr(s.errAny);
  }

  if (done) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "34px 28px", textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>🙏</div>
        <div style={{ fontSize: 20, fontWeight: 700, margin: "12px 0 8px" }}>{s.okTitle}</div>
        <div style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>{s.okText}</div>
      </div>
    );
  }

  // Отзыв уже отправлен — показываем его статус, а не пустую форму.
  if (!editing && existing) {
    const label = existing.status === "approved" ? s.approved : existing.status === "rejected" ? s.rejected : s.pending;
    const tone = existing.status === "approved" ? "#10b981" : existing.status === "rejected" ? "var(--text-3)" : "#f59e0b";
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "26px 24px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: tone, marginBottom: 12 }}>{label}</div>
        <div style={{ color: "#f5a623", letterSpacing: 2, marginBottom: 10 }}>{"★".repeat(existing.rating)}{"☆".repeat(5 - existing.rating)}</div>
        <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: "0 0 16px" }}>«{existing.text}»</p>
        <button
          onClick={() => setEditing(true)}
          style={{ padding: "10px 20px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          {s.again}
        </button>
      </div>
    );
  }

  const input: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12,
    border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)",
    fontSize: 15, fontFamily: "inherit", outline: "none",
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "26px 24px", boxShadow: "var(--shadow, 0 12px 32px -20px rgba(20,24,40,.18))" }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{s.rate}</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            aria-label={`${n}`}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 30, lineHeight: 1, color: n <= rating ? "#f5a623" : "var(--border)" }}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={s.ph}
        rows={5}
        maxLength={900}
        style={{ ...input, resize: "vertical", lineHeight: 1.55 }}
      />
      <div style={{ fontSize: 12, color: "var(--text-3)", margin: "6px 0 18px", textAlign: "right" }}>{text.length} / 900 {s.counter}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 18 }}>
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{s.name}</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={s.namePh} maxLength={60} style={input} />
        </label>
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{s.role}</div>
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder={s.rolePh} maxLength={60} style={input} />
        </label>
      </div>

      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", marginBottom: 18 }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3, width: 17, height: 17, accentColor: "var(--accent)" }} />
        <span style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5 }}>{s.consent}</span>
      </label>

      {err && <div style={{ fontSize: 13.5, color: "#e11d48", marginBottom: 14 }}>{err}</div>}

      <button
        onClick={send}
        disabled={busy}
        style={{
          padding: "13px 28px", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg,#6d6bf6,#8b5cf6)", color: "#fff",
          fontSize: 15, fontWeight: 600, cursor: busy ? "default" : "pointer",
          boxShadow: "0 12px 28px -12px rgba(91,91,245,.55)", opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? s.sending : s.send}
      </button>
    </div>
  );
}
