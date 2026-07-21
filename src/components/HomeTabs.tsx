"use client";

import { useState } from "react";
import Link from "next/link";
import CaptureChat from "./CaptureChat";
import LifeBalance from "./LifeBalance";
import Hint from "./Hint";
import PromiseList from "./PromiseList";
import HomeEditor from "./HomeEditor";
import AwarenessCard from "./AwarenessCard";
import BookWidget from "./BookWidget";

// Какие опциональные блоки показывать при каждом «акценте главной» (undefined = показать все).
const PRESET_VIS: Record<string, string[] | undefined> = {
  mindful: undefined,
  focus: ["book", "habit", "context", "changes", "focus", "stories", "tasks"],
  trace: ["book", "habit", "trace", "promises", "traceWeek", "context", "gratitude"],
  balance: ["book", "habit", "context", "metrics", "changes", "gratitude", "trace"],
  minimal: ["book", "habit", "focus", "gratitude"],
};

const DEFAULT_BLOCKS = ["book", "habit", "trace", "promises", "focus", "context", "gratitude"];
const GEAR_LABEL: Record<string, string> = { ru: "Настроить", en: "Customize", uk: "Налаштувати", fr: "Personnaliser" };
const PROFILE_LABEL: Record<string, string> = { ru: "Открыть профиль", en: "Open profile", uk: "Відкрити профіль", fr: "Ouvrir le profil" };
const ACQ: Record<string, { startT: string; startS: string; startCta: string; contT: string; contCta: string }> = {
  ru: { startT: "Давай познакомимся", startS: "Ответь на пару тёплых вопросов в боте — и твоя первая запись соберётся сама.", startCta: "Начать", contT: "Знакомство с ботом", contCta: "Продолжить" },
  en: { startT: "Let's get acquainted", startS: "Answer a couple of warm questions in the bot — and your first entry writes itself.", startCta: "Start", contT: "Getting to know you", contCta: "Continue" },
  uk: { startT: "Давай познайомимось", startS: "Дай відповідь на кілька теплих запитань у боті — і твій перший запис збереться сам.", startCta: "Почати", contT: "Знайомство з ботом", contCta: "Продовжити" },
  fr: { startT: "Faisons connaissance", startS: "Réponds à quelques questions dans le bot — et ta première entrée s'écrit toute seule.", startCta: "Commencer", contT: "On fait connaissance", contCta: "Continuer" },
};

const DAYPART_LINE: Record<string, { morning: string; day: string; evening: string; night: string }> = {
  ru: { morning: "Доброе начало. Сделай день сильным — для себя и для других.", day: "Держи фокус и не забывай о близких.", evening: "Заверши день: сохрани события, заметь добро, поблагодари.", night: "Поздний час. Если есть что сохранить за день — я рядом." },
  en: { morning: "A fresh start. Make today strong — for yourself and others.", day: "Hold your focus and remember the people close to you.", evening: "Close the day: save the events, notice the good, give thanks.", night: "Late hour. If there's anything to save from today — I'm here." },
  uk: { morning: "Добрий початок. Зроби день сильним — для себе й для інших.", day: "Тримай фокус і не забувай про близьких.", evening: "Заверши день: збережи події, поміть добро, подякуй.", night: "Пізня година. Якщо є що зберегти за день — я поруч." },
  fr: { morning: "Un bon début. Rends ta journée forte — pour toi et les autres.", day: "Garde ton focus et pense à tes proches.", evening: "Termine la journée : garde les événements, remarque le bien, remercie.", night: "Heure tardive. S'il y a quelque chose à garder de la journée — je suis là." },
};

