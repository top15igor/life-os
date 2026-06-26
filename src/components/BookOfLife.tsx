"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { intlOf } from "@/lib/i18n";

// ===== «Моя жизнь, [год]» — книга-летопись из записей =====

const STR: Record<string, any> = {
  ru: {
    almost: "Твоя книга за", growing: "растёт", pastReady: "готова к сборке", filledLabel: "наполнено",
    yearProgressLine: (p: number) => `Год прожит на ${p}% — книга наполняется вместе с тобой и будет дополняться до конца года.`,
    lifeCaption: "пишется всю жизнь",
    lifeProgressLine: (n: string) => `Автобиография пишется всю жизнь — у неё нет «готово». Пока записано: ${n}. Чем больше записей, тем живее и полнее книга.`,
    statHas: "есть материал", statSome: "немного материала", statEmpty: "пока пусто",
    lifeBook: "История моей жизни", allLife: "Вся жизнь",
    lifeSubtitle: "Автобиография всей моей жизни — написанная мной самим, при жизни, и оставленная следующим поколениям. Не просто факты обо мне, а моя жизнь, прожитая рядом со мной: мои решения, мой голос, мои уроки.",
    found: "LIFE OS собрал из твоих записей",
    entries: "записей", days: "дней", peopleW: "людей", places: "мест", voice: "голосовых",
    ready: "готовность", openBook: "Открыть книгу", build: "Собрать мою книгу",
    giftLine: "Подари близким не очередную вещь, а целый год, прожитый вместе с тобой. Книга, которую твоя семья будет перечитывать через поколения.",
    type: "Тип книги", recipient: "Кому книга",
    types: { year: "Мой год", gift: "Для близких", family: "Семейная", lifestory: "История жизни" },
    recipients: { self: "Себе", parents: "Родителям", children: "Детям", partner: "Партнёру", family: "Семье" },
    contents: "Оглавление", dedication: "Посвящение",
    dedicationPh: "Кому ты посвящаешь эту книгу? Например: «Моим детям — чтобы вы знали меня настоящим».",
    letterSelf: "Письмо себе в следующий год", letterSelfPh: "Что бы ты хотел сказать себе через год?",
    letterClose: "Письмо близким", letterClosePh: "Слова тем, кто дорог. Их прочитают однажды.",
    save: "Сохранить", saved: "Сохранено ✓", saving: "Сохраняю…",
    open: "Открыть", close: "Свернуть", building: "AI пишет главу…", rebuild: "Пересобрать",
    addMore: "Добавь записей, чтобы наполнить главу", empty: "Книга начнётся, когда появятся записи за этот период.",
    monthsOpen: "Открыть месяц",
    full: "Получить полную книгу", fullSub: "Цифровая версия, печать в твёрдой обложке или подарочный комплект для семьи.",
    order: "Оставить заявку", ordered: "Заявка отправлена ✓ — мы свяжемся.", ordering: "Отправляю…",
    soon: "печать скоро", tiersNote: "Цены — предварительные, на этапе тестирования.",
    readTitle: "Моя жизнь", by: "Автор", print: "Скачать / Печать (PDF)", closeReader: "Закрыть",
    buildAll: "Собрать все главы", reading: "Читать книгу",
    overviewStrip: { entries: "записей", days: "дней с записями", people: "людей рядом", places: "мест" },
    chapTitles: { overview: "Год в одном взгляде", months: "Двенадцать глав года", family: "Семья и близкие", health: "Здоровье и спорт", work: "Работа и проекты", travel: "Путешествия и места", trace: "Мой след", self: "Что я понял о себе", people: "Люди, которым я благодарен", lessons: "Главные уроки года" },
    chapTitlesLife: { overview: "Жизнь в одном взгляде", months: "Главы по месяцам", lessons: "Главные уроки жизни" },
    dataLabels: { peopleYear: "Люди этого периода", placesYear: "Места", projects: "Проекты и дела", deeds: "Добрых дел", promises: "Обещаний выполнено", gratitude: "Благодарностей", mood: "Настроение", energy: "Энергия", health: "Здоровье", avg: "в среднем", highlights: "Яркие моменты" },
  },
  en: {
    almost: "Your book of", growing: "is growing", pastReady: "is ready to assemble", filledLabel: "filled",
    yearProgressLine: (p: number) => `The year is ${p}% lived — the book grows with you and keeps filling until December.`,
    lifeCaption: "written for a lifetime",
    lifeProgressLine: (n: string) => `An autobiography is written across a whole life — it has no “done”. So far recorded: ${n}. The more you write, the richer and fuller the book.`,
    statHas: "has material", statSome: "some material", statEmpty: "empty so far",
    lifeBook: "The Story of My Life", allLife: "Whole life",
    lifeSubtitle: "The autobiography of my whole life — written by me, in my own words, while I lived it, and left for the generations to come. Not just facts about me, but my life lived alongside me: my decisions, my voice, my lessons.",
    found: "LIFE OS gathered from your entries",
    entries: "entries", days: "days", peopleW: "people", places: "places", voice: "voice notes",
    ready: "ready", openBook: "Open the book", build: "Build my book",
    giftLine: "Give your loved ones not another thing, but a whole year lived alongside you. A book your family will reread for generations.",
    type: "Book type", recipient: "Recipient",
    types: { year: "My year", gift: "For loved ones", family: "Family", lifestory: "Life story" },
    recipients: { self: "Myself", parents: "Parents", children: "Children", partner: "Partner", family: "Family" },
    contents: "Contents", dedication: "Dedication",
    dedicationPh: "Who do you dedicate this book to?",
    letterSelf: "Letter to next year's self", letterSelfPh: "What would you tell yourself a year from now?",
    letterClose: "Letter to loved ones", letterClosePh: "Words for those you love. They'll read them one day.",
    save: "Save", saved: "Saved ✓", saving: "Saving…",
    open: "Open", close: "Collapse", building: "AI is writing the chapter…", rebuild: "Rebuild",
    addMore: "Add entries to fill this chapter", empty: "The book begins once you have entries for this period.",
    monthsOpen: "Open month",
    full: "Get the full book", fullSub: "Digital, hardcover print, or a gift set for the family.",
    order: "Request it", ordered: "Request sent ✓ — we'll reach out.", ordering: "Sending…",
    soon: "print coming soon", tiersNote: "Prices are preliminary, in testing.",
    readTitle: "My life", by: "By", print: "Download / Print (PDF)", closeReader: "Close",
    buildAll: "Build all chapters", reading: "Read the book",
    overviewStrip: { entries: "entries", days: "days journaled", people: "people close by", places: "places" },
    chapTitles: { overview: "The year at a glance", months: "Twelve chapters of the year", family: "Family & loved ones", health: "Health & sport", work: "Work & projects", travel: "Travels & places", trace: "My trace", self: "What I learned about myself", people: "People I'm grateful to", lessons: "Key lessons of the year" },
    chapTitlesLife: { overview: "Life at a glance", months: "Chapters by month", lessons: "Key lessons of my life" },
    dataLabels: { peopleYear: "People of this period", placesYear: "Places", projects: "Projects & work", deeds: "Good deeds", promises: "Promises kept", gratitude: "Gratitudes", mood: "Mood", energy: "Energy", health: "Health", avg: "on average", highlights: "Bright moments" },
  },
};
STR.uk = STR.ru;
STR.fr = STR.en;

