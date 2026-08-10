import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AdminHealth from "@/components/AdminHealth";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

export default async function HealthPage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");

  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main" style={{ maxWidth: 720 }}>
        <Link href="/admin" style={{ color: "var(--accent)", fontSize: 13 }}>← Admin</Link>
        <div style={{ fontSize: 19, fontWeight: 500, margin: "10px 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-activity-heartbeat" style={{ color: "var(--accent)" }} />Здоровье бота
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 16px" }}>
          То же, что раньше открывалось голым JSON по ссылке. Разница в том, что видно, идёт работа или всё зависло, —
          и результат читается списком, а не простынёй.
        </p>
        <AdminHealth />

        <div style={{ marginTop: 22, fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>
          Если что-то упало: красным написано, ЧТО именно и почему судья счёл ответ плохим — это и есть подсказка, где искать.
          Строка «База готова: имя.sql» означает непринятую миграцию: чинится за минуту в Supabase, кодом лезть не нужно.
          Серьёзное диагност сам кладёт в <Link href="/admin/tasks" style={{ color: "var(--accent)" }}>отложенные задачи</Link>,
          там же кнопка «починить» — агент готовит правку и открывает pull request, в main не пишет никогда.
        </div>
      </main>
    </div>
  );
}
