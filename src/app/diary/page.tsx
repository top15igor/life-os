import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import DiaryView from "@/components/DiaryView";
import QuickAdd from "@/components/QuickAdd";
import { getEntries, cats, tagList, people as peopleOf } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const QA: Record<string, { placeholder: string; button: string; saving: string; hint: string }> = {
  ru: { placeholder: "Что произошло? Запиши событие, мысль, идею…", button: "Записать", saving: "Сохраняю…", hint: "AI разберёт запись и добавит её в дневник" },
  en: { placeholder: "What happened? Note an event, thought, idea…", button: "Save", saving: "Saving…", hint: "AI will sort the entry into your diary" },
  uk: { placeholder: "Що сталося? Запиши подію, думку, ідею…", button: "Записати", saving: "Зберігаю…", hint: "AI розбере запис і додасть його у щоденник" },
  fr: { placeholder: "Quoi de neuf ? Note un événement, une pensée…", button: "Enregistrer", saving: "Enregistrement…", hint: "L'IA classera l'entrée dans ton journal" },
};

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
        {(() => { const qa = QA[locale] || QA.ru; return <QuickAdd placeholder={qa.placeholder} button={qa.button} saving={qa.saving} hint={qa.hint} locale={locale} />; })()}
        <DiaryView entries={entries} t={t} locale={locale} initial={{ tag: sp.tag || "", category: sp.category || "", person: sp.person || "" }} />
      </main>
    </div>
  );
}
