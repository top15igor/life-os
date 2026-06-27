"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type Path = { id: string; title: string; description: string; emoji: string; accent: string; status: string; public: boolean; pages: number };

const STR: Record<string, any> = {
  ru: { newPath: "Новый путь", title: "Название", titlePh: "Напр.: Восстановление энергии", desc: "Описание (необязательно)", descPh: "О чём этот путь и куда ведёт", emoji: "Эмодзи", color: "Цвет", status: "Статус", active: "Иду", done: "Пройден", makePublic: "Публичный (виден по ссылке)", save: "Сохранить", create: "Создать путь", cancel: "Отмена", edit: "Изменить", del: "Удалить", open: "Открыть", share: "Поделиться", copy: "Копировать", copied: "Скопировано", tg: "Telegram", wa: "WhatsApp", more: "Поделиться…", close: "Закрыть", shareTitle: "Поделиться путём", shareSub: "Отправь ссылку — друг увидит твой путь и ленту страниц. Аккаунт ему не нужен.", pitchTpl: "📖 Мой путь «{t}» в LIFE OS — загляни:", pages: "стр.", confirmDel: "Удалить путь? Страницы останутся, просто отвяжутся от него.", empty: "Пока нет путей. Путь — это длинная история: «Восстановление здоровья», «Запуск проекта», «200 отжиманий». Группируй в него опубликованные страницы.", hint: "Привязывай страницы к пути при публикации записи (кнопка «Опубликовать»).", privateNote: "выключен — никто не видит" },
  en: { newPath: "New path", title: "Title", titlePh: "e.g. Restoring energy", desc: "Description (optional)", descPh: "What this path is about and where it leads", emoji: "Emoji", color: "Color", status: "Status", active: "Ongoing", done: "Completed", makePublic: "Public (visible via link)", save: "Save", create: "Create path", cancel: "Cancel", edit: "Edit", del: "Delete", open: "Open", share: "Share", copy: "Copy", copied: "Copied", tg: "Telegram", wa: "WhatsApp", more: "Share…", close: "Close", shareTitle: "Share path", shareSub: "Send the link — your friend sees your path and its timeline. No account needed.", pitchTpl: "📖 My path “{t}” on LIFE OS — take a look:", pages: "pages", confirmDel: "Delete this path? Pages stay, just unlinked.", empty: "No paths yet. A path is a long story: “Restoring health”, “Launching a project”, “200 push-ups”. Group published pages into it.", hint: "Attach pages to a path when you publish an entry (the “Publish” button).", privateNote: "off — nobody sees it" },
  uk: { newPath: "Новий шлях", title: "Назва", titlePh: "Напр.: Відновлення енергії", desc: "Опис (необов'язково)", descPh: "Про що цей шлях і куди веде", emoji: "Емодзі", color: "Колір", status: "Статус", active: "Іду", done: "Пройдено", makePublic: "Публічний (видно за посиланням)", save: "Зберегти", create: "Створити шлях", cancel: "Скасувати", edit: "Змінити", del: "Видалити", open: "Відкрити", share: "Поділитися", copy: "Копіювати", copied: "Скопійовано", tg: "Telegram", wa: "WhatsApp", more: "Поділитися…", close: "Закрити", shareTitle: "Поділитися шляхом", shareSub: "Надішли посилання — друг побачить твій шлях і стрічку сторінок. Акаунт не потрібен.", pitchTpl: "📖 Мій шлях «{t}» у LIFE OS — поглянь:", pages: "стор.", confirmDel: "Видалити шлях? Сторінки лишаться, просто відв'яжуться.", empty: "Поки немає шляхів. Шлях — це довга історія: «Відновлення здоров'я», «Запуск проєкту». Групуй у нього опубліковані сторінки.", hint: "Прив'язуй сторінки до шляху під час публікації запису.", privateNote: "вимкнено — ніхто не бачить" },
  fr: { newPath: "Nouveau chemin", title: "Titre", titlePh: "Ex. : Retrouver l'énergie", desc: "Description (optionnel)", descPh: "De quoi parle ce chemin et où il mène", emoji: "Emoji", color: "Couleur", status: "Statut", active: "En cours", done: "Terminé", makePublic: "Public (visible via lien)", save: "Enregistrer", create: "Créer le chemin", cancel: "Annuler", edit: "Modifier", del: "Supprimer", open: "Ouvrir", share: "Partager", copy: "Copier", copied: "Copié", tg: "Telegram", wa: "WhatsApp", more: "Partager…", close: "Fermer", shareTitle: "Partager le chemin", shareSub: "Envoie le lien — ton ami verra ton chemin et son fil de pages. Pas besoin de compte.", pitchTpl: "📖 Mon chemin « {t} » sur LIFE OS — jette un œil :", pages: "pages", confirmDel: "Supprimer ce chemin ? Les pages restent, juste détachées.", empty: "Pas encore de chemins. Un chemin est une longue histoire : « Retrouver la santé », « Lancer un projet ». Regroupes-y tes pages publiées.", hint: "Attache des pages à un chemin en publiant une entrée.", privateNote: "désactivé — personne ne voit" },
};

