"use client";

import { useState } from "react";
import Link from "next/link";
import QuickAdd from "./QuickAdd";
import Hint from "./Hint";

const HS: Record<string, any> = {
  ru: { tabs: ["Сегодня", "Путь", "Наследие"], focus: "Фокус дня", tasks: "Главные задачи", gratitude: "Благодарность", memory: "Воспоминание", ask: "Спроси свою жизнь", askSub: "AI ответит из всех твоих записей", balance: "Жизненный баланс", recent: "Записи дня", noTasks: "Открытых задач нет 👌", noEntries: "Записей сегодня ещё нет — напиши пару строк выше.", goals: "Цели", projects: "Проекты", lifebook: "Книга жизни", lifebookSub: "AI собирает месяцы в главы", insights: "Главные инсайты", biographer: "AI-Биограф", legacyEmpty: "Наследие наполнится по мере записей.", memYear: (t: string) => `Год назад в этот день: «${t}»`, memMonth: (t: string) => `Месяц назад в этот день: «${t}»` },
  en: { tabs: ["Today", "Path", "Legacy"], focus: "Focus of the day", tasks: "Top tasks", gratitude: "Gratitude", memory: "Memory", ask: "Ask your life", askSub: "AI answers from all your entries", balance: "Life balance", recent: "Today's entries", noTasks: "No open tasks 👌", noEntries: "No entries today yet — write a few lines above.", goals: "Goals", projects: "Projects", lifebook: "Book of Life", lifebookSub: "AI turns months into chapters", insights: "Key insights", biographer: "AI Biographer", legacyEmpty: "Your legacy grows as you write.", memYear: (t: string) => `A year ago today: “${t}”`, memMonth: (t: string) => `A month ago today: “${t}”` },
  uk: { tabs: ["Сьогодні", "Шлях", "Спадщина"], focus: "Фокус дня", tasks: "Головні завдання", gratitude: "Вдячність", memory: "Спогад", ask: "Запитай своє життя", askSub: "AI відповість з усіх твоїх записів", balance: "Життєвий баланс", recent: "Записи дня", noTasks: "Відкритих завдань немає 👌", noEntries: "Записів сьогодні ще немає — напиши кілька рядків вище.", goals: "Цілі", projects: "Проєкти", lifebook: "Книга життя", lifebookSub: "AI збирає місяці у глави", insights: "Головні інсайти", biographer: "AI-Біограф", legacyEmpty: "Спадщина зростає з твоїми записами.", memYear: (t: string) => `Рік тому цього дня: «${t}»`, memMonth: (t: string) => `Місяць тому цього дня: «${t}»` },
  fr: { tabs: ["Aujourd'hui", "Chemin", "Héritage"], focus: "Focus du jour", tasks: "Tâches clés", gratitude: "Gratitude", memory: "Souvenir", ask: "Interroge ta vie", askSub: "L'IA répond depuis toutes tes entrées", balance: "Équilibre de vie", recent: "Entrées du jour", noTasks: "Aucune tâche en cours 👌", noEntries: "Pas encore d'entrées — écris quelques lignes ci-dessus.", goals: "Objectifs", projects: "Projets", lifebook: "Livre de vie", lifebookSub: "L'IA transforme les mois en chapitres", insights: "Insights clés", biographer: "Biographe IA", legacyEmpty: "Ton héritage grandit à mesure que tu écris.", memYear: (t: string) => `Il y a un an : « ${t} »`, memMonth: (t: string) => `Il y a un mois : « ${t} »` },
};

const CAT_COLOR: Record<string, string> = { health: "#ef4444", sport: "#10b981", food: "#84cc16", family: "#ec4899", business: "#3b82f6", finance: "#0ea5e9", ideas: "#f59e0b", insight: "#8b5cf6", task: "#6366f1", gratitude: "#14b8a6", travel: "#06b6d4", emotions: "#a78bfa" };

function Metric({ label, icon, value, suffix, color }: any) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 11, padding: "11px 13px" }}>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 5 }}><i className={`ti ${icon}`} style={{ fontSize: 15, color }} />{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, marginTop: 3 }}>{value ?? "—"}{value != null && suffix ? <span style={{ fontSize: 12, color: "var(--text-3)" }}>{suffix}</span> : null}</div>
    </div>
  );
}

