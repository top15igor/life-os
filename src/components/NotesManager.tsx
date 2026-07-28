"use client";

import { useEffect, useMemo, useState } from "react";

// Экран «Заметки»: справочные факты (коды, размеры, адреса, списки) — отдельно
// от дневника. Добавление, поиск, закрепление, правка, удаление. Тот же список
// пополняет бот («запиши код от домофона 4582») и находит по «какой код от…?».

type Note = { id: string; text: string; pinned: boolean; created_at: string };

const STR: Record<string, any> = {
  ru: { ph: "Новая заметка: код, размер, адрес, список…", add: "Сохранить", search: "Поиск по заметкам…", empty: "Пока пусто. Скажи боту «запиши код от домофона 4582» или добавь здесь — заметка останется под рукой навсегда.", noTable: "Раздел ещё не включён: попроси владельца применить notes.sql.", nothing: "Ничего не нашлось.", del: "Удалить", pin: "Закрепить", unpin: "Открепить", edit: "Изменить", save: "Сохранить", cancel: "Отмена", hint: "Заметки — это справка, которую надо потом найти. Бот тоже умеет: «запиши…», «какой код от…?»", io: "Перенос заметок", ioHint: "Забрать заметки с собой или перенести сюда из Заметок айфона, Google Keep, откуда угодно.", dl: "Скачать файлом", imp: "Импортировать", impPh: "Вставь сюда заметки — каждая с новой строки или через пустую строку", impFile: "Выбрать файл (.txt, .md, .csv)", impLines: "Каждая строка — отдельная заметка", impBlocks: "Заметки разделены пустой строкой", impDo: "Добавить заметки", impDone: (n: number) => `Добавлено заметок: ${n}`, impEmpty: "Не нашёл, что добавить.", iphone: "С айфона: в Заметках выдели текст → «Поделиться» → отправь боту LIFE OS. Или скопируй и вставь сюда." },
  en: { ph: "New note: a code, size, address, list…", add: "Save", search: "Search notes…", empty: "Nothing yet. Tell the bot “save a note: locker code 4582” or add one here — it stays at hand forever.", noTable: "Not enabled yet: ask the owner to apply notes.sql.", nothing: "Nothing found.", del: "Delete", pin: "Pin", unpin: "Unpin", edit: "Edit", save: "Save", cancel: "Cancel", hint: "Notes are reference facts you'll need to find later. The bot understands too: “save a note…”, “what's the code for…?”", io: "Move notes", ioHint: "Take your notes with you, or bring them here from iPhone Notes, Google Keep, anywhere.", dl: "Download as file", imp: "Import", impPh: "Paste notes here — one per line, or separated by a blank line", impFile: "Choose a file (.txt, .md, .csv)", impLines: "Each line is a separate note", impBlocks: "Notes separated by a blank line", impDo: "Add notes", impDone: (n: number) => `Notes added: ${n}`, impEmpty: "Nothing to add here.", iphone: "From iPhone: in Notes select the text → “Share” → send it to the LIFE OS bot. Or copy and paste it here." },
  uk: { ph: "Нова нотатка: код, розмір, адреса, список…", add: "Зберегти", search: "Пошук нотатками…", empty: "Поки порожньо. Скажи боту «запиши код від домофона 4582» або додай тут — нотатка залишиться під рукою назавжди.", noTable: "Розділ ще не ввімкнено: попроси власника застосувати notes.sql.", nothing: "Нічого не знайшлося.", del: "Видалити", pin: "Закріпити", unpin: "Відкріпити", edit: "Змінити", save: "Зберегти", cancel: "Скасувати", hint: "Нотатки — це довідка, яку треба потім знайти. Бот теж уміє: «запиши…», «який код від…?»", io: "Перенесення нотаток", ioHint: "Забрати нотатки з собою або перенести сюди із Нотаток айфона, Google Keep, звідки завгодно.", dl: "Завантажити файлом", imp: "Імпортувати", impPh: "Встав сюди нотатки — кожну з нового рядка або через порожній рядок", impFile: "Обрати файл (.txt, .md, .csv)", impLines: "Кожен рядок — окрема нотатка", impBlocks: "Нотатки розділені порожнім рядком", impDo: "Додати нотатки", impDone: (n: number) => `Додано нотаток: ${n}`, impEmpty: "Не знайшов, що додати.", iphone: "З айфона: у Нотатках виділи текст → «Поділитися» → надішли боту LIFE OS. Або скопіюй і встав сюди." },
  fr: { ph: "Nouvelle note : code, taille, adresse, liste…", add: "Enregistrer", search: "Rechercher…", empty: "Rien pour l'instant. Dis au bot « note : code du portail 4582 » ou ajoute ici — la note reste à portée pour toujours.", noTable: "Pas encore activé : demande au propriétaire d'appliquer notes.sql.", nothing: "Rien trouvé.", del: "Supprimer", pin: "Épingler", unpin: "Désépingler", edit: "Modifier", save: "Enregistrer", cancel: "Annuler", hint: "Les notes sont des infos de référence à retrouver plus tard. Le bot comprend aussi : « note… », « quel est le code de… ? »", io: "Transférer les notes", ioHint: "Emporte tes notes, ou importe-les depuis Notes de l\u2019iPhone, Google Keep, n\u2019importe où.", dl: "Télécharger en fichier", imp: "Importer", impPh: "Colle tes notes ici — une par ligne, ou séparées par une ligne vide", impFile: "Choisir un fichier (.txt, .md, .csv)", impLines: "Chaque ligne est une note", impBlocks: "Notes séparées par une ligne vide", impDo: "Ajouter les notes", impDone: (n: number) => `Notes ajoutées : ${n}`, impEmpty: "Rien à ajouter ici.", iphone: "Depuis l\u2019iPhone : dans Notes, sélectionne le texte → « Partager » → envoie-le au bot LIFE OS. Ou copie-colle ici." },
  es: { ph: "Nueva nota: un código, talla, dirección, lista…", add: "Guardar", search: "Buscar notas…", empty: "Nada todavía. Dile al bot «apunta: código del portal 4582» o añade aquí — la nota queda a mano para siempre.", noTable: "Aún no activado: pide al dueño aplicar notes.sql.", nothing: "No se encontró nada.", del: "Eliminar", pin: "Fijar", unpin: "Soltar", edit: "Editar", save: "Guardar", cancel: "Cancelar", hint: "Las notas son datos de referencia para encontrar luego. El bot también entiende: «apunta…», «¿cuál es el código de…?»", io: "Mover notas", ioHint: "Llévate tus notas, o tráelas aquí desde Notas del iPhone, Google Keep, de donde sea.", dl: "Descargar como archivo", imp: "Importar", impPh: "Pega aquí tus notas — una por línea, o separadas por una línea vacía", impFile: "Elegir un archivo (.txt, .md, .csv)", impLines: "Cada línea es una nota", impBlocks: "Notas separadas por una línea vacía", impDo: "Añadir notas", impDone: (n: number) => `Notas añadidas: ${n}`, impEmpty: "No hay nada que añadir.", iphone: "Desde el iPhone: en Notas selecciona el texto → «Compartir» → envíalo al bot LIFE OS. O cópialo y pégalo aquí." },
};

