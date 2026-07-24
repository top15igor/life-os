"use client";
// Панель «Каналы привлечения»: создание помеченных ссылок на бота
// и воронка по каждому каналу: пришло → начали писать → 5+ записей → живы за 7 дней.
import { useEffect, useState } from "react";

type Funnel = { registered: number; wrote: number; engaged: number; active7: number };
type Channel = Funnel & { id: string; slug: string; name: string; cost: number; link: string };
type Data = { channels: Channel[]; noSource: Funnel; orphan: ({ slug: string } & Funnel)[]; needSql?: boolean };

export default function ChannelsPanel() {
  const [d, setD] = useState<Data | null>(null);
  const [needSql, setNeedSql] = useState(false);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  const load = () => fetch("/api/admin/channels").then((r) => r.json()).then((x) => (x.ok ? setD(x) : setNeedSql(!!x.needSql))).catch(() => {});
  useEffect(() => { load(); }, []);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    const r = await fetch("/api/admin/channels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, cost: Number(cost) || 0 }) }).then((x) => x.json()).catch(() => null);
    if (r && !r.ok && r.needSql) setNeedSql(true);
    setName("");
    setCost("");
    setBusy(false);
    load();
  }

  async function remove(c: Channel) {
    if (!window.confirm(`Удалить канал «${c.name}»? Статистика пришедших по нему людей сохранится.`)) return;
    await fetch(`/api/admin/channels?id=${c.id}`, { method: "DELETE" });
    load();
  }

  function copy(link: string) {
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(link);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  if (needSql) {
    return (
      <div className="card" style={{ padding: 16, fontSize: 13.5 }}>
        Сначала нужно применить <b>supabase/channels.sql</b> в Supabase (SQL Editor → New query → Run) — он создаёт таблицу каналов и колонку источника у пользователей.
      </div>
    );
  }
  if (!d) return <div style={{ color: "var(--text-3)", fontSize: 13 }}>Загружаю…</div>;

  const Cell = ({ v, of: ofV }: { v: number; of?: number }) => (
    <td style={{ padding: "8px 10px", textAlign: "center", fontSize: 13 }}>
      {v}{ofV ? <span style={{ color: "var(--text-3)", fontSize: 11 }}> ({Math.round((v / ofV) * 100)}%)</span> : null}
    </td>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Новый канал</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название (например: Посев @канал, TikTok июль)"
            style={{ flex: 2, minWidth: 220, padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 13.5 }} />
          <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Стоимость, $ (можно 0)" inputMode="decimal"
            style={{ flex: 1, minWidth: 140, padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 13.5 }} />
          <button className="btn btn-primary" disabled={busy || !name.trim()} onClick={add} style={{ fontSize: 13 }}>Создать ссылку</button>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>
          Получишь ссылку вида t.me/бот?start=src_… — вставляй её в пост/видео/описание. Кто придёт по ней, будет помечен этим каналом навсегда.
        </div>
      </div>

      {d.channels.length > 0 && (
        <div className="card" style={{ padding: 16, overflowX: "auto" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Воронка по каналам</div>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640 }}>
            <thead>
              <tr style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                <th style={{ textAlign: "left", padding: "6px 10px" }}>Канал</th>
                <th style={{ padding: "6px 10px" }}>Пришло</th>
                <th style={{ padding: "6px 10px" }}>Начали писать</th>
                <th style={{ padding: "6px 10px" }}>5+ записей</th>
                <th style={{ padding: "6px 10px" }}>Живы 7 дн.</th>
                <th style={{ padding: "6px 10px" }}>$ / вовлечённый</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {d.channels.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid var(--surface-2)" }}>
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</div>
                    <button onClick={() => copy(c.link)} className="btn" style={{ fontSize: 11, marginTop: 4, padding: "3px 8px" }}>
                      {copied === c.link ? "Скопировано ✓" : "Скопировать ссылку"}
                    </button>
                  </td>
                  <Cell v={c.registered} />
                  <Cell v={c.wrote} of={c.registered || undefined} />
                  <Cell v={c.engaged} of={c.registered || undefined} />
                  <Cell v={c.active7} of={c.registered || undefined} />
                  <td style={{ padding: "8px 10px", textAlign: "center", fontSize: 13 }}>
                    {c.cost > 0 ? (c.engaged > 0 ? `$${(c.cost / c.engaged).toFixed(1)}` : "—") : ""}
                  </td>
                  <td style={{ padding: "8px 6px", textAlign: "right" }}>
                    <button onClick={() => remove(c)} title="Удалить канал" className="btn" style={{ fontSize: 11, padding: "3px 8px", color: "var(--text-3)" }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10 }}>
            «5+ записей» — главная колонка: это люди, которых продукт зацепил. «$ / вовлечённый» = стоимость канала на одного такого человека.
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 16, fontSize: 13 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Без метки канала</div>
        Пришли без помеченной ссылки (друзья, рефералы, органика): <b>{d.noSource.registered}</b>, из них с 5+ записями: <b>{d.noSource.engaged}</b>, живы за 7 дней: <b>{d.noSource.active7}</b>.
        {d.orphan.length > 0 && (
          <div style={{ marginTop: 8, color: "var(--text-2)" }}>
            Метки удалённых каналов: {d.orphan.map((o) => `${o.slug} (${o.registered})`).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
