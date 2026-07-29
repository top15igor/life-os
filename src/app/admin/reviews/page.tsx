import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AdminReviews from "@/components/AdminReviews";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { getAllReviews } from "@/lib/reviews";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

export default async function AdminReviewsPage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");

  const locale = await getLocale();
  const t = getDict(locale);
  const reviews = await getAllReviews();
  const pending = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <Link href="/admin" style={{ color: "var(--accent)", fontSize: 13 }}>← Admin</Link>
        <div style={{ fontSize: 19, fontWeight: 500, margin: "10px 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-star" style={{ color: "var(--accent)" }} />Отзывы
          {pending > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: "#f59e0b", borderRadius: 999, padding: "2px 9px" }}>{pending}</span>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 18 }}>
          Отзывы с /reviews. На лендинг попадают только те, что нажал «Опубликовать».
        </div>
        <AdminReviews initial={reviews as any} />
      </main>
    </div>
  );
}
