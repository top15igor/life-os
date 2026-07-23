"use client";
// Панель PMF-опроса в админке: сводка ответов + кнопки «тест себе» и «разослать всем».
import { useEffect, useState } from "react";

type Summary = {
  eligible: number;
  asked: number;
  answered: number;
  counts: { very: number; somewhat: number; no: number };
  pmfPct: number | null;
  answers: { name: string; score: "very" | "somewhat" | "no"; at: string; isOwner: boolean }[];
};

const SCORE_META: Record<string, { label: string; color: string }> = {
  very: { label: "😨 Сильно расстроюсь", color: "#0e9f6e" },
  somewhat: { label: "🤔 Немного расстроюсь", color: "#d97706" },
  no: { label: "😌 Спокойно, проживу", color: "#dc2626" },
};

function verdict(pct: number | null, answered: number) {
  if (pct === null || answered < 5) return { text: "Мало ответов для вывода. Нужно хотя бы 5.", color: "var(--text-2)" };
  if (pct >= 40) return { text: `PMF-балл ${pct}%. Порог 40% пройден: продукт-маркет-фит в этой аудитории есть.`, color: "#0e9f6e" };
  if (pct >= 25) return { text: `PMF-балл ${pct}%. Близко к порогу 40%, фит почти есть. Смотри, чего не хватает «немного расстроенным».`, color: "#d97706" };
  return { text: `PMF-балл ${pct}%. До порога 40% далеко: продукт пока «приятный», но не «необходимый».`, color: "#dc2626" };
}

export default function PmfPanel() {
  const [s, setS] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/admin/pmf").then((r) => r.json()).then((d) => d.ok && setS(d)).catch(() => {});
  useEffect(() => { load(); }, []);

  async function send(test: boolean) {
    if (!test && !window.confirm(`Разослать опрос активным пользователям, которым он ещё не приходил?`)) return;
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/admin/pmf${test ? "?test=1" : ""}`, { method: "POST" });
      const d = await r.json();
      setMsg(d.ok ? (test ? "Отправил тебе в бота, проверь." : `Отправлено: ${d.sent}. Уже спрашивали раньше: ${d.skippedAlreadyAsked}.`) : "Не получилось отправить.");
      load();
    } catch {
      setMsg("Не получилось отправить.");
    }
    setBusy(false);
  }

  if (!s) return <div style={{ color: "var(--text-3)", fontSize: 13 }}>Загружаю…</div>;

  const v = verdict(s.pmfPct, s.answered);
  const maxCount = Math.max(1, s.counts.very, s.counts.somewhat, s.counts.no);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        {[
          { label: "Подходят для опроса", value: s.eligible },
          { label: "Вопрос отправлен", value: s.asked },
          { label: "Ответили", value: s.answered },
          { label: "PMF-балл", value: s.pmfPct === null ? "—" : `${s.pmfPct}%` },
        ].map((x) => (
          <div key={x.label} style={{ background: "var(--surface-2)", borderRadius: 12, padding: "13px 15px" }}>
            <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{x.label}</div>
            <div style={{ fontSize: 26, fontWeight: 500, marginTop: 3 }}>{x.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16, fontSize: 13.5, color: v.color, fontWeight: 500 }}>{v.text}</div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Как отвечали (без владельца)</div>
        {(["very", "somewhat", "no"] as const).map((k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 190, fontSize: 12.5, color: "var(--text-2)" }}>{SCORE_META[k].label}</div>
            <div style={{ flex: 1, background: "var(--surface-2)", borderRadius: 6, height: 18, overflow: "hidden" }}>
              <div style={{ width: `${Math.round((s.counts[k] / maxCount) * 100)}%`, minWidth: s.counts[k] ? 6 : 0, height: "100%", background: SCORE_META[k].color, borderRadius: 6 }} />
            </div>
            <div style={{ width: 24, fontSize: 13, fontWeight: 600 }}>{s.counts[k]}</div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10 }}>
          PMF-балл = доля ответов «сильно расстроюсь». Мировой ориентир Шона Эллиса: 40% и выше = фит есть.
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn" disabled={busy} onClick={() => send(true)} style={{ fontSize: 13 }}>
          Отправить себе (тест)
        </button>
        <button className="btn btn-primary" disabled={busy} onClick={() => send(false)} style={{ fontSize: 13 }}>
          Разослать опрос активным
        </button>
        {msg && <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{msg}</span>}
      </div>

      {s.answers.length > 0 && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Кто что ответил</div>
          {s.answers.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--surface-2)", fontSize: 13 }}>
              <span style={{ flex: 1 }}>{a.name}{a.isOwner ? " (владелец, не в счёте)" : ""}</span>
              <span style={{ color: SCORE_META[a.score].color }}>{SCORE_META[a.score].label}</span>
              <span style={{ color: "var(--text-3)", fontSize: 12 }}>{String(a.at).slice(0, 10)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
