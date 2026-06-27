"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Path = { id: string; title: string; description: string; emoji: string; accent: string; status: string; public: boolean; pages: number };

const STR: Record<string, any> = {
  ru: { newPath: "Новый путь", title: "Название", titlePh: "Напр.: Восстановление энергии", desc: "Описание (необязательно)", descPh: "О чём этот путь и куда ведёт", emoji: "Эмодзи", color: "Цвет", status: "Статус", active: "Иду", done: "Пройден", makePublic: "Публичный (виден по ссылке)", save: "Сохранить", create: "Создать путь", cancel: "Отмена", edit: "Изменить", del: "Удалить", open: "Открыть", pages: "стр.", confirmDel: "Удалить путь? Страницы останутся, просто отвяжутся от него.", empty: "Пока нет путей. Путь — это длинная история: «Восстановление здоровья», «Запуск проекта», «200 отжиманий». Группируй в него опубликованные страницы.", hint: "Привязывай страницы к пути при публикации записи (кнопка «Опубликовать»).", privateNote: "выключен — никто не видит" },
  en: { newPath: "New path", title: "Title", titlePh: "e.g. Restoring energy", desc: "Description (optional)", descPh: "What this path is about and where it leads", emoji: "Emoji", color: "Color", status: "Status", active: "Ongoing", done: "Completed", makePublic: "Public (visible via link)", save: "Save", create: "Create path", cancel: "Cancel", edit: "Edit", del: "Delete", open: "Open", pages: "pages", confirmDel: "Delete this path? Pages stay, just unlinked.", empty: "No paths yet. A path is a long story: “Restoring health”, “Launching a project”, “200 push-ups”. Group published pages into it.", hint: "Attach pages to a path when you publish an entry (the “Publish” button).", privateNote: "off — nobody sees it" },
  uk: { newPath: "Новий шлях", title: "Назва", titlePh: "Напр.: Відновлення енергії", desc: "Опис (необов'язково)", descPh: "Про що цей шлях і куди веде", emoji: "Емодзі", color: "Колір", status: "Статус", active: "Іду", done: "Пройдено", makePublic: "Публічний (видно за посиланням)", save: "Зберегти", create: "Створити шлях", cancel: "Скасувати", edit: "Змінити", del: "Видалити", open: "Відкрити", pages: "стор.", confirmDel: "Видалити шлях? Сторінки лишаться, просто відв'яжуться.", empty: "Поки немає шляхів. Шлях — це довга історія: «Відновлення здоров'я», «Запуск проєкту». Групуй у нього опубліковані сторінки.", hint: "Прив'язуй сторінки до шляху під час публікації запису.", privateNote: "вимкнено — ніхто не бачить" },
  fr: { newPath: "Nouveau chemin", title: "Titre", titlePh: "Ex. : Retrouver l'énergie", desc: "Description (optionnel)", descPh: "De quoi parle ce chemin et où il mène", emoji: "Emoji", color: "Couleur", status: "Statut", active: "En cours", done: "Terminé", makePublic: "Public (visible via lien)", save: "Enregistrer", create: "Créer le chemin", cancel: "Annuler", edit: "Modifier", del: "Supprimer", open: "Ouvrir", pages: "pages", confirmDel: "Supprimer ce chemin ? Les pages restent, juste détachées.", empty: "Pas encore de chemins. Un chemin est une longue histoire : « Retrouver la santé », « Lancer un projet ». Regroupes-y tes pages publiées.", hint: "Attache des pages à un chemin en publiant une entrée.", privateNote: "désactivé — personne ne voit" },
};

const ACCENTS: Record<string, [string, string]> = { indigo: ["#4f46e5", "#7c6ff0"], green: ["#0f9d6e", "#34d399"], amber: ["#c2620a", "#f59e0b"], pink: ["#be1d6a", "#f472b6"], dark: ["#111827", "#374151"] };
const EMOJIS = ["🌱", "🏃", "💪", "💼", "🏡", "📚", "🧘", "🍎", "🎯", "❤️", "✨", "🔥"];
const blank = { id: "", title: "", description: "", emoji: "🌱", accent: "indigo", status: "active", public: false, pages: 0 };

