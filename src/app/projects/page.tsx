import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import ProjectsManager from "@/components/ProjectsManager";
import { getProjectsManaged } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { hints } from "@/lib/hints";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const projects = await getProjectsManaged(user.id);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-briefcase" color="#3b82f6" title={t.nav.projects} hint={h.projects} />
        <ProjectsManager initial={projects as any} locale={locale} />
      </main>
    </div>
  );
}
