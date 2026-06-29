import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import Lab from "@/components/Lab";
import LabPitch from "@/components/LabPitch";
import { getExperiments } from "@/lib/lab";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";
import { isPremium } from "@/lib/plan";

export const dynamic = "force-dynamic";

export default async function LabPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const sp = await searchParams;

  // Лаборатория — премиальная фича. ?preview=lock — продающая страница даже на Премиуме.
  const premium = (await isPremium(user.id)) && sp?.preview !== "lock";
  const experiments = premium ? await getExperiments(user.id) : [];

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-flask-2" color="var(--insight)" title={t.nav.lab} hint={h.lab} />
        {premium ? <Lab experiments={experiments as any} locale={locale} /> : <LabPitch locale={locale} />}
      </main>
    </div>
  );
}
