import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import GoalsManager from "@/components/GoalsManager";
import { getGoals } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const goals = await getGoals(user.id);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-target" color="#3b82f6" title={t.nav.goals} hint={h.goals} />
        <GoalsManager initial={goals as any} locale={locale} />
      </main>
    </div>
  );
}
