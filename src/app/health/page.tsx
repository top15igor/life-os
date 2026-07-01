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
import { getHealthFocus, type HealthTrend } from "@/lib/health";
import { getWeightData } from "@/lib/weight";
import WeightTracker from "@/components/WeightTracker";
import { getHealthMetrics } from "@/lib/healthMetrics";
import HealthSync from "@/components/HealthSync";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isGoogleHealthConnected, googleHealthConfigured } from "@/lib/googleHealth";

export const dynamic = "force-dynamic";

const STR: Record<string, any> = {
  ru: { health: "Здоровье", sleep: "Сон", weight: "Вес", su: "ч", wu: "кг", trend: "Динамика по дням", perDay: "среднее за день", from: "от", noData: "нет данных", entries: "Записи о здоровье", empty: "Записей о здоровье пока нет — упоминай самочувствие, сон, тренировки, и они появятся здесь.", noTrend: "Динамика появится, когда в записях будет хотя бы пара оценок здоровья, энергии или настроения.", nowTitle: "Здоровье сейчас", goalsTitle: "Цели по здоровью" },
  en: { health: "Health", sleep: "Sleep", weight: "Weight", su: "h", wu: "kg", trend: "Daily dynamics", perDay: "daily average", from: "on", noData: "no data", entries: "Health entries", empty: "No health entries yet — mention wellbeing, sleep, workouts and they'll show here.", noTrend: "The chart appears once your entries have a few health, energy or mood ratings.", nowTitle: "Health right now", goalsTitle: "Health goals" },
  uk: { health: "Здоров'я", sleep: "Сон", weight: "Вага", su: "год", wu: "кг", trend: "Динаміка по днях", perDay: "середнє за день", from: "від", noData: "немає даних", entries: "Записи про здоров'я", empty: "Записів про здоров'я поки немає — згадуй самопочуття, сон, тренування.", noTrend: "Динаміка з'явиться, коли в записах буде хоча б кілька оцінок.", nowTitle: "Здоров'я зараз", goalsTitle: "Цілі щодо здоров'я" },
  fr: { health: "Santé", sleep: "Sommeil", weight: "Poids", su: "h", wu: "kg", trend: "Dynamique quotidienne", perDay: "moyenne par jour", from: "le", noData: "pas de données", entries: "Entrées santé", empty: "Pas encore d'entrées santé — mentionne bien-être, sommeil, sport.", noTrend: "La courbe apparaît dès que tes entrées ont quelques évaluations.", nowTitle: "Santé en ce moment", goalsTitle: "Objectifs santé" },
};

// Короткая дата для подписи оси: «26.06».
function shortDay(d: string) {
  const [, m, day] = d.split("-");
  return `${day}.${m}`;
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

const TREND: Record<HealthTrend, any> = {
  worsening: { ru: "становится хуже", en: "getting worse", uk: "стає гірше", fr: "s'aggrave", color: "#ef4444", icon: "ti-trending-down" },
  stable: { ru: "без изменений", en: "stable", uk: "без змін", fr: "stable", color: "#64748b", icon: "ti-minus" },
  improving: { ru: "идёт на улучшение", en: "improving", uk: "покращується", fr: "s'améliore", color: "#10b981", icon: "ti-trending-up" },
};

function HealthNow({ focus, s, locale }: any) {
  if (!focus || (!focus.concern && (!focus.goals || focus.goals.length === 0))) return null;
  const c = focus.concern;
  const tr = c ? TREND[c.trend as HealthTrend] || TREND.stable : null;
  return (
    <div style={{ marginBottom: 20 }}>
      {c && (
        <div className="card" style={{ borderLeft: `3px solid ${tr.color}`, marginBottom: focus.goals.length ? 10 : 0 }}>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
            <i className="ti ti-activity-heartbeat" style={{ fontSize: 14, color: "#ef4444" }} />{s.nowTitle}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15.5, fontWeight: 600 }}>{c.text}</span>
            <span style={{ fontSize: 12, color: tr.color, background: `${tr.color}1a`, padding: "2px 9px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <i className={`ti ${tr.icon}`} style={{ fontSize: 13 }} />{tr[locale] || tr.ru}
            </span>
          </div>
          {c.note && <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginTop: 7 }}>{c.note}</div>}
        </div>
      )}
      {focus.goals.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 11.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <i className="ti ti-target" style={{ fontSize: 14, color: "var(--accent)" }} />{s.goalsTitle}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {focus.goals.map((g: string, i: number) => (
              <Link key={i} href="/goals?tab=tasks" style={{ fontSize: 12.5, color: "var(--text)", background: "var(--surface-2)", padding: "5px 11px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-flag-3" style={{ fontSize: 13, color: "var(--accent)" }} />{g}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function WellnessPage({ searchParams }: { searchParams: Promise<{ tab?: string; fitbit?: string }> }) {
  const sp = await searchParams;
  const tab = ["health", "energy", "sport", "food"].includes(sp.tab || "") ? sp.tab! : "health";
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;
  const h = hints(locale);
  const all = await getEntries(user.id, 300);

  const energy = dailyTrend(all, [{ name: "energy", color: "#f59e0b", key: "energy" }]);
  const focus = tab === "health" ? await getHealthFocus(user.id) : null;
  const weight = tab === "health" ? await getWeightData(user.id) : null;
  const metrics = tab === "health" ? await getHealthMetrics(user.id) : null;
  let healthToken = "";
  let fbConnected = false;
  if (tab === "health") {
    // Ключ Apple Health = session_secret (стабильный, не ротируется при входе). Фолбэк на token до миграции.
    let u: any = null;
    try { u = (await supabaseAdmin().from("users").select("session_secret, token").eq("id", user.id).maybeSingle()).data; }
    catch { u = (await supabaseAdmin().from("users").select("token").eq("id", user.id).maybeSingle()).data; }
    healthToken = u?.session_secret || u?.token || "";
    fbConnected = await isGoogleHealthConnected(user.id);
  }

  const healthEntries = all.filter((e: Entry) => cats(e).some((c: any) => ["health", "sport", "food"].includes(c.slug)));
  const sportEntries = all.filter((e: Entry) => cats(e).some((c: any) => c.slug === "sport"));
  const foodEntries = all.filter((e: Entry) => cats(e).some((c: any) => c.slug === "food"));

  const overview: Record<string, string> = { ru: "Обзор", en: "Overview", uk: "Огляд", fr: "Aperçu" };
  const tabs = [
    { key: "health", label: overview[locale] || overview.en },
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
            <HealthNow focus={focus} s={s} locale={locale} />
            {weight && <WeightTracker data={weight} locale={locale} />}
            {metrics && <HealthSync days={metrics.days} token={healthToken} locale={locale} fitbitConnected={fbConnected} fitbitConfigured={googleHealthConfigured()} fitbitMsg={sp.fitbit} />}

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
