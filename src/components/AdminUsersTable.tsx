"use client";

import { useMemo, useState } from "react";
import AdminPlanSelect from "./AdminPlanSelect";
import AdminReferrerSelect from "./AdminReferrerSelect";
import AdminUserCard from "./AdminUserCard";

type Row = {
  id: string; name: string; entries: number; last: string | null; joined: string | null;
  referrer: string | null; referrerId: string | null; email: string | null; telegram: boolean;
  tgUsername: string | null; chatId: number | null; plan: string; active: boolean;
};

const COLS: { key: string; label: string; sort?: (a: Row, b: Row) => number }[] = [
  { key: "name", label: "Имя", sort: (a, b) => a.name.localeCompare(b.name) },
  { key: "entries", label: "Записей", sort: (a, b) => a.entries - b.entries },
  { key: "last", label: "Последняя", sort: (a, b) => (a.last || "").localeCompare(b.last || "") },
  { key: "joined", label: "Пришёл", sort: (a, b) => (a.joined || "").localeCompare(b.joined || "") },
  { key: "referrer", label: "Пригласил" },
  { key: "plan", label: "Тариф", sort: (a, b) => a.plan.localeCompare(b.plan) },
  { key: "status", label: "Статус", sort: (a, b) => Number(a.active) - Number(b.active) },
  { key: "actions", label: "" },
];

export default function AdminUsersTable({ users, refOptions }: { users: Row[]; refOptions: { id: string; name: string }[] }) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("entries");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [msgFor, setMsgFor] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");
  const [cardFor, setCardFor] = useState<Row | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = users;
    if (term) list = users.filter((u) => (u.name || "").toLowerCase().includes(term) || (u.email || "").toLowerCase().includes(term));
    const col = COLS.find((c) => c.key === sortKey);
    if (col?.sort) list = [...list].sort((a, b) => col.sort!(a, b) * dir);
    return list;
  }, [users, q, sortKey, dir]);

  function toggleSort(key: string) {
    const col = COLS.find((c) => c.key === key);
    if (!col?.sort) return;
    if (sortKey === key) setDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setDir(-1); }
  }

  async function sendMsg(id: string) {
    const text = msgText.trim();
    if (!text || sending) return;
    setSending(true);
    setToast("");
    const r = await fetch("/api/admin/message", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, text }) }).then((x) => x.json()).catch(() => ({ ok: false }));
    setSending(false);
    if (r?.ok) { setToast("Отправлено ✓"); setMsgFor(null); setMsgText(""); setTimeout(() => setToast(""), 2500); }
    else setToast(r?.error === "no_telegram" ? "У юзера нет Telegram" : "Не отправилось");
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 0 }}>
          <i className="ti ti-search" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--text-3)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени или почте…"
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 33px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5 }} />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>{rows.length} из {users.length}</div>
        {toast && <span style={{ fontSize: 12.5, fontWeight: 500, color: toast.includes("✓") ? "var(--positive)" : "#ef4444" }}>{toast}</span>}
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: "var(--text-2)", fontSize: 11.5, textAlign: "left" }}>
              {COLS.map((c) => (
                <th key={c.key} onClick={() => toggleSort(c.key)}
                  style={{ padding: "10px 12px", fontWeight: 500, cursor: c.sort ? "pointer" : "default", whiteSpace: "nowrap", userSelect: "none" }}>
                  {c.label}{c.sort && sortKey === c.key ? (dir === 1 ? " ↑" : " ↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 12px" }}>
                  <div onClick={() => setCardFor(u)} style={{ fontWeight: 500, cursor: "pointer", color: "var(--accent)" }} title="Подробнее">{u.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6, marginTop: 1, flexWrap: "wrap" }}>
                    {u.telegram && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><i className="ti ti-brand-telegram" style={{ fontSize: 12 }} />{u.tgUsername ? `@${u.tgUsername}` : "TG"}</span>}
                    {u.email && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><i className="ti ti-mail" style={{ fontSize: 12 }} />{u.email}</span>}
                    {!u.telegram && !u.email && "—"}
                  </div>
                </td>
                <td style={{ padding: "10px 12px" }}>{u.entries}</td>
                <td style={{ padding: "10px 12px", color: "var(--text-2)", whiteSpace: "nowrap" }}>{u.last || "—"}</td>
                <td style={{ padding: "10px 12px", color: "var(--text-2)", whiteSpace: "nowrap" }}>{u.joined || "—"}</td>
                <td style={{ padding: "10px 12px" }}><AdminReferrerSelect id={u.id} current={u.referrerId} users={refOptions} /></td>
                <td style={{ padding: "10px 12px" }}><AdminPlanSelect id={u.id} plan={u.plan || "free"} /></td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 99, whiteSpace: "nowrap", background: u.active ? "rgba(5,150,105,0.12)" : "var(--surface-2)", color: u.active ? "var(--positive)" : "var(--text-3)" }}>
                    {u.active ? "активен" : u.entries === 0 ? "не писал" : "тихо"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                  {u.telegram ? (
                    msgFor === u.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
                        <textarea value={msgText} onChange={(e) => setMsgText(e.target.value)} autoFocus rows={2} placeholder="Сообщение юзеру…"
                          style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 12.5, fontFamily: "inherit", resize: "vertical" }} />
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button onClick={() => { setMsgFor(null); setMsgText(""); }} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer" }}>Отмена</button>
                          <button onClick={() => sendMsg(u.id)} disabled={sending || !msgText.trim()} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 7, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", opacity: sending || !msgText.trim() ? 0.6 : 1 }}>{sending ? "…" : "Отправить"}</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setMsgFor(u.id); setMsgText(""); }} title="Написать в Telegram" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "5px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--accent)", cursor: "pointer" }}>
                        <i className="ti ti-send" style={{ fontSize: 14 }} />написать
                      </button>
                    )
                  ) : (
                    <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cardFor && <AdminUserCard id={cardFor.id} name={cardFor.name} onClose={() => setCardFor(null)} />}
    </div>
  );
}
