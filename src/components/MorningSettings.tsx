"use client";

import { useState } from "react";
import { MORNING_TONES, MORNING_TOPICS, type MorningPrefs, type MorningTone, type MorningTopic } from "@/lib/morningPrefs";

const STR: Record<string, {
  title: string; sub: string; toneLabel: string; topicsLabel: string; timeLabel: string; defaultTime: string;
  tzNote: (tz: string) => string; styleLabel: string; stylePh: string; previewBtn: string; previewLoading: string;
  saved: string; off: string; tone: Record<MorningTone, string>; topic: Record<MorningTopic, string>;
}> = {
  ru: {
    title: "Что присылать утром", sub: "Выбери тон, темы и время — ИИ соберёт утреннее сообщение под тебя.",
    toneLabel: "Тон", topicsLabel: "Темы", timeLabel: "Время", defaultTime: "По умолчанию (~08:00)",
    tzNote: (tz) => `Время в твоём поясе: ${tz}`, styleLabel: "Свой стиль (необязательно)",
    stylePh: "Напр.: коротко и по делу, без эмодзи; обращайся «капитан»",
    previewBtn: "Показать пример", previewLoading: "Собираю пример…", saved: "Сохранено",
    off: "Темы выключены — придёт короткое тёплое приветствие.",
    tone: { friend: "Друг", coach: "Коуч", calm: "Спокойный", mentor: "Наставник", funny: "С юмором" },
    topic: { motivation: "Мотивация", goals: "Цели", tasks: "Задачи", diary: "Дневник", insight: "Инсайты", gratitude: "Благодарность", movement: "Зарядка" },
  },
  en: {
    title: "Your morning message", sub: "Pick the tone, topics and time — the AI will tailor your morning message.",
    toneLabel: "Tone", topicsLabel: "Topics", timeLabel: "Time", defaultTime: "Default (~08:00)",
    tzNote: (tz) => `Time in your zone: ${tz}`, styleLabel: "Your style (optional)",
    stylePh: "E.g.: short and to the point, no emoji; call me “captain”",
    previewBtn: "Show example", previewLoading: "Building example…", saved: "Saved",
    off: "Topics off — you'll get a short warm greeting.",
    tone: { friend: "Friend", coach: "Coach", calm: "Calm", mentor: "Mentor", funny: "Witty" },
    topic: { motivation: "Motivation", goals: "Goals", tasks: "Tasks", diary: "Diary", insight: "Insights", gratitude: "Gratitude", movement: "Movement" },
  },
  uk: {
    title: "Що надсилати вранці", sub: "Обери тон, теми і час — ІІ збере ранкове повідомлення під тебе.",
    toneLabel: "Тон", topicsLabel: "Теми", timeLabel: "Час", defaultTime: "За замовчуванням (~08:00)",
    tzNote: (tz) => `Час у твоєму поясі: ${tz}`, styleLabel: "Свій стиль (необов'язково)",
    stylePh: "Напр.: коротко і по суті, без емодзі; звертайся «капітане»",
    previewBtn: "Показати приклад", previewLoading: "Збираю приклад…", saved: "Збережено",
    off: "Теми вимкнені — прийде коротке тепле привітання.",
    tone: { friend: "Друг", coach: "Коуч", calm: "Спокійний", mentor: "Наставник", funny: "З гумором" },
    topic: { motivation: "Мотивація", goals: "Цілі", tasks: "Завдання", diary: "Щоденник", insight: "Інсайти", gratitude: "Вдячність", movement: "Зарядка" },
  },
  fr: {
    title: "Ton message du matin", sub: "Choisis le ton, les thèmes et l'heure — l'IA composera ton message.",
    toneLabel: "Ton", topicsLabel: "Thèmes", timeLabel: "Heure", defaultTime: "Par défaut (~08:00)",
    tzNote: (tz) => `Heure dans ton fuseau : ${tz}`, styleLabel: "Ton style (facultatif)",
    stylePh: "Ex. : court et précis, sans emoji ; appelle-moi « capitaine »",
    previewBtn: "Voir un exemple", previewLoading: "Génération…", saved: "Enregistré",
    off: "Thèmes désactivés — tu recevras un petit mot chaleureux.",
    tone: { friend: "Ami", coach: "Coach", calm: "Calme", mentor: "Mentor", funny: "Avec humour" },
    topic: { motivation: "Motivation", goals: "Objectifs", tasks: "Tâches", diary: "Journal", insight: "Insights", gratitude: "Gratitude", movement: "Mouvement" },
  },
};

