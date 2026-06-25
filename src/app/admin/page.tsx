import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { getAdminData } from "@/lib/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

const CAT_COLOR: Record<string, string> = {
  health: "#ef4444", sport: "#10b981", food: "#84cc16", family: "#ec4899", relationship: "#f472b6", business: "#3b82f6",
  finance: "#0ea5e9", ideas: "#f59e0b", insight: "#8b5cf6", task: "#6366f1", gratitude: "#14b8a6", travel: "#06b6d4",
  emotions: "#a78bfa", problem: "#fb7185", decision: "#22d3ee", event: "#94a3b8",
};

function Stat({ label, value, color }: any) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "13px 15px" }}>
      <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 500, marginTop: 3, color: color || "var(--text)" }}>{value}</div>
    </div>
  );
}

function Bars({ series, color }: { series: { day: string; count: number }[]; color: string }) {
  const max = Math.max(1, ...series.map((s) => s.count));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 90 }}>
      {series.map((s) => (
        <div key={s.day} title={`${s.day}: ${s.count}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", height: `${Math.round((s.count / max) * 72)}px`, minHeight: s.count ? 3 : 0, background: color, borderRadius: 4 }} />
          <span style={{ fontSize: 9, color: "var(--text-3)" }}>{s.day.slice(8)}</span>
        </div>
      ))}
    </div>
  );
}

function Title({ children }: any) {
  return <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10 }}>{children}</div>;
}

const TREE_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

function Avatar({ name, root, depth }: { name: string; root?: boolean; depth: number }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const bg = root ? "var(--accent)" : TREE_COLORS[depth % TREE_COLORS.length];
  return <span style={{ width: 30, height: 30, borderRadius: 99, background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{initial}</span>;
}

function TreeNode({ node, depth }: { node: any; depth: number }) {
  const kids = node.children?.length || 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
        <Avatar name={node.name} root={depth === 0} depth={depth} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: depth === 0 ? 600 : 500 }}>{node.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            {kids > 0 ? `пригласил ${kids}` : depth === 0 ? "корень" : "приглашён"} · {node.entries ?? 0} зап.
          </div>
        </div>
      </div>
      {kids > 0 && (
        <div style={{ marginLeft: 14, paddingLeft: 18, borderLeft: "1.5px solid var(--border)" }}>
          {node.children.map((c: any, i: number) => <TreeNode key={c.id || i} node={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

const EXAMPLE_TREE = {
  id: "ex0", name: "Ты", entries: 12, children: [
    { id: "ex1", name: "Алиса", entries: 7, children: [
      { id: "ex2", name: "Костя", entries: 4, children: [{ id: "ex3", name: "Лена", entries: 2, children: [] }] },
    ] },
    { id: "ex4", name: "Дима", entries: 5, children: [] },
  ],
};

export default async function AdminPage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");

  const locale = await getLocale();
  const t = getDict(locale);
  const d = await getAdminData();

  const srcTotal = d.voice + d.textEntries || 1;
  const voicePct = Math.round((d.voice / srcTotal) * 100);
  const maxCat = d.catDist[0]?.count || 1;

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-shield-lock" style={{ color: "var(--accent)" }} />Admin · LIFE OS
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-lock" style={{ fontSize: 13 }} />Только агрегированные данные — без текста личных записей.
        </div>

        <Link href="/admin/architecture" className="card" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
          <i className="ti ti-blueprint" style={{ fontSize: 24, color: "var(--accent)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--accent-text)" }}>Архитектура проекта</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>Стек, база данных, инфраструктура — для программиста и инвестора</div>
          </div>
          <i className="ti ti-arrow-right" style={{ color: "var(--accent)", fontSize: 18 }} />
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
          <Stat label="Пользователей" value={d.totalUsers} />
          <Stat label="Активны (7 дней)" value={d.activeUsers} color="var(--positive)" />
          <Stat label="Активны (30 дней)" value={d.active30} />
          <Stat label="Всего записей" value={d.totalEntries} color="var(--accent)" />
          <Stat label="Ср. записей / автор" value={d.avgPerWriter} />
          <Stat label="Вернулись (≥2 дней)" value={d.returning} color="var(--insight)" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 24 }}>
          <div>
            <Title>Записи по дням (14 дней)</Title>
            <div className="card"><Bars series={d.entriesSeries} color="var(--accent)" /></div>
          </div>
          <div>
            <Title>Новые пользователи (14 дней)</Title>
            <div className="card"><Bars series={d.newUsersSeries} color="#10b981" /></div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 24 }}>
          <div className="card">
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 8 }}>Голос vs текст</div>
            <div style={{ height: 8, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${voicePct}%`, background: "var(--accent)" }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>🎙 {d.voice} ({voicePct}%) · ✍️ {d.textEntries}</div>
          </div>
          <Stat label="Ср. настроение" value={d.avgMood ?? "—"} color="#4f46e5" />
          <Stat label="Ср. энергия" value={d.avgEnergy ?? "—"} color="var(--energy)" />
        </div>

        {d.catDist.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Title>Зачем пользуются — темы записей</Title>
            <div className="card">
              {d.catDist.slice(0, 12).map((c) => {
                const pct = Math.round((c.count / d.totalEntries) * 100);
                return (
                  <div key={c.slug} style={{ marginBottom: 9 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                      <span>{t.cats[c.slug] || c.slug}</span>
                      <span style={{ color: "var(--text-3)" }}>{c.count} · {pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.round((c.count / maxCat) * 100)}%`, height: "100%", background: CAT_COLOR[c.slug] || "var(--accent)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <Title>🌳 Дерево приглашений — кто кого привёл</Title>
          {d.tree.length > 0 ? (
            <div className="card">
              {d.tree.map((n: any) => <TreeNode key={n.id} node={n} depth={0} />)}
            </div>
          ) : (
            <div className="card">
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 14 }}>
                Дерево пока пустое — никто не пришёл по ссылке-приглашению (все зашли в бота напрямую). Как только друг откроет твою ссылку «Пригласить друга» и заведётся — здесь вырастет ветка от тебя. Так это будет выглядеть:
              </div>
              <div style={{ opacity: 0.5, pointerEvents: "none" }}>
                <TreeNode node={EXAMPLE_TREE} depth={0} />
              </div>
            </div>
          )}
        </div>

        {d.topReferrers.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Title>Кто больше всех приглашает</Title>
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

        <Title>Все пользователи ({d.totalUsers})</Title>
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
