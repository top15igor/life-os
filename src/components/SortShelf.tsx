"use client";

import { useState } from "react";

// «Разобрать»: карточки, где шкаф сомневался, и по одному нажатию на каждую.
//
// Смысл экрана не в том, чтобы заставить человека работать архивариусом.
// Смысл — показать, что шкаф не притворяется всезнающим, и дать поправить
// его там, где он честно не понял. Поправка запоминается правилом, поэтому
// список со временем должен становиться короче сам собой.

type Item = { id: string; title: string; summary: string; category: string; folder: string | null; image_url: string | null; file_url: string | null; created_at: string; why: "unsure" | "unknown" | "empty" };
type Rule = { id: string; subject: string; should_be: string; times: number };
type Ent = { id: number; name: string; count: number };
type Dup = { kind: "people" | "places"; keep: Ent; merge: Ent[]; why: "same" | "similar" };

const CATS = [
  { key: "document", icon: "ti-file-text", c: "#185FA5", bg: "#E6F1FB" },
  { key: "moment", icon: "ti-photo-heart", c: "#993556", bg: "#FBEAF0" },
  { key: "thing", icon: "ti-package", c: "#854F0B", bg: "#FAEEDA" },
  { key: "person", icon: "ti-users", c: "#534AB7", bg: "#EEEDFE" },
  { key: "place", icon: "ti-map-pin", c: "#0F6E56", bg: "#E1F5EE" },
  { key: "project", icon: "ti-briefcase", c: "#185FA5", bg: "#E6F1FB" },
  { key: "info", icon: "ti-info-circle", c: "#5F5E5A", bg: "#F1EFE8" },
  { key: "other", icon: "ti-photo", c: "#5F5E5A", bg: "#F1EFE8" },
];

const STR: Record<string, any> = {
  ru: {
    empty: "Разбирать нечего — шкаф во всём разобрался сам.",
    emptyHint: "Сюда попадает только то, в чём агент не уверен: нечёткое фото, непонятная вещь, документ, из которого он ничего не вытащил.",
    whyUnsure: "не уверен, что понял верно",
    whyUnknown: "не смог отнести никуда",
    whyEmpty: "ничего не вытащил из файла",
    keep: "Всё верно",
    move: "Это на самом деле:",
    rulesTitle: "Чему шкаф научился",
    rulesHint: "Каждая твоя поправка становится правилом — так одна и та же ошибка не повторяется.",
    times: "раз",
    forget: "забыть",
    left: "осталось",
    cats: { document: "Документ", moment: "Момент", thing: "Вещь", person: "Люди", place: "Место", project: "Проект", info: "Инфо", other: "Другое" },
    dupTitle: "Похоже, это одно и то же",
    dupHint: "Один человек записан несколькими карточками — записи о нём разбросаны. Объединишь — всё соберётся в одну. Объединение не отменяется: если это всё-таки разные люди, жми «Разные».",
    dupSame: "написано одинаково",
    dupSimilar: "похоже на одно и то же",
    dupMerge: "Объединить",
    dupSkip: "Разные",
    dupKeep: "останется",
    dupMentions: "упом.",
  },
  en: {
    empty: "Nothing to sort — the wardrobe figured it all out.",
    emptyHint: "Only things the agent is unsure about land here: a blurry photo, an unclear object, a file it got nothing out of.",
    whyUnsure: "not sure it understood correctly",
    whyUnknown: "couldn't place it anywhere",
    whyEmpty: "got nothing out of the file",
    keep: "Looks right",
    move: "It's actually:",
    rulesTitle: "What the wardrobe learned",
    rulesHint: "Every correction becomes a rule — so the same mistake stops repeating.",
    times: "×",
    forget: "forget",
    left: "left",
    cats: { document: "Document", moment: "Moment", thing: "Thing", person: "People", place: "Place", project: "Project", info: "Info", other: "Other" },
    dupTitle: "Looks like the same thing",
    dupHint: "One person recorded as several cards — their entries are scattered. Merge and it all comes together. Merging can't be undone: if they really are different people, tap «Different».",
    dupSame: "written the same",
    dupSimilar: "looks like the same",
    dupMerge: "Merge",
    dupSkip: "Different",
    dupKeep: "stays",
    dupMentions: "ment.",
  },
};