function Section({ title, children, right }: any) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <div style={{ fontSize: 13, color: "var(--text-2)" }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function HomeTabs({ data, locale, nav, metricsLabels, qa }: any) {
  const s = HS[locale] || HS.ru;
  const [tab, setTab] = useState(0);

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 19, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>{data.greeting}<Hint text={data.hint} /></div>
        <div style={{ fontSize: 13, color: "var(--text-2)" }}>{data.dateLine}</div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, background: "var(--surface-2)", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {s.tabs.map((label: string, i: number) => (
          <button key={i} onClick={() => setTab(i)} style={{ fontSize: 13.5, fontWeight: 500, padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === i ? "var(--surface)" : "transparent", color: tab === i ? "var(--text)" : "var(--text-2)" }}>{label}</button>
        ))}
      </div>

      {tab === 0 && (
        <div className="fade-up">
          <QuickAdd placeholder={qa.placeholder} button={qa.button} saving={qa.saving} hint={qa.hint} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 9, marginBottom: 18 }}>
            <Metric label={metricsLabels.mood} icon="ti-mood-smile" value={data.mood} suffix="/10" color="var(--accent)" />
            <Metric label={metricsLabels.energy} icon="ti-bolt" value={data.energy} suffix="/10" color="var(--energy)" />
            <Metric label={metricsLabels.health} icon="ti-heart" value={data.health} suffix="/10" color="var(--health)" />
            <Metric label={metricsLabels.focus} icon="ti-target" value={data.focus} color="#3b82f6" />
          </div>

          {data.openTasks.length > 0 ? (
            <Section title={s.tasks}>
              <div className="card">
                {data.openTasks.map((tk: any) => (
                  <div key={tk.id} style={{ fontSize: 13.5, padding: "5px 0", display: "flex", gap: 8 }}><i className="ti ti-square" style={{ fontSize: 16, color: "var(--text-3)" }} />{tk.text}</div>
                ))}
              </div>
            </Section>
          ) : null}

          {data.gratitude.length > 0 && (
            <Section title={s.gratitude}>
              <div className="card" style={{ background: "#E1F5EE", border: "none" }}>
                {data.gratitude.map((g: string, k: number) => (<div key={k} style={{ fontSize: 13.5, padding: "3px 0", color: "#04342C" }}>🙏 {g}</div>))}
              </div>
            </Section>
          )}

          {data.memory && (
            <Section title={s.memory}>
              <Link href="/diary" className="card" style={{ display: "block", fontSize: 13.5, color: "var(--text-2)" }}>⏳ {s[data.memory.period === "year" ? "memYear" : "memMonth"](data.memory.summary)}</Link>
            </Section>
          )}

          <Section title={s.recent}>
            {data.today.length === 0 ? (
              <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.noEntries}</div>
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
                <div key={i} className="card" style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 14, marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}><i className="ti ti-target" style={{ color: "var(--accent)", fontSize: 16 }} />{g.title}</div>
                  <div style={{ height: 6, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden", marginBottom: 3 }}><div style={{ width: `${g.progress}%`, height: "100%", background: "var(--accent)" }} /></div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{g.progress}%</div>
                </div>
              ))
            )}
          </Section>

          {data.balance.length > 0 && (
            <Section title={s.balance}>
              <div className="card">
                {data.balance.map((b: any) => {
                  const max = data.balance[0].count || 1;
                  return (
                    <div key={b.slug} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}><span>{b.name}</span><span style={{ color: "var(--text-3)" }}>{b.count}</span></div>
                      <div style={{ height: 6, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}><div style={{ width: `${Math.round((b.count / max) * 100)}%`, height: "100%", background: CAT_COLOR[b.slug] || "var(--accent)" }} /></div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {data.projects.length > 0 && (
            <Section title={s.projects} right={<Link href="/projects" style={{ fontSize: 12.5, color: "var(--accent)" }}>→</Link>}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                {data.projects.map((p: any) => (
                  <div key={p.name} className="card" style={{ display: "flex", alignItems: "center", gap: 9 }}><i className="ti ti-briefcase" style={{ color: "#3b82f6", fontSize: 18 }} /><div style={{ minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: 11, color: "var(--text-3)" }}>{p.count}</div></div></div>
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
