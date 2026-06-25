import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import Lab from "@/components/Lab";
import { getExperiments } from "@/lib/lab";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LabPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const experiments = await getExperiments(user.id);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-flask-2" color="var(--insight)" title={t.nav.lab} hint={h.lab} />
        <Lab experiments={experiments as any} locale={locale} />
      </main>
    </div>
  );
}
