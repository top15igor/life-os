"use client";

import { useState } from "react";
import Link from "next/link";
import AddToCalendar from "./AddToCalendar";

type Horizon = "today" | "week" | "month";
type Task = { id: string; text: string; done: boolean; entry_id: string | null };

const HORIZONS: Horizon[] = ["today", "week", "month"];

const STR: Record<string, any> = {
  ru: {
    open: "Открытые", done: "Выполненные", source: "запись", all: "Все", emptyFilter: "В этом горизонте пусто 🎉",
    horizons: { today: "🔴 Сегодня", week: "🟡 На неделю", month: "🟢 На месяц" },
    moveTo: "Перенести:", horizonHint: "AI сам разложил задачи по горизонтам — перетащи кнопками, если что-то не туда.",
    emptyTitle: "Здесь будут твои задачи",
    emptyHint: "Задачи появляются сами — когда в записи мелькает «надо сделать…». Просто скажи боту или запиши на «Сегодня», например:",
    examples: ["Надо записаться к врачу", "Не забыть позвонить маме", "Завтра отправить отчёт"],
    emptyCta: "Записать сейчас",
  },
  en: {
    open: "Open", done: "Done", source: "entry", all: "All", emptyFilter: "Nothing in this horizon 🎉",
    horizons: { today: "🔴 Today", week: "🟡 This week", month: "🟢 This month" },
    moveTo: "Move to:", horizonHint: "AI sorted your tasks into horizons — nudge them with the buttons if something's off.",
    emptyTitle: "Your tasks will appear here",
    emptyHint: "Tasks show up on their own — when an entry mentions “need to do…”. Just tell the bot or write on “Today”, for example:",
    examples: ["Need to book a doctor's appointment", "Don't forget to call mom", "Send the report tomorrow"],
    emptyCta: "Write now",
  },
  uk: {
    open: "Відкриті", done: "Виконані", source: "запис", all: "Усі", emptyFilter: "У цьому горизонті порожньо 🎉",
    horizons: { today: "🔴 Сьогодні", week: "🟡 На тиждень", month: "🟢 На місяць" },
    moveTo: "Перенести:", horizonHint: "AI сам розклав завдання по горизонтах — перетягни кнопками, якщо щось не туди.",
    emptyTitle: "Тут будуть твої завдання",
    emptyHint: "Завдання з'являються самі — коли в записі промайне «треба зробити…». Просто скажи боту або запиши на «Сьогодні», наприклад:",
    examples: ["Треба записатися до лікаря", "Не забути зателефонувати мамі", "Завтра надіслати звіт"],
    emptyCta: "Записати зараз",
  },
  fr: {
    open: "En cours", done: "Terminées", source: "entrée", all: "Toutes", emptyFilter: "Rien dans cet horizon 🎉",
    horizons: { today: "🔴 Aujourd'hui", week: "🟡 Cette semaine", month: "🟢 Ce mois" },
    moveTo: "Déplacer :", horizonHint: "L'IA a trié tes tâches par horizon — ajuste avec les boutons si besoin.",
    emptyTitle: "Tes tâches apparaîtront ici",
    emptyHint: "Les tâches apparaissent seules — quand une entrée mentionne « il faut faire… ». Dis-le au bot ou écris sur « Aujourd'hui », par exemple :",
    examples: ["Prendre rendez-vous chez le médecin", "Ne pas oublier d'appeler maman", "Envoyer le rapport demain"],
    emptyCta: "Écrire maintenant",
  },
  es: {
    open: "Pendientes", done: "Hechas", source: "entrada", all: "Todas", emptyFilter: "Nada en este horizonte 🎉",
    horizons: { today: "🔴 Hoy", week: "🟡 Esta semana", month: "🟢 Este mes" },
    moveTo: "Mover a:", horizonHint: "La IA ya ordenó tus tareas por horizonte — ajústalas con los botones si algo no encaja.",
    emptyTitle: "Aquí aparecerán tus tareas",
    emptyHint: "Las tareas aparecen solas — cuando una entrada menciona «tengo que hacer…». Solo dile al bot o escribe en «Hoy», por ejemplo:",
    examples: ["Tengo que pedir cita con el médico", "No olvidar llamar a mamá", "Enviar el informe mañana"],
    emptyCta: "Escribir ahora",
  },
};

