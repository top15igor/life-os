"use client";

import { useState } from "react";

type Candidate = { id: string; theme: string; text: string; reason: string | null; replaces: string | null; created_at: string };
type BankItem = { id: string; lang: string; theme: string; text: string; source: string; active: boolean };
type Stat = { key: string; question: string; source: string; sent: number; answered: number; rate: number; avgLen: number };

const THEMES = ["family", "health", "work", "travel", "growth", "gratitude", "emotions"];
const THEME_RU: Record<string, string> = {
  family: "Семья", health: "Здоровье", work: "Работа", travel: "Путешествия",
  growth: "Рост", gratitude: "Благодарность", emotions: "Чувства",
};

export default function AdminQuestions({ candidates, bank, stats }: { candidates: Candidate[]; bank: BankItem[]; stats: Stat[] }) {
  const [cand, setCand] = useState(candidates);
  const [items, setItems] = useState(bank);
  const [busy, setBusy] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [theme, setTheme] = useState("growth");
  const [runNote, setRunNote] = useState("");

  async function api(payload: any) {
    return fetch("/api/admin/questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
      .then((r) => r.json()).catch(() => ({ ok: false }));
  }

  async function decide(c: Candidate, action: "approve" | "reject") {
    setBusy(c.id);
    const r = await api({ action, id: c.id });
    setBusy(null);
    if (!r?.ok) return;
    setCand((x) => x.filter((i) => i.id !== c.id));
    if (action === "approve") setItems((x) => [{ id: c.id, lang: "ru", theme: c.theme, text: c.text, source: "agent", active: true }, ...x]);
  }

  async function toggle(i: BankItem) {
    setItems((x) => x.map((b) => (b.id === i.id ? { ...b, active: !b.active } : b)));
    await api({ action: i.active ? "off" : "on", id: i.id });
  }

  async function add() {
    if (!text.trim()) return;
    setBusy("add");
    const r = await api({ action: "add", text, theme });
    setBusy(null);
    if (r?.ok && r.item) { setItems((x) => [r.item, ...x]); setText(""); }
  }

  async function runNow() {
    setBusy("run");
    setRunNote("Считаю статистику и думаю…");
    const r = await api({ action: "run" });
    setBusy(null);
    setRunNote(r?.note ? `Пока рано: ${r.note}` : r?.proposed ? `Готово: новых предложений — ${r.proposed}. Обнови страницу.` : "Готово: новых предложений нет.");
  }

  const card: React.CSSProperties = { padding: "12px 14px" };
  const inp: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14 };
  const btn = (bg: string): React.CSSProperties => ({ padding: "6px 13px", borderRadius: 9, border: "none", background: bg, color: "#fff", fontSize: 12.5, fontWeight: 500, cursor: "pointer" });

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Предложения агента */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9, gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Предложения агента · {cand.length}</div>
          <button onClick={runNow} disabled={busy === "run"} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12.5, cursor: "pointer", padding: 0 }}>
            <i className="ti ti-refresh" style={{ verticalAlign: "-2px" }} /> {busy === "run" ? "Считаю…" : "Прогнать разбор сейчас"}
          </button>
        </div>
        {runNote && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 9 }}>{runNote}</div>}
        {cand.length === 0 ? (
          <div className="card" style={{ ...card, color: "var(--text-2)", fontSize: 13.5 }}>
            Пока пусто. Агент разбирает статистику раз в неделю и предлагает правки, когда накопится достаточно ответов.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {cand.map((c) => (
              <div key={c.id} className="card" style={card}>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 4 }}>{THEME_RU[c.theme] || c.theme}</div>
                <div style={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.45 }}>{c.text}</div>
                {c.replaces && <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 6 }}>вместо: «{c.replaces}»</div>}
                {c.reason && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 6, lineHeight: 1.5 }}>{c.reason}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
                  <button onClick={() => decide(c, "approve")} disabled={busy === c.id} style={btn("var(--positive)")}>В банк</button>
                  <button onClick={() => decide(c, "reject")} disabled={busy === c.id} style={{ ...btn("transparent"), color: "var(--text-3)", border: "1px solid var(--border)" }}>Мимо</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Свой вопрос */}
      <section>
        <div style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 9 }}>Добавить свой вопрос</div>
        <div className="card" style={{ ...card, display: "grid", gap: 8 }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Кто сегодня тебя рассмешил?" style={inp} />
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ ...inp, width: "auto" }}>
              {THEMES.map((t) => <option key={t} value={t}>{THEME_RU[t]}</option>)}
            </select>
            <button onClick={add} disabled={!text.trim() || busy === "add"} style={btn("var(--accent)")}>Добавить</button>
          </div>
        </div>
      </section>

      {/* Банк */}
      <section>
        <div style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 9 }}>Банк вопросов · {items.length}</div>
        {items.length === 0 ? (
          <div className="card" style={{ ...card, color: "var(--text-2)", fontSize: 13.5 }}>Банк пуст — людям идут вопросы, зашитые в приложении.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((i) => (
              <div key={i.id} className="card" style={{ ...card, display: "flex", gap: 11, alignItems: "flex-start", opacity: i.active ? 1 : 0.5 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>{i.text}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>
                    {THEME_RU[i.theme] || i.theme} · {i.source === "owner" ? "твой" : "от агента"} · {i.lang}
                  </div>
                </div>
                <button onClick={() => toggle(i)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 12.5, flexShrink: 0 }}>
                  {i.active ? "выключить" : "включить"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Статистика */}
      <section>
        <div style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 9 }}>Отклик на вопросы · 60 дней</div>
        {stats.length === 0 ? (
          <div className="card" style={{ ...card, color: "var(--text-2)", fontSize: 13.5 }}>
            Данных пока нет. Статистика появится после того, как бот задаст вечерние вопросы и люди начнут отвечать.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {stats.map((s) => (
              <div key={s.key} className="card" style={{ ...card, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>{s.question || s.key}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>{s.answered} из {s.sent} · ответ ~{s.avgLen} симв. · {s.source}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, flexShrink: 0, color: s.rate >= 0.5 ? "var(--positive)" : s.rate >= 0.25 ? "var(--text)" : "var(--text-3)" }}>
                  {Math.round(s.rate * 100)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
