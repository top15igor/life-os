"use client";

import { useState } from "react";
import {
  MORNING_TONES, MORNING_TOPICS, MORNING_LENGTHS, EVENING_THEMES,
  type MorningPrefs, type EveningPrefs, type MorningTone, type MorningTopic, type MorningLength, type EveningTheme,
} from "@/lib/morningPrefs";

type L = {
  mTitle: string; mSub: string; mOn: string; toneLabel: string; topicsLabel: string; lengthLabel: string;
  addressLabel: string; addressPh: string; weekday: string; weekend: string; same: string; def: string; tzNote: (tz: string) => string;
  styleLabel: string; stylePh: string; off: string;
  eTitle: string; eSub: string; eOn: string; eAi: string; themesLabel: string; allThemes: string;
  customLabel: string; customPh: string; add: string;
  schedTitle: string; quietLabel: string; quietHint: string; weeklyOn: string; weeklyDay: string;
  preview: string; loading: string; saved: string;
  tone: Record<MorningTone, string>; topic: Record<MorningTopic, string>; length: Record<MorningLength, string>;
  theme: Record<EveningTheme, string>; dow: string[];
};

const STR: Record<string, L> = {
  ru: {
    mTitle: "Утренний пуш", mSub: "Тон, темы, время, длина и стиль — ИИ соберёт сообщение под тебя.",
    mOn: "Отправлять утром", toneLabel: "Тон", topicsLabel: "Темы", lengthLabel: "Длина",
    addressLabel: "Как обращаться (необязательно)", addressPh: "имя или прозвище: «капитан»",
    weekday: "Время (будни)", weekend: "Время (выходные)", same: "Как в будни", def: "По умолчанию (~08:00)", tzNote: (tz) => `Твой пояс: ${tz}`,
    styleLabel: "Свой стиль (необязательно)", stylePh: "Напр.: коротко, без эмодзи",
    off: "Темы выключены — придёт короткое тёплое приветствие.",
    eTitle: "Вечерние вопросы для книги", eSub: "Тёплый наводящий вопрос вечером, чтобы наполнять твою Книгу жизни.",
    eOn: "Отправлять вечером", eAi: "Умные вопросы (AI)", themesLabel: "Темы вопросов", allThemes: "Ничего не выбрано = все темы.",
    customLabel: "Свои подсказки", customPh: "Напиши свой вопрос или тему…", add: "Добавить",
    schedTitle: "Расписание и тишина", quietLabel: "Тихие дни (без пушей)", quietHint: "В эти дни не приходит ничего.",
    weeklyOn: "Недельный итог", weeklyDay: "День итога",
    preview: "Показать пример", loading: "Собираю…", saved: "Сохранено",
    tone: { friend: "Друг", coach: "Коуч", calm: "Спокойный", mentor: "Наставник", funny: "С юмором" },
    topic: { motivation: "Мотивация", goals: "Цели", tasks: "Задачи", diary: "Дневник", insight: "Инсайты", gratitude: "Благодарность", movement: "Зарядка" },
    length: { short: "Коротко", normal: "Обычно", long: "Подробно" },
    theme: { family: "Семья", health: "Здоровье", work: "Работа", travel: "Путешествия", growth: "О себе", gratitude: "Благодарность", emotions: "Чувства" },
    dow: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  },
  en: {
    mTitle: "Morning push", mSub: "Tone, topics, time, length and style — the AI tailors your message.",
    mOn: "Send in the morning", toneLabel: "Tone", topicsLabel: "Topics", lengthLabel: "Length",
    addressLabel: "How to address you (optional)", addressPh: "name or nickname: “captain”",
    weekday: "Time (weekdays)", weekend: "Time (weekend)", same: "Same as weekdays", def: "Default (~08:00)", tzNote: (tz) => `Your zone: ${tz}`,
    styleLabel: "Your style (optional)", stylePh: "E.g.: short, no emoji",
    off: "Topics off — you'll get a short warm greeting.",
    eTitle: "Evening book questions", eSub: "A warm prompt in the evening to fill your Book of Life.",
    eOn: "Send in the evening", eAi: "Smart questions (AI)", themesLabel: "Question themes", allThemes: "Nothing selected = all themes.",
    customLabel: "Your own prompts", customPh: "Write your own question or topic…", add: "Add",
    schedTitle: "Schedule & quiet", quietLabel: "Quiet days (no pushes)", quietHint: "Nothing is sent on these days.",
    weeklyOn: "Weekly summary", weeklyDay: "Summary day",
    preview: "Show example", loading: "Building…", saved: "Saved",
    tone: { friend: "Friend", coach: "Coach", calm: "Calm", mentor: "Mentor", funny: "Witty" },
    topic: { motivation: "Motivation", goals: "Goals", tasks: "Tasks", diary: "Diary", insight: "Insights", gratitude: "Gratitude", movement: "Movement" },
    length: { short: "Short", normal: "Normal", long: "Detailed" },
    theme: { family: "Family", health: "Health", work: "Work", travel: "Travel", growth: "About you", gratitude: "Gratitude", emotions: "Feelings" },
    dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  uk: {
    mTitle: "Ранковий пуш", mSub: "Тон, теми, час, довжина і стиль — ІІ збере повідомлення під тебе.",
    mOn: "Надсилати вранці", toneLabel: "Тон", topicsLabel: "Теми", lengthLabel: "Довжина",
    addressLabel: "Як звертатися (необов'язково)", addressPh: "ім'я або прізвисько: «капітане»",
    weekday: "Час (будні)", weekend: "Час (вихідні)", same: "Як у будні", def: "За замовчуванням (~08:00)", tzNote: (tz) => `Твій пояс: ${tz}`,
    styleLabel: "Свій стиль (необов'язково)", stylePh: "Напр.: коротко, без емодзі",
    off: "Теми вимкнені — прийде коротке тепле привітання.",
    eTitle: "Вечірні питання для книги", eSub: "Тепле навідне питання ввечері, щоб наповнювати твою Книгу життя.",
    eOn: "Надсилати ввечері", eAi: "Розумні питання (AI)", themesLabel: "Теми питань", allThemes: "Нічого не обрано = усі теми.",
    customLabel: "Свої підказки", customPh: "Напиши своє питання чи тему…", add: "Додати",
    schedTitle: "Розклад і тиша", quietLabel: "Тихі дні (без пушів)", quietHint: "У ці дні не приходить нічого.",
    weeklyOn: "Тижневий підсумок", weeklyDay: "День підсумку",
    preview: "Показати приклад", loading: "Збираю…", saved: "Збережено",
    tone: { friend: "Друг", coach: "Коуч", calm: "Спокійний", mentor: "Наставник", funny: "З гумором" },
    topic: { motivation: "Мотивація", goals: "Цілі", tasks: "Завдання", diary: "Щоденник", insight: "Інсайти", gratitude: "Вдячність", movement: "Зарядка" },
    length: { short: "Коротко", normal: "Звичайно", long: "Детально" },
    theme: { family: "Сім'я", health: "Здоров'я", work: "Робота", travel: "Подорожі", growth: "Про себе", gratitude: "Вдячність", emotions: "Почуття" },
    dow: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  },
  fr: {
    mTitle: "Push du matin", mSub: "Ton, thèmes, heure, longueur et style — l'IA s'adapte.",
    mOn: "Envoyer le matin", toneLabel: "Ton", topicsLabel: "Thèmes", lengthLabel: "Longueur",
    addressLabel: "Comment t'appeler (facultatif)", addressPh: "prénom ou surnom : « capitaine »",
    weekday: "Heure (semaine)", weekend: "Heure (week-end)", same: "Comme en semaine", def: "Par défaut (~08:00)", tzNote: (tz) => `Ton fuseau : ${tz}`,
    styleLabel: "Ton style (facultatif)", stylePh: "Ex. : court, sans emoji",
    off: "Thèmes désactivés — tu recevras un petit mot chaleureux.",
    eTitle: "Questions du soir", eSub: "Une question chaleureuse le soir pour remplir ton Livre de vie.",
    eOn: "Envoyer le soir", eAi: "Questions intelligentes (IA)", themesLabel: "Thèmes des questions", allThemes: "Rien de sélectionné = tous les thèmes.",
    customLabel: "Tes propres questions", customPh: "Écris ta question ou ton thème…", add: "Ajouter",
    schedTitle: "Planning & silence", quietLabel: "Jours sans push", quietHint: "Rien n'est envoyé ces jours-là.",
    weeklyOn: "Bilan hebdo", weeklyDay: "Jour du bilan",
    preview: "Voir un exemple", loading: "Génération…", saved: "Enregistré",
    tone: { friend: "Ami", coach: "Coach", calm: "Calme", mentor: "Mentor", funny: "Avec humour" },
    topic: { motivation: "Motivation", goals: "Objectifs", tasks: "Tâches", diary: "Journal", insight: "Insights", gratitude: "Gratitude", movement: "Mouvement" },
    length: { short: "Court", normal: "Normal", long: "Détaillé" },
    theme: { family: "Famille", health: "Santé", work: "Travail", travel: "Voyages", growth: "Sur toi", gratitude: "Gratitude", emotions: "Émotions" },
    dow: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
  },
};

const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]; // показываем Пн…Вс, значения 0=Вс
const field = { width: "100%", fontSize: 13.5, padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", boxSizing: "border-box" as const };
const lbl = { fontSize: 12, color: "var(--text-3)", marginBottom: 7 };

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</span>
      <button onClick={onChange} role="switch" aria-checked={on} aria-label={label}
        style={{ flexShrink: 0, width: 46, height: 28, borderRadius: 999, border: "none", cursor: "pointer", background: on ? "var(--accent)" : "var(--border)", position: "relative", transition: "background .15s" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: 999, background: "#fff", transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </button>
    </div>
  );
}

export default function PushSettings({ locale, initial }: { locale: string; initial: MorningPrefs }) {
  const s = STR[locale] || STR.ru;
  const [p, setP] = useState<MorningPrefs>(initial);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const [mPv, setMPv] = useState<string | null>(null);
  const [ePv, setEPv] = useState<string | null>(null);
  const [busy, setBusy] = useState<"" | "m" | "e">("");
  const [tz] = useState<string>(() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { return ""; } });

  async function save(next: MorningPrefs) {
    setP(next);
    try {
      await fetch("/api/morning-pref", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...next, tz: tz || next.tz }) });
      setSaved(true); setTimeout(() => setSaved(false), 1500);
    } catch { /* попробует при следующем изменении */ }
  }
  const set = (patch: Partial<MorningPrefs>) => save({ ...p, ...patch });
  const setEv = (patch: Partial<EveningPrefs>) => save({ ...p, evening: { ...p.evening, ...patch } });

  async function preview(kind: "m" | "e") {
    if (busy) return;
    setBusy(kind); (kind === "m" ? setMPv : setEPv)(null);
    try {
      const url = kind === "m" ? "/api/morning-preview" : "/api/evening-preview";
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefs: { ...p, tz: tz || p.tz }, locale }) }).then((x) => x.json()).catch(() => null);
      (kind === "m" ? setMPv : setEPv)(r?.text || "—");
    } finally { setBusy(""); }
  }

  function addPrompt() {
    const v = draft.trim();
    if (!v || p.evening.customPrompts.length >= 10) return;
    setEv({ customPrompts: [...p.evening.customPrompts, v.slice(0, 200)] });
    setDraft("");
  }

  const chip = (label: string, active: boolean, onClick: () => void, icon?: string) => (
    <button key={label} onClick={onClick}
      style={{ fontSize: 13, fontWeight: 500, padding: "7px 13px", borderRadius: 999, cursor: "pointer",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)", background: active ? "var(--accent-bg)" : "var(--surface)",
        color: active ? "var(--accent-text)" : "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 5 }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 14 }} />}{label}
    </button>
  );
  const timeSelect = (val: number | null, onChange: (v: string) => void, zeroLabel: string) => (
    <select value={val ?? ""} onChange={(e) => onChange(e.target.value)} style={{ ...field, cursor: "pointer" }}>
      <option value="">{zeroLabel}</option>
      {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
    </select>
  );
  const previewBtn = (kind: "m" | "e") => (
    <button onClick={() => preview(kind)} disabled={!!busy}
      style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, padding: "9px 14px", borderRadius: 10, border: "1px solid var(--accent)", background: "var(--accent-bg)", color: "var(--accent-text)", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
      <i className={`ti ${busy === kind ? "ti-loader-2" : "ti-sparkles"}`} style={{ fontSize: 15 }} />{busy === kind ? s.loading : s.preview}
    </button>
  );
  const pvBox = (text: string | null) => text && (
    <div style={{ marginTop: 11, padding: "11px 13px", borderRadius: 11, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 13.5, lineHeight: 1.5, color: "var(--text)", whiteSpace: "pre-wrap" }}>{text}</div>
  );

  return (
    <>
      {/* Утро */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 3 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>☀️ {s.mTitle}</div>
          {saved && <span style={{ fontSize: 12, color: "var(--positive)", display: "inline-flex", alignItems: "center", gap: 3 }}><i className="ti ti-check" style={{ fontSize: 13 }} />{s.saved}</span>}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, marginBottom: 13 }}>{s.mSub}</div>

        <Toggle on={p.morningEnabled} onChange={() => set({ morningEnabled: !p.morningEnabled })} label={s.mOn} />

        {p.morningEnabled && (
          <>
            <div style={lbl}>{s.toneLabel}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 15 }}>
              {MORNING_TONES.map((t) => chip(s.tone[t], p.tone === t, () => set({ tone: t })))}
            </div>

            <div style={lbl}>{s.lengthLabel}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 15 }}>
              {MORNING_LENGTHS.map((x) => chip(s.length[x], p.length === x, () => set({ length: x })))}
            </div>

            <div style={lbl}>{s.topicsLabel}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: p.topics.length === 0 ? 8 : 15 }}>
              {MORNING_TOPICS.map((t) => chip(s.topic[t], p.topics.includes(t),
                () => set({ topics: p.topics.includes(t) ? p.topics.filter((x) => x !== t) : [...p.topics, t] }),
                p.topics.includes(t) ? "ti-check" : "ti-plus"))}
            </div>
            {p.topics.length === 0 && <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 15, lineHeight: 1.45 }}>{s.off}</div>}

            <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={lbl}>{s.weekday}</div>
                {timeSelect(p.hour, (v) => set({ hour: v === "" ? null : parseInt(v, 10) }), s.def)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={lbl}>{s.weekend}</div>
                {timeSelect(p.hourWeekend, (v) => set({ hourWeekend: v === "" ? null : parseInt(v, 10) }), s.same)}
              </div>
            </div>
            {tz && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 15 }}>{s.tzNote(tz)}</div>}

            <div style={lbl}>{s.addressLabel}</div>
            <input value={p.address} onChange={(e) => setP({ ...p, address: e.target.value.slice(0, 40) })} onBlur={() => save(p)} placeholder={s.addressPh} style={{ ...field, marginBottom: 14 }} />

            <div style={lbl}>{s.styleLabel}</div>
            <textarea value={p.customStyle} onChange={(e) => setP({ ...p, customStyle: e.target.value.slice(0, 300) })} onBlur={() => save(p)} placeholder={s.stylePh} rows={2}
              style={{ ...field, resize: "vertical", marginBottom: 14, lineHeight: 1.4 }} />

            {previewBtn("m")}
            {pvBox(mPv)}
          </>
        )}
      </div>

      {/* Вечер */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>🌙 {s.eTitle}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, marginBottom: 13 }}>{s.eSub}</div>

        <Toggle on={p.evening.enabled} onChange={() => setEv({ enabled: !p.evening.enabled })} label={s.eOn} />

        {p.evening.enabled && (
          <>
            <Toggle on={p.evening.ai} onChange={() => setEv({ ai: !p.evening.ai })} label={s.eAi} />

            <div style={lbl}>{s.themesLabel}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 6 }}>
              {EVENING_THEMES.map((t) => chip(s.theme[t], p.evening.themes.includes(t),
                () => setEv({ themes: p.evening.themes.includes(t) ? p.evening.themes.filter((x) => x !== t) : [...p.evening.themes, t] }),
                p.evening.themes.includes(t) ? "ti-check" : "ti-plus"))}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 15 }}>{s.allThemes}</div>

            <div style={lbl}>{s.customLabel}</div>
            {p.evening.customPrompts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                {p.evening.customPrompts.map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <span style={{ flex: 1, fontSize: 13, lineHeight: 1.4, color: "var(--text)" }}>{q}</span>
                    <button onClick={() => setEv({ customPrompts: p.evening.customPrompts.filter((_, j) => j !== i) })} aria-label="remove"
                      style={{ flexShrink: 0, border: "none", background: "transparent", color: "var(--text-3)", cursor: "pointer", fontSize: 15, lineHeight: 1 }}>
                      <i className="ti ti-x" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {p.evening.customPrompts.length < 10 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 15 }}>
                <input value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 200))} placeholder={s.customPh}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPrompt(); } }} style={{ ...field, flex: 1 }} />
                <button onClick={addPrompt} disabled={!draft.trim()}
                  style={{ flexShrink: 0, fontSize: 13, fontWeight: 500, padding: "0 15px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", opacity: draft.trim() ? 1 : 0.5 }}>{s.add}</button>
              </div>
            )}

            {previewBtn("e")}
            {pvBox(ePv)}
          </>
        )}
      </div>

      {/* Расписание и тишина */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 11 }}>🗓 {s.schedTitle}</div>

        <div style={lbl}>{s.quietLabel}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
          {DOW_ORDER.map((d) => chip(s.dow[d], p.quietDays.includes(d),
            () => set({ quietDays: p.quietDays.includes(d) ? p.quietDays.filter((x) => x !== d) : [...p.quietDays, d] })))}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 16 }}>{s.quietHint}</div>

        <Toggle on={p.weekly.enabled} onChange={() => set({ weekly: { ...p.weekly, enabled: !p.weekly.enabled } })} label={s.weeklyOn} />
        {p.weekly.enabled && (
          <>
            <div style={lbl}>{s.weeklyDay}</div>
            <select value={p.weekly.day} onChange={(e) => set({ weekly: { ...p.weekly, day: parseInt(e.target.value, 10) } })} style={{ ...field, cursor: "pointer" }}>
              {DOW_ORDER.map((d) => <option key={d} value={d}>{s.dow[d]}</option>)}
            </select>
          </>
        )}
      </div>
    </>
  );
}
