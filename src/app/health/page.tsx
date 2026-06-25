import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import TrendChart from "@/components/TrendChart";
import EntryFeed from "@/components/EntryFeed";
import SubTabs from "@/components/SubTabs";
import { getEntries, cats, type Entry } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict, dateLabel } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import PageHead from "@/components/PageHead";
import { hints } from "@/lib/hints";

export const dynamic = "force-dynamic";

const STR = {
  ru: { health: "Здоровье", sleep: "Сон", weight: "Вес", su: "ч", wu: "кг", trend: "Тренд: здоровье · энергия · настроение", entries: "Записи о здоровье", empty: "Записей о здоровье пока нет — упоминай самочувствие, сон, тренировки, и они появятся здесь." },
  en: { health: "Health", sleep: "Sleep", weight: "Weight", su: "h", wu: "kg", trend: "Trend: health · energy · mood", entries: "Health entries", empty: "No health entries yet — mention wellbeing, sleep, workouts and they'll show here." },
  uk: { health: "Здоров'я", sleep: "Сон", weight: "Вага", su: "год", wu: "кг", trend: "Тренд: здоров'я · енергія · настрій", entries: "Записи про здоров'я", empty: "Записів про здоров'я поки немає — згадуй самопочуття, сон, тренування." },
  fr: { health: "Santé", sleep: "Sommeil", weight: "Poids", su: "h", wu: "kg", trend: "Tendance : santé · énergie · humeur", entries: "Entrées santé", empty: "Pas encore d'entrées santé — mentionne bien-être, sommeil, sport." },
};

function latest(entries: Entry[], key: string) {
  for (const e of entries) if (e[key] != null) return e[key];
  return null;
}

function Metric({ label, icon, value, suffix, color }: any) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 11, padding: "11px 13px" }}>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 5 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 15, color }} />{label}
      </div>
      <div style={{ fontSize: 21, fontWeight: 500, marginTop: 3 }}>
        {value ?? "—"}{value != null && suffix ? <span style={{ fontSize: 12, color: "var(--text-3)" }}> {suffix}</span> : null}
      </div>
    </div>
  );
}

function Dot({ c, label }: { c: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: c }} />{label}
    </span>
  );
}

export default async function WellnessPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab = ["health", "energy", "sport", "food"].includes(sp.tab || "") ? sp.tab! : "health";
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale];
  const h = hints(locale);
  const all = await getEntries(user.id, 300);

  const chrono = all.slice(0, 14).reverse();
  const healthSeries = [
    { name: "health", color: "#ef4444", values: chrono.map((e: Entry) => e.health) },
    { name: "energy", color: "#f59e0b", values: chrono.map((e: Entry) => e.energy) },
    { name: "mood", color: "#4f46e5", values: chrono.map((e: Entry) => e.mood) },
  ];
  const energySeries = [{ name: "energy", color: "#f59e0b", values: chrono.map((e: Entry) => e.energy) }];
  const healthEntries = all.filter((e: Entry) => cats(e).some((c: any) => ["health", "sport", "food"].includes(c.slug)));
  const sportEntries = all.filter((e: Entry) => cats(e).some((c: any) => c.slug === "sport"));
  const foodEntries = all.filter((e: Entry) => cats(e).some((c: any) => c.slug === "food"));

  const tabs = [
    { key: "health", label: t.nav.health },
    { key: "energy", label: t.nav.energy },
    { key: "sport", label: t.nav.sport },
    { key: "food", label: t.nav.food },
  ];

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-heartbeat" color="#ef4444" title={t.nav.wellness} hint={h.wellness} />
        <SubTabs base="/health" active={tab} tabs={tabs} />

        {tab === "health" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 9, marginBottom: 20 }}>
              <Metric label={s.health} icon="ti-heart" value={latest(all, "health")} suffix="/10" color="#ef4444" />
              <Metric label={s.sleep} icon="ti-moon" value={latest(all, "sleep_hours")} suffix={s.su} color="#4f46e5" />
              <Metric label={s.weight} icon="ti-scale" value={latest(all, "weight")} suffix={s.wu} color="#0ea5e9" />
            </div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 4 }}>{s.trend}</div>
            <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--text-2)", marginBottom: 6 }}>
              <Dot c="#ef4444" label={t.health} /><Dot c="#f59e0b" label={t.energy} /><Dot c="#4f46e5" label={t.mood} />
            </div>
            <div className="card" style={{ marginBottom: 20, padding: 10 }}>
              <TrendChart series={healthSeries} max={10} />
            </div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 8 }}>{s.entries}</div>
            {healthEntries.length === 0 ? (
              <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
            ) : (
              healthEntries.map((e: Entry) => (
                <Link key={e.id} href={`/entry/${e.id}`} className="card" style={{ display: "block", marginBottom: 9 }}>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 5 }}>{dateLabel(locale, e.entry_date)}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>{e.summary || e.raw_text}</div>
                </Link>
              ))
            )}
          </>
        )}

        {tab === "energy" && (
          <>
            <div style={{ display: "flex", gap: 6, fontSize: 11.5, color: "var(--text-2)", marginBottom: 6, alignItems: "center" }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: "#f59e0b" }} />{t.energy}
            </div>
            <div className="card" style={{ marginBottom: 20, padding: 10 }}>
              <TrendChart series={energySeries} max={10} />
            </div>
            <EntryFeed entries={all} t={t} locale={locale} />
          </>
        )}

        {tab === "sport" && <EntryFeed entries={sportEntries} t={t} locale={locale} />}
        {tab === "food" && <EntryFeed entries={foodEntries} t={t} locale={locale} />}
      </main>
    </div>
  );
}
