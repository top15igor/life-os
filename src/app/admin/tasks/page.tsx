import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AdminTasks from "@/components/AdminTasks";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { getAdminTasks } from "@/lib/adminTasks";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

export default async function AdminTasksPage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");

  const locale = await getLocale();
  const t = getDict(locale);
  const tasks = await getAdminTasks();

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <Link href="/admin" style={{ color: "var(--accent)", fontSize: 13 }}>← Admin</Link>
        <div style={{ fontSize: 19, fontWeight: 500, margin: "10px 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-clock-pause" style={{ color: "var(--accent)" }} />Отложенные задачи
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 18 }}>Всё, что отложено на потом: идеи, доработки, мысли. Запиши — реализуешь позже.</div>
        <AdminTasks initial={tasks as any} />
      </main>
    </div>
  );
}
