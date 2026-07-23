import Sidebar from "@/components/Sidebar";
import { getEntries, getEntityMeta, people as peopleOf, type Entry } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict, dateLabel } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import PageHead from "@/components/PageHead";
import EntityManager from "@/components/EntityManager";
import { hints } from "@/lib/hints";

export const dynamic = "force-dynamic";

const STR = {
  ru: { mentions: "упоминаний", empty: "Людей пока нет — появятся, когда упомянёшь их в записях.", last: "последнее" },
  en: { mentions: "mentions", empty: "No people yet — they'll appear when you mention them.", last: "last" },
  uk: { mentions: "згадувань", empty: "Людей поки немає — з'являться, коли згадаєш їх.", last: "останнє" },
  fr: { mentions: "mentions", empty: "Pas encore de personnes — elles apparaîtront quand tu les mentionnes.", last: "dernier" },
  es: { mentions: "menciones", empty: "Aún no hay personas — aparecerán cuando las menciones en tus entradas.", last: "última" },
};

export default async function PeoplePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale];
  const h = hints(locale);
  const [entries, metas] = await Promise.all([getEntries(user.id, 300), getEntityMeta(user.id, "people")]);

  const map = new Map<string, { name: string; count: number; lastDate: string; entries: Entry[] }>();
  for (const e of entries) {
    for (const name of peopleOf(e)) {
      const m = map.get(name) || { name, count: 0, lastDate: e.entry_date, entries: [] };
      m.count++;
      m.entries.push(e);
      if (e.entry_date > m.lastDate) m.lastDate = e.entry_date;
      map.set(name, m);
    }
  }
  const list = [...map.values()].sort((a, b) => b.count - a.count);
  const items = list.map((p) => ({
    id: metas[p.name]?.id,
    name: p.name,
    hidden: metas[p.name]?.hidden || false,
    meta: `${p.count} ${s.mentions} · ${s.last} ${dateLabel(locale, p.lastDate)}`,
    entries: p.entries.map((e: any) => ({ id: e.id, text: e.summary || e.raw_text || "" })),
  }));

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-user-heart" color="#ec4899" title={t.nav.people} hint={h.people} />
        {items.length === 0 ? (
          <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
        ) : (
          <EntityManager kind="people" locale={locale} items={items} />
        )}
      </main>
    </div>
  );
}
