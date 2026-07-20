"use client";

import { useState } from "react";
import { CHAT_TONES, type MorningPrefs, type MorningTone } from "@/lib/morningPrefs";

// Выбор тона общения с AI-другом (чат + голос). Хранится в тех же morning_prefs
// (поле chatTone), но не зависит от утреннего пуша. Пишем ВЕСЬ объект настроек,
// чтобы не затереть остальные поля (API нормализует всё тело запроса).
type L = {
  title: string;
  sub: string;
  saved: string;
  tone: Record<string, string>; // короткая подпись для чипа
  desc: Record<string, string>; // описание выбранного тона (под чипами)
};

const STR: Record<string, L> = {
  ru: {
    title: "Тон общения с ботом",
    sub: "Как AI-друг разговаривает с тобой — в чате и голосом.",
    saved: "Сохранено",
    tone: { auto: "Под мой стиль", friend: "Тёплый", direct: "Прямой", calm: "Спокойный", business: "Деловой", energetic: "Энергичный", coach: "Коуч", mentor: "Наставник", funny: "С юмором" },
    desc: {
      auto: "Бот подстроится под твою манеру письма — будет говорить примерно как ты сам.",
      friend: "По-доброму, как близкий человек, на «ты». Поддержит и посочувствует.",
      direct: "По делу и коротко. Без воды, подталкивает к одному конкретному действию.",
      calm: "Ровно и нейтрально, без лишних эмоций и пафоса.",
      business: "Конкретно, по приоритетам, спокойно и без сантиментов.",
      energetic: "Бодро и заряжающе, но без наигранности и кринжа.",
      coach: "Заряжает и мотивирует, мягко подталкивает к действию — как энергичный коуч.",
      mentor: "Вдумчиво, по делу и с уважением — как мудрый наставник.",
      funny: "С лёгким добрым юмором — улыбчиво, но по делу и без сарказма.",
    },
  },
  en: {
    title: "Bot conversation tone",
    sub: "How the AI friend talks with you — in chat and by voice.",
    saved: "Saved",
    tone: { auto: "My style", friend: "Warm", direct: "Direct", calm: "Calm", business: "Business", energetic: "Energetic", coach: "Coach", mentor: "Mentor", funny: "Funny" },
    desc: {
      auto: "The bot will mirror how you write — it'll sound roughly like you.",
      friend: "Kind and close, on first-name terms. Supportive and warm.",
      direct: "To the point and short. No fluff, nudges you to one concrete action.",
      calm: "Even and neutral, without extra emotion or pathos.",
      business: "Concrete, by priority, calm and without sentiment.",
      energetic: "Upbeat and energizing, but never forced or cringe.",
      coach: "Energizes and motivates, gently nudges you to act — like a coach.",
      mentor: "Thoughtful, on point and respectful — like a wise mentor.",
      funny: "Light, kind humor — smiley, but on point and without sarcasm.",
    },
  },
  uk: {
    title: "Тон спілкування з ботом",
    sub: "Як AI-друг говорить з тобою — у чаті та голосом.",
    saved: "Збережено",
    tone: { auto: "Під мій стиль", friend: "Теплий", direct: "Прямий", calm: "Спокійний", business: "Діловий", energetic: "Енергійний", coach: "Коуч", mentor: "Наставник", funny: "З гумором" },
    desc: {
      auto: "Бот підлаштується під твою манеру письма — говоритиме приблизно як ти.",
      friend: "По-доброму, як близька людина, на «ти». Підтримає й поспівчуває.",
      direct: "По суті й коротко. Без води, підштовхує до однієї конкретної дії.",
      calm: "Рівно й нейтрально, без зайвих емоцій і пафосу.",
      business: "Конкретно, за пріоритетами, спокійно й без сантиментів.",
      energetic: "Бадьоро й заряджаюче, але без награності та кринжу.",
      coach: "Заряджає й мотивує, м'яко підштовхує до дії — як енергійний коуч.",
      mentor: "Вдумливо, по суті й з повагою — як мудрий наставник.",
      funny: "З легким добрим гумором — усміхнено, але по суті й без сарказму.",
    },
  },
  fr: {
    title: "Ton des échanges avec le bot",
    sub: "Comment l'ami IA te parle — en chat et à la voix.",
    saved: "Enregistré",
    tone: { auto: "Mon style", friend: "Chaleureux", direct: "Direct", calm: "Calme", business: "Pro", energetic: "Énergique", coach: "Coach", mentor: "Mentor", funny: "Humour" },
    desc: {
      auto: "Le bot s'alignera sur ta façon d'écrire — il sonnera à peu près comme toi.",
      friend: "Bienveillant et proche, en te tutoyant. Soutenant et chaleureux.",
      direct: "Concis et direct. Sans blabla, te pousse vers une action concrète.",
      calm: "Posé et neutre, sans émotion ni emphase superflues.",
      business: "Concret, par priorités, calme et sans sentimentalité.",
      energetic: "Dynamique et stimulant, mais jamais forcé ni ridicule.",
      coach: "Stimule et motive, te pousse doucement à agir — comme un coach.",
      mentor: "Réfléchi, pertinent et respectueux — comme un mentor avisé.",
      funny: "Humour léger et bienveillant — souriant, mais pertinent et sans sarcasme.",
    },
  },
};

export default function ChatToneSettings({ locale, initial }: { locale: string; initial: MorningPrefs }) {
  const s = STR[locale] || STR.ru;
  const [prefs, setPrefs] = useState<MorningPrefs>(initial);
  const [saved, setSaved] = useState(false);

  async function pick(t: MorningTone) {
    if (t === prefs.chatTone) return;
    const next = { ...prefs, chatTone: t };
    setPrefs(next);
    setSaved(false);
    try {
      await fetch("/api/morning-pref", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(next) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* тихо — не блокируем UI */ }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 4 }}>
        <i className="ti ti-message-chatbot" style={{ fontSize: 20, color: "var(--accent)", flexShrink: 0 }} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
        {saved && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--positive)", display: "inline-flex", alignItems: "center", gap: 3 }}>
            <i className="ti ti-check" style={{ fontSize: 13 }} />{s.saved}
          </span>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, marginBottom: 12 }}>{s.sub}</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {CHAT_TONES.map((t) => {
          const active = prefs.chatTone === t;
          return (
            <button
              key={t}
              onClick={() => pick(t)}
              style={{
                fontSize: 13,
                fontWeight: 500,
                padding: "7px 14px",
                borderRadius: 999,
                cursor: "pointer",
                border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: active ? "var(--accent-bg)" : "var(--surface)",
                color: active ? "var(--accent-text)" : "var(--text-2)",
              }}
            >
              {s.tone[t]}
            </button>
          );
        })}
      </div>

      {/* Описание выбранного тона — чтобы было понятно, что он значит */}
      <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginTop: 10 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 14, color: "var(--text-3)", flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>{s.desc[prefs.chatTone]}</div>
      </div>
    </div>
  );
}
