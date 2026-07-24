import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { listHeirs } from "@/lib/heirs";
import HeirsManager from "@/components/HeirsManager";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = { ru: "Наследники", en: "Heirs", uk: "Спадкоємці", fr: "Héritiers", es: "Herederos" };
const SUB: Record<string, string> = {
  ru: "Кому однажды откроется твоя Книга жизни",
  en: "Who will one day get access to your Book of Life",
  uk: "Кому одного дня відкриється твоя Книга життя",
  fr: "À qui ton Livre de vie s'ouvrira un jour",
  es: "A quién se abrirá un día tu Libro de la vida",
};

export default async function HeirsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const heirs = await listHeirs(user.id);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <Link href="/lifebook" style={{ color: "var(--accent)", fontSize: 13 }}>← {t.nav.lifebook}</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 4px" }}>
          <i className="ti ti-users-group" style={{ fontSize: 24, color: "#ec4899" }} />
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{TITLE[locale] || TITLE.ru}</h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", margin: "0 0 18px" }}>{SUB[locale] || SUB.ru}</p>
        <HeirsManager initial={heirs as any} locale={locale} />
      </main>
    </div>
  );
}
