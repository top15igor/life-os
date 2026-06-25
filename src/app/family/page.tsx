import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import EntryFeed from "@/components/EntryFeed";
import { getEntries, cats } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const all = await getEntries(user.id, 300);
  const entries = all.filter((e) => cats(e).some((c) => c.slug === "family"));

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-users" color="#ec4899" title={t.nav.family} hint={h.family} />
        <EntryFeed entries={entries} t={t} locale={locale} />
      </main>
    </div>
  );
}
