"use client";

import { useState } from "react";
import { CHAT_TONES, type MorningPrefs, type MorningTone } from "@/lib/morningPrefs";

// Выбор тона общения с AI-другом (чат + голос + «Спроси свою жизнь»). Хранится в тех
// же morning_prefs (chatTone + свободный chatStyle), но не зависит от утреннего пуша.
// Пишем ВЕСЬ объект настроек (API нормализует всё тело — иначе затрём другие поля).
type L = {
  title: string;
  sub: string;
  saved: string;
  exampleLabel: string;
  styleLabel: string;
  stylePlaceholder: string;
  tone: Record<string, string>;    // подпись чипа
  desc: Record<string, string>;    // описание тона
  example: Record<string, string>; // живой пример реплики бота
};

const STR: Record<string, L> = {
  ru: {
    title: "Тон общения с ботом",
    sub: "Как AI-друг разговаривает с тобой — в чате, голосом и в «Спроси свою жизнь».",
    saved: "Сохранено",
    exampleLabel: "Пример",
    styleLabel: "Свой стиль (по желанию)",
    stylePlaceholder: "Опиши своими словами, как бот должен с тобой говорить. Напр.: «по-простому, с примерами, без длинных вступлений» или «обращайся ко мне „шеф“».",
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
    example: {
      auto: "Подстроюсь под тебя: пишешь коротко и с эмодзи — так и отвечу 👍",
      friend: "Рад тебя слышать! Как ты сегодня, по-честному?",
      direct: "Ок. Одна главная задача на сегодня — какая?",
      calm: "Привет. Расскажи, как прошёл день.",
      business: "Итоги дня: что сделано и что в приоритете на завтра?",
      energetic: "Йо! Погнали 🔥 Что сегодня покорим?",
      coach: "Ты можешь больше, чем думаешь. С чего начнём?",
      mentor: "Расскажи, что на душе. Подумаем вместе, спокойно.",
      funny: "Ну что, докладывай — как прошли сегодняшние приключения? 😄",
    },
  },
  en: {
    title: "Bot conversation tone",
    sub: "How the AI friend talks with you — in chat, by voice and in “Ask your life”.",
    saved: "Saved",
    exampleLabel: "Example",
    styleLabel: "Your own style (optional)",
    stylePlaceholder: "Describe in your words how the bot should talk to you. E.g.: “keep it simple, with examples, no long intros” or “call me ‘chief’”.",
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
    example: {
      auto: "I'll mirror you: if you write short with emoji — I'll answer the same 👍",
      friend: "Good to hear from you! How are you today, honestly?",
      direct: "Okay. Your one main task for today — what is it?",
      calm: "Hi. Tell me how your day went.",
      business: "Day's recap: what's done and what's the priority tomorrow?",
      energetic: "Yo! Let's go 🔥 What are we conquering today?",
      coach: "You can do more than you think. Where do we start?",
      mentor: "Tell me what's on your mind. Let's think it through, calmly.",
      funny: "So, report in — how did today's adventures go? 😄",
    },
  },
  uk: {
    title: "Тон спілкування з ботом",
    sub: "Як AI-друг говорить з тобою — у чаті, голосом і в «Запитай своє життя».",
    saved: "Збережено",
    exampleLabel: "Приклад",
    styleLabel: "Свій стиль (за бажанням)",
    stylePlaceholder: "Опиши своїми словами, як бот має з тобою говорити. Напр.: «простими словами, з прикладами, без довгих вступів» або «звертайся до мене „шеф“».",
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
    example: {
      auto: "Підлаштуюсь під тебе: пишеш коротко та з емодзі — так і відповім 👍",
      friend: "Радий тебе чути! Як ти сьогодні, чесно?",
      direct: "Ок. Одне головне завдання на сьогодні — яке?",
      calm: "Привіт. Розкажи, як минув день.",
      business: "Підсумки дня: що зроблено і що в пріоритеті на завтра?",
      energetic: "Йо! Погнали 🔥 Що сьогодні підкоримо?",
      coach: "Ти можеш більше, ніж думаєш. З чого почнемо?",
      mentor: "Розкажи, що на душі. Подумаємо разом, спокійно.",
      funny: "Ну що, доповідай — як минули сьогоднішні пригоди? 😄",
    },
  },
  fr: {
    title: "Ton des échanges avec le bot",
    sub: "Comment l'ami IA te parle — en chat, à la voix et dans « Interroge ta vie ».",
    saved: "Enregistré",
    exampleLabel: "Exemple",
    styleLabel: "Ton propre style (facultatif)",
    stylePlaceholder: "Décris avec tes mots comment le bot doit te parler. Ex. : « simple, avec des exemples, sans longues intros » ou « appelle-moi „chef“ ».",
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
    example: {
      auto: "Je m'aligne sur toi : tu écris court avec des emoji — je réponds pareil 👍",
      friend: "Content de te lire ! Comment vas-tu aujourd'hui, franchement ?",
      direct: "Ok. Ta tâche principale du jour — c'est quoi ?",
      calm: "Salut. Raconte-moi comment s'est passée ta journée.",
      business: "Bilan du jour : fait quoi et priorité demain ?",
      energetic: "Yo ! C'est parti 🔥 On conquiert quoi aujourd'hui ?",
      coach: "Tu peux plus que tu ne crois. On commence par quoi ?",
      mentor: "Dis-moi ce que tu as en tête. Réfléchissons ensemble, calmement.",
      funny: "Alors, fais ton rapport — comment se sont passées les aventures du jour ? 😄",
    },
  },
};

export default function ChatToneSettings({ locale, initial }: { locale: string; initial: MorningPrefs }) {
  const s = STR[locale] || STR.ru;
  const [prefs, setPrefs] = useState<MorningPrefs>(initial);
  const [style, setStyle] = useState<string>(initial.chatStyle || "");
  const [saved, setSaved] = useState(false);

  async function persist(next: MorningPrefs) {
    setPrefs(next);
    setSaved(false);
    try {
      await fetch("/api/morning-pref", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(next) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* тихо — не блокируем UI */ }
  }

  function pick(t: MorningTone) {
    if (t === prefs.chatTone) return;
    persist({ ...prefs, chatTone: t });
  }

  function saveStyle() {
    const trimmed = style.slice(0, 300).trim();
    if (trimmed === (prefs.chatStyle || "")) return;
    persist({ ...prefs, chatStyle: trimmed });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 58,
    border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)",
    color: "var(--text)", fontSize: 13, lineHeight: 1.5, padding: "9px 11px", fontFamily: "inherit",
  };

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
                fontSize: 13, fontWeight: 500, padding: "7px 14px", borderRadius: 999, cursor: "pointer",
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

      {/* Описание выбранного тона */}
      <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginTop: 10 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 14, color: "var(--text-3)", flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>{s.desc[prefs.chatTone]}</div>
      </div>

      {/* Живой пример реплики бота в этом тоне */}
      <div style={{ marginTop: 10, background: "var(--accent-bg)", borderRadius: 10, padding: "9px 12px" }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent-text)", opacity: 0.8, marginBottom: 3 }}>{s.exampleLabel}</div>
        <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, fontStyle: "italic" }}>«{s.example[prefs.chatTone]}»</div>
      </div>

      {/* Свой стиль — свободное пожелание, дополняет выбранный тон */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{s.styleLabel}</div>
        <textarea
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          onBlur={saveStyle}
          maxLength={300}
          placeholder={s.stylePlaceholder}
          style={inputStyle}
        />
      </div>
    </div>
  );
}
