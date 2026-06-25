"use client";

import { useState } from "react";

type QA = { id: string; question: string; answer: string };

const STR: Record<string, any> = {
  ru: { placeholder: "Спроси о своей жизни…", ask: "Спросить", asking: "AI собирает историю…", historyTitle: "Недавние вопросы", suggestions: ["Расскажи историю моего главного проекта", "Как менялось моё здоровье?", "Когда я был счастливее всего?", "Какие решения изменили мою жизнь?"] },
  en: { placeholder: "Ask about your life…", ask: "Ask", asking: "AI is weaving the story…", historyTitle: "Recent questions", suggestions: ["Tell the story of my main project", "How did my health change?", "When was I happiest?", "Which decisions changed my life?"] },
  uk: { placeholder: "Запитай про своє життя…", ask: "Запитати", asking: "AI збирає історію…", historyTitle: "Останні запитання", suggestions: ["Розкажи історію мого головного проєкту", "Як змінювалося моє здоров'я?", "Коли я був найщасливішим?", "Які рішення змінили моє життя?"] },
  fr: { placeholder: "Pose une question sur ta vie…", ask: "Demander", asking: "L'IA tisse l'histoire…", historyTitle: "Questions récentes", suggestions: ["Raconte l'histoire de mon projet principal", "Comment ma santé a-t-elle évolué ?", "Quand étais-je le plus heureux ?", "Quelles décisions ont changé ma vie ?"] },
};

export default function Biographer({ locale, initialHistory }: { locale: string; initialHistory?: QA[] }) {
  const s = STR[locale] || STR.ru;
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState("");
  const [history, setHistory] = useState<QA[]>(initialHistory || []);

  async function ask(question?: string) {
    const Q = (question ?? q).trim();
    if (!Q || busy) return;
    setQ("");
    setPending(Q);
    setBusy(true);
    try {
      const r = await fetch("/api/biographer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: Q }),
      }).then((x) => x.json());
      const answer = r.ok ? r.answer : "—";
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random());
      setHistory((h) => [{ id, question: Q, answer }, ...h]);
    } finally {
      setBusy(false);
      setPending("");
    }
  }

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); ask(); }} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={s.placeholder} style={{ flex: 1, height: 44, padding: "0 14px", fontSize: 15, borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} />
        <button type="submit" disabled={busy || !q.trim()} style={{ padding: "0 18px", borderRadius: 11, border: "none", background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 500, cursor: busy ? "default" : "pointer", opacity: busy || !q.trim() ? 0.6 : 1 }}>{s.ask}</button>
      </form>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
        {s.suggestions.map((sug: string) => (
          <button key={sug} onClick={() => ask(sug)} disabled={busy} style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 99, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}>{sug}</button>
        ))}
      </div>

      {busy && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 500, display: "flex", gap: 8, marginBottom: 8, color: "var(--accent-text)" }}>
            <i className="ti ti-quote" style={{ fontSize: 16, color: "var(--accent)" }} />{pending}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 9 }}>
            <i className="ti ti-loader-2" style={{ fontSize: 15 }} />{s.asking}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-history" style={{ fontSize: 15 }} />{s.historyTitle}
          </div>
          {history.map((item) => (
            <div key={item.id} className="card fade-up" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14.5, fontWeight: 500, display: "flex", gap: 9, marginBottom: 9, alignItems: "flex-start" }}>
                <i className="ti ti-quote" style={{ fontSize: 17, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
                <span>{item.question}</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-2)", whiteSpace: "pre-wrap", borderTop: "1px solid var(--border)", paddingTop: 10 }}>{item.answer}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
