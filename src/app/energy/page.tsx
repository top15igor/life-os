import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import EntryFeed from "@/components/EntryFeed";
import TrendChart from "@/components/TrendChart";
import { getEntries, type Entry } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EnergyPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const all = await getEntries(user.id, 60);
  const chrono = all.slice(0, 14).reverse();
  const series = [{ name: "energy", color: "#f59e0b", values: chrono.map((e: Entry) => e.energy) }];

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-bolt" color="var(--energy)" title={t.nav.energy} hint={h.energy} />
        <div style={{ display: "flex", gap: 6, fontSize: 11.5, color: "var(--text-2)", marginBottom: 6, alignItems: "center" }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: "#f59e0b" }} />{t.energy}
        </div>
        <div className="card" style={{ marginBottom: 20, padding: 10 }}>
          <TrendChart series={series} max={10} />
        </div>
        <EntryFeed entries={all} t={t} locale={locale} />
      </main>
    </div>
  );
}