const TIERS = [
  { id: "digital", name: "Digital", price: "19–29 €", icon: "ti-device-tablet", desc: { ru: "Цифровая книга + PDF", en: "Digital book + PDF" } },
  { id: "classic", name: "Classic", price: "69–99 €", icon: "ti-book", desc: { ru: "Печать, мягкая обложка", en: "Softcover print" } },
  { id: "gift", name: "Gift", price: "119–159 €", icon: "ti-gift", desc: { ru: "Твёрдая обложка, подарочная", en: "Hardcover gift edition" } },
  { id: "family", name: "Family", price: "179–299 €", icon: "ti-users", desc: { ru: "Семейный комплект", en: "Family set" } },
];

// Склонение чисел для RU/UK: forms = [1, 2-4, 5+]
const RUFORMS: Record<string, [string, string, string]> = {
  entries: ["запись", "записи", "записей"],
  days: ["день", "дня", "дней"],
  people: ["человек", "человека", "человек"],
  places: ["место", "места", "мест"],
  voice: ["голосовое", "голосовых", "голосовых"],
};
function plRu(n: number, f: [string, string, string]): string {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return f[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return f[1];
  return f[2];
}

function Ring({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={6} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size / 4} fontWeight={600} fill="var(--text)">{pct}%</text>
    </svg>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 5, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: pct >= 60 ? "var(--positive)" : pct >= 25 ? "var(--accent)" : "var(--text-3)" }} />
    </div>
  );
}

