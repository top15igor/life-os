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

const STR: Record<string, any> = {
  ru: { health: "Здоровье", sleep: "Сон", weight: "Вес", su: "ч", wu: "кг", trend: "Динамика по дням", perDay: "среднее за день", from: "от", noData: "нет данных", entries: "Записи о здоровье", empty: "Записей о здоровье пока нет — упоминай самочувствие, сон, тренировки, и они появятся здесь.", noTrend: "Динамика появится, когда в записях будет хотя бы пара оценок здоровья, энергии или настроения." },
  en: { health: "Health", sleep: "Sleep", weight: "Weight", su: "h", wu: "kg", trend: "Daily dynamics", perDay: "daily average", from: "on", noData: "no data", entries: "Health entries", empty: "No health entries yet — mention wellbeing, sleep, workouts and they'll show here.", noTrend: "The chart appears once your entries have a few health, energy or mood ratings." },
  uk: { health: "Здоров'я", sleep: "Сон", weight: "Вага", su: "год", wu: "кг", trend: "Динаміка по днях", perDay: "середнє за день", from: "від", noData: "немає даних", entries: "Записи про здоров'я", empty: "Записів про здоров'я поки немає — згадуй самопочуття, сон, тренування.", noTrend: "Динаміка з'явиться, коли в записах буде хоча б кілька оцінок." },
  fr: { health: "Santé", sleep: "Sommeil", weight: "Poids", su: "h", wu: "kg", trend: "Dynamique quotidienne", perDay: "moyenne par jour", from: "le", noData: "pas de données", entries: "Entrées santé", empty: "Pas encore d'entrées santé — mentionne bien-être, sommeil, sport.", noTrend: "La courbe apparaît dès que tes entrées ont quelques évaluations." },
};

// Короткая дата для подписи оси: «26.06».
function shortDay(d: string) {
  const [, m, day] = d.split("-");
  return `${day}.${m}`;
}

// Последнее (и предыдущее) реальное значение метрики. entries идут от новых к старым.
// positiveOnly — для сна: 0 ч это не «спал ноль», а отсутствие данных.
function lastVal(entries: Entry[], key: string, positiveOnly = false) {
  const seq: { v: number; date: string }[] = [];
  for (const e of entries) {
    const v = (e as any)[key];
    if (v != null && (!positiveOnly || v > 0)) seq.push({ v, date: e.entry_date });
  }
  return { value: seq[0]?.v ?? null, date: seq[0]?.date ?? null, prev: seq[1]?.v ?? null };
}

// Тренд по ДНЯМ: среднее значение за каждый день (а не по каждой записи).
function dailyTrend(entries: Entry[], keys: { name: string; color: string; key: string }[]) {
  const byDay = new Map<string, Record<string, number[]>>();
  for (const e of entries) {
    const day = e.entry_date;
    const bucket = byDay.get(day) || {};
    for (const k of keys) {
      const v = (e as any)[k.key];
      if (v != null) (bucket[k.key] ||= []).push(v);
    }
    byDay.set(day, bucket);
  }
  const days = [...byDay.keys()].sort().slice(-14); // по возрастанию, последние 14 дней
  const avg = (arr?: number[]) => (arr && arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);
  const series = keys.map((k) => ({ name: k.name, color: k.color, values: days.map((d) => avg(byDay.get(d)![k.key])) }));
  const labels = days.map(shortDay);
  const hasData = series.some((sr) => sr.values.some((v) => v != null));
  return { series, labels, hasData };
}

function MetricCard({ label, icon, color, value, suffix, dateStr, prev, locale, s, kind }: any) {
  // kind: "good" — рост хорошо (зелёный ↑, красный ↓); "neutral" — без оценки (вес, показываем ±разницу).
  let badge: any = null;
  if (value != null && prev != null && value !== prev) {
    const up = value > prev;
    if (kind === "neutral") {
      const diff = Math.round((value - prev) * 10) / 10;
      badge = <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{diff > 0 ? "+" : ""}{diff} {suffix}</span>;
    } else {
      badge = <span style={{ fontSize: 12, color: up ? "#10b981" : "#ef4444" }}>{up ? "↑" : "↓"}</span>;
    }
  }
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 11, padding: "11px 13px" }}>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 5 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 15, color }} />{label}
      </div>
      <div style={{ fontSize: 21, fontWeight: 500, marginTop: 3, display: "flex", alignItems: "baseline", gap: 7 }}>
        <span>{value ?? "—"}{value != null && suffix ? <span style={{ fontSize: 12, color: "var(--text-3)" }}> {suffix}</span> : null}</span>
        {badge}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
        {value != null && dateStr ? `${s.from} ${dateLabel(locale, dateStr)}` : s.noData}
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
  const s = STR[locale] || STR.ru;
  const h = hints(locale);
  const all = await getEntries(user.id, 300);

  const health = dailyTrend(all, [
    { name: "health", color: "#ef4444", key: "health" },
    { name: "energy", color: "#f59e0b", key: "energy" },
    { name: "mood", color: "#4f46e5", key: "mood" },
  ]);
  const energy = dailyTrend(all, [{ name: "energy", color: "#f59e0b", key: "energy" }]);

  const mHealth = lastVal(all, "health");
  const mSleep = lastVal(all, "sleep_hours", true);
  const mWeight = lastVal(all, "weight");

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
              <MetricCard label={s.health} icon="ti-heart" color="#ef4444" value={mHealth.value} suffix="/10" dateStr={mHealth.date} prev={mHealth.prev} locale={locale} s={s} kind="good" />
              <MetricCard label={s.sleep} icon="ti-moon" color="#4f46e5" value={mSleep.value} suffix={s.su} dateStr={mSleep.date} prev={mSleep.prev} locale={locale} s={s} kind="good" />
              <MetricCard label={s.weight} icon="ti-scale" color="#0ea5e9" value={mWeight.value} suffix={s.wu} dateStr={mWeight.date} prev={mWeight.prev} locale={locale} s={s} kind="neutral" />
            </div>

            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 4 }}>{s.trend} <span style={{ color: "var(--text-3)" }}>· {s.perDay}</span></div>
            <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--text-2)", marginBottom: 6 }}>
              <Dot c="#ef4444" label={t.health} /><Dot c="#f59e0b" label={t.energy} /><Dot c="#4f46e5" label={t.mood} />
            </div>
            {health.hasData ? (
              <div className="card" style={{ marginBottom: 20, padding: 10 }}>
                <TrendChart series={health.series} max={10} labels={health.labels} />
              </div>
            ) : (
              <div className="card" style={{ marginBottom: 20, color: "var(--text-2)", fontSize: 13 }}>{s.noTrend}</div>
            )}

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
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 4 }}>{s.trend} <span style={{ color: "var(--text-3)" }}>· {s.perDay}</span></div>
            <div style={{ display: "flex", gap: 6, fontSize: 11.5, color: "var(--text-2)", marginBottom: 6, alignItems: "center" }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: "#f59e0b" }} />{t.energy}
            </div>
            {energy.hasData ? (
              <div className="card" style={{ marginBottom: 20, padding: 10 }}>
                <TrendChart series={energy.series} max={10} labels={energy.labels} />
              </div>
            ) : (
              <div className="card" style={{ marginBottom: 20, color: "var(--text-2)", fontSize: 13 }}>{s.noTrend}</div>
            )}
            <EntryFeed entries={all} t={t} locale={locale} />
          </>
        )}

        {tab === "sport" && <EntryFeed entries={sportEntries} t={t} locale={locale} />}
        {tab === "food" && <EntryFeed entries={foodEntries} t={t} locale={locale} />}
      </main>
    </div>
  );
}
