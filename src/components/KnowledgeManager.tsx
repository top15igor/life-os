"use client";

import { useMemo, useState } from "react";
import type { SavedItem } from "@/lib/queries";

const STR: Record<string, any> = {
  ru: { addPh: "Вставь ссылку на пост или reels…", add: "Добавить", adding: "Добавляю…", badUrl: "Не похоже на ссылку Instagram", limited: "Закончился месячный лимит — попробуй позже", searchPh: "Поиск по заголовку, тексту, тегам…", favOnly: "Избранное", ask: "Спросить по базе", askPh: "Например: что я сохранял про спину?", asking: "Думаю…", points: "Главное", open: "Открыть в Instagram", reel: "Reels", post: "Instagram", edit: "Редактировать", save: "Сохранить", cancel: "Отмена", delete: "Удалить", del2: "Удалить эту карточку?", folder: "Папка", note: "Заметка", notePh: "Зачем сохранил, что применить…", title: "Заголовок", summary: "Описание", done: "Применил", undone: "Применить", fav: "В избранное", unfav: "В избранном", empty: "Ничего не найдено по фильтру.", applied: "Применил", clear: "Сбросить", newFolder: "Новая папка…", tidy: "Навести порядок", tidying: "Раскладываю…", translate: "Перевести базу", translating: "Перевожу…", translateConfirm: "Перевести все карточки на язык интерфейса? Это пересоберёт заголовки и описания." },
  en: { addPh: "Paste a post or reel link…", add: "Add", adding: "Adding…", badUrl: "Doesn't look like an Instagram link", limited: "Monthly limit reached — try later", searchPh: "Search by title, text, tags…", favOnly: "Favorites", ask: "Ask your base", askPh: "e.g. what did I save about back pain?", asking: "Thinking…", points: "Key points", open: "Open in Instagram", reel: "Reels", post: "Instagram", edit: "Edit", save: "Save", cancel: "Cancel", delete: "Delete", del2: "Delete this card?", folder: "Folder", note: "Note", notePh: "Why you saved it, what to apply…", title: "Title", summary: "Summary", done: "Applied", undone: "Mark applied", fav: "Add to favorites", unfav: "Favorited", empty: "Nothing matches the filter.", applied: "Applied", clear: "Clear", newFolder: "New folder…", tidy: "Tidy folders", tidying: "Tidying…", translate: "Translate base", translating: "Translating…", translateConfirm: "Translate all cards to the interface language? This will rebuild titles and summaries." },
  uk: { addPh: "Встав посилання на пост або reels…", add: "Додати", adding: "Додаю…", badUrl: "Не схоже на посилання Instagram", limited: "Закінчився місячний ліміт — спробуй пізніше", searchPh: "Пошук за заголовком, текстом, тегами…", favOnly: "Обране", ask: "Спитати базу", askPh: "Напр.: що я зберігав про спину?", asking: "Думаю…", points: "Головне", open: "Відкрити в Instagram", reel: "Reels", post: "Instagram", edit: "Редагувати", save: "Зберегти", cancel: "Скасувати", delete: "Видалити", del2: "Видалити цю картку?", folder: "Папка", note: "Нотатка", notePh: "Навіщо зберіг, що застосувати…", title: "Заголовок", summary: "Опис", done: "Застосував", undone: "Застосувати", fav: "В обране", unfav: "В обраному", empty: "Нічого не знайдено.", applied: "Застосував", clear: "Скинути", newFolder: "Нова папка…", tidy: "Навести лад", tidying: "Розкладаю…", translate: "Перекласти базу", translating: "Перекладаю…", translateConfirm: "Перекласти всі картки мовою інтерфейсу? Це перезбере заголовки й описи." },
  fr: { addPh: "Colle un lien de post ou reel…", add: "Ajouter", adding: "Ajout…", badUrl: "Ce n'est pas un lien Instagram", limited: "Limite mensuelle atteinte — réessaie plus tard", searchPh: "Recherche par titre, texte, tags…", favOnly: "Favoris", ask: "Demander à ta base", askPh: "ex. : qu'ai-je enregistré sur le dos ?", asking: "Réflexion…", points: "Points clés", open: "Ouvrir dans Instagram", reel: "Reels", post: "Instagram", edit: "Modifier", save: "Enregistrer", cancel: "Annuler", delete: "Supprimer", del2: "Supprimer cette carte ?", folder: "Dossier", note: "Note", notePh: "Pourquoi tu l'as gardé, quoi appliquer…", title: "Titre", summary: "Résumé", done: "Appliqué", undone: "Marquer appliqué", fav: "Ajouter aux favoris", unfav: "En favori", empty: "Aucun résultat.", applied: "Appliqué", clear: "Effacer", newFolder: "Nouveau dossier…", tidy: "Ranger", tidying: "Rangement…", translate: "Traduire la base", translating: "Traduction…", translateConfirm: "Traduire toutes les cartes dans la langue de l'interface ? Cela reconstruira titres et résumés." },
};

