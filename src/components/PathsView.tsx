"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Path = { id: string; title: string; description: string; emoji: string; accent: string; status: string; public: boolean; pages: number };

const STR: Record<string, any> = {
  ru: { newPath: "Новый путь", title: "Название", titlePh: "Напр.: Восстановление энергии", desc: "Описание (необязательно)", descPh: "О чём этот путь и куда ведёт", emoji: "Эмодзи", color: "Цвет", status: "Статус", active: "Иду", done: "Пройден", makePublic: "Публичный (виден по ссылке)", save: "Сохранить", create: "Создать путь", cancel: "Отмена", edit: "Изменить", del: "Удалить", open: "Открыть", share: "Поделиться", copied: "Скопировано", pages: "стр.", confirmDel: "Удалить путь? Страницы останутся, просто отвяжутся от него.", empty: "Пока нет путей. Путь — это длинная история: «Восстановление здоровья», «Запуск проекта», «200 отжиманий». Группируй в него опубликованные страницы.", hint: "Привязывай страницы к пути при публикации записи (кнопка «Опубликовать»).", privateNote: "выключен — никто не видит",
    guideTitle: "Как это работает", guideHide: "скрыть", guideShow: "как это работает?",
    steps: ["Создай путь — большую цель или историю, к которой идёшь.", "Публикуй записи дневника в этот путь — они складываются в таймлайн.", "Включи «Публичный» 🌍 и поделись ссылкой — твой прогресс вдохновляет других."],
    ideasLabel: "С чего начать — нажми и поменяй под себя:",
    ideas: [
      { emoji: "🏡", accent: "amber", title: "Строю дом", desc: "От фундамента до новоселья. Стройка как живой дневник." },
      { emoji: "🥾", accent: "green", title: "Camino de Santiago", desc: "800 км пешком. Каждый день — новая страница пути." },
      { emoji: "🚭", accent: "pink", title: "Бросаю курить", desc: "100 дней без сигарет. Считаю шаги к свободе." },
      { emoji: "🍷", accent: "indigo", title: "Трезвый год", desc: "365 дней ясности. История жизни без алкоголя." },
      { emoji: "🏃", accent: "green", title: "От дивана до марафона", desc: "Первые 5 км → 42,2. Весь путь в записях." },
      { emoji: "🌅", accent: "dark", title: "Меняю жизнь", desc: "Новая версия себя — по странице в день." },
      { emoji: "💰", accent: "amber", title: "Финансовая свобода", desc: "Закрываю долги и строю подушку. Шаг за шагом." },
      { emoji: "📖", accent: "indigo", title: "Пишу первую книгу", desc: "От идеи до точки. Дневник одной рукописи." },
      { emoji: "👶", accent: "pink", title: "Первый год малыша", desc: "Самые тёплые 365 дней. Чтобы не забыть ни мгновения." },
      { emoji: "🎸", accent: "dark", title: "Учусь играть на гитаре", desc: "От первых аккордов до своей песни." },
    ] },
  en: { newPath: "New path", title: "Title", titlePh: "e.g. Restoring energy", desc: "Description (optional)", descPh: "What this path is about and where it leads", emoji: "Emoji", color: "Color", status: "Status", active: "Ongoing", done: "Completed", makePublic: "Public (visible via link)", save: "Save", create: "Create path", cancel: "Cancel", edit: "Edit", del: "Delete", open: "Open", share: "Share", copied: "Copied", pages: "pages", confirmDel: "Delete this path? Pages stay, just unlinked.", empty: "No paths yet. A path is a long story: “Restoring health”, “Launching a project”, “200 push-ups”. Group published pages into it.", hint: "Attach pages to a path when you publish an entry (the “Publish” button).", privateNote: "off — nobody sees it",
    guideTitle: "How it works", guideHide: "hide", guideShow: "how it works?",
    steps: ["Create a path — a big goal or story you're walking toward.", "Publish diary entries into it — they stack up into a timeline.", "Turn on “Public” 🌍 and share the link — your progress inspires others."],
    ideasLabel: "Start here — tap one and make it yours:",
    ideas: [
      { emoji: "🏡", accent: "amber", title: "Building a house", desc: "From foundation to housewarming — a living build log." },
      { emoji: "🥾", accent: "green", title: "Camino de Santiago", desc: "800 km on foot. Every day, a new page of the journey." },
      { emoji: "🚭", accent: "pink", title: "Quitting smoking", desc: "100 days smoke-free. Counting steps to freedom." },
      { emoji: "🍷", accent: "indigo", title: "A sober year", desc: "365 days of clarity. Life without alcohol." },
      { emoji: "🏃", accent: "green", title: "Couch to marathon", desc: "First 5 km → 42.2. The whole road in entries." },
      { emoji: "🌅", accent: "dark", title: "Changing my life", desc: "A new version of myself — one page a day." },
      { emoji: "💰", accent: "amber", title: "Financial freedom", desc: "Clearing debt, building a cushion. Step by step." },
      { emoji: "📖", accent: "indigo", title: "Writing my first book", desc: "From idea to the final page. The log of one manuscript." },
      { emoji: "👶", accent: "pink", title: "Baby's first year", desc: "The warmest 365 days — so no moment is forgotten." },
      { emoji: "🎸", accent: "dark", title: "Learning guitar", desc: "From first chords to a song of my own." },
    ] },
  uk: { newPath: "Новий шлях", title: "Назва", titlePh: "Напр.: Відновлення енергії", desc: "Опис (необов'язково)", descPh: "Про що цей шлях і куди веде", emoji: "Емодзі", color: "Колір", status: "Статус", active: "Іду", done: "Пройдено", makePublic: "Публічний (видно за посиланням)", save: "Зберегти", create: "Створити шлях", cancel: "Скасувати", edit: "Змінити", del: "Видалити", open: "Відкрити", share: "Поділитися", copied: "Скопійовано", pages: "стор.", confirmDel: "Видалити шлях? Сторінки лишаться, просто відв'яжуться.", empty: "Поки немає шляхів. Шлях — це довга історія: «Відновлення здоров'я», «Запуск проєкту». Групуй у нього опубліковані сторінки.", hint: "Прив'язуй сторінки до шляху під час публікації запису.", privateNote: "вимкнено — ніхто не бачить",
    guideTitle: "Як це працює", guideHide: "сховати", guideShow: "як це працює?",
    steps: ["Створи шлях — велику ціль або історію, до якої йдеш.", "Публікуй записи щоденника в цей шлях — вони складаються в таймлайн.", "Увімкни «Публічний» 🌍 і поділись посиланням — твій прогрес надихає інших."],
    ideasLabel: "З чого почати — натисни й зміни під себе:",
    ideas: [
      { emoji: "🏡", accent: "amber", title: "Будую дім", desc: "Від фундаменту до новосілля. Будівництво як живий щоденник." },
      { emoji: "🥾", accent: "green", title: "Camino de Santiago", desc: "800 км пішки. Кожен день — нова сторінка шляху." },
      { emoji: "🚭", accent: "pink", title: "Кидаю палити", desc: "100 днів без сигарет. Рахую кроки до свободи." },
      { emoji: "🍷", accent: "indigo", title: "Тверезий рік", desc: "365 днів ясності. Історія життя без алкоголю." },
      { emoji: "🏃", accent: "green", title: "Від дивана до марафону", desc: "Перші 5 км → 42,2. Увесь шлях у записах." },
      { emoji: "🌅", accent: "dark", title: "Змінюю життя", desc: "Нова версія себе — по сторінці на день." },
      { emoji: "💰", accent: "amber", title: "Фінансова свобода", desc: "Закриваю борги й будую подушку. Крок за кроком." },
      { emoji: "📖", accent: "indigo", title: "Пишу першу книгу", desc: "Від ідеї до крапки. Щоденник одного рукопису." },
      { emoji: "👶", accent: "pink", title: "Перший рік малюка", desc: "Найтепліші 365 днів. Щоб не забути жодної миті." },
      { emoji: "🎸", accent: "dark", title: "Вчуся грати на гітарі", desc: "Від перших акордів до своєї пісні." },
    ] },
  fr: { newPath: "Nouveau chemin", title: "Titre", titlePh: "Ex. : Retrouver l'énergie", desc: "Description (optionnel)", descPh: "De quoi parle ce chemin et où il mène", emoji: "Emoji", color: "Couleur", status: "Statut", active: "En cours", done: "Terminé", makePublic: "Public (visible via lien)", save: "Enregistrer", create: "Créer le chemin", cancel: "Annuler", edit: "Modifier", del: "Supprimer", open: "Ouvrir", share: "Partager", copied: "Copié", pages: "pages", confirmDel: "Supprimer ce chemin ? Les pages restent, juste détachées.", empty: "Pas encore de chemins. Un chemin est une longue histoire : « Retrouver la santé », « Lancer un projet ». Regroupes-y tes pages publiées.", hint: "Attache des pages à un chemin en publiant une entrée.", privateNote: "désactivé — personne ne voit",
    guideTitle: "Comment ça marche", guideHide: "masquer", guideShow: "comment ça marche ?",
    steps: ["Crée un chemin — un grand objectif ou une histoire vers laquelle tu avances.", "Publie des entrées de journal dedans — elles forment une frise chronologique.", "Active « Public » 🌍 et partage le lien — ta progression en inspire d'autres."],
    ideasLabel: "Pour commencer — touche et adapte à toi :",
    ideas: [
      { emoji: "🏡", accent: "amber", title: "Je construis une maison", desc: "Des fondations à la crémaillère. Un carnet de chantier vivant." },
      { emoji: "🥾", accent: "green", title: "Camino de Santiago", desc: "800 km à pied. Chaque jour, une nouvelle page du chemin." },
      { emoji: "🚭", accent: "pink", title: "J'arrête de fumer", desc: "100 jours sans cigarette. Je compte les pas vers la liberté." },
      { emoji: "🍷", accent: "indigo", title: "Une année sobre", desc: "365 jours de clarté. La vie sans alcool." },
      { emoji: "🏃", accent: "green", title: "Du canapé au marathon", desc: "Premiers 5 km → 42,2. Tout le parcours en entrées." },
      { emoji: "🌅", accent: "dark", title: "Je change de vie", desc: "Une nouvelle version de moi — une page par jour." },
      { emoji: "💰", accent: "amber", title: "Liberté financière", desc: "Je solde mes dettes et je bâtis un matelas. Pas à pas." },
      { emoji: "📖", accent: "indigo", title: "J'écris mon premier livre", desc: "De l'idée au point final. Le carnet d'un manuscrit." },
      { emoji: "👶", accent: "pink", title: "La première année de bébé", desc: "Les 365 jours les plus tendres — pour ne rien oublier." },
      { emoji: "🎸", accent: "dark", title: "J'apprends la guitare", desc: "Des premiers accords à ma propre chanson." },
    ] },
};

