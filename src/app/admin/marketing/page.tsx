import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import MarketingBoard from "@/components/MarketingBoard";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

export default async function MarketingPage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");
  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <Link href="/admin" style={{ color: "var(--accent)", fontSize: 13 }}>← Admin</Link>

        <div style={{ margin: "12px 0 6px", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-speakerphone" style={{ fontSize: 26, color: "var(--accent)" }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Маркетинг</h1>
        </div>
        <p style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.6, marginTop: 0, marginBottom: 18, maxWidth: 660 }}>
          Всё для продвижения LIFE OS: 50 идей, готовые сценарии Reels, тексты постов, Stories-воронка и контент-план. Главный мотив — подарить близким их собственную книгу жизни.
        </p>

        <MarketingBoard />
      </main>
    </div>
  );
}
