import Sidebar from "@/components/Sidebar";
import TrendChart from "@/components/TrendChart";
import { getEntries, cats, people as peopleOf, type Entry } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STR = {
  ru: { trend: "Настроение и энергия", topThemes: "Главные темы", topPeople: "Чаще всего упомянуты", stats: "Сводка", total: "Записей", avgMood: "Ср. настроение", avgEnergy: "Ср. энергия", avgHealth: "Ср. здоровье", empty: "Аналитика наполнится, когда накопятся записи.", times: "раз" },
  en: { trend: "Mood & energy", topThemes: "Top themes", topPeople: "Most mentioned", stats: "Summary", total: "Entries", avgMood: "Avg mood", avgEnergy: "Avg energy", avgHealth: "Avg health", empty: "Analytics will fill in as entries accumulate.", times: "×" },
  uk: { trend: "Настрій та енергія", topThemes: "Головні теми", topPeople: "Найчастіше згадані", stats: "Зведення", total: "Записів", avgMood: "Сер. настрій", avgEnergy: "Сер. енергія", avgHealth: "Сер. здоров'я", empty: "Аналітика наповниться з часом.", times: "раз" },
  fr: { trend: "Humeur & énergie", topThemes: "Thèmes principaux", topPeople: "Plus mentionnés", stats: "Résumé", total: "Entrées", avgMood: "Humeur moy.", avgEnergy: "Énergie moy.", avgHealth: "Santé moy.", empty: "L'analytique se remplira au fil des entrées.", times: "×" },
};

const CAT_COLOR: Record<string, string> = {
  health: "#ef4444", sport: "#10b981", food: "#84cc16", family: "#ec4899", business: "#3b82f6",
  finance: "#0ea5e9", ideas: "#f59e0b", insight: "#8b5cf6", task: "#6366f1", gratitude: "#14b8a6",
  travel: "#06b6d4", emotions: "#a78bfa",
};

function avg(entries: Entry[], key: string) {
  const v = entries.map((e) => e[key]).filter((x) => x != null) as number[];
  return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "—";
}

export default async function AnalyticsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale];
  const entries = await getEntries(user.id, 200);

  if (entries.length === 0) {
    return (
      <div className="shell">
        <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
        <main className="main">
          <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-chart-line" style={{ color: "#3b82f6" }} />{t.nav.analytics}
          </div>
          <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
        </main>
      </div>
    );
  }

  const chrono = entries.slice(0, 20).reverse();
  const series = [
    { name: "mood", color: "#4f46e5", values: chrono.map((e: Entry) => e.mood) },
    { name: "energy", color: "#f59e0b", values: chrono.map((e: Entry) => e.energy) },
  ];

  const catCount: Record<string, number> = {};
  for (const e of entries) for (const c of cats(e)) catCount[c.slug] = (catCount[c.slug] || 0) + 1;
  const topThemes = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxTheme = topThemes[0]?.[1] || 1;

  const peopleCount: Record<string, number> = {};
  for (const e of entries) for (const p of peopleOf(e)) peopleCount[p] = (peopleCount[p] || 0) + 1;
  const topPeople = Object.entries(peopleCount).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-chart-line" style={{ color: "#3b82f6" }} />{t.nav.analytics}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 9, marginBottom: 20 }}>
          {[[s.total, entries.length], [s.avgMood, avg(entries, "mood")], [s.avgEnergy, avg(entries, "energy")], [s.avgHealth, avg(entries, "health")]].map(([l, v]: any) => (
            <div key={l} style={{ background: "var(--surface-2)", borderRadius: 11, padding: "11px 13px" }}>
              <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{l}</div>
              <div style={{ fontSize: 21, fontWeight: 500, marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 4 }}>{s.trend}</div>
        <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--text-2)", marginBottom: 6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#4f46e5" }} />{t.mood}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#f59e0b" }} />{t.energy}</span>
        </div>
        <div className="card" style={{ marginBottom: 20, padding: 10 }}>
          <TrendChart series={series} max={10} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 8 }}>{s.topThemes}</div>
            {topThemes.map(([slug, count]) => (
              <div key={slug} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                  <span>{t.cats[slug] || slug}</span><span style={{ color: "var(--text-3)" }}>{count}</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((count / maxTheme) * 100)}%`, height: "100%", background: CAT_COLOR[slug] || "#4f46e5" }} />
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 8 }}>{s.topPeople}</div>
            {topPeople.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>—</div>
            ) : (
              topPeople.map(([name, count]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>{name}</span><span style={{ color: "var(--text-3)" }}>{count} {s.times}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
