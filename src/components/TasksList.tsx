"use client";

import { useState } from "react";
import Link from "next/link";

type Task = { id: string; text: string; done: boolean; entry_id: string | null };

const STR: Record<string, any> = {
  ru: { open: "Открытые", done: "Выполненные", empty: "Задач пока нет — они появятся из твоих записей.", source: "запись" },
  en: { open: "Open", done: "Done", empty: "No tasks yet — they'll appear from your entries.", source: "entry" },
  uk: { open: "Відкриті", done: "Виконані", empty: "Завдань поки немає — з'являться з твоїх записів.", source: "запис" },
  fr: { open: "En cours", done: "Terminées", empty: "Pas encore de tâches — elles viendront de tes entrées.", source: "entrée" },
};

export default function TasksList({ tasks, locale }: { tasks: Task[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [items, setItems] = useState<Task[]>(tasks);

  function toggle(id: string, done: boolean) {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    fetch("/api/task", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, done }) }).catch(() => {});
  }

  if (items.length === 0) {
    return <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>;
  }

  const open = items.filter((t) => !t.done);
  const done = items.filter((t) => t.done);

  const Row = (t: Task) => (
    <div key={t.id} className="card" style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8, padding: "12px 14px" }}>
      <i
        onClick={() => toggle(t.id, !t.done)}
        className={`ti ${t.done ? "ti-square-check" : "ti-square"}`}
        style={{ fontSize: 20, color: t.done ? "var(--positive)" : "var(--text-3)", cursor: "pointer", flexShrink: 0 }}
      />
      <span style={{ flex: 1, fontSize: 14, color: t.done ? "var(--text-3)" : "var(--text)", textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
      {t.entry_id && (
        <Link href={`/entry/${t.entry_id}`} title={s.source} style={{ color: "var(--text-3)", flexShrink: 0 }}>
          <i className="ti ti-arrow-up-right" style={{ fontSize: 16 }} />
        </Link>
      )}
    </div>
  );

  return (
    <div>
      {open.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 9 }}>{s.open} · {open.length}</div>
          {open.map(Row)}
        </div>
      )}
      {done.length > 0 && (
        <div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 9 }}>{s.done} · {done.length}</div>
          {done.map(Row)}
        </div>
      )}
    </div>
  );
}