const clamp = (n: number): React.CSSProperties => ({ display: "-webkit-box", WebkitLineClamp: n, WebkitBoxOrient: "vertical", overflow: "hidden" });
const folderOf = (it: SavedItem) => (it.topic || "—").trim() || "—";

function sortItems(list: SavedItem[]): SavedItem[] {
  return [...list].sort((a, b) => {
    if (!!a.favorite !== !!b.favorite) return a.favorite ? -1 : 1;
    const pa = a.position || 0, pb = b.position || 0;
    if (pa !== pb) { if (pa === 0) return 1; if (pb === 0) return -1; return pa - pb; }
    return a.created_at < b.created_at ? 1 : -1;
  });
}

async function api(action: string, payload: any = {}) {
  const res = await fetch("/api/knowledge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
  return res.json().catch(() => null);
}

export default function KnowledgeManager({ initial, locale, emptyHint }: { initial: SavedItem[]; locale: string; emptyHint?: string }) {
  const s = STR[locale] || STR.ru;
  const [items, setItems] = useState<SavedItem[]>(initial);
  const [addUrl, setAddUrl] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addErr, setAddErr] = useState("");
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [askQ, setAskQ] = useState("");
  const [askA, setAskA] = useState("");
  const [askBusy, setAskBusy] = useState(false);
  const [open, setOpen] = useState<SavedItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ title: string; summary: string; note: string; topic: string }>({ title: "", summary: "", note: "", topic: "" });
  const [menuId, setMenuId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [tidyBusy, setTidyBusy] = useState(false);
  const [trBusy, setTrBusy] = useState(false);

  const folders = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) m.set(folderOf(it), (m.get(folderOf(it)) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);
  const tags = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) for (const t of it.tags || []) m.set(t, (m.get(t) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map((x) => x[0]);
  }, [items]);

  const filtered = useMemo(() => {
    const ql = query.trim().toLowerCase();
    return items.filter((it) => {
      if (favOnly && !it.favorite) return false;
      if (folderFilter && folderOf(it) !== folderFilter) return false;
      if (tagFilter && !(it.tags || []).includes(tagFilter)) return false;
      if (ql) {
        const hay = [it.title, it.summary, (it.key_points || []).join(" "), (it.tags || []).join(" "), it.note, it.topic, it.author].join(" ").toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [items, query, favOnly, folderFilter, tagFilter]);

  const groups = useMemo(() => {
    const m = new Map<string, SavedItem[]>();
    for (const it of filtered) { const k = folderOf(it); if (!m.has(k)) m.set(k, []); m.get(k)!.push(it); }
    return [...m.entries()].map(([k, v]) => [k, sortItems(v)] as [string, SavedItem[]]).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  // ---- actions ----
  function patchLocal(id: string, p: Partial<SavedItem>) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));
    setOpen((o) => (o && o.id === id ? { ...o, ...p } : o));
  }
  async function add() {
    const u = addUrl.trim();
    if (!/instagram\.com\//i.test(u)) { setAddErr(s.badUrl); return; }
    setAddErr(""); setAddBusy(true);
    const j = await api("add", { url: u });
    setAddBusy(false);
    if (j?.ok && j.item) { setItems((p) => [j.item, ...p]); setAddUrl(""); }
    else setAddErr(j?.error === "limited" ? s.limited : s.badUrl);
  }
  async function del(id: string) {
    if (!confirm(s.del2)) return;
    setItems((p) => p.filter((x) => x.id !== id));
    setOpen((o) => (o && o.id === id ? null : o));
    await api("delete", { id });
  }
  async function toggleFav(it: SavedItem) { patchLocal(it.id, { favorite: !it.favorite } as any); await api("update", { id: it.id, patch: { favorite: !it.favorite } }); }
  async function toggleDone(it: SavedItem) { patchLocal(it.id, { done: !it.done } as any); await api("update", { id: it.id, patch: { done: !it.done } }); }
  async function move(id: string, topic: string) { const t = topic.trim(); if (!t) return; patchLocal(id, { topic: t } as any); setMenuId(null); await api("update", { id, patch: { topic: t } }); }
  async function renameFolder(from: string) {
    const to = prompt(s.folder, from === "—" ? "" : from);
    if (!to || to.trim() === from) return;
    setItems((p) => p.map((x) => (folderOf(x) === from ? { ...x, topic: to.trim() } : x)));
    await api("renameFolder", { from, to: to.trim() });
  }
  async function saveEdit() {
    if (!open) return;
    const patch = { title: draft.title, summary: draft.summary, note: draft.note, topic: draft.topic };
    patchLocal(open.id, patch as any);
    setEditing(false);
    await api("update", { id: open.id, patch });
  }
  function startEdit(it: SavedItem) { setDraft({ title: it.title || "", summary: it.summary || "", note: it.note || "", topic: folderOf(it) === "—" ? "" : folderOf(it) }); setEditing(true); }

  async function ask() {
    const q = askQ.trim(); if (!q) return;
    setAskBusy(true); setAskA("");
    const j = await api("ask", { q });
    setAskBusy(false); setAskA(j?.answer || "—");
  }
  async function tidy() {
    setTidyBusy(true);
    await api("tidy");
    window.location.reload();
  }
  async function translateBase() {
    if (!confirm(s.translateConfirm)) return;
    setTrBusy(true);
    await api("translate");
    window.location.reload();
  }

  // drag reorder within folder / move between folders
  async function onDrop(targetId: string) {
    const id = dragId; setDragId(null);
    if (!id || id === targetId) return;
    const dragItem = items.find((i) => i.id === id);
    const target = items.find((i) => i.id === targetId);
    if (!dragItem || !target) return;
    const fa = folderOf(dragItem), fb = folderOf(target);
    if (fa !== fb) { await move(id, fb); return; }
    const ordered = sortItems(items.filter((i) => folderOf(i) === fa)).map((i) => i.id);
    const from = ordered.indexOf(id), to = ordered.indexOf(targetId);
    ordered.splice(from, 1); ordered.splice(to, 0, id);
    const posById = new Map(ordered.map((x, i) => [x, i + 1]));
    setItems((p) => p.map((x) => (posById.has(x.id) ? { ...x, position: posById.get(x.id)! } : x)));
    await api("reorder", { ids: ordered });
  }

  const Thumb = ({ it, h }: { it: SavedItem; h: number }) =>
    it.image_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={it.image_url} alt="" style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} />
    ) : (
      <div style={{ width: "100%", height: h, background: "linear-gradient(135deg,#7c6cff,#b39cff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <i className="ti ti-bookmark" style={{ fontSize: 26, color: "rgba(255,255,255,.9)" }} />
      </div>
    );

  const chip = (active: boolean): React.CSSProperties => ({ fontSize: 12, padding: "4px 11px", borderRadius: 999, cursor: "pointer", border: "1px solid " + (active ? "#6d5efc" : "var(--border)"), background: active ? "rgba(109,94,252,.12)" : "var(--surface)", color: active ? "#6d5efc" : "var(--text-2,var(--text-3))", whiteSpace: "nowrap" });
  const iconBtn = (active?: boolean): React.CSSProperties => ({ width: 30, height: 30, borderRadius: 8, border: "none", background: active ? "rgba(109,94,252,.14)" : "rgba(0,0,0,.5)", color: active ? "#6d5efc" : "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15 });

  return (
    <div>
      {/* Добавить по ссылке */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={addUrl} onChange={(e) => { setAddUrl(e.target.value); setAddErr(""); }} onKeyDown={(e) => { if (e.key === "Enter" && !addBusy) add(); }} placeholder={s.addPh} disabled={addBusy} style={{ flex: 1, minWidth: 220, padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5 }} />
          <button onClick={add} disabled={addBusy || !addUrl.trim()} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 17px", borderRadius: 11, border: "none", background: "#6d5efc", color: "#fff", fontSize: 14, fontWeight: 600, cursor: addBusy ? "default" : "pointer", opacity: addBusy || !addUrl.trim() ? 0.6 : 1 }}>
            <i className={`ti ${addBusy ? "ti-loader-2" : "ti-plus"}`} style={{ fontSize: 16 }} />{addBusy ? s.adding : s.add}
          </button>
        </div>
        {addErr ? <div style={{ fontSize: 12.5, color: "#ef4444", marginTop: 7 }}>{addErr}</div> : null}
      </div>

      {/* Спросить по базе */}
      <div style={{ marginBottom: 14 }}>
        {!askOpen ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setAskOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "#6d5efc", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <i className="ti ti-sparkles" style={{ fontSize: 15 }} />{s.ask}
            </button>
            <button onClick={tidy} disabled={tidyBusy} title={s.tidy} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2,var(--text-3))", fontSize: 13, fontWeight: 600, cursor: tidyBusy ? "default" : "pointer" }}>
              <i className={`ti ${tidyBusy ? "ti-loader-2" : "ti-folders"}`} style={{ fontSize: 15 }} />{tidyBusy ? s.tidying : s.tidy}
            </button>
            <button onClick={translateBase} disabled={trBusy} title={s.translate} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2,var(--text-3))", fontSize: 13, fontWeight: 600, cursor: trBusy ? "default" : "pointer" }}>
              <i className={`ti ${trBusy ? "ti-loader-2" : "ti-language"}`} style={{ fontSize: 15 }} />{trBusy ? s.translating : s.translate}
            </button>
          </div>
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", padding: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={askQ} onChange={(e) => setAskQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !askBusy) ask(); }} placeholder={s.askPh} autoFocus disabled={askBusy} style={{ flex: 1, minWidth: 220, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface,var(--surface))", color: "var(--text)", fontSize: 13.5 }} />
              <button onClick={ask} disabled={askBusy || !askQ.trim()} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#6d5efc", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer", opacity: askBusy || !askQ.trim() ? 0.6 : 1 }}>{askBusy ? s.asking : s.ask}</button>
              <button onClick={() => { setAskOpen(false); setAskA(""); }} aria-label="close" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 18, padding: "0 6px" }}><i className="ti ti-x" /></button>
            </div>
            {askA ? <div style={{ marginTop: 11, fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--text)" }}>{askA}</div> : null}
          </div>
        )}
      </div>

      {/* Поиск + фильтры */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ position: "relative", marginBottom: 9 }}>
          <i className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", fontSize: 15 }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={s.searchPh} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 34px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5 }} />
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
          <span onClick={() => setFavOnly((v) => !v)} style={chip(favOnly)}><i className="ti ti-star" style={{ fontSize: 12 }} /> {s.favOnly}</span>
          {folders.map(([f, n]) => (
            <span key={f} onClick={() => setFolderFilter(folderFilter === f ? null : f)} style={chip(folderFilter === f)}>{f} · {n}</span>
          ))}
          {tags.length ? <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 2px" }} /> : null}
          {tags.map((t) => (
            <span key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)} style={chip(tagFilter === t)}>#{t.replace(/\s+/g, "_")}</span>
          ))}
          {(favOnly || folderFilter || tagFilter || query) ? (
            <span onClick={() => { setFavOnly(false); setFolderFilter(null); setTagFilter(null); setQuery(""); }} style={{ ...chip(false), color: "#ef4444", borderColor: "var(--border)" }}><i className="ti ti-x" style={{ fontSize: 12 }} /> {s.clear}</span>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 26, border: "1px solid var(--border)", borderRadius: 16, background: "var(--surface)", color: "var(--text-3)", textAlign: "center", lineHeight: 1.6 }}>{items.length === 0 ? (emptyHint || s.empty) : s.empty}</div>
      ) : (
        groups.map(([topic, list]) => (
          <section key={topic} style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 11px", display: "flex", alignItems: "center", gap: 7 }}>
              <i className="ti ti-folder" style={{ color: "#6d5efc" }} /> {topic}
              <span style={{ color: "var(--text-3)", fontWeight: 500 }}>· {list.length}</span>
              {topic !== "—" ? <button onClick={() => renameFolder(topic)} aria-label="rename" title={s.edit} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 13, padding: 2 }}><i className="ti ti-pencil" /></button> : null}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {list.map((it) => (
                <article
                  key={it.id}
                  draggable
                  onDragStart={() => setDragId(it.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(it.id)}
                  onClick={() => { setOpen(it); setEditing(false); }}
                  style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column", opacity: dragId === it.id ? 0.5 : 1, position: "relative" }}
                >
                  <div style={{ position: "relative" }}>
                    <Thumb it={it} h={128} />
                    <div style={{ position: "absolute", top: 7, left: 7, display: "flex", gap: 5 }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleFav(it); }} title={s.fav} style={iconBtn(it.favorite)}><i className={`ti ${it.favorite ? "ti-star-filled" : "ti-star"}`} /></button>
                      <button onClick={(e) => { e.stopPropagation(); toggleDone(it); }} title={s.undone} style={iconBtn(it.done)}><i className={`ti ${it.done ? "ti-circle-check-filled" : "ti-circle-check"}`} /></button>
                    </div>
                    {it.kind === "reel" ? <span style={{ position: "absolute", bottom: 7, right: 7, background: "rgba(0,0,0,.6)", color: "#fff", borderRadius: 999, padding: "2px 7px", fontSize: 10 }}><i className="ti ti-player-play-filled" style={{ fontSize: 10 }} /> {s.reel}</span> : null}
                  </div>
                  <div style={{ padding: "10px 11px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.3, ...clamp(2) }}>{it.title}</div>
                    {it.summary ? <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.45, ...clamp(2) }}>{it.summary}</div> : null}
                    {it.note ? <div style={{ fontSize: 11.5, color: "#6d5efc", display: "flex", gap: 4, ...clamp(1) }}><i className="ti ti-message" style={{ fontSize: 12 }} />{it.note}</div> : null}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1, minWidth: 0 }}>
                        {(it.tags || []).slice(0, 2).map((tg, i) => <span key={i} style={{ fontSize: 10.5, color: "#6d5efc", background: "rgba(109,94,252,.1)", borderRadius: 7, padding: "1px 7px" }}>#{tg.replace(/\s+/g, "_")}</span>)}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setMenuId(menuId === it.id ? null : it.id); }} aria-label="menu" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 16, padding: 2, flexShrink: 0 }}><i className="ti ti-dots" /></button>
                    </div>
                    {menuId === it.id ? (
                      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", right: 10, bottom: 10, zIndex: 5, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.18)", padding: 6, minWidth: 150 }}>
                        <button onClick={() => { setOpen(it); startEdit(it); setMenuId(null); }} style={menuItem}><i className="ti ti-pencil" /> {s.edit}</button>
                        <div style={{ padding: "4px 8px 2px", fontSize: 10.5, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".04em" }}>{s.folder}</div>
                        {folders.filter(([f]) => f !== folderOf(it)).slice(0, 6).map(([f]) => (
                          <button key={f} onClick={() => move(it.id, f)} style={menuItem}><i className="ti ti-folder" /> {f}</button>
                        ))}
                        <button onClick={() => { const t = prompt(s.newFolder, ""); if (t) move(it.id, t); }} style={menuItem}><i className="ti ti-folder-plus" /> {s.newFolder}</button>
                        <button onClick={() => del(it.id)} style={{ ...menuItem, color: "#ef4444" }}><i className="ti ti-trash" /> {s.delete}</button>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Модалка */}
      {open ? (
        <div onClick={() => { setOpen(null); setEditing(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 18, maxWidth: 580, width: "100%", margin: "auto", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ position: "relative" }}>
              <Thumb it={open} h={230} />
              <button onClick={() => { setOpen(null); setEditing(false); }} aria-label="close" style={{ position: "absolute", top: 10, right: 10, ...iconBtn(false), width: 32, height: 32, fontSize: 17 }}><i className="ti ti-x" /></button>
              <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                <button onClick={() => toggleFav(open)} title={s.fav} style={{ ...iconBtn(open.favorite), width: 32, height: 32, fontSize: 16 }}><i className={`ti ${open.favorite ? "ti-star-filled" : "ti-star"}`} /></button>
                <button onClick={() => toggleDone(open)} title={s.undone} style={{ ...iconBtn(open.done), width: 32, height: 32, fontSize: 16 }}><i className={`ti ${open.done ? "ti-circle-check-filled" : "ti-circle-check"}`} /></button>
              </div>
            </div>
            <div style={{ padding: "16px 18px 20px" }}>
              {editing ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <label style={lbl}>{s.title}<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={inp} /></label>
                  <label style={lbl}>{s.folder}<input value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} list="kn-folders" style={inp} /></label>
                  <datalist id="kn-folders">{folders.map(([f]) => <option key={f} value={f} />)}</datalist>
                  <label style={lbl}>{s.summary}<textarea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} rows={3} style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} /></label>
                  <label style={lbl}>{s.note}<textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} rows={2} placeholder={s.notePh} style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} /></label>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 2 }}>
                    <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 13.5, padding: "8px 10px" }}>{s.cancel}</button>
                    <button onClick={saveEdit} style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "#6d5efc", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>{s.save}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>
                    <i className={`ti ${open.kind === "reel" ? "ti-video" : "ti-photo"}`} />
                    <span>{open.kind === "reel" ? s.reel : s.post}</span>
                    {open.author ? <span>· {open.author}</span> : null}
                    {open.done ? <span style={{ color: "#16a34a", marginLeft: 6 }}><i className="ti ti-circle-check-filled" /> {s.applied}</span> : null}
                    <span style={{ marginLeft: "auto", color: "#6d5efc" }}><i className="ti ti-folder" /> {folderOf(open)}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.3 }}>{open.title}</div>
                  {open.summary ? <div style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.55, marginTop: 8 }}>{open.summary}</div> : null}
                  {open.key_points?.length ? (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>{s.points}</div>
                      <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 5 }}>{open.key_points.map((p, i) => <li key={i} style={{ fontSize: 13.5, lineHeight: 1.5 }}>{p}</li>)}</ul>
                    </div>
                  ) : null}
                  {open.note ? <div style={{ marginTop: 13, background: "rgba(109,94,252,.08)", borderRadius: 10, padding: "10px 12px", fontSize: 13, lineHeight: 1.5, display: "flex", gap: 8 }}><i className="ti ti-message" style={{ color: "#6d5efc", marginTop: 2 }} /><span style={{ whiteSpace: "pre-wrap" }}>{open.note}</span></div> : null}
                  {open.tags?.length ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>{open.tags.map((tg, i) => <span key={i} style={{ fontSize: 11.5, color: "#6d5efc", background: "rgba(109,94,252,.1)", borderRadius: 8, padding: "2px 9px" }}>#{tg.replace(/\s+/g, "_")}</span>)}</div> : null}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, flexWrap: "wrap" }}>
                    {open.url ? <a href={open.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6d5efc", textDecoration: "none", fontWeight: 600 }}><i className="ti ti-brand-instagram" style={{ fontSize: 16 }} /> {s.open}</a> : null}
                    <button onClick={() => startEdit(open)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-2,var(--text-3))", cursor: "pointer", fontSize: 13 }}><i className="ti ti-pencil" /> {s.edit}</button>
                    <button onClick={() => del(open.id)} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13 }}><i className="ti ti-trash" /> {s.delete}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const menuItem: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "7px 9px", borderRadius: 7, border: "none", background: "none", color: "var(--text)", fontSize: 13, cursor: "pointer" };
const lbl: React.CSSProperties = { display: "grid", gap: 5, fontSize: 11.5, color: "var(--text-3)", fontWeight: 600 };
const inp: React.CSSProperties = { padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface,var(--surface))", color: "var(--text)", fontSize: 13.5, width: "100%", boxSizing: "border-box" };
