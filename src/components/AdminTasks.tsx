"use client";

import { useState } from "react";
import type { AdminTask } from "@/lib/adminTasks";

export default function AdminTasks({ initial }: { initial: AdminTask[] }) {
  const [tasks, setTasks] = useState<AdminTask[]>(initial);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

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
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{new Date(t.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</div>
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
