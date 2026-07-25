// «Живой» показ продукта на лендинге (дизайн A): голосовое в Telegram →
// AI разобрал → готовая карточка записи. Чистый JSX/CSS, без скриншотов —
// локализуется на 5 языков и не тянет чьи-то личные данные.

const STR: Record<string, {
  youSay: string; osSaves: string;
  chatApp: string; voice: string; voiceCaption: string;
  botHead: string; botMood: string; botTags: string[]; botInsight: string;
  cardApp: string; cardDate: string; cardText: string; cardChips: string[];
}> = {
  ru: {
    youSay: "Ты просто говоришь",
    osSaves: "LIFE OS сохраняет и раскладывает",
    chatApp: "Telegram · бот LIFE OS",
    voice: "Голосовое · 0:37",
    voiceCaption: "«Гуляли с Аней по набережной… и я наконец решился на свой проект»",
    botHead: "✨ Записал в твою книгу",
    botMood: "Настроение 8/10",
    botTags: ["👥 Аня", "📍 Набережная", "#прогулка"],
    botInsight: "💡 Инсайт: «решился на свой проект»",
    cardApp: "LIFE OS · Дневник",
    cardDate: "Сегодня, 21:40",
    cardText: "Гуляли с Аней по набережной. Наконец решился начать свой проект — страшно и радостно одновременно.",
    cardChips: ["🙂 8/10", "👥 Аня", "🎯 Новый проект"],
  },
  en: {
    youSay: "You just talk",
    osSaves: "LIFE OS saves and sorts it",
    chatApp: "Telegram · LIFE OS bot",
    voice: "Voice note · 0:37",
    voiceCaption: "“Walked with Anna along the river… and I finally decided to start my project”",
    botHead: "✨ Saved to your book",
    botMood: "Mood 8/10",
    botTags: ["👥 Anna", "📍 Riverside", "#walk"],
    botInsight: "💡 Insight: “decided to start my project”",
    cardApp: "LIFE OS · Diary",
    cardDate: "Today, 9:40 pm",
    cardText: "Walked with Anna along the river. Finally decided to start my own project — scary and joyful at once.",
    cardChips: ["🙂 8/10", "👥 Anna", "🎯 New project"],
  },
  uk: {
    youSay: "Ти просто говориш",
    osSaves: "LIFE OS зберігає й розкладає",
    chatApp: "Telegram · бот LIFE OS",
    voice: "Голосове · 0:37",
    voiceCaption: "«Гуляли з Анею по набережній… і я нарешті наважився на свій проєкт»",
    botHead: "✨ Записав у твою книгу",
    botMood: "Настрій 8/10",
    botTags: ["👥 Аня", "📍 Набережна", "#прогулянка"],
    botInsight: "💡 Інсайт: «наважився на свій проєкт»",
    cardApp: "LIFE OS · Щоденник",
    cardDate: "Сьогодні, 21:40",
    cardText: "Гуляли з Анею по набережній. Нарешті наважився почати свій проєкт — страшно і радісно водночас.",
    cardChips: ["🙂 8/10", "👥 Аня", "🎯 Новий проєкт"],
  },
  fr: {
    youSay: "Tu parles, c'est tout",
    osSaves: "LIFE OS sauvegarde et range",
    chatApp: "Telegram · bot LIFE OS",
    voice: "Vocal · 0:37",
    voiceCaption: "« Balade avec Anna le long du fleuve… et j'ai enfin décidé de lancer mon projet »",
    botHead: "✨ Noté dans ton livre",
    botMood: "Humeur 8/10",
    botTags: ["👥 Anna", "📍 Berges", "#balade"],
    botInsight: "💡 Insight : « décidé de lancer mon projet »",
    cardApp: "LIFE OS · Journal",
    cardDate: "Aujourd'hui, 21:40",
    cardText: "Balade avec Anna le long du fleuve. J'ai enfin décidé de lancer mon projet — effrayant et joyeux à la fois.",
    cardChips: ["🙂 8/10", "👥 Anna", "🎯 Nouveau projet"],
  },
  es: {
    youSay: "Tú solo hablas",
    osSaves: "LIFE OS lo guarda y ordena",
    chatApp: "Telegram · bot LIFE OS",
    voice: "Nota de voz · 0:37",
    voiceCaption: "«Paseamos con Ana por la ribera… y por fin me decidí a empezar mi proyecto»",
    botHead: "✨ Guardado en tu libro",
    botMood: "Ánimo 8/10",
    botTags: ["👥 Ana", "📍 Ribera", "#paseo"],
    botInsight: "💡 Insight: «me decidí a empezar mi proyecto»",
    cardApp: "LIFE OS · Diario",
    cardDate: "Hoy, 21:40",
    cardText: "Paseamos con Ana por la ribera. Por fin me decidí a empezar mi propio proyecto — da miedo y alegría a la vez.",
    cardChips: ["🙂 8/10", "👥 Ana", "🎯 Nuevo proyecto"],
  },
};

