import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import DashboardView from "@/components/DashboardView";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = { ru: "Дашборд", en: "Dashboard", uk: "Дашборд", fr: "Tableau de bord" };

export default async function DashboardPage() {
  await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-chart-histogram" color="#5b8cff" title={TITLE[locale] || TITLE.en} />
        <DashboardView />
      </main>
    </div>
  );
}