export default function BookOfLife({ book, meta, years, year, locale, userName }: any) {
  const s = STR[locale] || STR.ru;
  const router = useRouter();
  const isLife = year === 0;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // мета (посвящение/письма/тип/получатель)
  const [m, setM] = useState({ dedication: meta.dedication, letter_self: meta.letter_self, letter_close: meta.letter_close, recipient: meta.recipient || "self", book_type: meta.book_type || "year" });
  const [savedFlag, setSavedFlag] = useState<string | null>(null);
  const [savingFlag, setSavingFlag] = useState(false);

  async function saveMeta(patch: any, flag?: string) {
    setSavingFlag(true);
    setM((x) => ({ ...x, ...patch }));
    await fetch("/api/book/meta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ year, ...patch }) }).catch(() => {});
    setSavingFlag(false);
    if (flag) { setSavedFlag(flag); setTimeout(() => setSavedFlag((f) => (f === flag ? null : f)), 1800); }
  }

  // главы: AI-разделы и месяцы (общий кэш для оглавления и ридера)
  const [ai, setAi] = useState<Record<string, any>>(meta.sections || {});
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [months, setMonths] = useState<Record<string, any>>({});
  const [monthLoading, setMonthLoading] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [reader, setReader] = useState(false);

  async function loadAi(type: string, fresh = false) {
    setAiLoading(type);
    const r = await fetch("/api/book/section", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, year, fresh }) }).then((x) => x.json()).catch(() => null);
    setAi((c) => ({ ...c, [type]: r?.ok ? r.section : null }));
    setAiLoading(null);
    return r?.section || null;
  }
  async function loadMonth(month: string) {
    if (months[month] !== undefined) return;
    setMonthLoading(month);
    const r = await fetch(`/api/lifebook?month=${month}`).then((x) => x.json()).catch(() => null);
    setMonths((c) => ({ ...c, [month]: r?.ok ? r.chapter : null }));
    setMonthLoading(null);
  }

  function monthLabel(month: string) {
    return new Intl.DateTimeFormat(intlOf(locale as any), { month: "long", year: "numeric" }).format(new Date(month + "-01T12:00:00"));
  }

  const st = book.stats;
  const titleOf = (k: string) => (isLife && s.chapTitlesLife?.[k]) || s.chapTitles[k] || k;

  // Слово с правильным склонением (RU/UK) или статичное (EN/FR).
  const ru = locale === "ru" || locale === "uk";
  const word = (n: number, key: string, fallback: string) => (ru && RUFORMS[key] ? plRu(n, RUFORMS[key]) : fallback);

  // ===== деривативный (детерминированный) контент для data-глав =====
  function dataChapter(key: string) {
    const L = s.dataLabels;
    if (key === "family") return <NameList items={book.people} label={L.peopleYear} icon="ti-user-heart" color="#ec4899" />;
    if (key === "travel") return <NameList items={book.places} label={L.placesYear} icon="ti-map-pin" color="#06b6d4" />;
    if (key === "work") return <NameList items={book.projects} label={L.projects} icon="ti-briefcase" color="#3b82f6" />;
    if (key === "health") return (
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {[["mood", st.mood], ["energy", st.energy], ["health", st.health]].filter(([, v]) => v != null).map(([k, v]: any) => (
          <div key={k}><div style={{ fontSize: 22, fontWeight: 700 }}>{v}<span style={{ fontSize: 12, color: "var(--text-3)" }}>/10</span></div><div style={{ fontSize: 12, color: "var(--text-3)" }}>{L[k]} {L.avg}</div></div>
        ))}
      </div>
    );
    if (key === "trace") return (
      <div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: book.highlights.length ? 12 : 0 }}>
          <Num n={st.deeds} label={L.deeds} /><Num n={st.promisesDone} label={L.promises} /><Num n={st.gratitude} label={L.gratitude} />
        </div>
        {book.highlights.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 6 }}>{L.highlights}</div>
            {book.highlights.map((h: any, i: number) => <div key={i} style={{ fontSize: 13.5, lineHeight: 1.5, padding: "3px 0", color: "var(--text)" }}>· {h.text}</div>)}
          </div>
        )}
      </div>
    );
    return null;
  }

  function aiBody(type: string) {
    const sec = ai[type];
    if (!sec) return null;
    const lines = String(sec.body || "").split("\n").filter((l: string) => l.trim());
    const isList = lines.length > 1 && lines.filter((l) => /^[—\-•]/.test(l.trim())).length >= lines.length - 1;
    return (
      <div className="fade-up">
        {sec.title && <div style={{ fontSize: 16, fontWeight: 500, fontFamily: "var(--font-serif, Georgia, serif)", marginBottom: 8 }}>{sec.title}</div>}
        {isList ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {lines.map((l, i) => <div key={i} style={{ fontSize: 14.5, lineHeight: 1.6, display: "flex", gap: 8 }}><span style={{ color: "var(--accent)" }}>—</span>{l.replace(/^[—\-•]\s*/, "")}</div>)}
          </div>
        ) : (
          <div style={{ fontSize: 14.5, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{sec.body}</div>
        )}
      </div>
    );
  }

  if (st.entries === 0 && years.every((y: any) => y.count === 0)) {
    return <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>;
  }

  return (
    <div>
      {/* выбор года / «вся жизнь» */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
        {years.map((y: any) => (
          <button key={y.year} onClick={() => router.push(`/lifebook?year=${y.year}`)} style={chip(year === y.year)}>{y.year}<span style={{ opacity: 0.6, fontSize: 11, marginLeft: 5 }}>{y.count}</span></button>
        ))}
        <button onClick={() => router.push(`/lifebook?year=0`)} style={chip(isLife)}>{s.allLife}</button>
      </div>

      {/* ГЕРОЙ */}
      <div style={{ borderRadius: 20, padding: "24px 22px", marginBottom: 18, background: "linear-gradient(135deg, var(--accent-bg), #fdf2f8 55%, #fff7ed)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              {isLife ? s.lifeBook : `${s.almost} ${year} ${book.stage === "past" ? s.pastReady : s.growing}`}
            </div>
            <div style={{ fontSize: 13, color: "var(--accent-text)", marginTop: 6 }}>
              {s.found}: <b>{st.entries}</b> {word(st.entries, "entries", s.entries)} · <b>{st.days}</b> {word(st.days, "days", s.days)} · <b>{st.people}</b> {word(st.people, "people", s.peopleW)} · <b>{st.places}</b> {word(st.places, "places", s.places)}{st.voice ? <> · <b>{st.voice}</b> {word(st.voice, "voice", s.voice)}</> : null}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {isLife ? (
              <i className="ti ti-infinity" style={{ fontSize: 44, color: "var(--accent)" }} />
            ) : (
              <Ring pct={book.readiness} size={68} />
            )}
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{isLife ? s.lifeCaption : s.filledLabel}</span>
          </div>
        </div>
        {book.stage === "current" && !isLife && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "var(--accent-text)", lineHeight: 1.5, marginTop: 14, maxWidth: 560, background: "rgba(255,255,255,0.5)", borderRadius: 10, padding: "9px 12px" }}>
            <i className="ti ti-calendar-stats" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} />{s.yearProgressLine(book.yearProgress)}
          </div>
        )}
        {isLife && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "var(--accent-text)", lineHeight: 1.5, marginTop: 14, maxWidth: 560, background: "rgba(255,255,255,0.5)", borderRadius: 10, padding: "9px 12px" }}>
            <i className="ti ti-infinity" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} />{s.lifeProgressLine(`${st.entries} ${word(st.entries, "entries", s.entries)}`)}
          </div>
        )}
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55, marginTop: 14, maxWidth: 560 }}>{isLife ? s.lifeSubtitle : s.giftLine}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button onClick={() => setReader(true)} style={btnPrimary}>
            <i className="ti ti-book-2" style={{ fontSize: 17 }} />{book.readiness > 0 ? s.openBook : s.build}
          </button>
        </div>
      </div>

      {/* тип книги + получатель */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 18 }}>
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 9 }}>{s.type}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.keys(s.types).map((k) => <button key={k} onClick={() => saveMeta({ book_type: k })} style={chip(m.book_type === k)}>{s.types[k]}</button>)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 9 }}>{s.recipient}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.keys(s.recipients).map((k) => <button key={k} onClick={() => saveMeta({ recipient: k })} style={chip(m.recipient === k)}>{s.recipients[k]}</button>)}
          </div>
        </div>
      </div>

      {/* ПОСВЯЩЕНИЕ */}
      <Field label={s.dedication} value={m.dedication} ph={s.dedicationPh} onSave={(v) => saveMeta({ dedication: v }, "ded")} saved={savedFlag === "ded"} saving={savingFlag} s={s} icon="ti-quote" />

      {/* ОГЛАВЛЕНИЕ */}
      <div style={{ fontSize: 16, fontWeight: 500, margin: "22px 0 10px" }}>{s.contents}</div>
      {book.chapters.map((ch: any) => {
        const open = openKey === ch.key;
        return (
          <div key={ch.key} className="card" style={{ marginBottom: 10 }}>
            <div onClick={() => {
              const willOpen = !open; setOpenKey(willOpen ? ch.key : null);
              if (willOpen && ch.kind === "ai" && ai[ch.key] === undefined) loadAi(ch.key);
            }} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <i className={`ti ${ch.icon}`} style={{ fontSize: 19, color: "var(--accent)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{titleOf(ch.key)}</div>
                {isLife ? (
                  (() => {
                    const stt = ch.readiness >= 25 ? { t: s.statHas, c: "var(--positive)", bg: "#dcfce7" } : ch.readiness > 0 ? { t: s.statSome, c: "var(--accent-text)", bg: "var(--accent-bg)" } : { t: s.statEmpty, c: "var(--text-3)", bg: "var(--surface-2)" };
                    return <div style={{ marginTop: 6 }}><span style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 10px", borderRadius: 99, background: stt.bg, color: stt.c }}>{stt.t}</span></div>;
                  })()
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                    <Bar pct={ch.readiness} />
                    <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0, width: 32, textAlign: "right" }}>{ch.readiness}%</span>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 12.5, color: "var(--accent)", flexShrink: 0 }}>{open ? s.close : s.open}</span>
            </div>

            {open && (
              <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                {ch.kind === "ai" ? (
                  aiLoading === ch.key ? <Loading text={s.building} /> :
                  ai[ch.key] ? (
                    <>
                      {aiBody(ch.key)}
                      <button onClick={() => loadAi(ch.key, true)} style={ghostBtn}><i className="ti ti-refresh" style={{ fontSize: 13 }} />{s.rebuild}</button>
                    </>
                  ) : ch.readiness < 10 ? <Muted text={s.addMore} /> : <button onClick={() => loadAi(ch.key)} style={ghostBtn}><i className="ti ti-sparkles" style={{ fontSize: 13 }} />{s.build}</button>
                ) : ch.kind === "months" ? (
                  book.months.length === 0 ? <Muted text={s.addMore} /> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {book.months.map((mm: any) => {
                        const mc = months[mm.month];
                        return (
                          <div key={mm.month} style={{ borderRadius: 10, background: "var(--surface-2)", padding: "10px 12px" }}>
                            <div onClick={() => loadMonth(mm.month)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer", alignItems: "center" }}>
                              <span style={{ fontSize: 13.5, fontWeight: 500, textTransform: "capitalize" }}>{monthLabel(mm.month)}</span>
                              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{mm.count} {s.entries}{mc === undefined ? ` · ${s.monthsOpen}` : ""}</span>
                            </div>
                            {monthLoading === mm.month ? <div style={{ marginTop: 8 }}><Loading text={s.building} /></div> :
                             mc ? (
                              <div className="fade-up" style={{ marginTop: 9 }}>
                                <div style={{ fontSize: 14.5, fontWeight: 500, fontFamily: "var(--font-serif, Georgia, serif)", marginBottom: 6 }}>{mc.title}</div>
                                <div style={{ fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{mc.narrative}</div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  ch.readiness < 8 ? <Muted text={s.addMore} /> : dataChapter(ch.key)
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ПИСЬМА */}
      <div style={{ marginTop: 18 }}>
        <Field label={s.letterSelf} value={m.letter_self} ph={s.letterSelfPh} onSave={(v) => saveMeta({ letter_self: v }, "ls")} saved={savedFlag === "ls"} saving={savingFlag} s={s} icon="ti-mail-forward" big />
        <Field label={s.letterClose} value={m.letter_close} ph={s.letterClosePh} onSave={(v) => saveMeta({ letter_close: v }, "lc")} saved={savedFlag === "lc"} saving={savingFlag} s={s} icon="ti-mail-heart" big />
      </div>

      {/* ПОЛНАЯ КНИГА */}
      <FullBook s={s} locale={locale} year={year} bookType={m.book_type} recipient={m.recipient} />

      {/* РИДЕР */}
      {reader && mounted && createPortal(
        <Reader
          book={book} meta={m} year={year} locale={locale} userName={userName} s={s} isLife={isLife}
          ai={ai} months={months} monthLabel={monthLabel} aiBody={aiBody} dataChapter={dataChapter} titleOf={titleOf}
          loadAi={loadAi} loadMonth={loadMonth} aiLoading={aiLoading} monthLoading={monthLoading}
          onClose={() => setReader(false)}
        />, document.body)}
    </div>
  );
}

// ===== РИДЕР (полноэкранный, печать) =====
function Reader({ book, meta, year, locale, userName, s, isLife, ai, months, monthLabel, aiBody, dataChapter, titleOf, loadAi, loadMonth, aiLoading, monthLoading, onClose }: any) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onEsc); document.body.style.overflow = prev; };
  }, [onClose]);

  async function buildAll() {
    setBusy(true);
    await Promise.all([
      ai.overview === undefined ? loadAi("overview") : null,
      ai.self === undefined ? loadAi("self") : null,
      ai.lessons === undefined ? loadAi("lessons") : null,
      ai.people === undefined ? loadAi("people") : null,
      ...book.months.map((mm: any) => loadMonth(mm.month)),
    ].filter(Boolean));
    setBusy(false);
  }

  function doPrint() {
    document.body.classList.add("printing");
    const after = () => { document.body.classList.remove("printing"); window.removeEventListener("afterprint", after); };
    window.addEventListener("afterprint", after);
    window.print();
  }

  const L = s.dataLabels;
  const cover = (
    <div className="book-page book-cover">
      <div style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: "var(--accent)", marginBottom: 18 }}>LIFE OS</div>
      {isLife ? (
        <div className="serif" style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.15, maxWidth: 460 }}>{s.lifeBook}</div>
      ) : (
        <div className="serif" style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.15 }}>{s.readTitle},<br />{year}</div>
      )}
      {isLife && <div className="serif" style={{ fontSize: 15, fontStyle: "italic", color: "var(--text-2)", marginTop: 16, lineHeight: 1.6, maxWidth: 420 }}>{s.lifeSubtitle}</div>}
      {meta.dedication && <div className="serif" style={{ fontSize: 16, fontStyle: "italic", color: "var(--text-2)", marginTop: 28, lineHeight: 1.6, maxWidth: 420 }}>«{meta.dedication}»</div>}
      <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 40 }}>{s.by}: {userName || "—"}</div>
    </div>
  );

  return (
    <div className="print-root" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#efece4", overflowY: "auto" }}>
      {/* панель управления (не печатается) */}
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={onClose} style={ghostBtn}><i className="ti ti-arrow-left" style={{ fontSize: 15 }} />{s.closeReader}</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={buildAll} disabled={busy} style={ghostBtn}><i className={`ti ${busy ? "ti-loader-2" : "ti-sparkles"}`} style={{ fontSize: 15 }} />{s.buildAll}</button>
          <button onClick={doPrint} style={btnPrimary}><i className="ti ti-download" style={{ fontSize: 16 }} />{s.print}</button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 80px" }}>
        {cover}

        {/* Год в одном взгляде */}
        <Page title={titleOf("overview")}>
          <div className="book-strip">
            <span><b>{book.stats.entries}</b> {s.overviewStrip.entries}</span>
            <span><b>{book.stats.days}</b> {s.overviewStrip.days}</span>
            <span><b>{book.stats.people}</b> {s.overviewStrip.people}</span>
            <span><b>{book.stats.places}</b> {s.overviewStrip.places}</span>
          </div>
          {ai.overview ? aiBody("overview") : aiLoading === "overview" ? <Loading text={s.building} /> : <BuildBtn onClick={() => loadAi("overview")} s={s} />}
        </Page>

        {/* 12 месяцев */}
        {book.months.length > 0 && (
          <Page title={titleOf("months")}>
            {book.months.map((mm: any) => {
              const mc = months[mm.month];
              return (
                <div key={mm.month} style={{ marginBottom: 22 }}>
                  <div className="serif" style={{ fontSize: 20, fontWeight: 600, textTransform: "capitalize", marginBottom: 8 }}>{monthLabel(mm.month)}</div>
                  {mc ? <div className="book-text">{mc.title ? <b>{mc.title}. </b> : null}{mc.narrative}</div>
                    : monthLoading === mm.month ? <Loading text={s.building} />
                    : <BuildBtn onClick={() => loadMonth(mm.month)} s={s} />}
                </div>
              );
            })}
          </Page>
        )}

        {/* data-главы */}
        {[["family", "ti-users"], ["health", "ti-heartbeat"], ["work", "ti-briefcase"], ["travel", "ti-plane"], ["trace", "ti-heart-handshake"]].map(([k]) => {
          const node = dataChapter(k);
          if (!node) return null;
          return <Page key={k} title={titleOf(k)}>{node}</Page>;
        })}

        {/* AI-разделы */}
        {["self", "people", "lessons"].map((k) => (
          <Page key={k} title={titleOf(k)}>
            {ai[k] ? aiBody(k) : aiLoading === k ? <Loading text={s.building} /> : <BuildBtn onClick={() => loadAi(k)} s={s} />}
          </Page>
        ))}

        {/* письма */}
        {meta.letter_self && <Page title={s.letterSelf}><div className="book-text serif" style={{ fontStyle: "italic" }}>{meta.letter_self}</div></Page>}
        {meta.letter_close && <Page title={s.letterClose}><div className="book-text serif" style={{ fontStyle: "italic" }}>{meta.letter_close}</div></Page>}
      </div>
    </div>
  );
}

// ===== «Получить полную книгу» =====
function FullBook({ s, locale, year, bookType, recipient }: any) {
  const [sel, setSel] = useState("gift");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function order() {
    setState("sending");
    const tier = TIERS.find((t) => t.id === sel);
    const text = `Хочу книгу LIFE OS.\nТариф: ${tier?.name} (${tier?.price})\nТип: ${bookType}\nКому: ${recipient}\nПериод: ${year || "вся жизнь"}`;
    await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "book_order", text }) }).catch(() => {});
    setState("done");
  }

  return (
    <div style={{ marginTop: 26, borderRadius: 18, padding: "22px", background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 17, fontWeight: 600 }}>{s.full}</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 5, marginBottom: 16, lineHeight: 1.5 }}>{s.fullSub}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        {TIERS.map((t) => (
          <button key={t.id} onClick={() => setSel(t.id)} style={{ textAlign: "left", border: sel === t.id ? "2px solid var(--accent)" : "1px solid var(--border)", borderRadius: 13, padding: "13px 14px", background: sel === t.id ? "var(--accent-bg)" : "var(--surface)", cursor: "pointer" }}>
            <i className={`ti ${t.icon}`} style={{ fontSize: 20, color: "var(--accent)" }} />
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{t.name}</div>
            <div style={{ fontSize: 13, color: "var(--accent-text)", fontWeight: 600, marginTop: 2 }}>{t.price}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 3 }}>{(t.desc as any)[locale] || t.desc.en}</div>
          </button>
        ))}
      </div>
      {state === "done" ? (
        <div style={{ fontSize: 14, color: "var(--positive)", fontWeight: 500 }}>{s.ordered}</div>
      ) : (
        <button onClick={order} disabled={state === "sending"} style={btnPrimary}>
          <i className="ti ti-send" style={{ fontSize: 16 }} />{state === "sending" ? s.ordering : s.order}
        </button>
      )}
      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 10 }}>{s.tiersNote}</div>
    </div>
  );
}

