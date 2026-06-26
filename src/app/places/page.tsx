import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import Link from "next/link";
import { getEntries, getDreams, getEntityMeta, places as placesOf, type Entry } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict, dateLabel } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";
import EntityManager from "@/components/EntityManager";

export const dynamic = "force-dynamic";

const STR: Record<string, any> = {
  ru: { mentions: "записей", last: "последняя", been: "Где я был", wish: "Куда хочу", beenEmpty: "Пока нет мест, где ты бывал — расскажи в записи «был в…», «съездил в…», и они появятся.", wishLink: "Все мечты о путешествиях →", empty: "Мест пока нет — упоминай их в записях, и они появятся здесь." },
  en: { mentions: "entries", last: "last", been: "Where I've been", wish: "Where I want to go", beenEmpty: "No visited places yet — say «I was in…», «went to…» in an entry and they'll show up.", wishLink: "All travel dreams →", empty: "No places yet — mention them in your entries." },
  uk: { mentions: "записів", last: "остання", been: "Де я був", wish: "Куди хочу", beenEmpty: "Поки немає місць, де ти бував — скажи в записі «був у…», «їздив у…», і вони з'являться.", wishLink: "Усі мрії про подорожі →", empty: "Місць поки немає — згадуй їх у записах." },
  fr: { mentions: "entrées", last: "dernière", been: "Où je suis allé", wish: "Où je veux aller", beenEmpty: "Pas encore de lieux visités — dis «j'étais à…», «je suis allé à…» dans une entrée.", wishLink: "Tous les rêves de voyage →", empty: "Pas encore de lieux — mentionne-les dans tes entrées." },
};

const COLORS = ["#06b6d4", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

function SectionTitle({ icon, color, children }: any) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 7, margin: "22px 0 11px" }}>
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
  const [entries, dreams] = await Promise.all([getEntries(user.id, 300), getDreams(user.id)]);

  // Мечты о путешествиях — отдельная секция «Куда хочу».
  const travelDreams = dreams.filter((d) => d.sphere === "travel");
  const dreamLower = travelDreams.map((d) => (d.text || "").toLowerCase());
  const inDreams = (name: string) => { const k = name.toLowerCase().slice(0, 5); return k.length >= 3 && dreamLower.some((t) => t.includes(k)); };

  // Контекст упоминания места: поездка vs мечта (по тексту записи).
  const VISIT_RE = /(\bбыл|побыва|съезд|поехал|ездил|посети|вернул|прилет|отдыха|переехал|гостил|жил в|visited|went to|came back|trip to)/i;
  const WISH_RE = /(мечт|хочу|хотел|объезд|когда-нибудь|планиру|поехать бы|съездить бы|dream|want to go|wish to)/i;

  // Собираем места с накопленным текстом их записей.
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
  // «Был» = есть маркер поездки ИЛИ нейтральное упоминание (без маркера мечты).
  const visited = allPlaces.filter((p) => VISIT_RE.test(p.text) || !WISH_RE.test(p.text)).sort((a, b) => b.count - a.count);
  // «Хочу» = маркер мечты и нет маркера поездки, и ещё не показано как мечта в карте желаний.
  const wishPlaces = allPlaces.filter((p) => !VISIT_RE.test(p.text) && WISH_RE.test(p.text) && !inDreams(p.name)).sort((a, b) => b.count - a.count);
  const nothing = visited.length === 0 && travelDreams.length === 0 && wishPlaces.length === 0;

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-map-pin" color="#06b6d4" title={t.nav.places} hint={h.places} />

        {nothing ? (
          <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
        ) : (
          <>
            {/* ГДЕ Я БЫЛ */}
            <SectionTitle icon="ti-map-pin" color="#06b6d4">{s.been}</SectionTitle>
            {visited.length === 0 ? (
              <div className="card" style={{ color: "var(--text-2)", fontSize: 13.5 }}>{s.beenEmpty}</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
                {visited.map((p, idx) => (
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
          </>
        )}
      </main>
    </div>
  );
}
