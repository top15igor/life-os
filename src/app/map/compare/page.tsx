import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import MapCompare from "@/components/MapCompare";
import { getMapPoints } from "@/lib/lifeMap";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Временная страница выбора подложки: посмотреть глазами на своих же точках.
export default async function MapComparePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const points = (await getMapPoints(user.id)).slice(-60).map((p) => ({ lat: p.lat, lng: p.lng, url: p.url }));

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-versions" color="#0ea5e9" title="Какую карту берём" hint="Одно и то же место в четырёх исполнениях — чтобы выбрать глазами." />
        <MapCompare points={points} />
        <div style={{ marginTop: 18, fontSize: 13, color: "var(--text-3)" }}>
          <Link href="/map" style={{ color: "var(--accent)" }}>← вернуться к карте жизни</Link>
        </div>
      </main>
    </div>
  );
}
