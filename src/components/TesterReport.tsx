"use client";

import { useEffect, useState } from "react";
import { TESTER_FEATURES } from "@/lib/testerFeatures";

type Result = "ok" | "bug" | "skip";
type Report = { day: string; entries: number | null; checklist: { key: string; result: Result }[] | null; bugs: string | null; notes: string | null; updated_at?: string };
type BugItem = { id: string; day: string | null; text: string; status: string; payout: number; created_at: string | null };

const RESULTS: { v: Result; label: string; bg: string; fg: string; on: string }[] = [
  { v: "ok", label: "✓ работает", bg: "var(--surface-2)", fg: "var(--text-2)", on: "#0e9f6e" },
  { v: "bug", label: "🐞 баг", bg: "var(--surface-2)", fg: "var(--text-2)", on: "#e0533d" },
  { v: "skip", label: "— не тестил", bg: "var(--surface-2)", fg: "var(--text-3)", on: "var(--text-3)" },
];

function fmtDay(d: string): string {
  const [y, m, dd] = d.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(Date.UTC(y, m - 1, dd)));
}

export default function TesterReport() {
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState("");
  const [entries, setEntries] = useState<string>("");
  const [results, setResults] = useState<Record<string, Result>>({});
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<Report[]>([]);
  const [myBugs, setMyBugs] = useState<BugItem[]>([]);
  const [bugText, setBugText] = useState("");
  const [bugSaving, setBugSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const applyReport = (r: Report | null) => {
    setEntries(r?.entries != null ? String(r.entries) : "");
    setNotes(r?.notes || "");
    const map: Record<string, Result> = {};
    for (const c of r?.checklist || []) if (c?.key) map[c.key] = c.result;
    setResults(map);
  };

  const load = () => {
    fetch("/api/tester")
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok) return;
        setDay(j.today);
        setHistory(j.history || []);
        setMyBugs(j.bugs || []);
        applyReport(j.todayReport || null);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const setRes = (key: string, v: Result) => setResults((p) => ({ ...p, [key]: p[key] === v ? "skip" : v }));

  const submitBug = async () => {
    const text = bugText.trim();
    if (!text || bugSaving) return;
    setBugSaving(true);
    try {
      const r = await fetch("/api/tester", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bug", text }),
      }).then((x) => x.json());
      if (r?.ok) { setBugText(""); load(); }
    } finally { setBugSaving(false); }
  };

  const save = async () => {
    setSaving(true); setSaved(false);
    const checklist = TESTER_FEATURES.map((f) => ({ key: f.key, result: results[f.key] || "skip" }));
    try {
      const r = await fetch("/api/tester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report", day, entries: entries === "" ? null : Number(entries), checklist, notes }),
      }).then((x) => x.json());
      if (r?.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); load(); }
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ color: "var(--text-3)", padding: 30 }}>Загрузка…</div>;

  const label = (r: string) => (r === "ok" ? "работает" : r === "bug" ? "🐞 баг" : "не тестил");

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 3 }}>Отчёт за</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Сегодня · {day ? fmtDay(day) : ""}</div>
      </div>

      {/* Записи */}
      <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>Сколько записей сделал(а) сегодня</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>цель — минимум 10</div>
        </div>
        <input
          type="number" min={0} inputMode="numeric" value={entries} onChange={(e) => setEntries(e.target.value)}
          placeholder="0"
          style={{ width: 88, fontSize: 20, fontWeight: 700, textAlign: "center", padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
        />
      </div>

      {/* Чек-лист фич */}
      <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-3)", margin: "0 2px 10px" }}>Что тестировал(а)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
        {TESTER_FEATURES.map((f) => (
          <div key={f.key} className="card" style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
              <span style={{ fontSize: 17 }}>{f.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{f.hint}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              {RESULTS.map((r) => {
                const active = (results[f.key] || "skip") === r.v;
                return (
                  <button key={r.v} onClick={() => setRes(f.key, r.v)}
                    style={{ flex: 1, fontSize: 12.5, fontWeight: 600, padding: "8px 6px", borderRadius: 9, cursor: "pointer",
                      border: active ? `1px solid ${r.on}` : "1px solid var(--border)",
                      background: active ? r.on : "transparent",
                      color: active ? "#fff" : "var(--text-2)" }}>
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Баги — по одному, каждый оплачивается отдельно */}
      <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-3)", margin: "0 2px 8px" }}>Сообщить о баге</div>
      <div style={{ fontSize: 12.5, color: "var(--text-3)", margin: "0 2px 8px" }}>
        Каждый баг — отдельно. За мелкую ошибку $5, за баг / нелогичный ответ / неверную запись $10.
      </div>
      <textarea value={bugText} onChange={(e) => setBugText(e.target.value)} rows={3}
        placeholder="Что делал(а) → что ожидал(а) → что получилось. Скрины кидай в чат боту."
        style={{ width: "100%", boxSizing: "border-box", fontSize: 14, padding: "11px 13px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", resize: "vertical", marginBottom: 10 }} />
      <button onClick={submitBug} disabled={bugSaving || !bugText.trim()}
        style={{ width: "100%", fontSize: 14.5, fontWeight: 700, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", cursor: bugSaving || !bugText.trim() ? "default" : "pointer", background: "var(--surface-2)", color: "var(--text)", opacity: bugSaving || !bugText.trim() ? 0.55 : 1, marginBottom: 16 }}>
        {bugSaving ? "Отправляю…" : "＋ Отправить баг"}
      </button>

      {myBugs.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", margin: "0 2px 8px" }}>Мои баги ({myBugs.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {myBugs.map((b) => {
              const st = b.status === "paid"
                ? { txt: `✓ принят · $${b.payout}`, col: "#0e9f6e" }
                : b.status === "rejected"
                ? { txt: "не баг", col: "var(--text-3)" }
                : { txt: "● на проверке", col: "#e0a23d" };
              return (
                <div key={b.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px", opacity: b.status === "rejected" ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{b.day || ""}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: st.col }}>{st.txt}</span>
                  </div>
                  <div style={{ fontSize: 13.5, whiteSpace: "pre-wrap", textDecoration: b.status === "rejected" ? "line-through" : "none" }}>{b.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Заметки */}
      <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-3)", margin: "0 2px 8px" }}>Заметки / идеи</div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
        placeholder="Что понравилось, что запутало, идеи по улучшению…"
        style={{ width: "100%", boxSizing: "border-box", fontSize: 14, padding: "11px 13px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", resize: "vertical", marginBottom: 18 }} />

      <button onClick={save} disabled={saving}
        style={{ width: "100%", fontSize: 15, fontWeight: 700, padding: "14px 16px", borderRadius: 13, border: "none", cursor: saving ? "default" : "pointer", background: saved ? "#0e9f6e" : "var(--accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Сохраняю…" : saved ? "✓ Сохранено" : "Сохранить отчёт за сегодня"}
      </button>

      {/* История */}
      {history.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-3)", margin: "0 2px 10px" }}>Прошлые дни</div>
          {history.map((r) => {
            const bugsN = (r.checklist || []).filter((c) => c.result === "bug").length;
            const okN = (r.checklist || []).filter((c) => c.result === "ok").length;
            return (
              <div key={r.day} className="card" style={{ marginBottom: 8, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700 }}>{fmtDay(r.day)}</span>
                  <span style={{ fontSize: 13, color: "var(--text-3)" }}>📖 {r.entries ?? 0} записей</span>
                  {okN > 0 && <span style={{ fontSize: 13, color: "#0e9f6e" }}>✓ {okN}</span>}
                  {bugsN > 0 && <span style={{ fontSize: 13, color: "#e0533d" }}>🐞 {bugsN}</span>}
                </div>
                {r.bugs && <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, whiteSpace: "pre-wrap" }}>{r.bugs}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