const HS: Record<string, any> = {
  ru: { tabs: ["Сегодня", "Путь", "Наследие"], focus: "Фокус дня", tasks: "Главные задачи", gratitude: "Благодарность", memory: "Воспоминание", ask: "Спроси свою жизнь", askSub: "AI ответит из всех твоих записей", balance: "Жизненный баланс", recent: "Записи дня", noTasks: "Открытых задач нет 👌", noEntries: "Записей сегодня ещё нет — напиши пару строк выше.", goals: "Цели", projects: "Проекты", lifebook: "Книга жизни", lifebookSub: "AI собирает месяцы в главы", insights: "Главные инсайты", biographer: "AI-Биограф", legacyEmpty: "Наследие наполнится по мере записей.", memYear: (t: string) => `Год назад в этот день: «${t}»`, memMonth: (t: string) => `Месяц назад в этот день: «${t}»` },
  en: { tabs: ["Today", "Path", "Legacy"], focus: "Focus of the day", tasks: "Top tasks", gratitude: "Gratitude", memory: "Memory", ask: "Ask your life", askSub: "AI answers from all your entries", balance: "Life balance", recent: "Today's entries", noTasks: "No open tasks 👌", noEntries: "No entries today yet — write a few lines above.", goals: "Goals", projects: "Projects", lifebook: "Book of Life", lifebookSub: "AI turns months into chapters", insights: "Key insights", biographer: "AI Biographer", legacyEmpty: "Your legacy grows as you write.", memYear: (t: string) => `A year ago today: “${t}”`, memMonth: (t: string) => `A month ago today: “${t}”` },
  uk: { tabs: ["Сьогодні", "Шлях", "Спадщина"], focus: "Фокус дня", tasks: "Головні завдання", gratitude: "Вдячність", memory: "Спогад", ask: "Запитай своє життя", askSub: "AI відповість з усіх твоїх записів", balance: "Життєвий баланс", recent: "Записи дня", noTasks: "Відкритих завдань немає 👌", noEntries: "Записів сьогодні ще немає — напиши кілька рядків вище.", goals: "Цілі", projects: "Проєкти", lifebook: "Книга життя", lifebookSub: "AI збирає місяці у глави", insights: "Головні інсайти", biographer: "AI-Біограф", legacyEmpty: "Спадщина зростає з твоїми записами.", memYear: (t: string) => `Рік тому цього дня: «${t}»`, memMonth: (t: string) => `Місяць тому цього дня: «${t}»` },
  fr: { tabs: ["Aujourd'hui", "Chemin", "Héritage"], focus: "Focus du jour", tasks: "Tâches clés", gratitude: "Gratitude", memory: "Souvenir", ask: "Interroge ta vie", askSub: "L'IA répond depuis toutes tes entrées", balance: "Équilibre de vie", recent: "Entrées du jour", noTasks: "Aucune tâche en cours 👌", noEntries: "Pas encore d'entrées — écris quelques lignes ci-dessus.", goals: "Objectifs", projects: "Projets", lifebook: "Livre de vie", lifebookSub: "L'IA transforme les mois en chapitres", insights: "Insights clés", biographer: "Biographe IA", legacyEmpty: "Ton héritage grandit à mesure que tu écris.", memYear: (t: string) => `Il y a un an : « ${t} »`, memMonth: (t: string) => `Il y a un mois : « ${t} »` },
};

const HEROLINES: Record<string, string[]> = {
  ru: ["Каждый день — новая страница твоей истории. Ты пишешь её осознанно.", "Сегодня станет частью твоей жизни. Не дай ему просто исчезнуть.", "Маленькие записи сегодня — твоя память на годы вперёд.", "Ты не просто проживаешь день — ты его сохраняешь.", "Жизнь складывается из таких дней. И ты их не теряешь."],
  en: ["Every day is a new page of your story. You write it mindfully.", "Today becomes part of your life. Don't let it just vanish.", "Small notes today are your memory for years ahead.", "You don't just live the day — you keep it.", "Life is made of days like this. And you won't lose them."],
  uk: ["Кожен день — нова сторінка твоєї історії. Ти пишеш її свідомо.", "Сьогодні стане частиною твого життя. Не дай йому просто зникнути.", "Маленькі записи сьогодні — твоя пам'ять на роки вперед.", "Ти не просто проживаєш день — ти його зберігаєш.", "Життя складається з таких днів. І ти їх не втрачаєш."],
  fr: ["Chaque jour est une nouvelle page de ton histoire. Tu l'écris en conscience.", "Aujourd'hui fera partie de ta vie. Ne le laisse pas disparaître.", "De petites notes aujourd'hui — ta mémoire pour les années à venir.", "Tu ne vis pas seulement la journée — tu la gardes.", "La vie est faite de jours comme celui-ci. Et tu ne les perds pas."],
};

const QUOTES: Record<string, { text: string; author?: string }[]> = {
  ru: [{ text: "Фокусируйся на прогрессе, а не на совершенстве." }, { text: "Маленькие шаги каждый день меняют всё." }, { text: "Лучшее время начать — сегодня." }, { text: "Ты — это сумма твоих дней." }, { text: "Замечай хорошее — и его станет больше." }, { text: "Дисциплина — это форма любви к себе." }],
  en: [{ text: "Focus on progress, not perfection." }, { text: "Small steps every day change everything." }, { text: "The best time to start is today." }, { text: "You are the sum of your days." }, { text: "Notice the good — and it grows." }, { text: "Discipline is a form of self-love." }],
  uk: [{ text: "Фокусуйся на прогресі, а не на досконалості." }, { text: "Маленькі кроки щодня змінюють усе." }, { text: "Найкращий час почати — сьогодні." }, { text: "Ти — це сума твоїх днів." }, { text: "Помічай хороше — і його стане більше." }, { text: "Дисципліна — це форма любові до себе." }],
  fr: [{ text: "Concentre-toi sur le progrès, pas la perfection." }, { text: "De petits pas chaque jour changent tout." }, { text: "Le meilleur moment pour commencer, c'est aujourd'hui." }, { text: "Tu es la somme de tes jours." }, { text: "Remarque le bien — et il grandit." }, { text: "La discipline est une forme d'amour de soi." }],
};