export default function TasksList({
  tasks,
  locale,
  calConnected = false,
  calLinks = {},
  horizons = {},
}: {
  tasks: Task[];
  locale: string;
  calConnected?: boolean;
  calLinks?: Record<string, string>;
  horizons?: Record<string, Horizon>;
}) {
  const s = STR[locale] || STR.ru;
  const [items, setItems] = useState<Task[]>(tasks);
  const [hz, setHz] = useState<Record<string, Horizon>>(horizons);
  // Стартовый фильтр — «Сегодня» (как в лучших todo); если сегодня пусто — «Все».
  const [filter, setFilter] = useState<Horizon | "all" | "done">(() => {
    const hasToday = tasks.some((t) => !t.done && (horizons[t.id] || "week") === "today");
    return hasToday ? "today" : "all";
  });

  function toggle(id: string, done: boolean) {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    fetch("/api/task", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, done }) }).catch(() => {});
  }

  function move(id: string, horizon: Horizon) {
    setHz((prev) => ({ ...prev, [id]: horizon }));
    fetch("/api/task-horizon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, horizon }) }).catch(() => {});
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
  const hzOf = (id: string): Horizon => hz[id] || "week";
  const counts: Record<Horizon, number> = {
    today: open.filter((t) => hzOf(t.id) === "today").length,
    week: open.filter((t) => hzOf(t.id) === "week").length,
    month: open.filter((t) => hzOf(t.id) === "month").length,
  };

  const Row = (t: Task) => (
    <div key={t.id} className="card" style={{ marginBottom: 8, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <i
          onClick={() => toggle(t.id, !t.done)}
          className={`ti ${t.done ? "ti-square-check" : "ti-square"}`}
          style={{ fontSize: 20, color: t.done ? "var(--positive)" : "var(--text-3)", cursor: "pointer", flexShrink: 0 }}
        />
        <span style={{ flex: 1, fontSize: 14, color: t.done ? "var(--text-3)" : "var(--text)", textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
        {!t.done && (
          <AddToCalendar kind="task" refId={t.id} title={t.text} locale={locale} connected={calConnected} link={`task:${t.id}` in calLinks ? calLinks[`task:${t.id}`] : undefined} />
        )}
        {t.entry_id && (
          <Link href={`/entry/${t.entry_id}`} title={s.source} style={{ color: "var(--text-3)", flexShrink: 0 }}>
            <i className="ti ti-arrow-up-right" style={{ fontSize: 16 }} />
          </Link>
        )}
      </div>
      {/* Перенос: показываем только ДРУГИЕ горизонты (текущий и так виден по фильтру/группе) */}
      {!t.done && (
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 8, paddingLeft: 31 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>{s.moveTo}</span>
          {HORIZONS.filter((h) => h !== hzOf(t.id)).map((h) => (
            <button key={h} onClick={() => move(t.id, h)}
              style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 99, cursor: "pointer", border: "1px solid var(--border)", background: "transparent", color: "var(--text-3)" }}>
              {s.horizons[h]}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Фильтры-вкладки (как в лучших todo): Сегодня / Неделя / Месяц / Все / Выполненные.
  const chip = (on: boolean): any => ({
    display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 99, cursor: "pointer",
    border: on ? "1.5px solid var(--accent)" : "1px solid var(--border)",
    background: on ? "var(--accent-bg)" : "var(--surface)",
    color: on ? "var(--accent-text)" : "var(--text-2)", fontSize: 13, fontWeight: on ? 600 : 400,
  });
  const shown = filter === "done" ? done : filter === "all" ? open : open.filter((t) => hzOf(t.id) === filter);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
        {HORIZONS.map((h) => (
          <button key={h} onClick={() => setFilter(h)} style={chip(filter === h)}>
            {s.horizons[h]}<span style={{ opacity: 0.7 }}>{counts[h]}</span>
          </button>
        ))}
        <button onClick={() => setFilter("all")} style={chip(filter === "all")}>
          {s.all}<span style={{ opacity: 0.7 }}>{open.length}</span>
        </button>
        {done.length > 0 && (
          <button onClick={() => setFilter("done")} style={chip(filter === "done")}>
            ✅ {s.done}<span style={{ opacity: 0.7 }}>{done.length}</span>
          </button>
        )}
      </div>

      {filter === "all" && <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 12, lineHeight: 1.5 }}>{s.horizonHint}</div>}

      {filter === "all" ? (
        HORIZONS.map((h) => {
          const group = open.filter((t) => hzOf(t.id) === h);
          if (!group.length) return null;
          return (
            <div key={h} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 9 }}>{s.horizons[h]} · {group.length}</div>
              {group.map(Row)}
            </div>
          );
        })
      ) : shown.length === 0 ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 13.5 }}>{s.emptyFilter}</div>
      ) : (
        shown.map(Row)
      )}
    </div>
  );
}
