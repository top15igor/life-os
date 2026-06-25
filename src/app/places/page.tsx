import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import Link from "next/link";
import { getEntries, places as placesOf, type Entry } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict, dateLabel } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STR: Record<string, any> = {
  ru: { mentions: "записей", last: "последняя", empty: "Мест пока нет — упоминай места в записях, и они появятся." },
  en: { mentions: "entries", last: "last", empty: "No places yet — mention places in your entries." },
  uk: { mentions: "записів", last: "остання", empty: "Місць поки немає — згадуй місця в записах." },
  fr: { mentions: "entrées", last: "dernière", empty: "Pas encore de lieux — mentionne des lieux dans tes entrées." },
};

const COLORS = ["#06b6d4", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default async function PlacesPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const s = STR[locale] || STR.ru;
  const entries = await getEntries(user.id, 300);

  const map = new Map<string, { name: string; count: number; lastDate: string; entries: Entry[] }>();
  for (const e of entries) {
    for (const name of placesOf(e)) {
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
        <PageHead icon="ti-map-pin" color="#06b6d4" title={t.nav.places} hint={h.places} />
        {list.length === 0 ? (
          <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
            {list.map((p, idx) => (
              <div key={p.name} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--surface-2)", color: COLORS[idx % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-map-pin" style={{ fontSize: 18 }} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{p.count} {s.mentions} · {s.last} {dateLabel(locale, p.lastDate)}</div>
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
