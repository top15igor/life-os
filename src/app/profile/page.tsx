import Sidebar from "@/components/Sidebar";
import ProfileBody from "@/components/ProfileBody";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <ProfileBody user={user} locale={locale} />
      </main>
    </div>
  );
}