const ACCENTS: Record<string, [string, string]> = { indigo: ["#4f46e5", "#7c6ff0"], green: ["#0f9d6e", "#34d399"], amber: ["#c2620a", "#f59e0b"], pink: ["#be1d6a", "#f472b6"], dark: ["#111827", "#374151"] };
const EMOJIS = ["🌱", "🏃", "💪", "💼", "🏡", "📚", "🧘", "🍎", "🎯", "❤️", "✨", "🔥"];
const blank = { id: "", title: "", description: "", emoji: "🌱", accent: "indigo", status: "active", public: false, pages: 0 };

function shareBtn(bg: string, fg = "#fff"): any {
  return { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 11, background: bg, color: fg, fontSize: 13.5, fontWeight: 500, textDecoration: "none", border: "none", cursor: "pointer" };
}

export default function PathsView({ paths, host, locale }: { paths: Path[]; host: string; locale: string }) {
  const L = STR[locale] || STR.ru;
  const router = useRouter();
  const [edit, setEdit] = useState<Path | null>(null); // null = редактор закрыт
  const [busy, setBusy] = useState(false);
  const [shareP, setShareP] = useState<Path | null>(null); // путь, для которого открыто окно «Поделиться»
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
  function openShare(p: Path) { setCopied(false); setShareP(p); }
  function shareUrl(p: Path) { return `https://${host}/path/${p.id}`; }
  function pitch(p: Path) { return L.pitchTpl.replace("{t}", p.title); }
  async function copyLink(p: Path) {
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    try { await nav?.clipboard?.writeText(shareUrl(p)); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }
  function nativeShare(p: Path) {
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    if (nav?.share) nav.share({ title: p.title, text: pitch(p), url: shareUrl(p) }).catch(() => {});
    else copyLink(p);
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
                {p.public && (
                  <button onClick={() => openShare(p)} disabled={busy} style={{ ...chip, color: "var(--accent)", borderColor: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <i className="ti ti-share" style={{ fontSize: 13 }} />{L.share}
                  </button>
                )}
                <button onClick={() => togglePublic(p)} disabled={busy} style={chip}>{p.public ? "🌍→🔒" : "🔒→🌍"}</button>
                <button onClick={() => setEdit(p)} disabled={busy} style={chip}>{L.edit}</button>
                <button onClick={() => del(p)} disabled={busy} style={{ ...chip, color: "#ef4444" }}>{L.del}</button>
              </div>
            </div>
          </div>
        ))
      )}

      {paths.length > 0 && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 12 }}>{L.hint}</div>}

      {/* окно «Поделиться» */}
      {mounted && shareP && createPortal(
        <div onClick={() => setShareP(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 18, padding: "26px 22px", maxWidth: 400, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{shareP.emoji || "🌱"}</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 7 }}>{L.shareTitle}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5 }}>{L.shareSub}</div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input readOnly value={shareUrl(shareP)} onFocus={(e) => e.currentTarget.select()} style={{ flex: 1, fontSize: 12.5, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-2)", minWidth: 0 }} />
              <button onClick={() => copyLink(shareP)} style={{ flexShrink: 0, fontSize: 13, padding: "0 15px", borderRadius: 10, border: "none", background: copied ? "var(--positive)" : "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: 500 }}>
                <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} style={{ fontSize: 14, verticalAlign: "-2px", marginRight: 4 }} />{copied ? L.copied : L.copy}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl(shareP))}&text=${encodeURIComponent(pitch(shareP))}`} target="_blank" rel="noreferrer" style={shareBtn("#229ED9")}><i className="ti ti-brand-telegram" style={{ fontSize: 17 }} />{L.tg}</a>
              <a href={`https://wa.me/?text=${encodeURIComponent(pitch(shareP) + " " + shareUrl(shareP))}`} target="_blank" rel="noreferrer" style={shareBtn("#25D366")}><i className="ti ti-brand-whatsapp" style={{ fontSize: 17 }} />{L.wa}</a>
            </div>
            <button onClick={() => nativeShare(shareP)} style={{ ...shareBtn("var(--surface-2)", "var(--text)"), width: "100%", marginBottom: 4 }}>
              <i className="ti ti-share" style={{ fontSize: 16 }} />{L.more}
            </button>
            <button onClick={() => setShareP(null)} style={{ width: "100%", padding: "9px", borderRadius: 10, border: "none", background: "transparent", color: "var(--text-2)", cursor: "pointer", fontSize: 13 }}>{L.close}</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
