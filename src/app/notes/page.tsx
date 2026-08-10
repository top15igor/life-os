import Sidebar from "@/components/Sidebar";
import TipsRail from "@/components/TipsRail";
import NotesManager from "@/components/NotesManager";
import ListsBlock from "@/components/ListsBlock";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = { ru: "Заметки", en: "Notes", uk: "Нотатки", fr: "Notes", es: "Notas" };

export default async function NotesPage() {
  await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
            <i className="ti ti-note" style={{ fontSize: 24, color: "var(--accent)" }} />
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{TITLE[locale] || TITLE.ru}</h1>
          </div>
          <NotesManager locale={locale} />
          <ListsBlock locale={locale} />
        </div>
      </main>
      <TipsRail locale={locale} />
    </div>
  );
}