const T0: Record<string, any> = {
  ru: { dayYear: "й день года", daysLeft: "до конца года", days: "дн.", expDay: "й день эксперимента", changed: "Что изменилось со вчера", stories: "Незавершённые истории", thought: "Мысль дня", focus: "Фокус дня", up: "Лучше", down: "Хуже", flat: "Так же", mood: "Настроение", sleep: "Сон", idea: "Новая идея", appeared: "Появилась", streakWord: "Серия", daysInRow: "дней подряд", exp: "Эксперимент", expGo: "Продолжается", yearAgo: "Год назад в этот день", monthAgo: "Месяц назад в этот день", noStories: "Здесь появятся проекты, цели и идеи, к которым стоит вернуться.", notes: "зап.", totalDays: "дней с записями", keepChain: "Запиши сегодня, чтобы не разорвать цепочку 🔥", chainKept: "Сегодня записано — цепочка продолжается ✓", startChain: "Начни свою серию — запиши сегодняшний день", traceToday: "Мой след сегодня", traceEmpty: "Сделал сегодня что-то доброе? Расскажи в записи — даже мелочь оставляет след.", promised: "Ты обещал", traceWeekT: "Твой след за неделю", deedsWord: "добрых дел", promisesWord: "обещаний выполнено", gratWord: "благодарности" },
  en: { dayYear: "th day of the year", daysLeft: "left this year", days: "d", expDay: "th day of experiment", changed: "What changed since yesterday", stories: "Unfinished stories", thought: "Thought of the day", focus: "Focus of the day", up: "Better", down: "Worse", flat: "Same", mood: "Mood", sleep: "Sleep", idea: "New idea", appeared: "Appeared", streakWord: "Streak", daysInRow: "days in a row", exp: "Experiment", expGo: "Ongoing", yearAgo: "A year ago today", monthAgo: "A month ago today", noStories: "Projects, goals and ideas worth returning to will appear here.", notes: "entries", totalDays: "days journaled", keepChain: "Write today to keep your streak 🔥", chainKept: "Logged today — streak continues ✓", startChain: "Start your streak — write today", traceToday: "My trace today", traceEmpty: "Did something kind today? Mention it in an entry — even a small thing leaves a trace.", promised: "You promised", traceWeekT: "Your trace this week", deedsWord: "good deeds", promisesWord: "promises kept", gratWord: "gratitudes" },
  uk: { dayYear: "й день року", daysLeft: "до кінця року", days: "дн.", expDay: "й день експерименту", changed: "Що змінилося з учора", stories: "Незавершені історії", thought: "Думка дня", focus: "Фокус дня", up: "Краще", down: "Гірше", flat: "Так само", mood: "Настрій", sleep: "Сон", idea: "Нова ідея", appeared: "З'явилася", streakWord: "Серія", daysInRow: "днів поспіль", exp: "Експеримент", expGo: "Триває", yearAgo: "Рік тому цього дня", monthAgo: "Місяць тому цього дня", noStories: "Тут з'являться проєкти, цілі та ідеї, до яких варто повернутися.", notes: "зап.", totalDays: "днів із записами", keepChain: "Запиши сьогодні, щоб не розірвати ланцюжок 🔥", chainKept: "Сьогодні записано — ланцюжок триває ✓", startChain: "Почни свою серію — запиши сьогоднішній день", traceToday: "Мій слід сьогодні", traceEmpty: "Зробив сьогодні щось добре? Згадай у записі — навіть дрібниця лишає слід.", promised: "Ти обіцяв", traceWeekT: "Твій слід за тиждень", deedsWord: "добрих справ", promisesWord: "обіцянок виконано", gratWord: "подяки" },
  fr: { dayYear: "e jour de l'année", daysLeft: "avant la fin de l'année", days: "j", expDay: "e jour d'expérience", changed: "Ce qui a changé depuis hier", stories: "Histoires inachevées", thought: "Pensée du jour", focus: "Focus du jour", up: "Mieux", down: "Moins bien", flat: "Pareil", mood: "Humeur", sleep: "Sommeil", idea: "Nouvelle idée", appeared: "Apparue", streakWord: "Série", daysInRow: "jours d'affilée", exp: "Expérience", expGo: "En cours", yearAgo: "Il y a un an aujourd'hui", monthAgo: "Il y a un mois aujourd'hui", noStories: "Les projets, objectifs et idées à reprendre apparaîtront ici.", notes: "entrées", totalDays: "jours notés", keepChain: "Écris aujourd'hui pour garder ta série 🔥", chainKept: "Noté aujourd'hui — la série continue ✓", startChain: "Commence ta série — écris aujourd'hui", traceToday: "Mon empreinte aujourd'hui", traceEmpty: "Tu as fait quelque chose de bien ? Dis-le dans une entrée — même un petit geste laisse une trace.", promised: "Tu as promis", traceWeekT: "Ton empreinte cette semaine", deedsWord: "bonnes actions", promisesWord: "promesses tenues", gratWord: "gratitudes" },
};

