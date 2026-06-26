import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import BookOfLife from "@/components/BookOfLife";
import { getBookYears, getBookData, getBookMeta } from "@/lib/book";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LifeBookPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);

  const years = await getBookYears(user.id);
  const sp = await searchParams;
  const reqYear = sp.year !== undefined ? Number(sp.year) : NaN;
  // По умолчанию — текущий год (или ближайший с записями).
  const year = !Number.isNaN(reqYear) ? reqYear : (years.find((y) => y.count > 0)?.year ?? new Date().getFullYear());

  const [book, meta] = await Promise.all([getBookData(user.id, year), getBookMeta(user.id, year)]);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-book-2" color="var(--accent)" title={t.nav.lifebook} hint={h.lifebook} />
        <BookOfLife book={book} meta={meta} years={years} year={year} locale={locale} userName={user.name || ""} />
      </main>
    </div>
  );
}
