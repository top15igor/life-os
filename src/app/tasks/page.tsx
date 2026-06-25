import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import TasksList from "@/components/TasksList";
import { getAllTasks } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const tasks = await getAllTasks(user.id);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-checkbox" color="#6366f1" title={t.nav.tasks} hint={h.tasks} />
        <TasksList tasks={tasks as any} locale={locale} />
      </main>
    </div>
  );
}