const ACCENTS: Record<string, [string, string]> = { indigo: ["#4f46e5", "#7c6ff0"], green: ["#0f9d6e", "#34d399"], amber: ["#c2620a", "#f59e0b"], pink: ["#be1d6a", "#f472b6"], dark: ["#111827", "#374151"] };
const EMOJIS = ["🌱", "🏃", "💪", "💼", "🏡", "📚", "🧘", "🍎", "🎯", "❤️", "✨", "🔥"];
const blank = { id: "", title: "", description: "", emoji: "🌱", accent: "indigo", status: "active", public: false, pages: 0 };

export default function PathsView({ paths, host, locale }: { paths: Path[]; host: string; locale: string }) {
  const L = STR[locale] || STR.ru;
  const router = useRouter();
  const [edit, setEdit] = useState<Path | null>(null); // null = редактор закрыт
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState(paths.length === 0); // гайд открыт по умолчанию, пока нет путей
  const [copiedId, setCopiedId] = useState<string | null>(null); // показываем «Скопировано» у конкретной карточки

  function startFromIdea(idea: { emoji: string; accent: string; title: string; desc: string }) {
    setGuide(false);
    setEdit({ ...blank, emoji: idea.emoji, accent: idea.accent, title: idea.title, description: idea.desc });
  }

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
  async function share(p: Path) {
    const url = `https://${host}/path/${p.id}`;
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    // на телефоне — системное меню «Поделиться»; на десктопе — копируем ссылку в буфер
    if (nav?.share) { nav.share({ title: p.title, text: p.description || p.title, url }).catch(() => {}); return; }
    try { await nav?.clipboard?.writeText(url); setCopiedId(p.id); setTimeout(() => setCopiedId(null), 1800); } catch {}
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setEdit({ ...blank })} style={{ ...btn(true), display: "inline-flex", alignItems: "center", gap: 7 }}>
            <i className="ti ti-plus" style={{ fontSize: 16 }} />{L.newPath}
          </button>
          <button onClick={() => setGuide((g) => !g)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 5, padding: 0 }}>
            <i className="ti ti-help-circle" style={{ fontSize: 15 }} />{guide ? L.guideHide : L.guideShow}
          </button>
        </div>
      )}

      {/* гайд: как пользоваться + вдохновляющие примеры */}
      {!edit && guide && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{L.guideTitle}</div>
          <ol style={{ margin: "0 0 14px", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {L.steps.map((s: string, i: number) => (
              <li key={i} style={{ display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-2)" }}>
                <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 999, background: "var(--accent-bg)", color: "var(--accent-text)", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 9 }}>{L.ideasLabel}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8 }}>
            {L.ideas.map((idea: any) => (
              <button key={idea.title} onClick={() => startFromIdea(idea)} style={{ textAlign: "left", display: "flex", gap: 9, alignItems: "flex-start", padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer" }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: `linear-gradient(135deg, ${(ACCENTS[idea.accent] || ACCENTS.indigo)[0]}, ${(ACCENTS[idea.accent] || ACCENTS.indigo)[1]})` }}>{idea.emoji}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{idea.title}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.4, marginTop: 1 }}>{idea.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* редактор */}
      {edit && (
        <div className="card" style={{ marginBottom: 18 }}>
          {!edit.id && (
            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>{L.ideasLabel}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {L.ideas.map((idea: any) => (
                  <button key={idea.title} onClick={() => setEdit({ ...edit, emoji: idea.emoji, accent: idea.accent, title: idea.title, description: idea.desc })} style={{ ...chip, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span>{idea.emoji}</span>{idea.title}
                  </button>
                ))}
              </div>
            </div>
          )}
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
                  <button onClick={() => share(p)} disabled={busy} style={{ ...chip, color: "var(--accent)", borderColor: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <i className={`ti ${copiedId === p.id ? "ti-check" : "ti-share"}`} style={{ fontSize: 13 }} />{copiedId === p.id ? L.copied : L.share}
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
    </div>
  );
}
