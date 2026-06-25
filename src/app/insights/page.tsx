import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { getInsights } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict, dateLabel } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import PageHead from "@/components/PageHead";
import { hints } from "@/lib/hints";

export const dynamic = "force-dynamic";

const STR = {
  ru: { from: "из записи от", empty: "Инсайтов пока нет — они появятся из твоих записей." },
  en: { from: "from entry on", empty: "No insights yet — they'll appear from your entries." },
  uk: { from: "із запису від", empty: "Інсайтів поки немає — з'являться з твоїх записів." },
  fr: { from: "de l'entrée du", empty: "Pas encore d'insights — ils apparaîtront depuis tes entrées." },
};

export default async function InsightsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale];
  const h = hints(locale);
  const insights = await getInsights(user.id);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-bulb" color="var(--energy)" title={t.nav.insights} hint={h.insights} />
        {insights.length === 0 ? (
          <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
        ) : (
          insights.map((i: any, k: number) => (
            <Link key={k} href={i.entry_id ? `/entry/${i.entry_id}` : "#"} className="card" style={{ display: "block", marginBottom: 9 }}>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, display: "flex", gap: 9 }}>
                <i className="ti ti-bulb" style={{ fontSize: 16, color: "var(--energy)", marginTop: 2 }} />
                <span>{i.text}</span>
              </div>
              {i.entries?.entry_date && (
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6, marginLeft: 25 }}>
                  {s.from} {dateLabel(locale, i.entries.entry_date)}
                </div>
              )}
            </Link>
          ))
        )}
      </main>
    </div>
  );
}
