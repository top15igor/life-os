"use client";

import { useState } from "react";

type Heir = { id: string; name: string; relation: string | null; email: string | null; token: string; status: "sealed" | "released"; auto_release_days: number; released_at: string | null; created_at: string };

const STR: Record<string, any> = {
  ru: {
    intro: "Наследники — те, кому однажды откроется твоя Книга жизни. Ты добавляешь человека и получаешь секретную ссылку. Пока она «запечатана» — по ней виден только бережный экран ожидания. Когда придёт время, ты раскрываешь её сам, или она откроется автоматически, если тебя долго не будет.",
    addName: "Имя", addRelation: "Кто это тебе (напр. дочь, сын, жена)", addEmail: "Email (по желанию)", add: "Добавить наследника",
    empty: "Пока никого. Добавь того, кому важно однажды прочитать твою историю.",
    sealed: "Запечатано", released: "Раскрыто", relLabel: "кому",
    copy: "Копировать ссылку", copied: "Скопировано ✓", release: "Раскрыть сейчас", seal: "Запечатать обратно", remove: "Удалить",
    autoHint: (d: number) => d > 0 ? `Авто-раскрытие, если тебя не будет ${d} дн.` : "Без авто-раскрытия",
    confirmRelease: "Раскрыть книгу этому наследнику прямо сейчас? Он сможет её прочитать.",
    confirmRemove: "Удалить наследника? Его ссылка перестанет работать.",
    linkTitle: "Секретная ссылка наследника",
  },
  en: {
    intro: "Heirs are those to whom your Book of Life will one day open. You add a person and get a secret link. While it's “sealed”, it shows only a gentle waiting screen. When the time comes, you release it yourself — or it opens automatically if you're gone for a long time.",
    addName: "Name", addRelation: "Who they are to you (e.g. daughter, son, wife)", addEmail: "Email (optional)", add: "Add heir",
    empty: "No one yet. Add someone who should one day read your story.",
    sealed: "Sealed", released: "Released", relLabel: "for",
    copy: "Copy link", copied: "Copied ✓", release: "Release now", seal: "Seal again", remove: "Remove",
    autoHint: (d: number) => d > 0 ? `Auto-releases if you're gone for ${d} days` : "No auto-release",
    confirmRelease: "Release the book to this heir right now? They'll be able to read it.",
    confirmRemove: "Remove this heir? Their link will stop working.",
    linkTitle: "Heir's secret link",
  },
};

export default function HeirsManager({ initial, locale }: { initial: Heir[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [heirs, setHeirs] = useState<Heir[]>(initial);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function add() {
    if (!name.trim() || busy) return;
    setBusy(true);
    const r = await fetch("/api/heir", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "add", name, relation, email }) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (r?.ok && r.heir) { setHeirs((h) => [...h, r.heir]); setName(""); setRelation(""); setEmail(""); }
  }
  async function toggle(h: Heir) {
    const to = h.status === "released" ? "seal" : "release";
    if (to === "release" && !confirm(s.confirmRelease)) return;
    setHeirs((c) => c.map((x) => x.id === h.id ? { ...x, status: to === "release" ? "released" : "sealed" } : x));
    await fetch("/api/heir", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: to, id: h.id }) }).catch(() => {});
  }
  async function remove(h: Heir) {
    if (!confirm(s.confirmRemove)) return;
    setHeirs((c) => c.filter((x) => x.id !== h.id));
    await fetch("/api/heir", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "remove", id: h.id }) }).catch(() => {});
  }
  function copy(h: Heir) {
    const link = `${origin}/heir/${h.token}`;
    navigator.clipboard?.writeText(link).then(() => { setCopied(h.id); setTimeout(() => setCopied(null), 1600); }).catch(() => {});
  }

  const inp = { width: "100%", boxSizing: "border-box" as const, padding: "10px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14 };

  return (
    <div>
      <div className="card" style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 16 }}>{s.intro}</div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={s.addName} style={inp} />
          <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder={s.addRelation} style={inp} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={s.addEmail} style={inp} />
          <button onClick={add} disabled={!name.trim() || busy} style={{ padding: "11px 16px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: !name.trim() || busy ? 0.6 : 1 }}>
            <i className="ti ti-user-plus" style={{ fontSize: 16, marginRight: 6 }} />{s.add}
          </button>
        </div>
      </div>

      {heirs.length === 0 ? (
        <div className="card" style={{ color: "var(--text-3)", fontSize: 13.5 }}>{s.empty}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {heirs.map((h) => {
            const rel = h.status === "released";
            return (
              <div key={h.id} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <i className="ti ti-user-heart" style={{ fontSize: 20, color: "#ec4899", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{h.name}</div>
                    {h.relation && <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{s.relLabel}: {h.relation}</div>}
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: rel ? "rgba(5,150,105,0.14)" : "var(--surface-2)", color: rel ? "var(--positive)" : "var(--text-3)" }}>
                    {rel ? `🔓 ${s.released}` : `🔒 ${s.sealed}`}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
                  <button onClick={() => copy(h)} style={ghost}><i className="ti ti-link" style={{ fontSize: 14 }} />{copied === h.id ? s.copied : s.copy}</button>
                  <button onClick={() => toggle(h)} style={ghost}><i className={`ti ${rel ? "ti-lock" : "ti-lock-open"}`} style={{ fontSize: 14 }} />{rel ? s.seal : s.release}</button>
                  <button onClick={() => remove(h)} style={{ ...ghost, color: "#e11d48" }}><i className="ti ti-trash" style={{ fontSize: 14 }} />{s.remove}</button>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 9 }}>{s.autoHint(h.auto_release_days)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ghost = { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer" } as any;