const CAT_COLOR: Record<string, string> = { health: "#ef4444", sport: "#10b981", food: "#84cc16", family: "#ec4899", business: "#3b82f6", finance: "#0ea5e9", ideas: "#f59e0b", insight: "#8b5cf6", task: "#6366f1", gratitude: "#14b8a6", travel: "#06b6d4", emotions: "#a78bfa" };
const CAT_HREF: Record<string, string> = { health: "/health", sport: "/sport", food: "/food", family: "/family", insight: "/insights" };

function Metric({ label, icon, value, suffix, color, href }: any) {
  const style: any = { background: "var(--surface-2)", borderRadius: 11, padding: "11px 13px", display: "block", textDecoration: "none", color: "var(--text)" };
  const inner = (
    <>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 5 }}><i className={`ti ${icon}`} style={{ fontSize: 15, color }} />{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, marginTop: 3 }}>{value ?? "—"}{value != null && suffix ? <span style={{ fontSize: 12, color: "var(--text-3)" }}>{suffix}</span> : null}</div>
    </>
  );
  return href ? <Link href={href} style={style}>{inner}</Link> : <div style={style}>{inner}</div>;
}

function Section({ title, children, right }: any) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function ContextCard({ icon, title, sub, href }: any) {
  const inner = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 16, color: "var(--accent)", flexShrink: 0 }} />{title}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{sub}</div>
    </>
  );
  return href
    ? <Link href={href} className="card" style={{ display: "block", textDecoration: "none", color: "var(--text)" }}>{inner}</Link>
    : <div className="card">{inner}</div>;
}

function Chip({ icon, label, value, color }: any) {
  return (
    <div className="card" style={{ padding: "10px 13px", minWidth: 132, flex: "1 1 132px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-2)" }}>
        <i className={`ti ${icon}`} style={{ fontSize: 14, color }} />{label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2, color }}>{value}</div>
    </div>
  );
}

