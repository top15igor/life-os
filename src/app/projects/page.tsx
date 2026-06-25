import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { getEntries, projects as projectsOf, type Entry } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict, dateLabel } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import PageHead from "@/components/PageHead";
import { hints } from "@/lib/hints";

export const dynamic = "force-dynamic";

const STR = {
  ru: { notes: "записей", empty: "Проектов пока нет — появятся, когда упомянёшь их в записях.", last: "последняя" },
  en: { notes: "entries", empty: "No projects yet — they'll appear when you mention them.", last: "last" },
  uk: { notes: "записів", empty: "Проєктів поки немає — з'являться, коли згадаєш їх.", last: "остання" },
  fr: { notes: "entrées", empty: "Pas encore de projets — ils apparaîtront quand tu les mentionnes.", last: "dernière" },
};

const COLORS = ["#3b82f6", "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];

export default async function ProjectsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale];
  const h = hints(locale);
  const entries = await getEntries(user.id, 300);

  const map = new Map<string, { name: string; count: number; lastDate: string; entries: Entry[] }>();
  for (const e of entries) {
    for (const name of projectsOf(e)) {
      const m = map.get(name) || { name, count: 0, lastDate: e.entry_date, entries: [] };
      m.count++;
      m.entries.push(e);
      if (e.entry_date > m.lastDate) m.lastDate = e.entry_date;
      map.set(name, m);
    }
  }
  const list = [...map.values()].sort((a, b) => b.count - a.count);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-briefcase" color="#3b82f6" title={t.nav.projects} hint={h.projects} />
        {list.length === 0 ? (
          <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
            {list.map((p, idx) => (
              <div key={p.name} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--surface-2)", color: COLORS[idx % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-briefcase" style={{ fontSize: 18 }} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{p.count} {s.notes} · {s.last} {dateLabel(locale, p.lastDate)}</div>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                  {p.entries.slice(0, 3).map((e: any) => (
                    <Link key={e.id} href={`/entry/${e.id}`} style={{ display: "block", fontSize: 12.5, color: "var(--text-2)", padding: "3px 0", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      · {e.summary || e.raw_text}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