export default function NotesManager({ locale }: { locale: string }) {
  const s = STR[locale] || STR.ru;
  const [notes, setNotes] = useState<Note[]>([]);
  const [noTable, setNoTable] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  // Перенос заметок: выгрузка файлом и импорт (вставка текста или файл).
  const [ioOpen, setIoOpen] = useState(false);
  const [impText, setImpText] = useState("");
  const [impMode, setImpMode] = useState<"blocks" | "lines">("lines");
  const [impMsg, setImpMsg] = useState("");

  useEffect(() => {
    fetch("/api/note").then((r) => r.json()).then((d) => {
      if (d?.error === "no_table") setNoTable(true);
      setNotes(d?.notes || []);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const norm = (x: string) => x.toLowerCase().replace(/ё/g, "е");
  const shown = useMemo(() => {
    const query = norm(q.trim());
    if (!query) return notes;
    return notes.filter((n) => norm(n.text).includes(query));
  }, [notes, q]);

  async function post(payload: any) {
    return fetch("/api/note", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()).catch(() => null);
  }
  async function add() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    const d = await post({ action: "add", text: t });
    setBusy(false);
    if (d?.ok && d.note) { setNotes((prev) => [d.note, ...prev].sort(byOrder)); setText(""); }
    else if (d?.error === "no_table") setNoTable(true);
  }
  const byOrder = (a: Note, b: Note) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at);
  async function togglePin(n: Note) {
    setNotes((prev) => prev.map((x) => (x.id === n.id ? { ...x, pinned: !n.pinned } : x)).sort(byOrder));
    await post({ action: "pin", id: n.id, pinned: !n.pinned });
  }
  async function del(n: Note) {
    if (!confirm(`${s.del}? «${n.text.slice(0, 60)}»`)) return;
    setNotes((prev) => prev.filter((x) => x.id !== n.id));
    await post({ action: "del", id: n.id });
  }
  async function saveEdit() {
    const t = editText.trim();
    if (!t || !editId) return;
    setNotes((prev) => prev.map((x) => (x.id === editId ? { ...x, text: t } : x)));
    const id = editId;
    setEditId(null);
    await post({ action: "edit", id, text: t });
  }
  const dd = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(2, 4)}`;

  async function runImport(raw?: string) {
    const payload = (raw ?? impText).trim();
    if (!payload || busy) return;
    setBusy(true);
    setImpMsg("");
    const d = await post({ action: "import", text: payload, mode: impMode });
    setBusy(false);
    if (d?.ok) {
      setNotes((prev) => [...(d.notes || []), ...prev].sort(byOrder));
      setImpText("");
      setImpMsg(s.impDone(d.added));
    } else if (d?.error === "no_table") setNoTable(true);
    else setImpMsg(s.impEmpty);
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    // В файле заметки чаще разделены пустой строкой (наш экспорт, выгрузки из других приложений).
    reader.onload = () => { setImpMode("blocks"); runImport(String(reader.result || "")); };
    reader.readAsText(f);
    e.target.value = "";
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 12 }}>{s.hint}</div>

      <div className="card" style={{ marginBottom: 12 }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={s.ph} rows={2}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add(); }}
          style={{ width: "100%", boxSizing: "border-box", resize: "vertical", fontSize: 14, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", marginBottom: 8, fontFamily: "inherit" }} />
        <button onClick={add} disabled={busy || !text.trim()} style={{ fontSize: 13.5, fontWeight: 500, padding: "9px 18px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", opacity: busy || !text.trim() ? 0.5 : 1 }}>
          <i className="ti ti-plus" style={{ fontSize: 14, verticalAlign: "-2px", marginRight: 5 }} />{s.add}
        </button>
      </div>

      {/* Перенос: забрать заметки файлом или принести их из другого приложения */}
      <div className="card" style={{ marginBottom: 12 }}>
        <button onClick={() => setIoOpen(!ioOpen)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text)", fontSize: 13.5, fontWeight: 600 }}>
          <i className="ti ti-arrows-exchange" style={{ fontSize: 17, color: "var(--accent)" }} />
          <span style={{ flex: 1, textAlign: "left" }}>{s.io}</span>
          <i className={`ti ti-chevron-${ioOpen ? "up" : "down"}`} style={{ fontSize: 15, color: "var(--text-3)" }} />
        </button>
        {ioOpen && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 10 }}>{s.ioHint}</div>
            <a href="/api/note?export=md" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--accent)", background: "var(--accent-bg)", color: "var(--accent-text)", fontSize: 13, fontWeight: 500, textDecoration: "none", marginBottom: 12 }}>
              <i className="ti ti-download" style={{ fontSize: 15 }} />{s.dl}
            </a>
            <textarea value={impText} onChange={(e) => { setImpText(e.target.value); setImpMsg(""); }} placeholder={s.impPh} rows={3}
              style={{ width: "100%", boxSizing: "border-box", resize: "vertical", fontSize: 13.5, padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", marginBottom: 8, fontFamily: "inherit" }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
              {(["lines", "blocks"] as const).map((m) => (
                <label key={m} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-2)", cursor: "pointer" }}>
                  <input type="radio" checked={impMode === m} onChange={() => setImpMode(m)} />
                  {m === "lines" ? s.impLines : s.impBlocks}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <button onClick={() => runImport()} disabled={busy || !impText.trim()} style={{ fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", opacity: busy || !impText.trim() ? 0.5 : 1 }}>
                <i className="ti ti-file-import" style={{ fontSize: 14, verticalAlign: "-2px", marginRight: 5 }} />{s.impDo}
              </button>
              <label style={{ fontSize: 13, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer" }}>
                <i className="ti ti-paperclip" style={{ fontSize: 14, verticalAlign: "-2px", marginRight: 5 }} />{s.impFile}
                <input type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" onChange={onFile} style={{ display: "none" }} />
              </label>
              {impMsg && <span style={{ fontSize: 12.5, color: "var(--positive, var(--accent))" }}>{impMsg}</span>}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, marginTop: 10 }}>{s.iphone}</div>
          </div>
        )}
      </div>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <i className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--text-3)" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={s.search}
          style={{ width: "100%", boxSizing: "border-box", fontSize: 14, padding: "10px 12px 10px 36px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} />
      </div>

      {noTable && <div className="card" style={{ fontSize: 13, color: "var(--text-2)" }}>{s.noTable}</div>}
      {!noTable && loaded && !notes.length && <div className="card" style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55 }}>{s.empty}</div>}
      {!noTable && loaded && notes.length > 0 && !shown.length && <div style={{ fontSize: 13.5, color: "var(--text-3)" }}>{s.nothing}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {shown.map((n) => (
          <div key={n.id} className="card" style={{ padding: "12px 14px", borderLeft: n.pinned ? "3px solid var(--accent)" : undefined }}>
            {editId === n.id ? (
              <div>
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3}
                  style={{ width: "100%", boxSizing: "border-box", resize: "vertical", fontSize: 14, padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", marginBottom: 8, fontFamily: "inherit" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveEdit} style={{ fontSize: 12.5, fontWeight: 500, padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>{s.save}</button>
                  <button onClick={() => setEditId(null)} style={{ fontSize: 12.5, padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer" }}>{s.cancel}</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{n.text}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)", flex: 1 }}>{dd(n.created_at)}</span>
                  <button onClick={() => togglePin(n)} title={n.pinned ? s.unpin : s.pin} style={{ background: "none", border: "none", cursor: "pointer", color: n.pinned ? "var(--accent)" : "var(--text-3)", padding: 4 }}>
                    <i className={`ti ${n.pinned ? "ti-pin-filled" : "ti-pin"}`} style={{ fontSize: 16 }} />
                  </button>
                  <button onClick={() => { setEditId(n.id); setEditText(n.text); }} title={s.edit} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4 }}>
                    <i className="ti ti-pencil" style={{ fontSize: 16 }} />
                  </button>
                  <button onClick={() => del(n)} title={s.del} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4 }}>
                    <i className="ti ti-trash" style={{ fontSize: 16 }} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
