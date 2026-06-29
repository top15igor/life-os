import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import Biographer from "@/components/Biographer";
import BiographerPitch from "@/components/BiographerPitch";
import AiHelperBanner from "@/components/AiHelperBanner";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { getBiographerHistory } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { isPremium } from "@/lib/plan";

export const dynamic = "force-dynamic";

export default async function BiographerPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const sp = await searchParams;

  // Биограф — премиальная фича. ?preview=lock — посмотреть продающую страницу даже на Премиуме.
  const premium = (await isPremium(user.id)) && sp?.preview !== "lock";
  const history = premium ? await getBiographerHistory(user.id) : [];

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main narrow">
        <PageHead icon="ti-messages" color="var(--insight)" title={t.nav.biographer} hint={h.biographer} />
        {premium ? (
          <>
            <AiHelperBanner which="biographer" locale={locale} />
            <Biographer locale={locale} initialHistory={history as any} />
          </>
        ) : (
          <BiographerPitch locale={locale} />
        )}
      </main>
    </div>
  );
}
