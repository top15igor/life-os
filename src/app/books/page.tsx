import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import Books from "@/components/Books";
import { getBooks, getQuotes, getBookGoal, getBooksShare } from "@/lib/books";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const [books, quotes, goal, share] = await Promise.all([
    getBooks(user.id),
    getQuotes(user.id),
    getBookGoal(user.id),
    getBooksShare(user.id),
  ]);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-books" color="#8b5cf6" title={t.nav.books} hint={h.books} />
        <Books locale={locale} initial={books as any} quotes={quotes as any} goal={goal} share={share} />
      </main>
    </div>
  );
}
