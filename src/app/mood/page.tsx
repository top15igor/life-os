import Sidebar from "@/components/Sidebar";
import MoodCalendar from "@/components/MoodCalendar";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MoodPage() {
  await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <i className="ti ti-mood-smile" style={{ fontSize: 24, color: "var(--accent)" }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Настроение</h1>
        </div>
        <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.6, marginTop: 0, marginBottom: 18 }}>
          Календарь заполняется сам из твоих записей — тапни любой день, чтобы поправить или добавить настроение.
        </p>
        <MoodCalendar />
      </main>
    </div>
  );
}