export default function SortShelf({ initial, rules: initialRules, dupes: initialDupes, locale }: { initial: Item[]; rules: Rule[]; dupes: Dup[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [items, setItems] = useState<Item[]>(initial);
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [dupes, setDupes] = useState<Dup[]>(initialDupes || []);
  const [openId, setOpenId] = useState<string | null>(null);

  // Ключ группы: у людей и мест номера свои, поэтому берём и то и другое.
  const dupKey = (d: Dup) => `${d.kind}:${d.keep.id}`;

  async function merge(d: Dup) {
    setDupes((p) => p.filter((x) => dupKey(x) !== dupKey(d)));
    try {
      await fetch("/api/sort", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "merge", kind: d.kind, keepId: d.keep.id, mergeIds: d.merge.map((m) => m.id) }),
      });
    } catch {}
  }
  // «Разные» — просто убираем с глаз: ничего не меняем в данных.
  const skip = (d: Dup) => setDupes((p) => p.filter((x) => dupKey(x) !== dupKey(d)));

  async function act(id: string, action: string, category?: string) {
    setItems((p) => p.filter((x) => x.id !== id));
    setOpenId(null);
    try {
      await fetch("/api/sort", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, id, category }) });
      if (category) {
        // Правило добавится на сервере; показываем его сразу, чтобы человек
        // видел связь между своей поправкой и обучением.
        const it = initial.find((x) => x.id === id);
        const subject = (it?.title || "").trim().toLowerCase().split(/[\s,—–-]+/).filter(Boolean).slice(0, 2).join(" ").slice(0, 60);
        if (subject) setRules((p) => [{ id: "new-" + id, subject, should_be: category, times: 1 }, ...p.filter((r) => !(r.subject === subject && r.should_be === category))]);
      }
    } catch {}
  }

  async function forget(id: string) {
    setRules((p) => p.filter((r) => r.id !== id));
    try { await fetch("/api/sort", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "forgetRule", id }) }); } catch {}
  }

  const whyText = (w: Item["why"]) => (w === "unsure" ? s.whyUnsure : w === "unknown" ? s.whyUnknown : s.whyEmpty);
  const catOf = (k: string) => CATS.find((c) => c.key === k) || CATS[7];

  return (
    <div>
      {items.length === 0 && dupes.length > 0 ? null : items.length === 0 ? (
        <div className="card" style={{ padding: "20px 18px", textAlign: "center" }}>
          <i className="ti ti-checks" style={{ fontSize: 30, color: "#0F6E56" }} />
          <div style={{ fontSize: 15, fontWeight: 500, marginTop: 8 }}>{s.empty}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55, marginTop: 6 }}>{s.emptyHint}</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 10 }}>{items.length} {s.left}</div>
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((m) => {
              const cm = catOf(m.category);
              const open = openId === m.id;
              return (
                <div key={m.id} className="card" style={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ width: 54, height: 54, borderRadius: 10, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: m.image_url ? `center/cover no-repeat url(${m.image_url})` : cm.bg }}>
                      {!m.image_url && <i className={`ti ${m.file_url ? "ti-file-type-pdf" : cm.icon}`} style={{ fontSize: 22, color: cm.c }} />}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>{m.title || "—"}</div>
                      {m.summary && <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, marginTop: 2 }}>{m.summary.slice(0, 140)}</div>}
                      <div style={{ fontSize: 11.5, color: "#854F0B", background: "#FAEEDA", display: "inline-block", padding: "2px 8px", borderRadius: 999, marginTop: 6 }}>{whyText(m.why)}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <button onClick={() => act(m.id, "keep")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "#0F6E56", fontSize: 13, cursor: "pointer" }}>
                      <i className="ti ti-check" style={{ fontSize: 15 }} />{s.keep}
                    </button>
                    <button onClick={() => setOpenId(open ? null : m.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--accent)", fontSize: 13, cursor: "pointer" }}>
                      <i className={`ti ${open ? "ti-chevron-up" : "ti-arrows-shuffle"}`} style={{ fontSize: 15 }} />{s.move}
                    </button>
                  </div>

                  {open && (
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
                      {CATS.filter((c) => c.key !== m.category).map((c) => (
                        <button key={c.key} onClick={() => act(m.id, "category", c.key)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 11px", borderRadius: 9, border: "1px solid var(--border)", background: c.bg, color: c.c, fontSize: 12.5, cursor: "pointer" }}>
                          <i className={`ti ${c.icon}`} style={{ fontSize: 14 }} />{s.cats[c.key]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {dupes.length > 0 && (
        <div style={{ marginTop: items.length ? 22 : 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.dupTitle}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 10 }}>{s.dupHint}</div>
          <div style={{ display: "grid", gap: 9 }}>
            {dupes.map((d) => (
              <div key={dupKey(d)} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <i className={`ti ${d.kind === "people" ? "ti-user-heart" : "ti-map-pin"}`} style={{ fontSize: 17, color: "var(--accent)" }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{d.keep.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>({s.dupKeep}{d.keep.count ? `, ${d.keep.count} ${s.dupMentions}` : ""})</span>
                  <i className="ti ti-arrow-left" style={{ fontSize: 15, color: "var(--text-3)" }} />
                  <span style={{ fontSize: 13.5, color: "var(--text-2)" }}>
                    {d.merge.map((m) => `${m.name}${m.count ? ` · ${m.count}` : ""}`).join(", ")}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: "#854F0B", background: "#FAEEDA", display: "inline-block", padding: "2px 8px", borderRadius: 999, marginTop: 7 }}>
                  {d.why === "same" ? s.dupSame : s.dupSimilar}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => merge(d)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--accent)", fontSize: 13, cursor: "pointer" }}>
                    <i className="ti ti-arrows-join" style={{ fontSize: 15 }} />{s.dupMerge}
                  </button>
                  <button onClick={() => skip(d)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: 13, cursor: "pointer" }}>
                    <i className="ti ti-x" style={{ fontSize: 15 }} />{s.dupSkip}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rules.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.rulesTitle}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 10 }}>{s.rulesHint}</div>
          <div className="card" style={{ padding: "10px 12px", display: "grid", gap: 7 }}>
            {rules.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span style={{ color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  «{r.subject}» → {s.cats[r.should_be] || r.should_be}
                </span>
                {r.times > 1 && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{r.times} {s.times}</span>}
                <button onClick={() => forget(r.id)} style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 12, cursor: "pointer", padding: 0 }}>{s.forget}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
