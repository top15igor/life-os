"use client";

import { useState } from "react";
import Link from "next/link";

type Task = { id: string; text: string; done: boolean; entry_id: string | null };

const STR: Record<string, any> = {
  ru: {
    open: "Открытые", done: "Выполненные", source: "запись",
    emptyTitle: "Здесь будут твои задачи",
    emptyHint: "Задачи появляются сами — когда в записи мелькает «надо сделать…». Просто скажи боту или запиши на «Сегодня», например:",
    examples: ["Надо записаться к врачу", "Не забыть позвонить маме", "Завтра отправить отчёт"],
    emptyCta: "Записать сейчас",
  },
  en: {
    open: "Open", done: "Done", source: "entry",
    emptyTitle: "Your tasks will appear here",
    emptyHint: "Tasks show up on their own — when an entry mentions “need to do…”. Just tell the bot or write on “Today”, for example:",
    examples: ["Need to book a doctor's appointment", "Don't forget to call mom", "Send the report tomorrow"],
    emptyCta: "Write now",
  },
  uk: {
    open: "Відкриті", done: "Виконані", source: "запис",
    emptyTitle: "Тут будуть твої завдання",
    emptyHint: "Завдання з'являються самі — коли в записі промайне «треба зробити…». Просто скажи боту або запиши на «Сьогодні», наприклад:",
    examples: ["Треба записатися до лікаря", "Не забути зателефонувати мамі", "Завтра надіслати звіт"],
    emptyCta: "Записати зараз",
  },
  fr: {
    open: "En cours", done: "Terminées", source: "entrée",
    emptyTitle: "Tes tâches apparaîtront ici",
    emptyHint: "Les tâches apparaissent seules — quand une entrée mentionne « il faut faire… ». Dis-le au bot ou écris sur « Aujourd'hui », par exemple :",
    examples: ["Prendre rendez-vous chez le médecin", "Ne pas oublier d'appeler maman", "Envoyer le rapport demain"],
    emptyCta: "Écrire maintenant",
  },
};

export default function TasksList({ tasks, locale }: { tasks: Task[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [items, setItems] = useState<Task[]>(tasks);

  function toggle(id: string, done: boolean) {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    fetch("/api/task", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, done }) }).catch(() => {});
  }

  if (items.length === 0) {
    return (
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <i className="ti ti-checklist" style={{ fontSize: 22, color: "var(--accent)" }} />
          <div style={{ fontSize: 15.5, fontWeight: 600 }}>{s.emptyTitle}</div>
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 13 }}>{s.emptyHint}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 15 }}>
          {s.examples.map((ex: string) => (
            <div key={ex} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)", background: "var(--surface-2)", borderRadius: 10, padding: "9px 12px" }}>
              <i className="ti ti-microphone" style={{ fontSize: 15, color: "var(--text-3)", flexShrink: 0 }} />
              <span style={{ fontStyle: "italic" }}>«{ex}»</span>
            </div>
          ))}
        </div>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 500, color: "#fff", background: "var(--accent)", padding: "9px 16px", borderRadius: 10, textDecoration: "none" }}>
          <i className="ti ti-pencil-plus" style={{ fontSize: 16 }} />{s.emptyCta}
        </Link>
      </div>
    );
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
