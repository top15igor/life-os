"use client";

import { useState } from "react";

// «Здоровье бота» человеческим языком.
//
// Раньше это были три голые ссылки на JSON. Каждая из них не «показывает
// статус», а делает настоящую работу: полная проверка шлёт боту сорок четыре
// живых сообщения через настоящий вебхук и судит ответы второй моделью — это
// две с половиной минуты, в течение которых вкладка просто висит белым
// экраном. Отсюда и ощущение «долго открывается»: непонятно, идёт работа или
// всё зависло.
//
// Здесь то же самое, но видно: что запущено, сколько прошло, и результат
// списком, а не простынёй JSON.

type Step = { name: string; ok: boolean; why?: string; ms?: number };

const BTN = (main: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 15px",
  borderRadius: 10,
  border: `1px solid ${main ? "var(--accent)" : "var(--border)"}`,
  background: main ? "var(--accent)" : "var(--surface)",
  color: main ? "#fff" : "var(--text)",
  fontSize: 13.5,
  cursor: "pointer",
});

export default function AdminHealth() {
  const [busy, setBusy] = useState<string | null>(null);
  const [sec, setSec] = useState(0);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [head, setHead] = useState<string>("");
  const [note, setNote] = useState<string>("");

  async function run(kind: "light" | "full" | "diagnose") {
    if (busy) return;
    setBusy(kind);
    setSteps(null);
    setNote("");
    setHead("");
    setSec(0);
    const t0 = Date.now();
    const tick = setInterval(() => setSec(Math.round((Date.now() - t0) / 1000)), 1000);
    try {
      const url = kind === "diagnose" ? "/api/diagnose?hours=24" : `/api/selftest?mode=${kind}`;
      const j = await fetch(url).then((r) => r.json());
      if (kind === "diagnose") {
        setHead(j?.issues ? `Нашёл поводов разобраться: ${j.issues}` : "За сутки разбирать нечего");
        setNote(j?.issues ? `Добавлено в «Отложенные задачи»: ${j.tasks || 0}. Разбор ушёл тебе в Telegram.` : "Диагност молчит, когда всё спокойно: ежедневное «всё ок» быстро превращается в шум.");
      } else {
        const list: Step[] = j?.steps || [];
        setSteps(list);
        const bad = list.filter((s) => !s.ok).length;
        setHead(bad ? `Упало ${bad} из ${list.length}` : `Всё в порядке: ${list.length} из ${list.length}`);
      }
    } catch {
      setHead("Не получилось — попробуй ещё раз");
    }
    clearInterval(tick);
    setBusy(null);
  }

  const bad = (steps || []).filter((s) => !s.ok);
  const good = (steps || []).filter((s) => s.ok);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => run("light")} style={BTN(true)} disabled={!!busy}>
          <i className="ti ti-bolt" style={{ fontSize: 16 }} />Быстрая проверка
        </button>
        <button onClick={() => run("full")} style={BTN(false)} disabled={!!busy}>
          <i className="ti ti-checkup-list" style={{ fontSize: 16 }} />Полная
        </button>
        <button onClick={() => run("diagnose")} style={BTN(false)} disabled={!!busy}>
          <i className="ti ti-stethoscope" style={{ fontSize: 16 }} />Разбор за сутки
        </button>
      </div>

      <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5, marginTop: 8 }}>
        Быстрая — пути без AI, около полуминуты. Полная — плюс сорок четыре живых сообщения боту с оценкой ответов, две-три минуты.
        Обе шлют настоящие сообщения через настоящий вебхук, но ответы перехватываются и в чат не уходят.
      </div>

      {busy && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--text-2)" }}>
          <i className="ti ti-loader-2" style={{ fontSize: 17, color: "var(--accent)" }} />
          {busy === "diagnose" ? "Диагност читает журналы…" : busy === "full" ? "Идёт полная проверка…" : "Идёт быстрая проверка…"} {sec} с
        </div>
      )}

      {head && !busy && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: bad.length ? "#b91c1c" : "#0F6E56" }}>{head}</div>
          {note && <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, marginTop: 5 }}>{note}</div>}

          {/* Сначала то, что упало: остальное можно и не читать. */}
          {bad.length > 0 && (
            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              {bad.map((s, i) => (
                <div key={i} className="card" style={{ padding: "10px 12px", borderLeft: "3px solid #ef4444" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.name}</div>
                  {s.why && <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginTop: 3 }}>{s.why}</div>}
                </div>
              ))}
            </div>
          )}

          {good.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: 13, color: "var(--text-2)", cursor: "pointer" }}>Что прошло ({good.length})</summary>
              <div style={{ display: "grid", gap: 3, marginTop: 7 }}>
                {good.map((s, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: "var(--text-3)", display: "flex", gap: 7 }}>
                    <i className="ti ti-check" style={{ fontSize: 14, color: "#0F6E56", flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{s.name}</span>
                    {s.ms ? <span>{(s.ms / 1000).toFixed(1)} с</span> : null}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
