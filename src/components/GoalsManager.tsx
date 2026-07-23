"use client";

import { useRef, useState } from "react";

type Goal = { id: string; title: string; progress: number; year?: number };

const STR: Record<string, any> = {
  ru: {
    addBtn: "Добавить", placeholder: "Новая цель на год…",
    emptyTitle: "С чего начать?",
    emptyHint: "Цель — это то, чего хочешь достичь за год. Нажми на пример, чтобы подставить его в поле, или напиши свою.",
    examples: [
      "🏃 Пробежать полумарафон", "📚 Прочитать 24 книги за год", "🇬🇧 Свободно заговорить на английском",
      "💰 Накопить подушку на 6 месяцев", "🧘 Медитировать каждый день", "💪 Прийти в форму, минус 10 кг",
      "✈️ Съездить в страну, где не был", "🎸 Научиться играть на гитаре", "🚭 Бросить курить",
      "👨‍👩‍👧 Больше времени с семьёй без телефона",
    ],
  },
  en: {
    addBtn: "Add", placeholder: "New goal for the year…",
    emptyTitle: "Where to start?",
    emptyHint: "A goal is something you want to achieve this year. Tap an example to drop it into the field, or write your own.",
    examples: [
      "🏃 Run a half-marathon", "📚 Read 24 books this year", "🇬🇧 Become fluent in English",
      "💰 Save a 6-month safety cushion", "🧘 Meditate every day", "💪 Get in shape, lose 10 kg",
      "✈️ Visit a country I've never been to", "🎸 Learn to play the guitar", "🚭 Quit smoking",
      "👨‍👩‍👧 More time with family, phone away",
    ],
  },
  uk: {
    addBtn: "Додати", placeholder: "Нова ціль на рік…",
    emptyTitle: "З чого почати?",
    emptyHint: "Ціль — це те, чого хочеш досягти за рік. Натисни на приклад, щоб підставити його в поле, або напиши свою.",
    examples: [
      "🏃 Пробігти напівмарафон", "📚 Прочитати 24 книги за рік", "🇬🇧 Вільно заговорити англійською",
      "💰 Накопити подушку на 6 місяців", "🧘 Медитувати щодня", "💪 Прийти у форму, мінус 10 кг",
      "✈️ Поїхати в країну, де не був", "🎸 Навчитися грати на гітарі", "🚭 Кинути палити",
      "👨‍👩‍👧 Більше часу з родиною без телефону",
    ],
  },
  fr: {
    addBtn: "Ajouter", placeholder: "Nouvel objectif pour l'année…",
    emptyTitle: "Par où commencer ?",
    emptyHint: "Un objectif, c'est ce que tu veux accomplir cette année. Touche un exemple pour l'insérer dans le champ, ou écris le tien.",
    examples: [
      "🏃 Courir un semi-marathon", "📚 Lire 24 livres cette année", "🇬🇧 Devenir à l'aise en anglais",
      "💰 Épargner 6 mois de sécurité", "🧘 Méditer chaque jour", "💪 Se remettre en forme, −10 kg",
      "✈️ Visiter un pays inconnu", "🎸 Apprendre la guitare", "🚭 Arrêter de fumer",
      "👨‍👩‍👧 Plus de temps en famille, sans téléphone",
    ],
  },
  es: {
    addBtn: "Añadir", placeholder: "Nueva meta para el año…",
    emptyTitle: "¿Por dónde empezar?",
    emptyHint: "Una meta es algo que quieres lograr este año. Toca un ejemplo para ponerlo en el campo, o escribe el tuyo.",
    examples: [
      "🏃 Correr un medio maratón", "📚 Leer 24 libros este año", "🇬🇧 Hablar inglés con fluidez",
      "💰 Ahorrar un colchón de 6 meses", "🧘 Meditar cada día", "💪 Ponerte en forma, bajar 10 kg",
      "✈️ Visitar un país en el que nunca has estado", "🎸 Aprender a tocar la guitarra", "🚭 Dejar de fumar",
      "👨‍👩‍👧 Más tiempo en familia, sin el teléfono",
    ],
  },
};

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function GoalsManager({ initial, locale }: { initial: Goal[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [goals, setGoals] = useState<Goal[]>(initial);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function pickExample(text: string) {
    setTitle(text);
    inputRef.current?.focus();
  }

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
        <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={s.placeholder} style={{ flex: 1, height: 42, padding: "0 13px", fontSize: 14.5, borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} />
        <button type="submit" disabled={!title.trim()} style={{ padding: "0 18px", borderRadius: 11, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14.5, fontWeight: 500, cursor: "pointer", opacity: title.trim() ? 1 : 0.6 }}>{s.addBtn}</button>
      </form>

      {goals.length === 0 ? (
        <div className="card">
          <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 5 }}>{s.emptyTitle}</div>
          <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 14 }}>{s.emptyHint}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {s.examples.map((ex: string) => (
              <button
                key={ex}
                type="button"
                onClick={() => pickExample(ex)}
                style={{
                  padding: "8px 13px", fontSize: 13.5, borderRadius: 99, cursor: "pointer",
                  border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)",
                  lineHeight: 1.3, textAlign: "left",
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
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
