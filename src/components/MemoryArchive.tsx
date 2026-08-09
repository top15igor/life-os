"use client";

import { useState, useRef } from "react";
import { deriveFolder } from "@/lib/memoryFolders";

type Memory = { id: string; category: string; title: string; summary: string; fields: { label: string; value: string }[]; folder?: string | null; mem_date: string | null; image_url: string | null; status: string; note?: string | null; file_url?: string | null; file_name?: string | null; mime_type?: string | null; created_at: string };

const CATS = [
  { key: "moment", icon: "ti-photo-heart", c: "#993556", bg: "#FBEAF0" },
  { key: "document", icon: "ti-file-text", c: "#185FA5", bg: "#E6F1FB" },
  { key: "thing", icon: "ti-package", c: "#854F0B", bg: "#FAEEDA" },
  { key: "person", icon: "ti-users", c: "#534AB7", bg: "#EEEDFE" },
  { key: "place", icon: "ti-map-pin", c: "#0F6E56", bg: "#E1F5EE" },
  { key: "project", icon: "ti-briefcase", c: "#185FA5", bg: "#E6F1FB" },
  { key: "info", icon: "ti-info-circle", c: "#5F5E5A", bg: "#F1EFE8" },
  { key: "other", icon: "ti-photo", c: "#5F5E5A", bg: "#F1EFE8" },
];
const catMeta = (k: string) => CATS.find((x) => x.key === k) || CATS[7];

const STR: Record<string, any> = {
  ru: { tidy: "Разложить по папкам", tidyBusy: "Раскладываю…", tidyDone: "Готово — разложил по папкам", misc: "Разное", all: "Все", add: "Добавить фото или документ", sub: "Сфоткай чек, гарантию или важный момент — я пойму и сохраню смысл. Или просто пришли фото боту.", analyzing: "Разбираю фото…", empty: "Здесь будет твоя визуальная память. Сфоткай первый документ, квитанцию или момент.", review: "проверь", addNote: "Добавить заметку", editNote: "Изменить заметку", notePh: "Что важного в этом моменте? Опиши место, событие, что с этим делать…", save: "Сохранить", cancel: "Отмена", recording: "Запись… нажми, чтобы остановить", recHint: "Можно наговорить голосом", changeCat: "Сменить категорию", catNames: { moment: "Важные моменты", document: "Документы и квитанции", thing: "Вещи", person: "Люди и семья", place: "Места и поездки", project: "Проекты", info: "Полезная информация", other: "Другое" } },
  en: { tidy: "Sort into folders", tidyBusy: "Sorting…", tidyDone: "Done — sorted into folders", misc: "Other", all: "All", add: "Add a photo or document", sub: "Snap a receipt, warranty or a meaningful moment — I'll understand and keep its meaning. Or just send a photo to the bot.", analyzing: "Reading the photo…", empty: "Your visual memory will live here. Snap your first document, receipt or moment.", review: "review", addNote: "Add a note", editNote: "Edit note", notePh: "What matters about this moment? Place, event, what to do with it…", save: "Save", cancel: "Cancel", recording: "Recording… tap to stop", recHint: "You can speak it", changeCat: "Change category", catNames: { moment: "Key moments", document: "Documents & receipts", thing: "Things", person: "People & family", place: "Places & trips", project: "Projects", info: "Useful info", other: "Other" } },
  uk: { tidy: "Розкласти по папках", tidyBusy: "Розкладаю…", tidyDone: "Готово — розклав по папках", misc: "Інше", all: "Усі", add: "Додати фото або документ", sub: "Сфоткай чек, гарантію чи важливий момент — я зрозумію й збережу сенс. Або просто надішли фото боту.", analyzing: "Розпізнаю фото…", empty: "Тут буде твоя візуальна пам'ять. Сфоткай перший документ, квитанцію чи момент.", review: "перевір", addNote: "Додати нотатку", editNote: "Змінити нотатку", notePh: "Що важливого в цьому моменті? Місце, подія, що з цим робити…", save: "Зберегти", cancel: "Скасувати", recording: "Запис… натисни, щоб зупинити", recHint: "Можна наговорити голосом", changeCat: "Змінити категорію", catNames: { moment: "Важливі моменти", document: "Документи та квитанції", thing: "Речі", person: "Люди та сім'я", place: "Місця та поїздки", project: "Проєкти", info: "Корисна інформація", other: "Інше" } },
  fr: { tidy: "Ranger par dossiers", tidyBusy: "Rangement…", tidyDone: "Terminé — rangé par dossiers", misc: "Divers", all: "Tout", add: "Ajouter une photo ou un document", sub: "Photographie un reçu, une garantie ou un moment important — je comprends et garde le sens. Ou envoie la photo au bot.", analyzing: "Je lis la photo…", empty: "Ta mémoire visuelle vivra ici. Photographie ton premier document, reçu ou moment.", review: "à vérifier", addNote: "Ajouter une note", editNote: "Modifier la note", notePh: "Qu'est-ce qui compte dans ce moment ? Lieu, événement, quoi en faire…", save: "Enregistrer", cancel: "Annuler", recording: "Enregistrement… touche pour arrêter", recHint: "Tu peux le dicter", changeCat: "Changer de catégorie", catNames: { moment: "Moments clés", document: "Documents & reçus", thing: "Objets", person: "Personnes & famille", place: "Lieux & voyages", project: "Projets", info: "Infos utiles", other: "Autre" } },
  es: { tidy: "Ordenar en carpetas", tidyBusy: "Ordenando…", tidyDone: "Listo — ordenado en carpetas", misc: "Otros", all: "Todo", add: "Añadir foto o documento", sub: "Fotografía un recibo, una garantía o un momento importante — yo entiendo y guardo el sentido. O simplemente envía la foto al bot.", analyzing: "Leyendo la foto…", empty: "Aquí vivirá tu memoria visual. Fotografía tu primer documento, recibo o momento.", review: "por revisar", addNote: "Añadir nota", editNote: "Editar nota", notePh: "¿Qué es lo importante de este momento? Lugar, evento, qué hacer con ello…", save: "Guardar", cancel: "Cancelar", recording: "Grabando… toca para detener", recHint: "Puedes dictarlo por voz", changeCat: "Cambiar categoría", catNames: { moment: "Momentos clave", document: "Documentos y recibos", thing: "Cosas", person: "Personas y familia", place: "Lugares y viajes", project: "Proyectos", info: "Información útil", other: "Otro" } },
};