export default function MorningSettings({ locale, initial }: { locale: string; initial: MorningPrefs }) {
  const s = STR[locale] || STR.ru;
  const [tone, setTone] = useState<MorningTone>(initial.tone);
  const [topics, setTopics] = useState<MorningTopic[]>(initial.topics);
  const [hour, setHour] = useState<number | null>(initial.hour);
  const [style, setStyle] = useState<string>(initial.customStyle);
  const [saved, setSaved] = useState(false);
  const [pvText, setPvText] = useState<string | null>(null);
  const [pvLoading, setPvLoading] = useState(false);
  // Таймзона из браузера — нужна, чтобы перевести выбранный час в реальное время отправки.
  const [tz] = useState<string>(() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { return ""; } });

  async function persist(next: { tone: MorningTone; topics: MorningTopic[]; hour: number | null; customStyle: string }) {
    try {
      await fetch("/api/morning-pref", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...next, tz: tz || null }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch { /* не критично — попробует при следующем изменении */ }
  }
  const current = () => ({ tone, topics, hour, customStyle: style });
  function pickTone(t: MorningTone) { if (t === tone) return; setTone(t); persist({ ...current(), tone: t }); }
  function toggleTopic(t: MorningTopic) {
    const next = topics.includes(t) ? topics.filter((x) => x !== t) : [...topics, t];
    setTopics(next);
    persist({ ...current(), topics: next });
  }
  function pickHour(v: string) {
    const h = v === "" ? null : parseInt(v, 10);
    setHour(h);
    persist({ ...current(), hour: h });
  }
  function styleBlur() { persist(current()); }

  async function preview() {
    if (pvLoading) return;
    setPvLoading(true); setPvText(null);
    try {
      const r = await fetch("/api/morning-preview", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ prefs: { tone, topics, hour, tz: tz || null, customStyle: style }, locale }),
      }).then((x) => x.json()).catch(() => null);
      setPvText(r?.text || "—");
    } finally {
      setPvLoading(false);
    }
  }

  const chip = (label: string, active: boolean, onClick: () => void, icon?: string) => (
    <button key={label} onClick={onClick}
      style={{
        fontSize: 13, fontWeight: 500, padding: "7px 13px", borderRadius: 999, cursor: "pointer",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--accent-bg)" : "var(--surface)",
        color: active ? "var(--accent-text)" : "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 5,
      }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 14 }} />}{label}
    </button>
  );
  const fieldStyle = { width: "100%", fontSize: 13.5, padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", boxSizing: "border-box" as const };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 3 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>☀️ {s.title}</div>
        {saved && <span style={{ fontSize: 12, color: "var(--positive)", display: "inline-flex", alignItems: "center", gap: 3 }}><i className="ti ti-check" style={{ fontSize: 13 }} />{s.saved}</span>}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, marginBottom: 13 }}>{s.sub}</div>

      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 7 }}>{s.toneLabel}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 15 }}>
        {MORNING_TONES.map((t) => chip(s.tone[t], tone === t, () => pickTone(t)))}
      </div>

      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 7 }}>{s.topicsLabel}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: topics.length === 0 ? 8 : 15 }}>
        {MORNING_TOPICS.map((t) => chip(s.topic[t], topics.includes(t), () => toggleTopic(t), topics.includes(t) ? "ti-check" : "ti-plus"))}
      </div>
      {topics.length === 0 && <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 15, lineHeight: 1.45 }}>{s.off}</div>}

      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 7 }}>{s.timeLabel}</div>
      <select value={hour ?? ""} onChange={(e) => pickHour(e.target.value)} style={{ ...fieldStyle, marginBottom: 6, cursor: "pointer" }}>
        <option value="">{s.defaultTime}</option>
        {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
      </select>
      {tz && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 15 }}>{s.tzNote(tz)}</div>}

      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 7 }}>{s.styleLabel}</div>
      <textarea value={style} onChange={(e) => setStyle(e.target.value.slice(0, 300))} onBlur={styleBlur} placeholder={s.stylePh} rows={2}
        style={{ ...fieldStyle, resize: "vertical", marginBottom: 14, lineHeight: 1.4 }} />

      <button onClick={preview} disabled={pvLoading}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, padding: "9px 14px", borderRadius: 10, border: "1px solid var(--accent)", background: "var(--accent-bg)", color: "var(--accent-text)", cursor: "pointer", opacity: pvLoading ? 0.6 : 1 }}>
        <i className={`ti ${pvLoading ? "ti-loader-2" : "ti-sparkles"}`} style={{ fontSize: 15 }} />{pvLoading ? s.previewLoading : s.previewBtn}
      </button>
      {pvText && (
        <div style={{ marginTop: 11, padding: "11px 13px", borderRadius: 11, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 13.5, lineHeight: 1.5, color: "var(--text)", whiteSpace: "pre-wrap" }}>
          {pvText}
        </div>
      )}
    </div>
  );
}
