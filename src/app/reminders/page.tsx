import Sidebar from "@/components/Sidebar";
import RemindersView from "@/components/RemindersView";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isCalendarConnected } from "@/lib/googleCalendar";

export const dynamic = "force-dynamic";

const STR: Record<string, { title: string; sub: string }> = {
  ru: { title: "Напоминания", sub: "Поставь напоминание — оно придёт уведомлением в Google Календарь." },
  en: { title: "Reminders", sub: "Set a reminder — it pops up as a notification in Google Calendar." },
  uk: { title: "Нагадування", sub: "Постав нагадування — воно прийде сповіщенням у Google Календар." },
  fr: { title: "Rappels", sub: "Crée un rappel — il s'affiche comme notification dans Google Agenda." },
};

export default async function RemindersPage({ searchParams }: { searchParams: Promise<{ cal?: string }> }) {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;
  const sp = await searchParams;

  let reminders: any[] = [];
  try {
    const { data } = await supabaseAdmin()
      .from("reminders")
      .select("id, text, due_at, gcal_event_id, gcal_link, done")
      .eq("user_id", user.id)
      .order("due_at", { ascending: true })
      .limit(200);
    reminders = data || [];
  } catch {}
  const connected = await isCalendarConnected(user.id);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <i className="ti ti-bell" style={{ fontSize: 24, color: "var(--accent)" }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{s.title}</h1>
        </div>
        <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.6, marginTop: 0, marginBottom: 18 }}>{s.sub}</p>
        <RemindersView locale={locale} initial={reminders} connected={connected} calStatus={sp.cal} />
      </main>
    </div>
  );
}
