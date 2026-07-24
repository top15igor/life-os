import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { getEntries, getEntityMeta, people as peopleOf, type Entry } from "@/lib/queries";
import { daysSince } from "@/lib/peopleCrm";
import { getLocale } from "@/lib/locale";
import { getDict, dateLabel } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import PageHead from "@/components/PageHead";
import EntityManager from "@/components/EntityManager";
import { hints } from "@/lib/hints";

export const dynamic = "force-dynamic";

const STR = {
  ru: { mentions: "упоминаний", empty: "Людей пока нет — появятся, когда упомянёшь их в записях.", last: "последнее", staleTitle: "💛 Давно не общались", staleLead: "Эти люди давно не появлялись в записях. Напомни о себе — им будет приятно.", ago: (n: number) => `${n} дн. назад` },
  en: { mentions: "mentions", empty: "No people yet — they'll appear when you mention them.", last: "last", staleTitle: "💛 It's been a while", staleLead: "These people haven't appeared in your entries for a while. Reach out — they'll be glad.", ago: (n: number) => `${n} days ago` },
  uk: { mentions: "згадувань", empty: "Людей поки немає — з'являться, коли згадаєш їх.", last: "останнє", staleTitle: "💛 Давно не спілкувалися", staleLead: "Ці люди давно не з'являлися у записах. Нагадай про себе — їм буде приємно.", ago: (n: number) => `${n} дн. тому` },
  fr: { mentions: "mentions", empty: "Pas encore de personnes — elles apparaîtront quand tu les mentionnes.", last: "dernier", staleTitle: "💛 Ça fait longtemps", staleLead: "Ces personnes n'apparaissent plus dans tes entrées depuis un moment. Fais-leur signe.", ago: (n: number) => `il y a ${n} j` },
  es: { mentions: "menciones", empty: "Aún no hay personas — aparecerán cuando las menciones en tus entradas.", last: "última", staleTitle: "💛 Hace tiempo sin hablar", staleLead: "Estas personas llevan tiempo sin aparecer en tus entradas. Escríbeles — les alegrará.", ago: (n: number) => `hace ${n} días` },
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
    href: metas[p.name]?.id ? `/people/${metas[p.name].id}` : undefined,
    entries: p.entries.map((e: any) => ({ id: e.id, text: e.summary || e.raw_text || "" })),
  }));

  // «Давно не общались»: близкие (2+ упоминания), пропавшие из записей на 2+ недели.
  const staleList = list
    .filter((p) => p.count >= 2 && !(metas[p.name]?.hidden))
    .map((p) => ({ name: p.name, count: p.count, days: daysSince(p.lastDate), id: metas[p.name]?.id }))
    .filter((p) => p.days >= 14 && p.days <= 180)
    .sort((a, b) => b.count - a.count || b.days - a.days)
    .slice(0, 6);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-user-heart" color="#ec4899" title={t.nav.people} hint={h.people} />
        {staleList.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, letterSpacing: "-0.01em" }}>{s.staleTitle}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 10 }}>{s.staleLead}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
              {staleList.map((p) => {
                const inner = (
                  <div className="card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderLeft: "3px solid #ec4899" }}>
                    <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-2)", color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 14, flexShrink: 0 }}>{p.name.trim().slice(0, 1).toUpperCase()}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text)" }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: "#ec4899" }}>{s.ago(p.days)}</div>
                    </div>
                  </div>
                );
                return p.id ? (
                  <Link key={p.name} href={`/people/${p.id}`} style={{ textDecoration: "none" }}>{inner}</Link>
                ) : (
                  <div key={p.name}>{inner}</div>
                );
              })}
            </div>
          </div>
        )}
        {items.length === 0 ? (
          <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
        ) : (
          <EntityManager kind="people" locale={locale} items={items} />
        )}
      </main>
    </div>
  );
}
