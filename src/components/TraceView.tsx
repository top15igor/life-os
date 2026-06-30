"use client";

import { useState } from "react";
import Link from "next/link";
import AddToCalendar from "./AddToCalendar";

type Deed = { id: string; text: string; kind?: string; person?: string; created_at: string };
type Prom = { id: string; text: string; person?: string; status: string; created_at: string };
type Week = { deeds: number; peopleHelped: number; promisesDone: number; gratitude: number };

const ICONS: Record<string, string> = {
  help: "ti-hand-stop", support: "ti-heart-handshake", care: "ti-heart", gift: "ti-gift",
  knowledge: "ti-bulb", volunteer: "ti-users-group", family: "ti-users", community: "ti-building", other: "ti-sparkles",
};

const KIND_LABEL: Record<string, Record<string, string>> = {
  ru: { help: "Помощь", support: "Поддержка", care: "Забота", gift: "Подарок", knowledge: "Знания", volunteer: "Волонтёрство", family: "Семья", community: "Сообщество", other: "Доброе дело" },
  en: { help: "Help", support: "Support", care: "Care", gift: "Gift", knowledge: "Knowledge", volunteer: "Volunteering", family: "Family", community: "Community", other: "Good deed" },
  uk: { help: "Допомога", support: "Підтримка", care: "Турбота", gift: "Подарунок", knowledge: "Знання", volunteer: "Волонтерство", family: "Сім'я", community: "Спільнота", other: "Добра справа" },
  fr: { help: "Aide", support: "Soutien", care: "Attention", gift: "Cadeau", knowledge: "Savoir", volunteer: "Bénévolat", family: "Famille", community: "Communauté", other: "Bonne action" },
};

const S: Record<string, any> = {
  ru: { tabs: ["Обзор", "Добрые дела", "Обещания"], warm: "Ты оставляешь добрый след.", warmEmpty: "Твой след только начинается.", sub: "Главное не количество поступков, а истории, которые продолжаются после них.", weekLabel: "За неделю", deedsW: "добрых дел", peopleW: "людям помог", keptW: "обещаний сдержано", grat: (n: number) => `🙏 Благодарностей сохранено: ${n}`, attention: "Требует внимания", chronicle: "Хроника следа", openP: "Открытые обещания", doneP: "Выполненные обещания", deedsEmpty: "Здесь появятся истории того, что стало лучше благодаря тебе. Просто расскажи в записи, кому ты помог.", openEmpty: "Открытых обещаний нет.", doneStr: "Выполнено", keptStr: "Выполнено ✓" },
  en: { tabs: ["Overview", "Good deeds", "Promises"], warm: "You're leaving a kind trace.", warmEmpty: "Your trace is just beginning.", sub: "What matters isn't the count, but the stories that continue after.", weekLabel: "This week", deedsW: "good deeds", peopleW: "people helped", keptW: "promises kept", grat: (n: number) => `🙏 Gratitudes saved: ${n}`, attention: "Needs attention", chronicle: "Trace chronicle", openP: "Open promises", doneP: "Kept promises", deedsEmpty: "Stories of what got better thanks to you will appear here. Just mention who you helped.", openEmpty: "No open promises.", doneStr: "Done", keptStr: "Done ✓" },
  uk: { tabs: ["Огляд", "Добрі справи", "Обіцянки"], warm: "Ти залишаєш добрий слід.", warmEmpty: "Твій слід лише починається.", sub: "Головне не кількість, а історії, які тривають після.", weekLabel: "За тиждень", deedsW: "добрих справ", peopleW: "людям допоміг", keptW: "обіцянок виконано", grat: (n: number) => `🙏 Подяк збережено: ${n}`, attention: "Потребує уваги", chronicle: "Хроніка сліду", openP: "Відкриті обіцянки", doneP: "Виконані обіцянки", deedsEmpty: "Тут з'являться історії того, що стало кращим завдяки тобі. Згадай у записі, кому допоміг.", openEmpty: "Відкритих обіцянок немає.", doneStr: "Виконано", keptStr: "Виконано ✓" },
  fr: { tabs: ["Aperçu", "Bonnes actions", "Promesses"], warm: "Tu laisses une belle empreinte.", warmEmpty: "Ton empreinte ne fait que commencer.", sub: "Ce qui compte, ce n'est pas le nombre, mais les histoires qui continuent après.", weekLabel: "Cette semaine", deedsW: "bonnes actions", peopleW: "personnes aidées", keptW: "promesses tenues", grat: (n: number) => `🙏 Gratitudes enregistrées : ${n}`, attention: "À suivre", chronicle: "Chronique de l'empreinte", openP: "Promesses ouvertes", doneP: "Promesses tenues", deedsEmpty: "Les histoires de ce qui s'est amélioré grâce à toi apparaîtront ici. Dis qui tu as aidé.", openEmpty: "Aucune promesse ouverte.", doneStr: "Fait", keptStr: "Fait ✓" },
};

