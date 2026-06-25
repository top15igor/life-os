import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import Biographer from "@/components/Biographer";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { getBiographerHistory } from "@/lib/queries";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BiographerPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const history = await getBiographerHistory(user.id);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-messages" color="var(--insight)" title={t.nav.biographer} hint={h.biographer} />
        <Biographer locale={locale} initialHistory={history as any} />
      </main>
    </div>
  );
}
