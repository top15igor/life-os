"use client";

import { useState } from "react";

const STR: Record<string, any> = {
  ru: { placeholder: "Спроси о своей жизни…", ask: "Спросить", asking: "AI собирает историю…", suggestions: ["Расскажи историю моего главного проекта", "Как менялось моё здоровье?", "Когда я был счастливее всего?", "Какие решения изменили мою жизнь?"] },
  en: { placeholder: "Ask about your life…", ask: "Ask", asking: "AI is weaving the story…", suggestions: ["Tell the story of my main project", "How did my health change?", "When was I happiest?", "Which decisions changed my life?"] },
  uk: { placeholder: "Запитай про своє життя…", ask: "Запитати", asking: "AI збирає історію…", suggestions: ["Розкажи історію мого головного проєкту", "Як змінювалося моє здоров'я?", "Коли я був найщасливішим?", "Які рішення змінили моє життя?"] },
  fr: { placeholder: "Pose une question sur ta vie…", ask: "Demander", asking: "L'IA tisse l'histoire…", suggestions: ["Raconte l'histoire de mon projet principal", "Comment ma santé a-t-elle évolué ?", "Quand étais-je le plus heureux ?", "Quelles décisions ont changé ma vie ?"] },
};

export default function Biographer({ locale }: { locale: string }) {
  const s = STR[locale] || STR.ru;
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");

  async function ask(question?: string) {
    const Q = (question ?? q).trim();
    if (!Q || busy) return;
    setQ(Q);
    setBusy(true);
    setAnswer("");
    try {
      const r = await fetch("/api/biographer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: Q }),
      }).then((x) => x.json());
      setAnswer(r.ok ? r.answer : "—");
    } catch {
      setAnswer("—");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); ask(); }} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={s.placeholder}
          style={{ flex: 1, height: 44, padding: "0 14px", fontSize: 15, borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
        />
        <button type="submit" disabled={busy || !q.trim()} style={{ padding: "0 18px", borderRadius: 11, border: "none", background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 500, cursor: busy ? "default" : "pointer", opacity: busy || !q.trim() ? 0.6 : 1 }}>
          {s.ask}
        </button>
      </form>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 }}>
        {s.suggestions.map((sug: string) => (
          <button key={sug} onClick={() => ask(sug)} disabled={busy} style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 99, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}>
            {sug}
          </button>
        ))}
      </div>

      {busy && (
        <div style={{ fontSize: 13, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-loader-2" style={{ fontSize: 16 }} />{s.asking}
        </div>
      )}
      {answer && !busy && (
        <div className="card fade-up" style={{ fontSize: 14.5, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{answer}</div>
      )}
    </div>
  );
}
