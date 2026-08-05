"use client";

import { useState } from "react";
import type { AdminTask } from "@/lib/adminTasks";

export default function AdminTasks({ initial }: { initial: AdminTask[] }) {
  const [tasks, setTasks] = useState<AdminTask[]>(initial);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [fixing, setFixing] = useState<string | null>(null);
  const [fixRes, setFixRes] = useState<Record<string, string>>({});

  async function api(payload: any) {
    return fetch("/api/admin/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()).catch(() => ({ ok: false }));
  }

  async function add() {
    if (!title.trim() || adding) return;
    setAdding(true);
    const r = await api({ action: "add", title, note });
    setAdding(false);
    if (r?.ok && r.task) { setTasks((x) => [r.task, ...x]); setTitle(""); setNote(""); }
  }
  async function toggle(t: AdminTask) {
    setTasks((x) => x.map((i) => (i.id === t.id ? { ...i, done: !i.done } : i)));
    await api({ action: "toggle", id: t.id, done: !t.done });
  }
  async function del(id: string) {
    setTasks((x) => x.filter((i) => i.id !== id));
    await api({ action: "delete", id });
  }

  // Агент готовит правку и открывает pull request. В main он не пишет никогда —
  // ссылка ведёт на PR, где видно каждую изменённую строку и результат сборки.
  async function fix(t: AdminTask) {
    if (fixing) return;
    setFixing(t.id);
    setFixRes((r) => ({ ...r, [t.id]: "" }));
    const res = await api({ action: "fix", id: t.id });
    setFixing(null);
    setFixRes((r) => ({ ...r, [t.id]: res?.ok ? `PR готов: ${res.url}` : `Не вышло: ${res?.error || "неизвестная ошибка"}` }));
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  const Row = (t: AdminTask) => (
    <div key={t.id} className="card" style={{ display: "flex", gap: 11, alignItems: "flex-start", opacity: t.done ? 0.55 : 1 }}>
      <button onClick={() => toggle(t)} title={t.done ? "Вернуть" : "Выполнено"} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, marginTop: 1 }}>
        <i className={`ti ${t.done ? "ti-circle-check-filled" : "ti-circle"}`} style={{ fontSize: 21, color: t.done ? "var(--positive)" : "var(--text-3)" }} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
        {t.note && <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginTop: 3, whiteSpace: "pre-wrap" }}>{t.note}</div>}
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span>{new Date(t.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>
          {!t.done && (
            <button onClick={() => fix(t)} disabled={fixing === t.id} title="Агент подготовит правку и откроет pull request"
              style={{ background: "none", border: "none", padding: 0, cursor: fixing === t.id ? "default" : "pointer", color: "var(--accent)", fontSize: 11.5 }}>
              <i className="ti ti-wand" style={{ verticalAlign: "-2px" }} /> {fixing === t.id ? "Готовлю правку…" : "Подготовить фикс"}
            </button>
          )}
        </div>
        {fixRes[t.id] && (
          <div style={{ fontSize: 11.5, marginTop: 6, color: fixRes[t.id].startsWith("PR") ? "var(--positive)" : "var(--text-2)", wordBreak: "break-all" }}>
            {fixRes[t.id].startsWith("PR готов: ")
              ? <a href={fixRes[t.id].slice(10)} target="_blank" rel="noreferrer" style={{ color: "var(--positive)" }}>PR готов — открыть и посмотреть правку</a>
              : fixRes[t.id]}
          </div>
        )}
      </div>
      <button onClick={() => del(t.id)} title="Удалить" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 15, flexShrink: 0 }}><i className="ti ti-trash" /></button>
    </div>
  );

  return (
    <div>
      {/* Добавить */}
      <div className="card" style={{ marginBottom: 18, display: "grid", gap: 8 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && title.trim()) { e.preventDefault(); add(); } }} placeholder="Что отложить на потом…" style={inp} />
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Детали, мысли, ссылки (необязательно)" rows={2} style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} />
        <div>
          <button onClick={add} disabled={!title.trim() || adding} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: !title.trim() || adding ? 0.6 : 1 }}>
            <i className="ti ti-plus" style={{ verticalAlign: "-2px" }} /> Добавить
          </button>
        </div>
      </div>

      {open.length === 0 && done.length === 0 && (
        <div className="card" style={{ textAlign: "center", color: "var(--text-2)", padding: "26px 18px" }}>Пока пусто. Запиши, что откладываешь на потом.</div>
      )}

      {open.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.03em", margin: "0 0 8px" }}>В работе позже · {open.length}</div>
          <div style={{ display: "grid", gap: 10, marginBottom: 22 }}>{open.map(Row)}</div>
        </>
      )}

      {done.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.03em", margin: "0 0 8px" }}>Сделано · {done.length}</div>
          <div style={{ display: "grid", gap: 10 }}>{done.map(Row)}</div>
        </>
      )}
    </div>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 14, color: "var(--text)" };
