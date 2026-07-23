"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const STR: Record<string, any> = {
  ru: { publish: "Опубликовать", published: "Опубликовано", edit: "Изменить", remove: "Убрать", modalTitle: "Опубликовать в Книгу жизни", sub: "AI подготовил публичную версию — личное не уйдёт. Проверь и поправь под себя.", lTitle: "Заголовок", lText: "Текст", aiHid: "🔒 AI спрятал ради приватности:", save: "Опубликовать", saveEdit: "Сохранить", cancel: "Отмена", preparing: "AI готовит…", bookNote: "После публикации запись появится на твоей публичной странице — ссылку увидишь сразу здесь. Выключить страницу целиком можно в «Поделиться».", confirmRemove: "Убрать запись из публичной книги?", empty: "Текст не может быть пустым.", pathLabel: "Добавить в путь (необязательно)", pathNone: "Без пути", viewPage: "Открыть публичную страницу", copied: "Ссылка скопирована" },
  en: { publish: "Publish", published: "Published", edit: "Edit", remove: "Remove", modalTitle: "Publish to your Book of Life", sub: "AI prepared a public version — nothing personal leaks. Review and tweak.", lTitle: "Title", lText: "Text", aiHid: "🔒 AI hid for privacy:", save: "Publish", saveEdit: "Save", cancel: "Cancel", preparing: "AI is preparing…", bookNote: "Once published, the entry appears on your public page — you'll get the link right here. You can turn the whole page off in Share.", confirmRemove: "Remove this entry from your public book?", empty: "Text can't be empty.", pathLabel: "Add to a path (optional)", pathNone: "No path", viewPage: "Open public page", copied: "Link copied" },
  uk: { publish: "Опублікувати", published: "Опубліковано", edit: "Змінити", remove: "Прибрати", modalTitle: "Опублікувати в Книгу життя", sub: "AI підготував публічну версію — особисте не піде. Перевір і поправ.", lTitle: "Заголовок", lText: "Текст", aiHid: "🔒 AI сховав заради приватності:", save: "Опублікувати", saveEdit: "Зберегти", cancel: "Скасувати", preparing: "AI готує…", bookNote: "Після публікації запис з'явиться на твоїй публічній сторінці — посилання побачиш одразу тут. Вимкнути сторінку цілком можна в «Поділитися».", confirmRemove: "Прибрати запис із публічної книги?", empty: "Текст не може бути порожнім.", pathLabel: "Додати в шлях (необов'язково)", pathNone: "Без шляху", viewPage: "Відкрити публічну сторінку", copied: "Посилання скопійовано" },
  fr: { publish: "Publier", published: "Publié", edit: "Modifier", remove: "Retirer", modalTitle: "Publier dans ton Livre de vie", sub: "L'IA a préparé une version publique — rien de personnel ne sort. Vérifie et ajuste.", lTitle: "Titre", lText: "Texte", aiHid: "🔒 L'IA a masqué pour la confidentialité :", save: "Publier", saveEdit: "Enregistrer", cancel: "Annuler", preparing: "L'IA prépare…", bookNote: "Une fois publiée, l'entrée apparaît sur ta page publique — tu auras le lien ici même. Tu peux désactiver toute la page dans Partager.", confirmRemove: "Retirer cette entrée du livre public ?", empty: "Le texte ne peut pas être vide.", pathLabel: "Ajouter à un chemin (optionnel)", pathNone: "Sans chemin", viewPage: "Ouvrir la page publique", copied: "Lien copié" },
  es: { publish: "Publicar", published: "Publicado", edit: "Editar", remove: "Quitar", modalTitle: "Publicar en tu Libro de la vida", sub: "La IA preparó una versión pública — nada personal se filtra. Revísala y ajústala a tu gusto.", lTitle: "Título", lText: "Texto", aiHid: "🔒 La IA ocultó por privacidad:", save: "Publicar", saveEdit: "Guardar", cancel: "Cancelar", preparing: "La IA está preparando…", bookNote: "Una vez publicada, la entrada aparecerá en tu página pública — verás el enlace aquí mismo. Puedes desactivar toda la página en «Compartir».", confirmRemove: "¿Quitar esta entrada del libro público?", empty: "El texto no puede estar vacío.", pathLabel: "Añadir a un camino (opcional)", pathNone: "Sin camino", viewPage: "Abrir página pública", copied: "Enlace copiado" },
};

