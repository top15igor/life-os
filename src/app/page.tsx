import Sidebar from "@/components/Sidebar";
import HomeTabs from "@/components/HomeTabs";
import {
  getToday, getEntries, getGoals, getMonths, getOpenTasks, getRecentGratitude, getInsights,
  getOnThisDay, getStreak, getHabit, cats, tagList, projects as projectsOf, type Entry,
} from "@/lib/queries";
import { getExperiments } from "@/lib/lab";
import { getLocale } from "@/lib/locale";
import { getDict, greeting, dateLabel } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PinPrompt from "@/components/PinPrompt";
import EnterInBrowser from "@/components/EnterInBrowser";
import { cookies, headers } from "next/headers";

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

  const todayISO = new Date().toISOString().slice(0, 10);
  const { date, entries: todayEntries } = await getToday(user.id);
  const [allEntries, goals, months, openTasks, gratitude, insights, streak, experiments, habit] = await Promise.all([
    getEntries(user.id, 200),
    getGoals(user.id),
    getMonths(user.id),
    getOpenTasks(user.id, 3),
    getRecentGratitude(user.id, 3),
    getInsights(user.id),
    getStreak(user.id),
    getExperiments(user.id),
    getHabit(user.id, todayISO),
  ]);
  const memory = await getOnThisDay(user.id, date || new Date().toISOString().slice(0, 10));

  let hasPin = false;
  try {
    const { data: pinRow } = await supabaseAdmin().from("users").select("pin_hash").eq("id", user.id).maybeSingle();
    hasPin = !!pinRow?.pin_hash;
  } catch {}

  const tok = (await cookies()).get("lifeos_token")?.value || "";
  const hdrs = await headers();
  const personalLink = tok ? `${hdrs.get("x-forwarded-proto") || "https"}://${hdrs.get("host") || ""}/u/${tok}` : "";

  // Контекст дня
  const nd = new Date();
  const dayOfYear = Math.floor((nd.getTime() - new Date(nd.getFullYear(), 0, 0).getTime()) / 86400000);
  const daysLeft = Math.round((new Date(nd.getFullYear(), 11, 31).getTime() - nd.getTime()) / 86400000);

  const activeExp = (experiments || []).find((e: any) => e.status === "active");
  const expDay = activeExp ? Math.max(1, Math.round((Date.now() - new Date(activeExp.start_date + "T00:00:00Z").getTime()) / 86400000) + 1) : null;

  // Что изменилось со вчера
  const byDate: Record<string, Entry[]> = {};
  for (const e of allEntries) (byDate[e.entry_date] ||= []).push(e);
  const dts = Object.keys(byDate).sort().reverse();
  const avgOf = (ds: string, k: string) => {
    const arr = (byDate[ds] || []).map((e: any) => e[k]).filter((x: any) => x != null) as number[];
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  };
  const dir = (k: string) => {
    const a = dts[1] ? avgOf(dts[1], k) : null;
    const b = dts[0] ? avgOf(dts[0], k) : null;
    if (a == null || b == null) return null;
    return b > a ? "up" : b < a ? "down" : "flat";
  };
  const changes = {
    mood: dir("mood"),
    sleep: dir("sleep_hours"),
    newIdea: dts[0] ? (byDate[dts[0]] || []).some((e: any) => cats(e).some((c: any) => ["ideas", "insight"].includes(c.slug))) : false,
  };

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
    dayOfYear,
    daysLeft,
    streak,
    habit,
    experiment: activeExp ? { title: activeExp.title, day: expDay, duration: activeExp.duration_days } : null,
    changes,
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
        <EnterInBrowser link={personalLink} locale={locale} />
        <PinPrompt hasPin={hasPin} locale={locale} />
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
