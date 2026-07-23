import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import Link from "next/link";
import { getEntries, getDreams, getEntityMeta, getMemories, places as placesOf, type Entry } from "@/lib/queries";
import { getTrips, getTripSuggestions, VISIT_RE, WISH_RE } from "@/lib/trips";
import { getLocale } from "@/lib/locale";
import { getDict, dateLabel } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";
import EntityManager from "@/components/EntityManager";
import TravelDiary from "@/components/TravelDiary";

export const dynamic = "force-dynamic";

const STR: Record<string, any> = {
  ru: { mentions: "записей", last: "последняя", been: "Все места (справочник)", beenSub: "Переименовать, объединить дубли или скрыть место", wish: "Куда хочу", wishLink: "Все мечты о путешествиях →" },
  en: { mentions: "entries", last: "last", been: "All places (reference)", beenSub: "Rename, merge duplicates or hide a place", wish: "Where I want to go", wishLink: "All travel dreams →" },
  uk: { mentions: "записів", last: "остання", been: "Усі місця (довідник)", beenSub: "Перейменувати, об'єднати дублі чи приховати місце", wish: "Куди хочу", wishLink: "Усі мрії про подорожі →" },
  fr: { mentions: "entrées", last: "dernière", been: "Tous les lieux (référence)", beenSub: "Renommer, fusionner ou masquer un lieu", wish: "Où je veux aller", wishLink: "Tous les rêves de voyage →" },
  es: { mentions: "entradas", last: "última", been: "Todos los lugares (referencia)", beenSub: "Renombrar, combinar duplicados u ocultar un lugar", wish: "A dónde quiero ir", wishLink: "Todos los sueños de viaje →" },
};

function SectionTitle({ icon, color, children }: any) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 7, margin: "26px 0 11px" }}>
      <i className={`ti ${icon}`} style={{ fontSize: 16, color }} />{children}
    </div>
  );
}

export default async function PlacesPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const s = STR[locale] || STR.ru;
  const [entries, dreams, metas, memoriesRaw] = await Promise.all([
    getEntries(user.id, 300),
    getDreams(user.id),
    getEntityMeta(user.id, "places"),
    getMemories(user.id),
  ]);
  const hiddenNames = new Set(Object.keys(metas).filter((n) => (metas as any)[n]?.hidden));
  const [trips, suggestions] = await Promise.all([getTrips(user.id), getTripSuggestions(user.id, hiddenNames)]);
  const memories = memoriesRaw
    .filter((m) => m.image_url)
    .map((m) => ({ id: m.id, url: m.image_url as string, title: m.title || "", date: m.mem_date }));

  // Мечты о путешествиях — секция «Куда хочу».
  const travelDreams = dreams.filter((d) => d.sphere === "travel");
  const dreamLower = travelDreams.map((d) => (d.text || "").toLowerCase());
  const inDreams = (name: string) => { const k = name.toLowerCase().slice(0, 5); return k.length >= 3 && dreamLower.some((t) => t.includes(k)); };

  // Места из записей (для справочника и «куда хочу»).
  const map = new Map<string, { name: string; count: number; lastDate: string; entries: Entry[]; text: string }>();
  for (const e of entries) {
    const etext = `${e.summary || ""} ${e.raw_text || ""}`.toLowerCase();
    for (const name of placesOf(e)) {
      const m = map.get(name) || { name, count: 0, lastDate: e.entry_date, entries: [], text: "" };
      m.count++;
      m.entries.push(e);
      m.text += " " + etext;
      if (e.entry_date > m.lastDate) m.lastDate = e.entry_date;
      map.set(name, m);
    }
  }
  const allPlaces = [...map.values()];
  const visited = allPlaces.filter((p) => VISIT_RE.test(p.text) && !WISH_RE.test(p.text)).sort((a, b) => b.count - a.count);
  const wishPlaces = allPlaces.filter((p) => WISH_RE.test(p.text) && !VISIT_RE.test(p.text) && !inDreams(p.name)).sort((a, b) => b.count - a.count);
  const visitedItems = visited.map((p) => ({
    id: metas[p.name]?.id,
    name: p.name,
    hidden: metas[p.name]?.hidden || false,
    meta: `${p.count} ${s.mentions} · ${s.last} ${dateLabel(locale, p.lastDate)}`,
    entries: p.entries.map((e: any) => ({ id: e.id, text: e.summary || e.raw_text || "" })),
    lat: metas[p.name]?.lat ?? null,
    lng: metas[p.name]?.lng ?? null,
  }));

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main wide">
        <PageHead icon="ti-plane-departure" color="#06b6d4" title={t.nav.places} hint={h.places} />

        {/* Хронология путешествий */}
        <TravelDiary locale={locale} trips={trips} suggestions={suggestions} memories={memories} />

        {/* КУДА ХОЧУ */}
        {(travelDreams.length > 0 || wishPlaces.length > 0) && (
          <>
            <SectionTitle icon="ti-plane" color="#854F0B">{s.wish}</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
              {travelDreams.map((d) => (
                <Link key={d.id} href="/goals?tab=dreams" className="card" style={{ display: "flex", alignItems: "center", gap: 11, background: "#FAEEDA66", borderColor: "#85500b33" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: "#FAEEDA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
                    {d.emoji || "✈️"}
                  </span>
                  <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "var(--text)" }}>{d.text}</div>
                </Link>
              ))}
              {wishPlaces.map((p) => (
                <Link key={p.name} href={`/entry/${p.entries[0].id}`} className="card" style={{ display: "flex", alignItems: "center", gap: 11, background: "#FAEEDA66", borderColor: "#85500b33" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: "#FAEEDA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>✈️</span>
                  <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "var(--text)" }}>{p.name}</div>
                </Link>
              ))}
            </div>
            <Link href="/goals?tab=dreams" style={{ display: "inline-block", marginTop: 11, fontSize: 12.5, color: "var(--accent)" }}>{s.wishLink}</Link>
          </>
        )}

        {/* ВСЕ МЕСТА — компактный справочник (переименовать/объединить/скрыть) */}
        {visitedItems.length > 0 && (
          <details style={{ marginTop: 26 }}>
            <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-2)", listStyle: "none", display: "flex", alignItems: "center", gap: 7 }}>
              <i className="ti ti-map-pin" style={{ fontSize: 16, color: "#06b6d4" }} />{s.been}
              <span style={{ fontWeight: 400, color: "var(--text-3)", fontSize: 12 }}>· {s.beenSub}</span>
              <i className="ti ti-chevron-down" style={{ fontSize: 14, color: "var(--text-3)" }} />
            </summary>
            <div style={{ marginTop: 11 }}>
              <EntityManager kind="places" locale={locale} items={visitedItems} />
            </div>
          </details>
        )}
      </main>
    </div>
  );
}
