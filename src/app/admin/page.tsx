import Sidebar from "@/components/Sidebar";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { getAdminData } from "@/lib/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

function Stat({ label, value, color }: any) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "13px 15px" }}>
      <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 500, marginTop: 3, color: color || "var(--text)" }}>{value}</div>
    </div>
  );
}

export default async function AdminPage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");

  const locale = await getLocale();
  const t = getDict(locale);
  const d = await getAdminData();

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-shield-lock" style={{ color: "var(--accent)" }} />Admin · LIFE OS
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
          <Stat label="Пользователей" value={d.totalUsers} />
          <Stat label="Активных (7 дней)" value={d.activeUsers} color="var(--positive)" />
          <Stat label="Неактивных" value={d.inactiveUsers} color="var(--text-2)" />
          <Stat label="Всего записей" value={d.totalEntries} color="var(--accent)" />
        </div>

        {d.topReferrers.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10 }}>Кто больше всех приглашает</div>
            <div className="card" style={{ padding: "6px 14px" }}>
              {d.topReferrers.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "8px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-user-plus" style={{ fontSize: 16, color: "var(--accent)" }} />{r.name}</span>
                  <span style={{ color: "var(--text-3)" }}>{r.count} {r.count === 1 ? "приглашённый" : "приглашённых"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10 }}>Все пользователи ({d.totalUsers})</div>
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "var(--text-2)", fontSize: 11.5, textAlign: "left" }}>
                <th style={{ padding: "10px 12px", fontWeight: 500 }}>Имя</th>
                <th style={{ padding: "10px 12px", fontWeight: 500 }}>Записей</th>
                <th style={{ padding: "10px 12px", fontWeight: 500 }}>Последняя</th>
                <th style={{ padding: "10px 12px", fontWeight: 500 }}>Пришёл</th>
                <th style={{ padding: "10px 12px", fontWeight: 500 }}>Пригласил</th>
                <th style={{ padding: "10px 12px", fontWeight: 500 }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {d.list.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: "10px 12px" }}>{u.entries}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text-2)" }}>{u.last || "—"}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text-2)" }}>{u.joined || "—"}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text-2)" }}>{u.referrer || "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 99, background: u.active ? "rgba(5,150,105,0.12)" : "var(--surface-2)", color: u.active ? "var(--positive)" : "var(--text-3)" }}>
                      {u.active ? "активен" : u.entries === 0 ? "не писал" : "тихо"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
