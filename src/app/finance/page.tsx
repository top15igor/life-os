import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import FinanceTracker from "@/components/FinanceTracker";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { getFinanceData } from "@/lib/finance";

export const dynamic = "force-dynamic";

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const data = await getFinanceData(user.id, sp.m);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-wallet" color="#10b981" title={t.nav.finance} hint={h.finance} />
        <FinanceTracker data={data} locale={locale} />
      </main>
    </div>
  );
}