export default function HomeTabs({ data, locale, nav, metricsLabels, qa, design, onSetDesign }: any) {
  const s = HS[locale] || HS.ru;
  const [tab, setTab] = useState(0);

  const t0 = T0[locale] || T0.ru;
  const inBookWord = (({ ru: "в книге", uk: "у книзі", en: "in your book", fr: "dans ton livre" }) as Record<string, string>)[locale] || "в книге";
  const bq = (({ ru: { label: "Вопрос для книги", cta: "Записать" }, en: { label: "A question for your book", cta: "Note" }, uk: { label: "Питання для книги", cta: "Записати" }, fr: { label: "Une question pour ton livre", cta: "Noter" } }) as Record<string, { label: string; cta: string }>)[locale] || { label: "Вопрос для книги", cta: "Записать" };
  const entriesWord = (n: number) => {
    if (locale === "en") return n === 1 ? "entry" : "entries";
    if (locale === "fr") return n === 1 ? "entrée" : "entrées";
    const a = Math.abs(n) % 100, b = a % 10;
    if (locale === "uk") return a > 10 && a < 20 ? "записів" : b === 1 ? "запис" : b > 1 && b < 5 ? "записи" : "записів";
    return a > 10 && a < 20 ? "записей" : b === 1 ? "запись" : b > 1 && b < 5 ? "записи" : "записей";
  };
  const heroPool = HEROLINES[locale] || HEROLINES.ru;
  const quotePool = QUOTES[locale] || QUOTES.ru;
  const doy = data.dayOfYear || 0;
  const heroLine = heroPool[doy % heroPool.length];
  const quote = quotePool[doy % quotePool.length];
  const daypart = data.daypart || "day";
  const [curPreset, setCurPreset] = useState<string>(data.preset || "minimal");
  const [curBlocks, setCurBlocks] = useState<string[]>(data.blocks && data.blocks.length ? data.blocks : DEFAULT_BLOCKS);
  const [editOpen, setEditOpen] = useState(false);
  const allowedBlocks = curPreset === "custom" ? (curBlocks.length ? curBlocks : undefined) : PRESET_VIS[curPreset];
  const vis = (k: string) => !allowedBlocks || allowedBlocks.includes(k);
  const dpLine = (DAYPART_LINE[locale] || DAYPART_LINE.ru)[daypart as "morning" | "day" | "evening" | "night"];

  async function persistHome(p: string, bl: string[]) {
    try { await fetch("/api/home-preset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p === "custom" ? { preset: p, blocks: bl } : { preset: p }) }); } catch {}
  }
  function choosePreset(p: string) { setCurPreset(p); persistHome(p, curBlocks); }
  function toggleBlock(k: string) {
    const next = curBlocks.includes(k) ? curBlocks.filter((x) => x !== k) : [...curBlocks, k];
    setCurBlocks(next);
    setCurPreset("custom");
    persistHome("custom", next);
  }

  const arrow = (d: string) => (d === "up" ? "ti-arrow-up-right" : d === "down" ? "ti-arrow-down-right" : "ti-arrow-right");
  const dirCol = (d: string) => (d === "up" ? "var(--positive)" : d === "down" ? "#ef4444" : "var(--text-3)");
  const dirWord = (d: string) => (d === "up" ? t0.up : d === "down" ? t0.down : t0.flat);
  const changeChips: any[] = [];
  if (data.changes?.mood) changeChips.push({ icon: arrow(data.changes.mood), label: t0.mood, value: dirWord(data.changes.mood), color: dirCol(data.changes.mood) });
  if (data.changes?.sleep) changeChips.push({ icon: arrow(data.changes.sleep), label: t0.sleep, value: dirWord(data.changes.sleep), color: dirCol(data.changes.sleep) });
  if (data.changes?.newIdea) changeChips.push({ icon: "ti-bulb", label: t0.idea, value: t0.appeared, color: "var(--energy)" });
  if (data.experiment) changeChips.push({ icon: "ti-flask-2", label: t0.exp, value: t0.expGo, color: "var(--accent)" });

  const stories = [
    ...(data.projects || []).slice(0, 3).map((p: any) => ({ icon: "ti-briefcase", title: p.name, sub: `${p.count} ${t0.notes}`, href: "/projects", color: "#3b82f6" })),
    ...(data.goals || []).slice(0, 2).map((g: any) => ({ icon: "ti-target", title: g.title, sub: `${g.progress}%`, href: "/goals", color: "var(--accent)" })),
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            {data.userName ? (
              <span>
                {data.greetWord}, <a
                  href="/profile"
                  title={PROFILE_LABEL[locale] || PROFILE_LABEL.ru}
                  aria-label={PROFILE_LABEL[locale] || PROFILE_LABEL.ru}
                  style={{ color: "inherit", textDecoration: "none", fontWeight: 600, borderBottom: "1px dashed var(--accent)", paddingBottom: 1 }}
                >{data.userName}</a>
                <a
                  href="/profile"
                  title={PROFILE_LABEL[locale] || PROFILE_LABEL.ru}
                  aria-label={PROFILE_LABEL[locale] || PROFILE_LABEL.ru}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 999, background: "var(--accent-bg)", color: "var(--accent-text)", marginLeft: 8, verticalAlign: "middle" }}
                ><i className="ti ti-user-circle" style={{ fontSize: 17 }} /></a>
              </span>
            ) : (
              <span>{data.greetWord}</span>
            )}
            <Hint text={data.hint} />
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>{data.dateLine}</div>
        </div>
        {tab === 0 && (
          <button onClick={() => setEditOpen(true)} title={GEAR_LABEL[locale] || GEAR_LABEL.ru} aria-label={GEAR_LABEL[locale] || GEAR_LABEL.ru} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer", flexShrink: 0 }}>
            <i className="ti ti-settings" style={{ fontSize: 19 }} />
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", borderRadius: 12, padding: 4 }}>
          {s.tabs.map((label: string, i: number) => (
            <button key={i} onClick={() => setTab(i)} style={{ fontSize: 13.5, fontWeight: 500, padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === i ? "var(--surface)" : "transparent", color: tab === i ? "var(--text)" : "var(--text-2)" }}>{label}</button>
          ))}
        </div>
      </div>

      {editOpen && <HomeEditor locale={locale} preset={curPreset} blocks={curBlocks} onPreset={choosePreset} onToggleBlock={toggleBlock} onClose={() => setEditOpen(false)} />}

      {tab === 0 && (
        <div className="fade-up">
          <CaptureChat qa={qa} locale={locale} />

          {/* Знакомство: приглашение (0%) или прогресс (1–99%). На 100% — скрыто. */}
          {data.acquaintLink && data.acquaintPct < 100 && (() => {
            const a = ACQ[locale] || ACQ.ru;
            const started = data.acquaintPct > 0;
            return (
              <a href={data.acquaintLink} target="_blank" rel="noreferrer"
                style={{ display: "block", marginBottom: 12, padding: "12px 14px", borderRadius: 14, border: "1px solid var(--accent)", background: "var(--accent-bg)", textDecoration: "none", color: "var(--text)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🌱</span>
                  <span style={{ fontSize: 14.5, fontWeight: 600, flex: 1 }}>{started ? a.contT : a.startT}</span>
                  <span style={{ fontSize: 12.5, color: "var(--accent-text)", fontWeight: 600, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3 }}>{started ? a.contCta : a.startCta}<i className="ti ti-arrow-right" style={{ fontSize: 13 }} /></span>
                </div>
                {started ? (
                  <div style={{ marginTop: 9 }}>
                    <div style={{ height: 7, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
                      <div style={{ width: `${data.acquaintPct}%`, height: "100%", borderRadius: 99, background: "var(--accent)" }} />
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--accent-text)", fontWeight: 600, marginTop: 4 }}>{data.acquaintPct}%</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, marginTop: 4 }}>{a.startS}</div>
                )}
              </a>
            );
          })()}

          {data.bookPrompt && (
            <button
              onClick={() => {
                // Фокус — СИНХРОННО в жесте тапа, иначе на iOS клавиатура не всплывает.
                const el = document.getElementById("lifeos-capture-input") as HTMLTextAreaElement | null;
                el?.focus();
                window.dispatchEvent(new Event("lifeos-open-capture"));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 12, padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--accent-bg)", cursor: "pointer", color: "var(--text)", fontFamily: "inherit" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--accent-text)", fontWeight: 600 }}>
                <i className="ti ti-book-2" style={{ fontSize: 14, color: "var(--accent)" }} />{bq.label} · {data.bookPrompt.title}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.4 }}>{data.bookPrompt.question}</span>
                <span style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 600, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3 }}>{bq.cta}<i className="ti ti-arrow-up" style={{ fontSize: 13 }} /></span>
              </div>
            </button>
          )}

          {curPreset === "mindful" ? (
            <AwarenessCard locale={locale} totalDays={data.habit?.totalDays || 0} />
          ) : curPreset === "minimal" ? null : (
            <div className="soft-hero" style={{ borderRadius: 18, padding: "22px", marginBottom: 16, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.45, maxWidth: 520, letterSpacing: "-0.01em" }}>{heroLine}</div>
              <div style={{ fontSize: 13.5, color: "var(--accent-text)", marginTop: 9, fontWeight: 500, lineHeight: 1.45, maxWidth: 520 }}>{dpLine}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, color: "var(--accent)", fontWeight: 600 }}><i className="ti ti-sparkles" />LIFE OS</div>
            </div>
          )}

          {curPreset === "minimal" && (data.habit || (data.book && data.book.entries > 0)) && (
            <Link href="/health" className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", flexWrap: "wrap", rowGap: 8, textDecoration: "none", color: "var(--text)" }}>
              {data.habit && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 500 }}>
                  <span style={{ fontSize: 17, filter: data.habit.streak > 0 ? "none" : "grayscale(1)", opacity: data.habit.streak > 0 ? 1 : 0.5 }}>🔥</span>
                  {data.habit.streak} <span style={{ color: "var(--text-2)", fontWeight: 400 }}>{t0.daysInRow}</span>
                </span>
              )}
              {data.book && data.book.entries > 0 && (
                <>
                  <span style={{ color: "var(--text-3)" }}>·</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 500 }}>
                    <i className="ti ti-book-2" style={{ fontSize: 16, color: "var(--accent)" }} />{data.book.entries} {entriesWord(data.book.entries)} <span style={{ color: "var(--text-2)", fontWeight: 400 }}>{inBookWord}</span>
                  </span>
                </>
              )}
              <span style={{ flex: 1 }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
                <i className="ti ti-chart-histogram" style={{ fontSize: 16 }} />Дашборд
                <i className="ti ti-chevron-right" style={{ fontSize: 15 }} />
              </span>
            </Link>
          )}

          {curPreset !== "minimal" && vis("book") && data.book && <BookWidget book={data.book} locale={locale} />}

          {curPreset !== "minimal" && vis("habit") && data.habit && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 24, lineHeight: 1, filter: data.habit.streak > 0 ? "none" : "grayscale(1)", opacity: data.habit.streak > 0 ? 1 : 0.5 }}>🔥</span>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1 }}>{data.habit.streak}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t0.daysInRow}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "right" }}>{data.habit.totalDays} {t0.totalDays}</div>
              </div>
              <div style={{ display: "flex", gap: 5, marginBottom: 11, flexWrap: "wrap" }}>
                {data.habit.chain.map((d: any, i: number) => {
                  const isToday = i === data.habit.chain.length - 1;
                  return (
                    <span key={i} title={d.date} style={{ width: 15, height: 15, borderRadius: 5, flexShrink: 0, background: d.active ? "#f97316" : "var(--surface-2)", border: isToday ? "2px solid var(--accent)" : "1px solid var(--border)", boxSizing: "border-box" }} />
                  );
                })}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: data.habit.wroteToday ? "var(--positive)" : "var(--text-2)" }}>
                {data.habit.totalDays === 0 ? t0.startChain : data.habit.wroteToday ? t0.chainKept : t0.keepChain}
              </div>
            </div>
          )}

          {vis("trace") && (
          <Section title={t0.traceToday}>
            {data.todayDeeds && data.todayDeeds.length > 0 ? (
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {data.todayDeeds.map((d: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14.5, lineHeight: 1.45 }}>
                    <i className="ti ti-heart" style={{ fontSize: 16, color: "#ec4899", flexShrink: 0, marginTop: 2 }} />{d}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5 }}>{t0.traceEmpty}</div>
            )}
          </Section>
          )}

          {vis("promises") && data.promises && data.promises.length > 0 && (
            <Section title={t0.promised} right={<Link href="/trace" style={{ fontSize: 12.5, color: "var(--accent)" }}>→</Link>}>
              <PromiseList promises={data.promises} locale={locale} />
            </Section>
          )}

          {vis("traceWeek") && data.traceWeek && (data.traceWeek.deeds || data.traceWeek.promisesDone || data.traceWeek.gratitude) ? (
            <Link href="/trace" className="card" style={{ display: "block", marginBottom: 22, textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-2)", marginBottom: 11 }}><i className="ti ti-heart-handshake" style={{ color: "#ec4899" }} />{t0.traceWeekT}</div>
              <div style={{ display: "flex", gap: 20 }}>
                <div><div style={{ fontSize: 22, fontWeight: 700 }}>{data.traceWeek.deeds}</div><div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t0.deedsWord}</div></div>
                <div><div style={{ fontSize: 22, fontWeight: 700 }}>{data.traceWeek.promisesDone}</div><div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t0.promisesWord}</div></div>
                <div><div style={{ fontSize: 22, fontWeight: 700 }}>{data.traceWeek.gratitude}</div><div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t0.gratWord}</div></div>
              </div>
            </Link>
          ) : null}

          {vis("context") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
            <ContextCard icon="ti-calendar" title={`${data.dayOfYear}${t0.dayYear}`} sub={`${t0.daysLeft}: ${data.daysLeft} ${t0.days}`} />
            {data.experiment && <ContextCard icon="ti-flask-2" title={`${data.experiment.day}${t0.expDay}`} sub={data.experiment.title} href="/lab" />}
            {data.memory && <ContextCard icon="ti-book" title={data.memory.period === "year" ? t0.yearAgo : t0.monthAgo} sub={data.memory.summary} href="/diary" />}
          </div>
          )}

          {vis("metrics") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 9, marginBottom: 18 }}>
            <Metric label={metricsLabels.mood} icon="ti-mood-smile" value={data.mood} suffix="/10" color="var(--accent)" href="/analytics" />
            <Metric label={metricsLabels.energy} icon="ti-bolt" value={data.energy} suffix="/10" color="var(--energy)" href="/health?tab=energy" />
            <Metric label={metricsLabels.health} icon="ti-heart" value={data.health} suffix="/10" color="var(--health)" href="/health" />
          </div>
          )}

          {vis("changes") && changeChips.length > 0 && (
            <Section title={t0.changed}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {changeChips.map((c, i) => <Chip key={i} {...c} />)}
              </div>
            </Section>
          )}

          {vis("focus") && data.focus && (
            <div className="card" style={{ display: "flex", gap: 11, marginBottom: 22, alignItems: "flex-start" }}>
              <i className="ti ti-target" style={{ fontSize: 20, color: "#3b82f6", flexShrink: 0, marginTop: 1 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 2 }}>{t0.focus}</div>
                <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.4 }}>{data.focus}</div>
              </div>
            </div>
          )}

          {vis("stories") && stories.length > 0 && (
            <Section title={t0.stories} right={<Link href="/projects" style={{ fontSize: 12.5, color: "var(--accent)" }}>→</Link>}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 9 }}>
                {stories.map((st, i) => (
                  <Link key={i} href={st.href} className="card" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <i className={`ti ${st.icon}`} style={{ fontSize: 18, color: st.color, flexShrink: 0, marginTop: 1 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{st.sub}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {vis("tasks") && data.openTasks.length > 0 && (
            <Section title={s.tasks}>
              <div className="card">
                {data.openTasks.map((tk: any) => (
                  <div key={tk.id} style={{ fontSize: 13.5, padding: "5px 0", display: "flex", gap: 8 }}><i className="ti ti-square" style={{ fontSize: 16, color: "var(--text-3)" }} />{tk.text}</div>
                ))}
              </div>
            </Section>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 12, marginBottom: 22 }}>
            {vis("gratitude") && data.gratitude.length > 0 && (
              <div className="card" style={{ background: "#E1F5EE", border: "none" }}>
                <div style={{ fontSize: 12, color: "#04342C", opacity: 0.7, marginBottom: 6 }}>{s.gratitude}</div>
                {data.gratitude.map((g: string, k: number) => (<div key={k} style={{ fontSize: 13.5, padding: "3px 0", color: "#04342C" }}>🙏 {g}</div>))}
              </div>
            )}
            <div className="card" style={{ background: "var(--surface-2)", border: "none" }}>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 6 }}>{t0.thought}</div>
              <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.5 }}>“{quote.text}”</div>
              {quote.author && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>— {quote.author}</div>}
            </div>
          </div>

          <Section title={s.recent}>
            {data.today.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "26px 18px" }}>
                <i className="ti ti-notebook" style={{ fontSize: 30, color: "var(--text-3)", display: "block", marginBottom: 8 }} />
                <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{s.noEntries}</div>
              </div>
            ) : (
              data.today.map((e: any) => (
                <Link key={e.id} href={`/entry/${e.id}`} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border)" }}>
                  <div style={{ flexShrink: 0, width: 48, textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 500 }}>{e.time}</div><i className={`ti ${e.source === "telegram_voice" ? "ti-microphone" : "ti-message"}`} style={{ fontSize: 13, color: "var(--text-3)" }} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 6 }}>{e.summary}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {e.cats.map((c: any) => (<span key={c.slug} style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 7, background: "var(--surface-2)", color: CAT_COLOR[c.slug] || "var(--text-2)" }}>{c.name}</span>))}
                      {e.tags.map((tg: string) => (<span key={tg} style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 7, color: "var(--accent)" }}>#{tg}</span>))}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </Section>

          <Link href="/biographer" className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <i className="ti ti-messages" style={{ fontSize: 22, color: "var(--insight)" }} />
            <div><div style={{ fontSize: 14, fontWeight: 500 }}>{s.ask}</div><div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{s.askSub}</div></div>
            <i className="ti ti-arrow-right" style={{ marginLeft: "auto", color: "var(--text-3)" }} />
          </Link>
        </div>
      )}

      {tab === 1 && (
        <div className="fade-up">
          <Section title={s.goals} right={<Link href="/goals" style={{ fontSize: 12.5, color: "var(--accent)" }}>→</Link>}>
            {data.goals.length === 0 ? (
              <Link href="/goals" className="card" style={{ display: "block", color: "var(--text-2)", fontSize: 14 }}>+ {s.goals}</Link>
            ) : (
              data.goals.map((g: any, i: number) => (
                <Link key={i} href="/goals" className="card" style={{ display: "block", marginBottom: 8 }}>
                  <div style={{ fontSize: 14, marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}><i className="ti ti-target" style={{ color: "var(--accent)", fontSize: 16 }} />{g.title}</div>
                  <div style={{ height: 6, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden", marginBottom: 3 }}><div style={{ width: `${g.progress}%`, height: "100%", background: "var(--accent)" }} /></div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{g.progress}%</div>
                </Link>
              ))
            )}
          </Section>

          <LifeBalance locale={locale} />

          {data.projects.length > 0 && (
            <Section title={s.projects} right={<Link href="/projects" style={{ fontSize: 12.5, color: "var(--accent)" }}>→</Link>}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                {data.projects.map((p: any) => (
                  <Link key={p.name} href="/projects" className="card" style={{ display: "flex", alignItems: "center", gap: 9 }}><i className="ti ti-briefcase" style={{ color: "#3b82f6", fontSize: 18 }} /><div style={{ minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: 11, color: "var(--text-3)" }}>{p.count}</div></div></Link>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {tab === 2 && (
        <div className="fade-up">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 18 }}>
            <Link href="/lifebook" className="card"><div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}><i className="ti ti-book-2" style={{ color: "var(--accent)", fontSize: 19 }} /><span style={{ fontSize: 14, fontWeight: 500 }}>{s.lifebook}</span></div><div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{s.lifebookSub}</div></Link>
            <Link href="/biographer" className="card"><div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}><i className="ti ti-messages" style={{ color: "var(--insight)", fontSize: 19 }} /><span style={{ fontSize: 14, fontWeight: 500 }}>{s.biographer}</span></div><div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{s.askSub}</div></Link>
          </div>

          <Section title={s.insights} right={<Link href="/insights" style={{ fontSize: 12.5, color: "var(--accent)" }}>→</Link>}>
            {data.insights.length === 0 ? (
              <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.legacyEmpty}</div>
            ) : (
              <div className="card">
                {data.insights.map((it: string, k: number) => (<div key={k} style={{ fontSize: 13.5, lineHeight: 1.55, padding: "5px 0", display: "flex", gap: 8 }}><i className="ti ti-bulb" style={{ color: "var(--energy)", fontSize: 16, marginTop: 1 }} />{it}</div>))}
              </div>
            )}
          </Section>

          <Link href="/people" className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <i className="ti ti-user-heart" style={{ fontSize: 22, color: "#ec4899" }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>{nav.people}</div>
            <i className="ti ti-arrow-right" style={{ marginLeft: "auto", color: "var(--text-3)" }} />
          </Link>
        </div>
      )}
    </div>
  );
}