function resizeImage(file: File, max = 1568): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > max || height > max) {
        if (width > height) { height = Math.round((height * max) / width); width = max; }
        else { width = Math.round((width * max) / height); height = max; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
      canvas.toBlob((b) => { URL.revokeObjectURL(url); b ? resolve(b) : reject(new Error("blob")); }, "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img")); };
    img.src = url;
  });
}

export default function MemoryArchive({ initial, locale }: { initial: Memory[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [items, setItems] = useState<Memory[]>(initial);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [recBusy, setRecBusy] = useState(false);
  const [catId, setCatId] = useState<string | null>(null);
  // Полка категорий (фильтр) + раскрытая карточка: по умолчанию карточки компактные
  // (фото+заголовок+дата), весь AI-разбор и заметки — по клику.
  const [activeCat, setActiveCat] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [tidying, setTidying] = useState(false);
  const [tidyMsg, setTidyMsg] = useState<string>("");

  // Кнопка «Разложить по папкам»: закрепляет папки в базе для уже загруженных фото
  // (POST за тебя — из адресной строки так нельзя). Папки и так видны сразу за счёт
  // клиент-эвристики; это делает их постоянными.
  async function tidyFolders() {
    setTidying(true); setTidyMsg("");
    try {
      const r = await fetch("/api/admin/memory-folders", { method: "POST" }).then((x) => x.json());
      if (r?.ok) {
        setTidyMsg(s.tidyDone + (r.applied ? ` (${r.applied})` : ""));
        setTimeout(() => window.location.reload(), 900);
      }
    } catch {}
    setTidying(false);
  }
  const fileRef = useRef<HTMLInputElement | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function onFile(f: File) {
    setBusy(true);
    try {
      const blob = await resizeImage(f);
      const fd = new FormData();
      fd.append("image", blob, "photo.jpg");
      const res = await fetch("/api/memory-upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.ok && j.memory) setItems((p) => [j.memory, ...p]);
    } catch {}
    setBusy(false);
  }
  async function del(id: string) {
    setItems((p) => p.filter((x) => x.id !== id));
    try { await fetch("/api/memory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", id }) }); } catch {}
  }
  function openNote(m: Memory) { setEditId(m.id); setDraft(m.note || ""); setRecording(false); }
  async function saveNote(id: string) {
    const note = draft.trim();
    setItems((p) => p.map((x) => (x.id === id ? { ...x, note } : x)));
    setEditId(null);
    try { await fetch("/api/memory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "note", id, note }) }); } catch {}
  }
  async function setCategory(id: string, category: string) {
    setItems((p) => p.map((x) => (x.id === id ? { ...x, category } : x)));
    setCatId(null);
    try { await fetch("/api/memory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "category", id, category }) }); } catch {}
  }

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecBusy(true);
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : blob.type.includes("webm") ? "webm" : "m4a";
        const fd = new FormData();
        fd.append("audio", blob, `voice.${ext}`);
        try {
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          const j = await res.json().catch(() => null);
          if (res.ok && j?.ok && j.text) setDraft((d) => (d ? d + " " : "") + j.text);
        } catch {}
        setRecBusy(false);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { alert("Нет доступа к микрофону"); }
  }
  function stopRec() { setRecording(false); try { mediaRef.current?.stop(); } catch {} }

  const dateStr = (iso: string | null) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : locale, { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; }
  };

  // Папка вещи: сохранённая в БД, иначе — мгновенная эвристика (для фото, загруженных
  // до появления папок). Так стопки видны сразу, ещё до бэкфилла.
  const folderOf = (m: Memory) => (m.folder && m.folder.trim()) || deriveFolder(m.category, m.title, m.fields) || null;

  const used = CATS.filter((c) => items.some((m) => m.category === c.key));

  const Card = (m: Memory) => {
    const cm = catMeta(m.category);
    const open = openId === m.id;
    return (
      <div key={m.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
        {m.image_url ? (
          <a href={m.image_url} target="_blank" rel="noreferrer" style={{ display: "block", height: 150, background: `center/cover no-repeat url(${m.image_url})` }} />
        ) : m.file_url ? (
          <a href={m.file_url} target="_blank" rel="noreferrer" style={{ display: "flex", height: 110, background: cm.bg, alignItems: "center", justifyContent: "center", gap: 9, textDecoration: "none", color: cm.c }}>
            <i className="ti ti-file-type-pdf" style={{ fontSize: 34 }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.file_name || "PDF"}</span>
          </a>
        ) : (
          <div style={{ height: 110, background: cm.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><i className={`ti ${cm.icon}`} style={{ fontSize: 34, color: cm.c }} /></div>
        )}
        <div style={{ padding: "12px 13px 13px" }}>
          {/* Шапка карточки — клик раскрывает/сворачивает детали. */}
          <div onClick={() => { setOpenId(open ? null : m.id); if (open) setCatId(null); }} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1, fontSize: 14.5, fontWeight: 500, lineHeight: 1.3 }}>{m.title}</div>
              <i className="ti ti-chevron-down" style={{ fontSize: 15, color: "var(--text-3)", flexShrink: 0, marginTop: 2, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4, flexWrap: "wrap" }}>
              {m.mem_date && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{dateStr(m.mem_date)}</span>}
              {m.status === "review" && <span style={{ fontSize: 11, color: "#854F0B", background: "#FAEEDA", padding: "2px 7px", borderRadius: 999 }}>{s.review}</span>}
              {m.note && !open && <i className="ti ti-message" style={{ fontSize: 13, color: "var(--accent)" }} />}
            </div>
          </div>

          {open && (
          <>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
            <button onClick={() => setCatId(catId === m.id ? null : m.id)} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, color: cm.c, background: cm.bg, padding: "2px 8px", borderRadius: 999, border: "none", cursor: "pointer" }}><i className={`ti ${cm.icon}`} style={{ fontSize: 12 }} />{s.catNames[m.category]}<i className="ti ti-chevron-down" style={{ fontSize: 11 }} /></button>
          </div>

          {catId === m.id && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "8px 0 3px" }}>
              {CATS.map((c) => (
                <button key={c.key} onClick={() => setCategory(m.id, c.key)} style={{ fontSize: 11.5, padding: "4px 9px", borderRadius: 999, cursor: "pointer", border: "1px solid " + (m.category === c.key ? c.c : "var(--border)"), background: m.category === c.key ? c.bg : "var(--surface)", color: m.category === c.key ? c.c : "var(--text-2)" }}>{s.catNames[c.key]}</button>
              ))}
            </div>
          )}

          {m.summary && <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, marginTop: 8 }}>{m.summary}</div>}

          {m.fields?.length > 0 && (
            <div style={{ marginTop: 9, borderTop: "1px solid var(--border)", paddingTop: 8, display: "grid", gap: 4 }}>
              {m.fields.slice(0, 6).map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                  <span style={{ color: "var(--text-3)", flexShrink: 0 }}>{f.label}</span>
                  <span style={{ marginLeft: "auto", textAlign: "right", color: "var(--text)" }}>{f.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Заметка */}
          {m.note && editId !== m.id && (
            <div style={{ marginTop: 10, background: "var(--surface-2)", borderRadius: 10, padding: "9px 11px", fontSize: 13, lineHeight: 1.5, display: "flex", gap: 8 }}>
              <i className="ti ti-message" style={{ fontSize: 14, color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
              <span style={{ whiteSpace: "pre-wrap" }}>{m.note}</span>
            </div>
          )}

          {editId === m.id ? (
            <div style={{ marginTop: 10 }}>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={s.notePh} rows={3} autoFocus disabled={recBusy} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <button onClick={recording ? stopRec : startRec} disabled={recBusy} title={s.recHint} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 9, border: "1px solid var(--border)", background: recording ? "#fee2e2" : "var(--surface)", color: recording ? "#ef4444" : recBusy ? "var(--text-3)" : "var(--accent)", fontSize: 12.5, cursor: "pointer" }}>
                  <i className={`ti ${recBusy ? "ti-loader-2" : recording ? "ti-player-stop-filled" : "ti-microphone"}`} style={{ fontSize: 15 }} />{recording ? s.recording : recBusy ? s.analyzing : ""}
                </button>
                <div style={{ flex: 1 }} />
                <button onClick={() => setEditId(null)} style={{ background: "none", border: "none", color: "var(--text-2)", fontSize: 13, cursor: "pointer", padding: "8px 10px" }}>{s.cancel}</button>
                <button onClick={() => saveNote(m.id)} disabled={recording || recBusy} style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13.5, fontWeight: 500, cursor: "pointer", opacity: recording || recBusy ? 0.6 : 1 }}>{s.save}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => openNote(m)} style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12.5, padding: 0 }}>
              <i className="ti ti-message-plus" style={{ fontSize: 15 }} />{m.note ? s.editNote : s.addNote}
            </button>
          )}

          <button onClick={() => del(m.id)} aria-label="delete" style={{ marginTop: 10, marginLeft: 14, background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 12, padding: 0 }}><i className="ti ti-trash" style={{ fontSize: 14 }} /></button>
          </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />

      <div style={{ marginBottom: 18 }}>
        <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", justifyContent: "center", padding: "13px", borderRadius: 13, border: "1px dashed var(--border)", background: "var(--surface)", color: busy ? "var(--text-3)" : "var(--accent)", fontSize: 14.5, fontWeight: 500, cursor: busy ? "default" : "pointer" }}>
          {busy ? <><i className="ti ti-loader-2" style={{ fontSize: 17 }} />{s.analyzing}</> : <><i className="ti ti-camera" style={{ fontSize: 18 }} />{s.add}</>}
        </button>
        <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, marginTop: 8, textAlign: "center" }}>{s.sub}</div>
        {items.length > 1 && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={tidyFolders} disabled={tidying} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: tidying ? "var(--text-3)" : "var(--accent)", cursor: tidying ? "default" : "pointer", fontSize: 12.5, padding: 0 }}>
              <i className={`ti ${tidying ? "ti-loader-2" : "ti-folders"}`} style={{ fontSize: 15 }} />{tidying ? s.tidyBusy : tidyMsg || s.tidy}
            </button>
          </div>
        )}
      </div>

      {items.length === 0 && !busy ? (
        <div className="card" style={{ textAlign: "center", padding: "30px 20px" }}>
          <i className="ti ti-photo" style={{ fontSize: 32, color: "var(--accent)", display: "block", marginBottom: 9 }} />
          <div style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.55, maxWidth: 420, margin: "0 auto" }}>{s.empty}</div>
        </div>
      ) : (
        <>
          {/* Полка категорий: счётчики + фильтр. «Все» — общая лента. */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 15 }}>
            <button onClick={() => setActiveCat("all")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: "1px solid " + (activeCat === "all" ? "var(--accent)" : "var(--border)"), background: activeCat === "all" ? "var(--accent)" : "var(--surface)", color: activeCat === "all" ? "#fff" : "var(--text-2)" }}>
              {s.all}<span style={{ opacity: 0.75 }}>{items.length}</span>
            </button>
            {used.map((c) => (
              <button key={c.key} onClick={() => setActiveCat(activeCat === c.key ? "all" : c.key)} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: "1px solid " + (activeCat === c.key ? c.c : "var(--border)"), background: activeCat === c.key ? c.bg : "var(--surface)", color: activeCat === c.key ? c.c : "var(--text-2)" }}>
                <i className={`ti ${c.icon}`} style={{ fontSize: 14 }} />{s.catNames[c.key]}<span style={{ opacity: 0.75 }}>{items.filter((m) => m.category === c.key).length}</span>
              </button>
            ))}
          </div>
          {activeCat === "all" ? (
            /* «Все» — полочки: категория = полка с заголовком и горизонтальной лентой карточек. */
            used.map((c) => {
              const inCat = items.filter((m) => m.category === c.key);
              return (
                <div key={c.key} style={{ marginBottom: 24 }}>
                  <button onClick={() => setActiveCat(c.key)} style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 2px 10px", background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text)" }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><i className={`ti ${c.icon}`} style={{ fontSize: 16, color: c.c }} /></span>
                    <span style={{ fontSize: 15.5, fontWeight: 600 }}>{s.catNames[c.key]}</span>
                    <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>{inCat.length}</span>
                    <i className="ti ti-chevron-right" style={{ fontSize: 15, color: "var(--text-3)" }} />
                  </button>
                  <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "thin" }}>
                    {inCat.map((m) => (
                      <div key={m.id} style={{ width: 232, flexShrink: 0 }}>{Card(m)}</div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            (() => {
              const inCat = items.filter((m) => m.category === activeCat);
              // Стопки-папки: собираем по folderOf, порядок — по первому появлению.
              const order: string[] = [];
              const groups = new Map<string, Memory[]>();
              for (const m of inCat) {
                const key = folderOf(m) || "__none__";
                if (!groups.has(key)) { groups.set(key, []); order.push(key); }
                groups.get(key)!.push(m);
              }
              // Папки с одним элементом не заводим — они уходят в «Разное».
              const foldered = order.filter((k) => k !== "__none__" && groups.get(k)!.length >= 2);
              const looseKeys = order.filter((k) => !foldered.includes(k));
              const loose = looseKeys.flatMap((k) => groups.get(k)!);
              const cm = catMeta(activeCat);
              const Grid = (arr: Memory[]) => (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>{arr.map(Card)}</div>
              );
              return (
                <div style={{ display: "grid", gap: 20 }}>
                  {foldered.map((k) => (
                    <div key={k}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 2px 10px" }}>
                        <span style={{ width: 24, height: 24, borderRadius: 7, background: cm.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-folder" style={{ fontSize: 14, color: cm.c }} /></span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{k}</span>
                        <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{groups.get(k)!.length}</span>
                      </div>
                      {Grid(groups.get(k)!)}
                    </div>
                  ))}
                  {loose.length > 0 && (
                    <div>
                      {foldered.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 2px 10px" }}>
                          <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-dots" style={{ fontSize: 14, color: "var(--text-3)" }} /></span>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{s.misc}</span>
                          <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{loose.length}</span>
                        </div>
                      )}
                      {Grid(loose)}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </>
      )}
    </div>
  );
}
