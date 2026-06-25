"use client";

import { useState } from "react";

type Goal = { id: string; title: string; progress: number; year?: number };

const STR: Record<string, any> = {
  ru: { addBtn: "Добавить", placeholder: "Новая цель на год…", empty: "Целей пока нет. Добавь первую — например «Создать LIFE OS»." },
  en: { addBtn: "Add", placeholder: "New goal for the year…", empty: "No goals yet. Add your first — e.g. “Build LIFE OS”." },
  uk: { addBtn: "Додати", placeholder: "Нова ціль на рік…", empty: "Цілей поки немає. Додай першу — наприклад «Створити LIFE OS»." },
  fr: { addBtn: "Ajouter", placeholder: "Nouvel objectif pour l'année…", empty: "Pas encore d'objectifs. Ajoute le premier — ex. « Créer LIFE OS »." },
};

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function GoalsManager({ initial, locale }: { initial: Goal[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [goals, setGoals] = useState<Goal[]>(initial);
  const [title, setTitle] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTitle("");
    const r = await fetch("/api/goal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create", title: t }) }).then((x) => x.json());
    if (r.ok && r.goal) setGoals((g) => [...g, r.goal]);
  }

  function setProgress(id: string, p: number) {
    setGoals((g) => g.map((x) => (x.id === id ? { ...x, progress: p } : x)));
    fetch("/api/goal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "progress", id, progress: p }) });
  }

  function del(id: string) {
    setGoals((g) => g.filter((x) => x.id !== id));
    fetch("/api/goal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
  }

  return (
    <div>
      <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={s.placeholder} style={{ flex: 1, height: 42, padding: "0 13px", fontSize: 14.5, borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} />
        <button type="submit" disabled={!title.trim()} style={{ padding: "0 18px", borderRadius: 11, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14.5, fontWeight: 500, cursor: "pointer", opacity: title.trim() ? 1 : 0.6 }}>{s.addBtn}</button>
      </form>

      {goals.length === 0 ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
      ) : (
        goals.map((goal, i) => (
          <div key={goal.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
              <span style={{ fontSize: 14.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-target" style={{ color: COLORS[i % COLORS.length], fontSize: 18 }} />{goal.title}
              </span>
              <button onClick={() => del(goal.id)} aria-label="delete" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}>
                <i className="ti ti-trash" style={{ fontSize: 16 }} />
              </button>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden", marginBottom: 8 }}>
              <div style={{ width: `${goal.progress}%`, height: "100%", background: COLORS[i % COLORS.length], transition: "width .2s" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <input type="range" min={0} max={100} step={5} value={goal.progress} onChange={(e) => setProgress(goal.id, Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontSize: 13, color: "var(--text-2)", minWidth: 38, textAlign: "right" }}>{goal.progress}%</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
