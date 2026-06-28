import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

const C = {
  ru: {
    nav_login: "Войти",
    hero_badge: "Личная операционная система жизни",
    hero_title: "Твоя жизнь заслуживает быть сохранённой",
    hero_sub:
      "Ты просто рассказываешь, как прошёл день — голосом или текстом. AI расшифровывает, раскладывает по смыслу и собирает из этого твою историю: дневник, книгу жизни, цели, здоровье, людей и места.",
    cta_create: "Создать аккаунт",
    cta_tg: "Открыть в Telegram",
    cta_hint: "Через Google или обычную почту — за минуту",

    idea_kicker: "Зачем это",
    idea_title: "Мы почти ничего не помним",
    idea_p1:
      "Через неделю ты забудешь, о чём думал сегодня. Через год — каким был этот месяц. Мы фотографируем отпуск, но почти никогда не сохраняем свои мысли, решения и идеи — а ведь именно из них и состоит жизнь.",
    idea_p2:
      "LIFE OS убирает всё трение. Не нужно ничего заполнять и систематизировать. Ты говоришь — остальное делает AI. Со временем он начинает понимать тебя: что даёт энергию, какие привычки работают, какие решения меняли твою жизнь.",

    how_kicker: "Как это работает",
    how: [
      { n: "1", t: "Рассказываешь", d: "Голосом или текстом — в Telegram-бота или прямо на сайте. Как другу: «сегодня было…»." },
      { n: "2", t: "AI понимает", d: "Расшифровывает речь, выделяет инсайты, задачи, настроение, людей и места, связывает с проектами." },
      { n: "3", t: "Видишь свою жизнь", d: "Лента, аналитика, книга жизни, карта здоровья и целей. Спрашиваешь — AI-биограф отвечает по твоим записям." },
    ],

    feat_kicker: "Что внутри",
    feats: [
      { i: "ti-book", t: "Книга жизни", d: "AI собирает из твоих дней настоящую летопись по главам и годам." },
      { i: "ti-heart-rate-monitor", t: "Здоровье", d: "Вес, энергия, самочувствие — в динамике, без ручного ведения." },
      { i: "ti-target", t: "Цели и мечты", d: "Карта желаний и задачи — AI сам достаёт их из того, что ты рассказал." },
      { i: "ti-users", t: "Люди и места", d: "Кто рядом и где ты был — само складывается в карту твоей жизни." },
      { i: "ti-sparkles", t: "Что заметил AI", d: "Закономерности, что даёт тебе энергию и счастье — взгляд со стороны." },
      { i: "ti-message-chatbot", t: "AI-биограф", d: "«Когда я был счастливее всего?» — ответ за секунды по твоим записям." },
    ],

    founder_kicker: "Об основателе",
    founder_title: "Почему я создаю LIFE OS",
    founder_paras: [
      "Меня зовут Игорь. Я начал создавать LIFE OS не как бизнес-проект, а как письмо тем, кто будет после меня.",
      "Однажды я поймал себя на простой и немного страшной мысли: я почти не помню собственную жизнь. Отпуска, разговоры, важные решения, идеи, от которых когда-то горели глаза, — всё это постепенно стирается. Фотографии остаются, но мы уже не помним, что было за кадром и почему этот день был для нас важен.",
      "А ещё я понял: всё, что я узнал за свою жизнь — мои ошибки, открытия и моменты, ради которых стоило жить, — однажды может уйти вместе со мной. Мои дети и внуки увидят фотографии, но не узнают меня настоящего. Мы сохраняем изображения своей жизни, но почти не сохраняем себя.",
      "Я хотел инструмент, который не требует дисциплины. Где достаточно просто говорить — как близкому человеку, — а технология сама понимает, что произошло, находит важное и превращает это в историю жизни. Такого не было. Поэтому я начал создавать его сам — для себя и своей семьи.",
      "LIFE OS — это мой личный дневник, память и будущая книга жизни. А теперь я открываю его для каждого, кто тоже не хочет, чтобы его опыт и самые важные моменты однажды исчезли.",
    ],
    founder_quote:
      "Я не программист и не хочу подстраивать свою жизнь под сложные системы. Я хочу просто говорить — а технология пусть делает остальное. LIFE OS создаётся не для технических специалистов, а для обычных людей.",
    founder_sign: "Игорь, основатель LIFE OS",

    testi_kicker: "Отзывы",
    testi_title: "Люди в восторге от LIFE OS",
    // TODO: заменить на реальные отзывы пользователей (пока — примеры для вёрстки)
    testi: [
      { text: "Веду LIFE OS три месяца и впервые в жизни не забросил дневник. Просто говорю в Telegram по дороге домой — а вечером читаю свою жизнь, разложенную по полочкам.", name: "Анна", role: "маркетолог" },
      { text: "Пробовал десятки приложений для заметок — всё бросал. Здесь ничего не надо настраивать: говоришь как другу, остальное делает AI.", name: "Дмитрий", role: "предприниматель" },
      { text: "Выгрузил всё в Obsidian и понял — это правда моё. Я не привязан к сервису, мои воспоминания всегда со мной.", name: "Сергей", role: "инженер" },
      { text: "Делаю это для дочери. Хочу, чтобы однажды она смогла прочитать, о чём я думала, когда она была маленькой.", name: "Мария", role: "мама в декрете" },
    ],

    trust_own: "Данные — ваши навсегда",
    trust_own_d: "Выгрузка в Markdown и Obsidian в один клик. Ваша книга жизни останется с вами — даже без интернета и без нашего сервиса.",
    trust_open: "Открытый код",
    trust_open_d: "Проект публичный — можно проверить, как всё устроено.",
    trust_priv: "Честная приватность",
    trust_priv_d: "Дневник видишь только ты. Скачать или удалить всё — в один клик.",

    final_title: "Начни первую страницу своей книги жизни",
    final_sub: "Бесплатно. Через Google или почту.",

    foot_priv: "Приватность",
    foot_code: "Код на GitHub",
  },
  en: {
    nav_login: "Sign in",
    hero_badge: "A personal operating system for your life",
    hero_title: "Your life deserves to be saved",
    hero_sub:
      "You just tell how your day went — by voice or text. AI transcribes it, makes sense of it and builds your story: a diary, a book of life, goals, health, people and places.",
    cta_create: "Create account",
    cta_tg: "Open in Telegram",
    cta_hint: "With Google or regular email — in a minute",

    idea_kicker: "Why",
    idea_title: "We remember almost nothing",
    idea_p1:
      "In a week you'll forget what you thought about today. In a year — what this month was like. We photograph our vacations but almost never save our thoughts, decisions and ideas — yet that's what life is made of.",
    idea_p2:
      "LIFE OS removes all the friction. Nothing to fill in or organize. You speak — AI does the rest. Over time it starts to understand you: what gives you energy, which habits work, which decisions changed your life.",

    how_kicker: "How it works",
    how: [
      { n: "1", t: "You tell", d: "By voice or text — to a Telegram bot or right on the site. Like to a friend: “today was…”." },
      { n: "2", t: "AI understands", d: "Transcribes speech, extracts insights, tasks, mood, people and places, links to projects." },
      { n: "3", t: "You see your life", d: "Feed, analytics, book of life, health and goals map. Ask — the AI biographer answers from your entries." },
    ],

    feat_kicker: "What's inside",
    feats: [
      { i: "ti-book", t: "Book of life", d: "AI turns your days into a real chronicle by chapters and years." },
      { i: "ti-heart-rate-monitor", t: "Health", d: "Weight, energy, wellbeing — tracked over time, no manual logging." },
      { i: "ti-target", t: "Goals & dreams", d: "A wish map and tasks — AI pulls them from what you said." },
      { i: "ti-users", t: "People & places", d: "Who's around and where you've been — your life map builds itself." },
      { i: "ti-sparkles", t: "What AI noticed", d: "Patterns, what gives you energy and happiness — an outside view." },
      { i: "ti-message-chatbot", t: "AI biographer", d: "“When was I happiest?” — answered in seconds from your entries." },
    ],

    founder_kicker: "About the founder",
    founder_title: "Why I'm building LIFE OS",
    founder_paras: [
      "My name is Igor. I started building LIFE OS not as a business, but as a letter to those who come after me.",
      "One day a simple, slightly frightening thought caught me: I barely remember my own life. Vacations, conversations, important decisions, ideas that once lit me up — all of it slowly fades. The photos remain, but we no longer recall what happened off-camera or why that day mattered.",
      "And I realized something else: everything I've learned in my life — my mistakes, discoveries and the moments worth living for — could one day leave with me. My children and grandchildren will see photos, but won't know the real me. We save the images of our lives, but we hardly save ourselves.",
      "I wanted a tool that needs no discipline. Where it's enough to just speak — like to someone close — and technology understands what happened, finds what matters and turns it into a life story. It didn't exist. So I started building it myself — for me and my family.",
      "LIFE OS is my personal diary, my memory and my future book of life. And now I'm opening it to everyone who also doesn't want their experience and most important moments to one day disappear.",
    ],
    founder_quote:
      "I'm not a programmer, and I don't want to bend my life around complex systems. I just want to speak — and let technology do the rest. LIFE OS isn't built for tech specialists; it's built for ordinary people.",
    founder_sign: "Igor, founder of LIFE OS",

    testi_kicker: "Testimonials",
    testi_title: "People love LIFE OS",
    // TODO: replace with real user testimonials (these are placeholders for layout)
    testi: [
      { text: "I've used LIFE OS for three months and for the first time I haven't abandoned a diary. I just talk into Telegram on my way home — and in the evening I read my life, neatly sorted.", name: "Anna", role: "marketer" },
      { text: "I've tried dozens of note apps and quit them all. Here there's nothing to set up: you talk like to a friend, AI does the rest.", name: "Dmitry", role: "entrepreneur" },
      { text: "I exported everything to Obsidian and realized — it's truly mine. I'm not locked to the service, my memories are always with me.", name: "Sergey", role: "engineer" },
      { text: "I'm doing this for my daughter. I want her to one day read what I was thinking when she was little.", name: "Maria", role: "mom" },
    ],

    trust_own: "Your data, forever yours",
    trust_own_d: "Export to Markdown and Obsidian in one click. Your book of life stays with you — even without internet and without our service.",
    trust_open: "Open source",
    trust_open_d: "The project is public — you can check how everything works.",
    trust_priv: "Honest privacy",
    trust_priv_d: "Only you see your diary. Export or delete everything in one click.",

    final_title: "Start the first page of your book of life",
    final_sub: "Free. With Google or email.",

    foot_priv: "Privacy",
    foot_code: "Code on GitHub",
  },
};

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = locale === "en" || locale === "fr" ? C.en : C.ru;
  const GH = "https://github.com/top15igor/life-os";
  // Реферал: пробрасываем метку на страницу входа, чтобы пригласивший засчитался.
  const ref = sp.ref && /^[A-Za-z0-9-]{3,40}$/.test(sp.ref) ? sp.ref : "";
  const loginHref = ref ? `/login?ref=${encodeURIComponent(ref)}` : "/login";

  const section: React.CSSProperties = { maxWidth: 920, margin: "0 auto", padding: "0 22px" };
  const kicker: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--accent)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 10,
  };

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100dvh" }}>
      {/* Top bar */}
      <div style={{ ...section, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <i className="ti ti-flower" style={{ fontSize: 22, color: "var(--accent)" }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>LIFE OS</span>
        </div>
        <a
          href={loginHref}
          style={{ padding: "8px 16px", borderRadius: 10, background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
        >
          {t.nav_login}
        </a>
      </div>

      {/* Hero */}
      <div style={{ ...section, textAlign: "center", padding: "44px 22px 28px" }}>
        <div
          style={{
            display: "inline-block",
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--accent-text)",
            background: "var(--accent-bg)",
            padding: "6px 13px",
            borderRadius: 999,
            marginBottom: 22,
          }}
        >
          {t.hero_badge}
        </div>
        <h1 style={{ fontSize: "clamp(30px, 6.5vw, 52px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.025em", margin: "0 0 18px" }}>
          {t.hero_title}
        </h1>
        <p style={{ fontSize: "clamp(16px, 2.4vw, 19px)", color: "var(--text-2)", lineHeight: 1.55, maxWidth: 620, margin: "0 auto 28px" }}>
          {t.hero_sub}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={loginHref} style={{ padding: "14px 26px", borderRadius: 13, background: "var(--accent)", color: "#fff", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
            {t.cta_create}
          </a>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 14 }}>{t.cta_hint}</div>
      </div>

      {/* Idea */}
      <div style={{ ...section, padding: "48px 22px" }}>
        <div style={kicker}>{t.idea_kicker}</div>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 18px" }}>{t.idea_title}</h2>
        <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 14px", maxWidth: 700 }}>{t.idea_p1}</p>
        <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.6, margin: 0, maxWidth: 700 }}>{t.idea_p2}</p>
      </div>

      {/* How */}
      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "48px 0" }}>
        <div style={section}>
          <div style={kicker}>{t.how_kicker}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginTop: 8 }}>
            {t.how.map((s) => (
              <div key={s.n}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--accent-bg)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, marginBottom: 12 }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{s.t}</div>
                <div style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.55 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ ...section, padding: "48px 22px" }}>
        <div style={kicker}>{t.feat_kicker}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginTop: 8 }}>
          {t.feats.map((f) => (
            <div key={f.t} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 18px" }}>
              <i className={`ti ${f.i}`} style={{ fontSize: 24, color: "var(--accent)" }} />
              <div style={{ fontSize: 17, fontWeight: 600, margin: "12px 0 6px" }}>{f.t}</div>
              <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.55 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Founder */}
      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "52px 0" }}>
        <div style={{ ...section, maxWidth: 720 }}>
          <div style={kicker}>{t.founder_kicker}</div>
          <h2 style={{ fontSize: "clamp(23px, 3.6vw, 30px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 18px" }}>{t.founder_title}</h2>
          {t.founder_paras.map((p, i) => (
            <p key={i} style={{ fontSize: 17, color: i === 0 ? "var(--text)" : "var(--text-2)", lineHeight: 1.65, margin: "0 0 14px" }}>{p}</p>
          ))}
          <blockquote
            style={{
              borderLeft: "3px solid var(--accent)",
              background: "var(--accent-bg)",
              borderRadius: "0 12px 12px 0",
              padding: "16px 20px",
              margin: "22px 0",
              fontSize: 17.5,
              fontWeight: 500,
              fontStyle: "italic",
              color: "var(--text)",
              lineHeight: 1.6,
            }}
          >
            {t.founder_quote}
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 999, background: "var(--accent-bg)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
              И
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{t.founder_sign}</div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ ...section, padding: "48px 22px" }}>
        <div style={kicker}>{t.testi_kicker}</div>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 24px" }}>{t.testi_title}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {t.testi.map((r, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 20px", display: "flex", flexDirection: "column" }}>
              <div style={{ color: "var(--accent)", fontSize: 14, marginBottom: 10 }}>★★★★★</div>
              <p style={{ fontSize: 15.5, color: "var(--text)", lineHeight: 1.6, margin: "0 0 16px", flex: 1 }}>«{r.text}»</p>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--accent-bg)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-3)" }}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust */}
      <div style={{ ...section, padding: "44px 22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <div style={{ display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 18px", color: "var(--text)" }}>
            <i className="ti ti-download" style={{ fontSize: 22, color: "var(--accent)" }} />
            <div style={{ fontSize: 16.5, fontWeight: 600, margin: "10px 0 5px" }}>{t.trust_own}</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{t.trust_own_d}</div>
          </div>
          <a href={GH} target="_blank" rel="noreferrer" style={{ display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 18px", textDecoration: "none", color: "var(--text)" }}>
            <i className="ti ti-brand-github" style={{ fontSize: 22 }} />
            <div style={{ fontSize: 16.5, fontWeight: 600, margin: "10px 0 5px" }}>{t.trust_open}</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{t.trust_open_d}</div>
          </a>
          <a href="/privacy" style={{ display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 18px", textDecoration: "none", color: "var(--text)" }}>
            <span style={{ fontSize: 22 }}>🔒</span>
            <div style={{ fontSize: 16.5, fontWeight: 600, margin: "10px 0 5px" }}>{t.trust_priv}</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{t.trust_priv_d}</div>
          </a>
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ ...section, textAlign: "center", padding: "20px 22px 64px" }}>
        <h2 style={{ fontSize: "clamp(23px, 4vw, 34px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>{t.final_title}</h2>
        <p style={{ fontSize: 16, color: "var(--text-2)", margin: "0 0 24px" }}>{t.final_sub}</p>
        <a href={loginHref} style={{ display: "inline-block", padding: "15px 34px", borderRadius: 13, background: "var(--accent)", color: "#fff", fontSize: 16.5, fontWeight: 600, textDecoration: "none" }}>
          {t.cta_create}
        </a>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "24px 22px" }}>
        <div style={{ ...section, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-2)", fontSize: 14 }}>
            <i className="ti ti-flower" style={{ fontSize: 16, color: "var(--accent)" }} />
            LIFE OS
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <a href="/privacy" style={{ color: "var(--text-3)", fontSize: 13, textDecoration: "none" }}>{t.foot_priv}</a>
            <a href={GH} target="_blank" rel="noreferrer" style={{ color: "var(--text-3)", fontSize: 13, textDecoration: "none" }}>{t.foot_code}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