export default function PublishEntry({ entryId, initial, paths = [], locale, handle: handleProp = "", baseUrl = "" }: { entryId: string; initial: { published: boolean; title: string; text: string }; paths?: { id: string; title: string; emoji?: string }[]; locale: string; handle?: string; baseUrl?: string }) {
  const L = STR[locale] || STR.ru;
  const router = useRouter();
  const [published, setPublished] = useState(initial.published);
  const [title, setTitle] = useState(initial.title);
  const [text, setText] = useState(initial.text);
  const [pathId, setPathId] = useState("");
  const [removed, setRemoved] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [handle, setHandle] = useState(handleProp);
  useEffect(() => setMounted(true), []);

  const pageUrl = handle ? `${baseUrl}/p/${handle}` : "";

  async function openNew() {
    setBusy(true);
    try {
      const r = await fetch("/api/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: entryId, action: "prepare" }) });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) { setTitle(j.title || ""); setText(j.text || ""); setRemoved(j.removed || []); setOpen(true); }
    } finally { setBusy(false); }
  }
  function openEdit() { setRemoved([]); setOpen(true); }

  async function save() {
    const t = text.trim();
    if (!t) { window.alert(L.empty); return; }
    setBusy(true);
    try {
      const payload: any = { id: entryId, action: "publish", title: title.trim(), text: t, privacy: "public" };
      if (paths.length) payload.path_id = pathId || null;
      const r = await fetch("/api/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json().catch(() => null);
      if (r.ok) { if (j?.handle) setHandle(j.handle); setPublished(true); setOpen(false); router.refresh(); }
    } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm(L.confirmRemove)) return;
    setBusy(true);
    try {
      const r = await fetch("/api/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: entryId, action: "unpublish" }) });
      if (r.ok) { setPublished(false); router.refresh(); }
    } finally { setBusy(false); }
  }

  const btn: any = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13.5, cursor: "pointer", color: "var(--text)" };
  const inp: any = { width: "100%", boxSizing: "border-box", fontSize: 14, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)" };

  return (
    <>
      {!published ? (
        <button onClick={openNew} disabled={busy} style={{ ...btn, color: "var(--accent)", borderColor: "var(--accent)" }}>
          <i className="ti ti-world-share" style={{ fontSize: 16 }} />{busy ? L.preparing : L.publish}
        </button>
      ) : (
        <div style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#10b981", fontWeight: 500 }}><i className="ti ti-circle-check" style={{ fontSize: 16 }} />{L.published}</span>
          {pageUrl && (
            <a href={pageUrl} target="_blank" rel="noreferrer" style={{ ...btn, color: "var(--accent)", borderColor: "var(--accent)", textDecoration: "none" }}>
              <i className="ti ti-external-link" style={{ fontSize: 15 }} />{L.viewPage}
            </a>
          )}
          <button onClick={openEdit} disabled={busy} style={btn}><i className="ti ti-pencil" style={{ fontSize: 15 }} />{L.edit}</button>
          <button onClick={remove} disabled={busy} style={{ ...btn, color: "#ef4444" }}><i className="ti ti-eye-off" style={{ fontSize: 15 }} />{L.remove}</button>
        </div>
      )}

      {mounted && open && createPortal(
        <div onClick={() => (busy ? null : setOpen(false))} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 16, padding: 20, width: "min(560px,100%)", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
            <div style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}><i className="ti ti-world" style={{ fontSize: 18, color: "var(--accent)" }} />{L.modalTitle}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, margin: "6px 0 14px" }}>{L.sub}</div>

            <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 4 }}>{L.lTitle}</div>
            <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 120))} style={{ ...inp, marginBottom: 12, fontWeight: 600 }} />
            <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 4 }}>{L.lText}</div>
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 2000))} rows={6} style={{ ...inp, resize: "vertical", lineHeight: 1.55, fontFamily: "inherit" }} />

            {removed.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--text-2)", background: "var(--surface-2)", borderRadius: 10, padding: "10px 12px", lineHeight: 1.5 }}>
                {L.aiHid} {removed.join(", ")}
              </div>
            )}
            {paths.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 4 }}>{L.pathLabel}</div>
                <select value={pathId} onChange={(e) => setPathId(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">{L.pathNone}</option>
                  {paths.map((p) => <option key={p.id} value={p.id}>{p.emoji ? p.emoji + " " : ""}{p.title}</option>)}
                </select>
              </div>
            )}
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 10, lineHeight: 1.45 }}>{L.bookNote}</div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button disabled={busy} onClick={() => setOpen(false)} style={{ ...btn }}>{L.cancel}</button>
              <button disabled={busy} onClick={save} style={{ ...btn, border: "none", background: "var(--accent)", color: "#fff" }}><i className="ti ti-world-share" style={{ fontSize: 16 }} />{published ? L.saveEdit : L.save}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