const WAVE = [7, 12, 9, 16, 11, 18, 8, 14, 10, 17, 12, 7, 15, 9, 13, 8, 11, 16, 9, 12];

function Window({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg, #fff)", border: "1px solid rgba(15,15,40,.08)", borderRadius: 18, boxShadow: "0 18px 44px -22px rgba(30,30,80,.25)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", borderBottom: "1px solid rgba(15,15,40,.06)", background: "rgba(15,15,40,.02)" }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#fc5753" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#fdbc40" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#33c748" }} />
        <span style={{ marginLeft: 8, fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

export default function ProductPeek({ locale }: { locale: string }) {
  const s = STR[locale] || STR.ru;
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 10 };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 22, alignItems: "start", maxWidth: 880, margin: "44px auto 0", textAlign: "left" }}>
      {/* Слева: как это выглядит у пользователя — голосовое в Telegram */}
      <div>
        <div style={label}>{s.youSay}</div>
        <Window title={s.chatApp}>
          {/* Голосовое сообщение */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <div style={{ background: "linear-gradient(135deg,#6d6bf6,#8b5cf6)", color: "#fff", borderRadius: "16px 16px 4px 16px", padding: "11px 14px", maxWidth: "88%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-player-play-filled" style={{ fontSize: 13 }} />
                </span>
                <span style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 20 }}>
                  {WAVE.map((h, i) => (<span key={i} style={{ width: 2.5, height: h, borderRadius: 2, background: "rgba(255,255,255,.75)" }} />))}
                </span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 6 }}>{s.voice}</div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", fontStyle: "italic", textAlign: "right", marginBottom: 12 }}>{s.voiceCaption}</div>
          {/* Ответ бота */}
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "rgba(15,15,40,.045)", borderRadius: "16px 16px 16px 4px", padding: "11px 14px", maxWidth: "92%" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>{s.botHead}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 7 }}>
                <span style={{ fontSize: 11.5, background: "var(--accent-bg, #eeeafd)", color: "var(--accent)", borderRadius: 999, padding: "3px 9px", fontWeight: 600 }}>{s.botMood}</span>
                {s.botTags.map((tg) => (<span key={tg} style={{ fontSize: 11.5, background: "rgba(15,15,40,.05)", color: "var(--text-2)", borderRadius: 999, padding: "3px 9px" }}>{tg}</span>))}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>{s.botInsight}</div>
            </div>
          </div>
        </Window>
      </div>

      {/* Справа: как это лежит в приложении — карточка записи */}
      <div>
        <div style={label}>{s.osSaves}</div>
        <Window title={s.cardApp}>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 7 }}>{s.cardDate}</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 11 }}>{s.cardText}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {s.cardChips.map((c) => (
              <span key={c} style={{ fontSize: 12, background: "var(--accent-bg, #eeeafd)", color: "var(--accent)", borderRadius: 999, padding: "4px 11px", fontWeight: 600 }}>{c}</span>
            ))}
          </div>
        </Window>
      </div>
    </div>
  );
}
