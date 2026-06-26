import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import DiaryView from "@/components/DiaryView";
import { getEntries, cats, tagList, people as peopleOf } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DiaryPage({ searchParams }: { searchParams: Promise<{ tag?: string; category?: string; person?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const all = await getEntries(user.id, 300);

  const entries = all.map((e: any) => ({
    id: e.id,
    date: e.entry_date,
    time: (e.entry_time || "").slice(0, 5),
    source: e.source,
    summary: e.summary || e.raw_text,
    rawText: e.raw_text || "",
    mood: e.mood,
    energy: e.energy,
    health: e.health,
    cats: cats(e).map((c: any) => ({ slug: c.slug, name: t.cats[c.slug] || c.slug })),
    tags: tagList(e),
    people: peopleOf(e),
  }));

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-book" color="var(--accent)" title={t.diaryTitle} hint={h.diary} />
        <DiaryView entries={entries} t={t} locale={locale} initial={{ tag: sp.tag || "", category: sp.category || "", person: sp.person || "" }} />
      </main>
    </div>
  );
}