export default function TraceView({ locale, deeds, promises, gratitudeCount, week, calConnected = false, calLinks = {} }: { locale: string; deeds: Deed[]; promises: Prom[]; gratitudeCount: number; week: Week; calConnected?: boolean; calLinks?: Record<string, string> }) {
  const s = S[locale] || S.ru;
  const labels = KIND_LABEL[locale] || KIND_LABEL.ru;
  const [tab, setTab] = useState(0);
  const [deedList, setDeedList] = useState<Deed[]>(deeds);
  const [promList, setPromList] = useState<Prom[]>(promises);

  const active = promList.filter((p) => p.status !== "done");
  const done = promList.filter((p) => p.status === "done");

  const dateStr = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : locale, { day: "numeric", month: "long" });
    } catch {
      return "";
    }
  };

  async function delDeed(id: string) {
    setDeedList((p) => p.filter((x) => x.id !== id));
    try { await fetch("/api/deed", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }); } catch {}
  }
  async function promDone(id: string) {
    setPromList((p) => p.map((x) => (x.id === id ? { ...x, status: "done" } : x)));
    try { await fetch("/api/promise", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: "done" }) }); } catch {}
  }
  async function delProm(id: string) {
    setPromList((p) => p.filter((x) => x.id !== id));
    try { await fetch("/api/promise", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, del: true }) }); } catch {}
  }

  const DeedCard = (d: Deed) => (
    <div key={d.id} className="card" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: "#FBEAF0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className={`ti ${ICONS[d.kind || "other"] || ICONS.other}`} style={{ fontSize: 18, color: "#ec4899" }} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11.5, color: "#993556", fontWeight: 500, marginBottom: 2 }}>{labels[d.kind || "other"] || labels.other}{d.person ? ` · ${d.person}` : ""}</div>
        <div style={{ fontSize: 14.5, lineHeight: 1.4 }}>{d.text}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>{dateStr(d.created_at)}</div>
      </div>
      <button onClick={() => delDeed(d.id)} aria-label="delete" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 2, flexShrink: 0 }}><i className="ti ti-x" style={{ fontSize: 16 }} /></button>
    </div>
  );

  const PromCard = (p: Prom) => {
    const isDone = p.status === "done";
    return (
      <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, opacity: isDone ? 0.55 : 1 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, lineHeight: 1.4, textDecoration: isDone ? "line-through" : "none" }}>{p.text}</div>
          {p.person && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{p.person}</div>}
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {isDone ? (
            <span style={{ fontSize: 12, color: "var(--positive)", whiteSpace: "nowrap" }}>{s.keptStr}</span>
          ) : (
            <>
              <AddToCalendar kind="promise" refId={p.id} title={p.text} locale={locale} connected={calConnected} link={`promise:${p.id}` in calLinks ? calLinks[`promise:${p.id}`] : undefined} />
              <button onClick={() => promDone(p.id)} style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--accent)", cursor: "pointer", whiteSpace: "nowrap" }}>{s.doneStr}</button>
            </>
          )}
          <button onClick={() => delProm(p.id)} aria-label="delete" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 2 }}><i className="ti ti-x" style={{ fontSize: 16 }} /></button>
        </span>
      </div>
    );
  };

  const Empty = (txt: string) => <div className="card" style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{txt}</div>;
  const Head = (txt: string) => <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "22px 0 11px" }}><span style={{ width: 4, height: 18, borderRadius: 2, background: "#ec4899" }} /><span style={{ fontSize: 16, fontWeight: 600 }}>{txt}</span></div>;

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, background: "var(--surface-2)", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {s.tabs.map((label: string, i: number) => (
          <button key={i} onClick={() => setTab(i)} style={{ fontSize: 13.5, fontWeight: 500, padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === i ? "var(--surface)" : "transparent", color: tab === i ? "var(--text)" : "var(--text-2)" }}>{label}</button>
        ))}
      </div>

      {tab === 0 && (
        <div className="fade-up">
          <div className="card" style={{ background: "#FBEAF0", border: "none", marginBottom: 18 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#4B1528", lineHeight: 1.35 }}>{week.deeds > 0 ? s.warm : s.warmEmpty}</div>
            <div style={{ fontSize: 13, color: "#72243E", lineHeight: 1.5, marginTop: 6 }}>{s.sub}</div>
            <div style={{ fontSize: 12, color: "#993556", marginTop: 12, display: "flex", flexWrap: "wrap", gap: 14 }}>
              <span>{s.weekLabel}: {week.deeds} {s.deedsW}</span>
              {week.peopleHelped > 0 && <span>{week.peopleHelped} {s.peopleW}</span>}
              {week.promisesDone > 0 && <span>{week.promisesDone} {s.keptW}</span>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 18, alignItems: "start" }}>
            <div>
              {Head(s.attention)}
              {active.length === 0 ? Empty(s.openEmpty) : <div style={{ display: "grid", gap: 8 }}>{active.map(PromCard)}</div>}
              {gratitudeCount > 0 && (
                <Link href="/diary?category=gratitude" style={{ display: "block", marginTop: 12, fontSize: 13, color: "var(--accent)" }}>{s.grat(gratitudeCount)}</Link>
              )}
            </div>
            <div>
              {Head(s.chronicle)}
              {deedList.length === 0 ? Empty(s.deedsEmpty) : <div style={{ display: "grid", gap: 8 }}>{deedList.slice(0, 8).map(DeedCard)}</div>}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="fade-up">
          {deedList.length === 0 ? Empty(s.deedsEmpty) : <div style={{ display: "grid", gap: 8 }}>{deedList.map(DeedCard)}</div>}
        </div>
      )}

      {tab === 2 && (
        <div className="fade-up">
          {Head(s.openP)}
          {active.length === 0 ? Empty(s.openEmpty) : <div style={{ display: "grid", gap: 8 }}>{active.map(PromCard)}</div>}
          {done.length > 0 && (
            <>
              {Head(s.doneP)}
              <div style={{ display: "grid", gap: 8 }}>{done.map(PromCard)}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
