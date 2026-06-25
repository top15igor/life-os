import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import LifeBook from "@/components/LifeBook";
import { getMonths } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LifeBookPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const months = await getMonths(user.id);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-book-2" color="var(--accent)" title={t.nav.lifebook} hint={h.lifebook} />
        <LifeBook months={months} locale={locale} />
      </main>
    </div>
  );
}
