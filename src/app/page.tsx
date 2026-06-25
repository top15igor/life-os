import Sidebar from "@/components/Sidebar";
import HomeTabs from "@/components/HomeTabs";
import {
  getToday, getEntries, getGoals, getMonths, getOpenTasks, getRecentGratitude, getInsights,
  getOnThisDay, cats, tagList, projects as projectsOf, type Entry,
} from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict, greeting, dateLabel } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function pickLatest(entries: Entry[], key: string) {
  for (const e of entries) if (e[key] != null) return e[key];
  return null;
}

export default async function HomePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);

  const { date, entries: todayEntries } = await getToday(user.id);
  const [allEntries, goals, months, openTasks, gratitude, insights] = await Promise.all([
    getEntries(user.id, 200),
    getGoals(user.id),
    getMonths(user.id),
    getOpenTasks(user.id, 3),
    getRecentGratitude(user.id, 3),
    getInsights(user.id),
  ]);
  const memory = await getOnThisDay(user.id, date || new Date().toISOString().slice(0, 10));

  const catCount: Record<string, number> = {};
  for (const e of allEntries) for (const c of cats(e)) catCount[c.slug] = (catCount[c.slug] || 0) + 1;
  const balance = Object.entries(catCount)
    .map(([slug, count]) => ({ slug, name: t.cats[slug] || slug, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const projMap: Record<string, number> = {};
  for (const e of allEntries) for (const p of projectsOf(e)) projMap[p] = (projMap[p] || 0) + 1;
  const projects = Object.entries(projMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);

  const today = todayEntries.map((e: Entry) => ({
    id: e.id,
    time: (e.entry_time || "").slice(0, 5),
    source: e.source,
    summary: e.summary || e.raw_text,
    cats: cats(e).slice(0, 3).map((c: any) => ({ slug: c.slug, name: t.cats[c.slug] || c.slug })),
    tags: tagList(e).slice(0, 3),
  }));

  const data = {
    greeting: `${greeting(locale)}${user.name ? ", " + user.name : ""}`,
    dateLine: `${dateLabel(locale, date || undefined)} · ${todayEntries.length} ${t.entriesWord}`,
    hint: h.today,
    mood: pickLatest(todayEntries, "mood"),
    energy: pickLatest(todayEntries, "energy"),
    health: pickLatest(todayEntries, "health"),
    focus: pickLatest(todayEntries, "focus"),
    today,
    openTasks: openTasks.map((tk: any) => ({ id: tk.id, text: tk.text })),
    gratitude,
    memory,
    goals: goals.map((g: any) => ({ title: g.title, progress: g.progress })),
    balance,
    projects,
    insights: insights.slice(0, 4).map((i: any) => i.text),
    monthsCount: months.length,
  };

  const qa = {
    ru: { placeholder: "Что произошло? Напиши пару строк…", button: "Добавить", saving: "Сохраняю…" },
    en: { placeholder: "What happened? Write a few lines…", button: "Add", saving: "Saving…" },
    uk: { placeholder: "Що сталося? Напиши кілька рядків…", button: "Додати", saving: "Зберігаю…" },
    fr: { placeholder: "Que s'est-il passé ? Écris quelques lignes…", button: "Ajouter", saving: "Enregistrement…" },
  }[locale] || { placeholder: "…", button: "+", saving: "…" };

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <HomeTabs
          data={data}
          locale={locale}
          nav={t.nav}
          metricsLabels={{ mood: t.mood, energy: t.energy, health: t.health, focus: t.focus }}
          qa={{ ...qa, hint: t.quickHint }}
        />
      </main>
    </div>
  );
}