export default function PathsView({ paths, host, locale }: { paths: Path[]; host: string; locale: string }) {
  const L = STR[locale] || STR.ru;
  const router = useRouter();
  const [edit, setEdit] = useState<Path | null>(null); // null = редактор закрыт
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!edit) return;
    const title = edit.title.trim();
    if (!title) return;
    setBusy(true);
    const action = edit.id ? "update" : "create";
    const r = await fetch("/api/path", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, id: edit.id || undefined, title, description: edit.description, emoji: edit.emoji, accent: edit.accent, status: edit.status, public: edit.public }) });
    setBusy(false);
    if (r.ok) { setEdit(null); router.refresh(); }
  }
  async function togglePublic(p: Path) {
    setBusy(true);
    await fetch("/api/path", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "update", id: p.id, public: !p.public }) });
    setBusy(false); router.refresh();
  }
  async function del(p: Path) {
    if (!window.confirm(L.confirmDel)) return;
    setBusy(true);
    await fetch("/api/path", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", id: p.id }) });
    setBusy(false); router.refresh();
  }

  const inp: any = { width: "100%", boxSizing: "border-box", fontSize: 14, padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" };
  const btn = (primary: boolean): any => ({ fontSize: 13.5, fontWeight: 500, padding: "9px 16px", borderRadius: 10, border: primary ? "none" : "1px solid var(--border)", background: primary ? "var(--accent)" : "var(--surface)", color: primary ? "#fff" : "var(--text)", cursor: "pointer" });
  const chip: any = { fontSize: 12, padding: "5px 11px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer" };

  return (
    <div>
      {!edit && (
        <button onClick={() => setEdit({ ...blank })} style={{ ...btn(true), marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 7 }}>
          <i className="ti ti-plus" style={{ fontSize: 16 }} />{L.newPath}
        </button>
      )}

      {/* редактор */}
      {edit && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 4 }}>{L.title}</div>
          <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value.slice(0, 80) })} placeholder={L.titlePh} style={{ ...inp, marginBottom: 11 }} />
          <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 4 }}>{L.desc}</div>
          <textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value.slice(0, 300) })} placeholder={L.descPh} rows={2} style={{ ...inp, marginBottom: 11, resize: "vertical", fontFamily: "inherit" }} />
          <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 5 }}>{L.emoji}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 11 }}>
            {EMOJIS.map((em) => <button key={em} onClick={() => setEdit({ ...edit, emoji: em })} style={{ fontSize: 18, width: 36, height: 36, borderRadius: 8, border: `1px solid ${em === edit.emoji ? "var(--accent)" : "var(--border)"}`, background: em === edit.emoji ? "var(--accent-bg)" : "var(--surface)", cursor: "pointer" }}>{em}</button>)}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 5 }}>{L.color}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {Object.keys(ACCENTS).map((k) => <button key={k} onClick={() => setEdit({ ...edit, accent: k })} style={{ width: 32, height: 32, borderRadius: 9, cursor: "pointer", border: edit.accent === k ? "3px solid var(--text)" : "1px solid var(--border)", background: `linear-gradient(135deg, ${ACCENTS[k][0]}, ${ACCENTS[k][1]})` }} />)}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>{L.status}:</span>
            <button onClick={() => setEdit({ ...edit, status: "active" })} style={{ ...chip, ...(edit.status === "active" ? { borderColor: "var(--accent)", color: "var(--accent-text)", background: "var(--accent-bg)" } : {}) }}>{L.active}</button>
            <button onClick={() => setEdit({ ...edit, status: "done" })} style={{ ...chip, ...(edit.status === "done" ? { borderColor: "var(--accent)", color: "var(--accent-text)", background: "var(--accent-bg)" } : {}) }}>{L.done}</button>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", marginBottom: 14, fontSize: 13.5 }}>
            <input type="checkbox" checked={edit.public} onChange={(e) => setEdit({ ...edit, public: e.target.checked })} style={{ width: 17, height: 17, accentColor: "var(--accent)" }} />{L.makePublic}
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button disabled={busy} onClick={save} style={btn(true)}>{edit.id ? L.save : L.create}</button>
            <button disabled={busy} onClick={() => setEdit(null)} style={btn(false)}>{L.cancel}</button>
          </div>
        </div>
      )}

      {/* список */}
      {paths.length === 0 && !edit ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.55 }}>{L.empty}</div>
      ) : (
        paths.map((p) => (
          <div key={p.id} className="card" style={{ marginBottom: 10, display: "flex", gap: 13, alignItems: "flex-start" }}>
            <span style={{ width: 44, height: 44, borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: `linear-gradient(135deg, ${(ACCENTS[p.accent] || ACCENTS.indigo)[0]}, ${(ACCENTS[p.accent] || ACCENTS.indigo)[1]})`, flexShrink: 0 }}>{p.emoji || "🌱"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{p.title}</div>
              {p.description && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2, lineHeight: 1.45 }}>{p.description}</div>}
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 5, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span>{p.status === "done" ? "✓ " + L.done : L.active}</span>
                <span>{p.pages} {L.pages}</span>
                {!p.public && <span>· {L.privateNote}</span>}
              </div>
              <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
                {p.public && <a href={`https://${host}/path/${p.id}`} target="_blank" rel="noreferrer" style={{ ...chip, color: "var(--accent)", borderColor: "var(--accent)", textDecoration: "none" }}>{L.open} →</a>}
                <button onClick={() => togglePublic(p)} disabled={busy} style={chip}>{p.public ? "🌍→🔒" : "🔒→🌍"}</button>
                <button onClick={() => setEdit(p)} disabled={busy} style={chip}>{L.edit}</button>
                <button onClick={() => del(p)} disabled={busy} style={{ ...chip, color: "#ef4444" }}>{L.del}</button>
              </div>
            </div>
          </div>
        ))
      )}

      {paths.length > 0 && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 12 }}>{L.hint}</div>}
    </div>
  );
}
