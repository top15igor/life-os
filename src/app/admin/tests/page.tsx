import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTesterData, type TesterRow } from "@/lib/admin";

export const dynamic = "force-dynamic";
const OWNER = "00000000-0000-0000-0000-000000000000";

function fmt(d: string | null): string {
  if (!d) return "—";
  const [y, m, dd] = d.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, dd)));
}
function fmtShort(d: string): string {
  const [y, m, dd] = d.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(Date.UTC(y, m - 1, dd)));
}

const BONUS_DAYS = 24; // сколько дней с 10+ записями считаем «месяцем» для бонуса

function Chip({ children, color }: { children: any; color?: string }) {
  return <span style={{ fontSize: 12.5, fontWeight: 600, color: color || "var(--text-2)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "3px 9px", borderRadius: 8, whiteSpace: "nowrap" }}>{children}</span>;
}

function TesterCard({ tr }: { tr: TesterRow }) {
  const bonus = tr.daysWith10 >= BONUS_DAYS;
  return (
    <div className="card" style={{ marginBottom: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{tr.name}</span>
        {tr.email && <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{tr.email}</span>}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>с {fmt(tr.since)} · послед. {fmt(tr.lastDay)}</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <Chip>📖 {tr.totalEntries} записей</Chip>
        <Chip>🗓 {tr.reportDays} дн. отчётов</Chip>
        <Chip color={tr.daysWith10 >= BONUS_DAYS ? "#0e9f6e" : "var(--text-2)"}>≥10 записей: {tr.daysWith10} дн.</Chip>
        <Chip color="#e0533d">🐞 {tr.bugReports} описаний · {tr.bugMarks} отметок</Chip>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", color: "var(--text-3)" }}>К оплате:</span>
        {bonus
          ? <Chip color="#0e9f6e">🎁 бонус $100 заработан</Chip>
          : <Chip>🎁 бонус: {tr.daysWith10}/{BONUS_DAYS} дн. с 10+</Chip>}
        <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>+ баги: смотри описания ниже, ставь $5 (мелкая) / $10 (баг)</span>
      </div>

      {tr.reports.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>Отчёты по дням ({tr.reports.length})</summary>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
            {tr.reports.map((r) => (
              <div key={r.day} style={{ borderLeft: "2px solid var(--border)", paddingLeft: 12 }}>
                <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "baseline" }}>
                  <b style={{ fontSize: 13.5 }}>{fmtShort(r.day)}</b>
                  <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>📖 {r.entries}</span>
                  {r.ok > 0 && <span style={{ fontSize: 12.5, color: "#0e9f6e" }}>✓ {r.ok}</span>}
                  {r.bug > 0 && <span style={{ fontSize: 12.5, color: "#e0533d" }}>🐞 {r.bug}</span>}
                </div>
                {r.bugs && <div style={{ fontSize: 13, color: "var(--text)", marginTop: 4, whiteSpace: "pre-wrap", background: "#e0533d10", border: "1px solid #e0533d33", borderRadius: 8, padding: "8px 10px" }}>🐞 {r.bugs}</div>}
                {r.notes && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 4, whiteSpace: "pre-wrap" }}>📝 {r.notes}</div>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default async function AdminTestsPage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");
  const testers = await getTesterData();

  const totalEntries = testers.reduce((s, t) => s + t.totalEntries, 0);
  const totalBugs = testers.reduce((s, t) => s + t.bugReports, 0);

  return (
    <div className="shell">
      <main className="main" style={{ maxWidth: 820, margin: "0 auto" }}>
        <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", textDecoration: "none", marginBottom: 14 }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 16 }} />Админ
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
          <i className="ti ti-checklist" style={{ fontSize: 24, color: "#0e9f6e" }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Тесты</h1>
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 18 }}>
          Тестировщиков: <b>{testers.length}</b> · записей всего: <b>{totalEntries}</b> · описаний багов: <b>{totalBugs}</b>
        </div>

        {testers.length === 0 ? (
          <div className="card" style={{ color: "var(--text-2)" }}>Пока никто не включил режим тестировщика.</div>
        ) : (
          testers.map((tr) => <TesterCard key={tr.id} tr={tr} />)
        )}
      </main>
    </div>
  );
}
