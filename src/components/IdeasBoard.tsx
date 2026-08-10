"use client";

import { useState } from "react";

// Доска идей.
//
// Автор видит свои предложения и что с ними стало. Владелец — все и меняет
// статус. Смысл экрана прост: человек, который что-то предложил, должен
// видеть, что его услышали. Без этого предложения уходят в пустоту, и после
// второго раза человек перестаёт предлагать.

type Idea = {
  id: string; num: number; user_id: string; title: string; body: string;
  problem: string | null; who: string | null; done_when: string | null;
  status: string; note: string | null; created_at: string; updated_at: string;
};

const ST: { key: string; label: string; c: string; bg: string }[] = [
  { key: "new", label: "новая", c: "#185FA5", bg: "#E6F1FB" },
  { key: "thinking", label: "обдумываем", c: "#854F0B", bg: "#FAEEDA" },
  { key: "queued", label: "в очереди", c: "#534AB7", bg: "#EEEDFE" },
  { key: "doing", label: "делаем", c: "#993556", bg: "#FBEAF0" },
  { key: "done", label: "готово", c: "#0F6E56", bg: "#E1F5EE" },
  { key: "declined", label: "не будем", c: "#5F5E5A", bg: "#F1EFE8" },
];
const meta = (k: string) => ST.find((x) => x.key === k) || ST[0];

const dateStr = (iso: string) => {
  const d = new Date(iso);
  return isNaN(+d) ? "" : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

export default function IdeasBoard({ initial, owner, authors }: { initial: Idea[]; owner: boolean; authors: Record<string, string> }) {
  const [ideas, setIdeas] = useState<Idea[]>(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function change(id: string, status: string) {
    setIdeas((p) => p.map((i) => (i.id === id ? { ...i, status, note: note.trim() || i.note } : i)));
    const body = { id, status, ...(note.trim() ? { note: note.trim() } : {}) };
    setNote("");
    setOpenId(null);
    try {
      await fetch("/api/ideas", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    } catch {}
  }

  if (!ideas.length) {
    return (
      <div className="card" style={{ padding: "20px 18px", textAlign: "center" }}>
        <i className="ti ti-bulb" style={{ fontSize: 30, color: "var(--accent)" }} />
        <div style={{ fontSize: 15, fontWeight: 500, marginTop: 8 }}>Идей пока нет</div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55, marginTop: 6 }}>
          Скажи боту «идея по LIFE OS» и расскажи своими словами — он расспросит и доведёт до постановки.
        </div>
      </div>
    );
  }

  // Сначала то, что в работе и ждёт решения: сделанное и отклонённое можно
  // посмотреть, но каждый день оно не нужно.
  const order = ["doing", "queued", "new", "thinking", "done", "declined"];
  const sorted = [...ideas].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || b.num - a.num);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {sorted.map((i) => {
        const m = meta(i.status);
        const open = openId === i.id;
        return (
          <div key={i.id} className="card" style={{ padding: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>№{i.num}</span>
              <span style={{ fontSize: 11.5, color: m.c, background: m.bg, padding: "2px 9px", borderRadius: 999 }}>{m.label}</span>
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{dateStr(i.created_at)}</span>
              {owner && authors[i.user_id] && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>· {authors[i.user_id]}</span>}
            </div>

            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>{i.title}</div>
            <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55, marginTop: 4 }}>{i.body}</div>

            {(i.problem || i.who || i.done_when) && (
              <div style={{ marginTop: 8, display: "grid", gap: 3, fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5 }}>
                {i.problem && <div><b>Зачем:</b> {i.problem}</div>}
                {i.who && <div><b>Кому:</b> {i.who}</div>}
                {i.done_when && <div><b>Готово, когда:</b> {i.done_when}</div>}
              </div>
            )}

            {i.note && (
              <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, borderLeft: "2px solid var(--border)", paddingLeft: 9 }}>{i.note}</div>
            )}

            {owner && (
              <div style={{ marginTop: 10 }}>
                <button onClick={() => { setOpenId(open ? null : i.id); setNote(""); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--accent)", fontSize: 12.5, cursor: "pointer" }}>
                  <i className={`ti ${open ? "ti-chevron-up" : "ti-flag"}`} style={{ fontSize: 14 }} />Статус
                </button>
                {open && (
                  <div style={{ marginTop: 8 }}>
                    {/* Комментарий необязателен, но именно он уходит автору —
                        «не будем» без причины обиднее, чем молчание. */}
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Комментарий автору (не обязательно)"
                      style={{ width: "100%", padding: "8px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, marginBottom: 8 }}
                    />
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {ST.filter((x) => x.key !== i.status).map((x) => (
                        <button key={x.key} onClick={() => change(i.id, x.key)} style={{ padding: "6px 11px", borderRadius: 9, border: "1px solid var(--border)", background: x.bg, color: x.c, fontSize: 12.5, cursor: "pointer" }}>
                          {x.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