// ===== мелкие части =====
function Field({ label, value, ph, onSave, saved, saving, s, icon, big }: any) {
  const [v, setV] = useState(value || "");
  const [dirty, setDirty] = useState(false);
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 16, color: "var(--accent)" }} />{label}
      </div>
      <textarea value={v} onChange={(e) => { setV(e.target.value); setDirty(true); }} placeholder={ph} rows={big ? 4 : 2}
        style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontSize: 14, lineHeight: 1.5, resize: "vertical", fontFamily: "inherit", background: "var(--surface-2)", color: "var(--text)" }} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        {saved ? <span style={{ fontSize: 12.5, color: "var(--positive)" }}>{s.saved}</span> :
          <button onClick={() => { onSave(v); setDirty(false); }} disabled={!dirty || saving} style={{ ...ghostBtn, opacity: dirty ? 1 : 0.5 }}>{saving ? s.saving : s.save}</button>}
      </div>
    </div>
  );
}

function NameList({ items, label, icon, color }: any) {
  if (!items?.length) return null;
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((it: any) => (
          <span key={it.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "5px 11px", borderRadius: 99, background: "var(--surface-2)" }}>
            <i className={`ti ${icon}`} style={{ fontSize: 14, color }} />{it.name}{it.count > 1 ? <span style={{ color: "var(--text-3)", fontSize: 11 }}>×{it.count}</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

const Num = ({ n, label }: any) => <div><div style={{ fontSize: 22, fontWeight: 700 }}>{n}</div><div style={{ fontSize: 12, color: "var(--text-3)" }}>{label}</div></div>;
const Loading = ({ text }: any) => <div style={{ fontSize: 13, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-loader-2" style={{ fontSize: 15 }} />{text}</div>;
const Muted = ({ text }: any) => <div style={{ fontSize: 13, color: "var(--text-3)" }}>{text}</div>;
const BuildBtn = ({ onClick, s }: any) => <button onClick={onClick} style={ghostBtn}><i className="ti ti-sparkles" style={{ fontSize: 14 }} />{s.build}</button>;
function Page({ title, children }: any) {
  return (
    <div className="book-page">
      <div className="serif" style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>{title}</div>
      {children}
    </div>
  );
}

// ===== стили-объекты =====
function chip(active: boolean): any {
  return { fontSize: 13, fontWeight: 500, padding: "6px 13px", borderRadius: 99, border: active ? "1px solid var(--accent)" : "1px solid var(--border)", background: active ? "var(--accent-bg)" : "var(--surface)", color: active ? "var(--accent-text)" : "var(--text-2)", cursor: "pointer" };
}
const btnPrimary: any = { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14.5, fontWeight: 600, cursor: "pointer" };
const ghostBtn: any = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: 13, cursor: "pointer" };
