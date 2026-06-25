"use client";

import { useState } from "react";

type Task = { id: string; text: string; done: boolean };

export default function TaskList({ tasks }: { tasks: Task[] }) {
  const [items, setItems] = useState<Task[]>(tasks);

  async function toggle(id: string, done: boolean) {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    try {
      await fetch("/api/task", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, done }),
      });
    } catch {
      // откат при ошибке
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, done: !done } : t)));
    }
  }

  return (
    <div className="card">
      {items.map((t) => (
        <div
          key={t.id}
          onClick={() => toggle(t.id, !t.done)}
          style={{ fontSize: 13, lineHeight: 1.5, display: "flex", gap: 8, padding: "5px 0", cursor: "pointer", color: t.done ? "var(--text-3)" : "var(--text)" }}
        >
          <i className={`ti ${t.done ? "ti-square-check" : "ti-square"}`} style={{ fontSize: 16, color: t.done ? "var(--positive)" : "var(--text-3)" }} />
          <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
