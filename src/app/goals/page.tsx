import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import SubTabs from "@/components/SubTabs";
import GoalsManager from "@/components/GoalsManager";
import TasksList from "@/components/TasksList";
import DreamsBoard from "@/components/DreamsBoard";
import InsightsView from "@/components/InsightsView";
import { getGoals, getAllTasks, getInsights, getDreams } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STR = {
  ru: { from: "из записи от", empty: "Инсайтов пока нет — они появятся из твоих записей.", dreams: "Мечты" },
  en: { from: "from entry on", empty: "No insights yet — they'll appear from your entries.", dreams: "Dreams" },
  uk: { from: "із запису від", empty: "Інсайтів поки немає — з'являться з твоїх записів.", dreams: "Мрії" },
  fr: { from: "de l'entrée du", empty: "Pas encore d'insights — ils apparaîtront depuis tes entrées.", dreams: "Rêves" },
};

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab = ["goals", "tasks", "ideas", "dreams"].includes(sp.tab || "") ? sp.tab! : "goals";
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale];
  const h = hints(locale);

  const goals = tab === "goals" ? await getGoals(user.id) : [];
  const tasks = tab === "tasks" ? await getAllTasks(user.id) : [];
  const insights = tab === "ideas" ? await getInsights(user.id) : [];
  const dreams = tab === "dreams" ? await getDreams(user.id) : [];

  const tabs = [
    { key: "goals", label: t.nav.goals },
    { key: "tasks", label: t.nav.tasks },
    { key: "dreams", label: s.dreams },
    { key: "ideas", label: t.nav.insights },
  ];

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-target" color="#3b82f6" title={t.nav.plans} hint={h.plans} />
        <SubTabs base="/goals" active={tab} tabs={tabs} />

        {tab === "goals" && <GoalsManager initial={goals as any} locale={locale} />}
        {tab === "tasks" && <TasksList tasks={tasks as any} locale={locale} />}
        {tab === "dreams" && <DreamsBoard initial={dreams as any} locale={locale} />}
        {tab === "ideas" && <InsightsView insights={insights as any} locale={locale} />}
      </main>
    </div>
  );
}
