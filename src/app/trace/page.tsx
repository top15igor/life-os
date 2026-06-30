import Sidebar from "@/components/Sidebar";
import TraceView from "@/components/TraceView";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { getGoodDeeds, getAllPromises, getTraceWeek } from "@/lib/queries";
import { isCalendarConnected, getCalendarLinkMap } from "@/lib/googleCalendar";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const STR: Record<string, { title: string; sub: string }> = {
  ru: { title: "Мой след", sub: "История того, что стало лучше благодаря тебе." },
  en: { title: "My Trace", sub: "The story of what got better thanks to you." },
  uk: { title: "Мій слід", sub: "Історія того, що стало кращим завдяки тобі." },
  fr: { title: "Mon empreinte", sub: "L'histoire de ce qui s'est amélioré grâce à toi." },
};

export default async function TracePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;

  const [deeds, promises, week] = await Promise.all([
    getGoodDeeds(user.id, 200),
    getAllPromises(user.id),
    getTraceWeek(user.id),
  ]);
  let gratitudeCount = 0;
  try {
    const { count } = await supabaseAdmin().from("gratitude").select("*", { count: "exact", head: true }).eq("user_id", user.id);
    gratitudeCount = count || 0;
  } catch {}
  const [calConnected, calLinks] = await Promise.all([
    isCalendarConnected(user.id),
    getCalendarLinkMap(user.id, ["promise"]),
  ]);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <i className="ti ti-heart-handshake" style={{ fontSize: 24, color: "#ec4899" }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{s.title}</h1>
        </div>
        <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.6, marginTop: 0, marginBottom: 18 }}>{s.sub}</p>
        <TraceView locale={locale} deeds={deeds} promises={promises} gratitudeCount={gratitudeCount} week={week} calConnected={calConnected} calLinks={calLinks} />
      </main>
    </div>
  );
}
