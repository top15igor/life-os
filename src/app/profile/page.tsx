import Sidebar from "@/components/Sidebar";
import ProfileBody from "@/components/ProfileBody";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ linked?: string; e?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const locale = await getLocale();
  const t = getDict(locale);
  const notice = sp.linked ? "linked" : sp.e === "emailtaken" ? "emailtaken" : undefined;

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <ProfileBody user={user} locale={locale} notice={notice} />
      </main>
    </div>
  );
}
