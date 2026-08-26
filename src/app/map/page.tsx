import Sidebar from "@/components/Sidebar";
import CaseStrip from "@/components/CaseStrip";
import TipsRail from "@/components/TipsRail";
import PageHead from "@/components/PageHead";
import LifeMap from "@/components/LifeMap";
import { getMapPoints, getPhotosWithoutGeo, getAllMedia } from "@/lib/lifeMap";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";
import { mapkitConfigured } from "@/lib/mapkit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);

  const [points, orphans, media] = await Promise.all([getMapPoints(user.id), getPhotosWithoutGeo(user.id), getAllMedia(user.id)]);

  // Карты Apple доступны, только если заведён ключ разработчика. Нет ключа —
  // человек даже не увидит переключатель, и карта работает как раньше.
  // По умолчанию — векторная карта: чёткая на ретине, с непрерывным зумом,
  // ночной темой и русскими подписями, и при этом бесплатная и без ключей.
  const appleReady = mapkitConfigured();
  let provider: "vector" | "osm" | "apple" = "vector";
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", user.id).maybeSingle();
    const saved = (data as any)?.morning_prefs?.mapProvider;
    if (saved === "osm" || saved === "vector") provider = saved;
    else if (saved === "apple" && appleReady) provider = "apple";
  } catch {}

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <CaseStrip locale={locale} section="map" />
        <PageHead icon="ti-map-2" color="#0ea5e9" title={t.nav.map} hint={h.map} />
        <LifeMap
          locale={locale}
          points={points}
          orphans={orphans.items}
          orphanTotal={orphans.total}
          media={media}
          appleReady={appleReady}
          provider={provider}
        />
      </main>
      <TipsRail locale={locale} section="map" />
    </div>
  );
}
