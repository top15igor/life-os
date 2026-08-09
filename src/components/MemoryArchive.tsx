"use client";

import { useState, useRef } from "react";
import { deriveFolder } from "@/lib/memoryFolders";
import { documentExpiry, daysLeft } from "@/lib/docExpiry";

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
  ru: { expTitle: "Скоро истекают сроки", expLeft: "через {n} дн.", expToday: "сегодня", expOver: "истёк {n} дн. назад", send: "Отправить", sendDownload: "Скачать файл", sendLink: "Ссылка", sendTg: "В Telegram", copied: "Ссылка скопирована", tgSent: "Отправил в Telegram", tgNo: "Сначала подключи Telegram-бота", failMsg: "Не получилось, попробуй ещё раз", rootFolder: "Все папки", newSub: "Новая подпапка здесь…", manage: "Выбрать", manageDone: "Готово", selected: "выбрано", moveTo: "В папку", newFolder: "Новая папка…", delSel: "Удалить", delAsk: "Удалить выбранные безвозвратно?", rename: "Переименовать", renameAsk: "Новое имя папки:", delFolder: "Убрать папку", delFolderAsk: "Убрать эту папку? Файлы останутся, просто выйдут из папки.", cancel2: "Отмена", tidy: "Разложить по папкам", tidyBusy: "Раскладываю…", tidyDone: "Готово — разложил по папкам", misc: "Разное", all: "Все", add: "Добавить фото или документ", sub: "Сфоткай чек, гарантию или важный момент — я пойму и сохраню смысл. Или просто пришли фото боту.", analyzing: "Разбираю фото…", empty: "Здесь будет твоя визуальная память. Сфоткай первый документ, квитанцию или момент.", review: "проверь", addNote: "Добавить заметку", editNote: "Изменить заметку", notePh: "Что важного в этом моменте? Опиши место, событие, что с этим делать…", save: "Сохранить", cancel: "Отмена", recording: "Запись… нажми, чтобы остановить", recHint: "Можно наговорить голосом", changeCat: "Сменить категорию", catNames: { moment: "Важные моменты", document: "Документы и квитанции", thing: "Вещи", person: "Люди и семья", place: "Места и поездки", project: "Проекты", info: "Полезная информация", other: "Другое" } },
  en: { expTitle: "Expiring soon", expLeft: "in {n} d.", expToday: "today", expOver: "expired {n} d. ago", send: "Send", sendDownload: "Download", sendLink: "Link", sendTg: "To Telegram", copied: "Link copied", tgSent: "Sent to Telegram", tgNo: "Connect the Telegram bot first", failMsg: "Didn't work, try again", rootFolder: "All folders", newSub: "New subfolder here…", manage: "Select", manageDone: "Done", selected: "selected", moveTo: "To folder", newFolder: "New folder…", delSel: "Delete", delAsk: "Delete selected permanently?", rename: "Rename", renameAsk: "New folder name:", delFolder: "Remove folder", delFolderAsk: "Remove this folder? Files stay, just leave the folder.", cancel2: "Cancel", tidy: "Sort into folders", tidyBusy: "Sorting…", tidyDone: "Done — sorted into folders", misc: "Other", all: "All", add: "Add a photo or document", sub: "Snap a receipt, warranty or a meaningful moment — I'll understand and keep its meaning. Or just send a photo to the bot.", analyzing: "Reading the photo…", empty: "Your visual memory will live here. Snap your first document, receipt or moment.", review: "review", addNote: "Add a note", editNote: "Edit note", notePh: "What matters about this moment? Place, event, what to do with it…", save: "Save", cancel: "Cancel", recording: "Recording… tap to stop", recHint: "You can speak it", changeCat: "Change category", catNames: { moment: "Key moments", document: "Documents & receipts", thing: "Things", person: "People & family", place: "Places & trips", project: "Projects", info: "Useful info", other: "Other" } },
  uk: { expTitle: "Скоро спливають терміни", expLeft: "через {n} дн.", expToday: "сьогодні", expOver: "сплив {n} дн. тому", send: "Надіслати", sendDownload: "Завантажити", sendLink: "Посилання", sendTg: "У Telegram", copied: "Посилання скопійовано", tgSent: "Надіслав у Telegram", tgNo: "Спершу підключи Telegram-бота", failMsg: "Не вийшло, спробуй ще раз", rootFolder: "Усі папки", newSub: "Нова підпапка тут…", manage: "Вибрати", manageDone: "Готово", selected: "вибрано", moveTo: "У папку", newFolder: "Нова папка…", delSel: "Видалити", delAsk: "Видалити вибрані безповоротно?", rename: "Перейменувати", renameAsk: "Нове ім'я папки:", delFolder: "Прибрати папку", delFolderAsk: "Прибрати цю папку? Файли залишаться, просто вийдуть із папки.", cancel2: "Скасувати", tidy: "Розкласти по папках", tidyBusy: "Розкладаю…", tidyDone: "Готово — розклав по папках", misc: "Інше", all: "Усі", add: "Додати фото або документ", sub: "Сфоткай чек, гарантію чи важливий момент — я зрозумію й збережу сенс. Або просто надішли фото боту.", analyzing: "Розпізнаю фото…", empty: "Тут буде твоя візуальна пам'ять. Сфоткай перший документ, квитанцію чи момент.", review: "перевір", addNote: "Додати нотатку", editNote: "Змінити нотатку", notePh: "Що важливого в цьому моменті? Місце, подія, що з цим робити…", save: "Зберегти", cancel: "Скасувати", recording: "Запис… натисни, щоб зупинити", recHint: "Можна наговорити голосом", changeCat: "Змінити категорію", catNames: { moment: "Важливі моменти", document: "Документи та квитанції", thing: "Речі", person: "Люди та сім'я", place: "Місця та поїздки", project: "Проєкти", info: "Корисна інформація", other: "Інше" } },
  fr: { expTitle: "Expire bientot", expLeft: "dans {n} j.", expToday: "aujourd'hui", expOver: "expire il y a {n} j.", send: "Envoyer", sendDownload: "Télécharger", sendLink: "Lien", sendTg: "Vers Telegram", copied: "Lien copié", tgSent: "Envoyé sur Telegram", tgNo: "Connecte d'abord le bot Telegram", failMsg: "Échec, réessaie", rootFolder: "Tous les dossiers", newSub: "Nouveau sous-dossier ici…", manage: "Sélectionner", manageDone: "Terminé", selected: "sélectionné(s)", moveTo: "Vers dossier", newFolder: "Nouveau dossier…", delSel: "Supprimer", delAsk: "Supprimer définitivement la sélection ?", rename: "Renommer", renameAsk: "Nouveau nom du dossier :", delFolder: "Retirer le dossier", delFolderAsk: "Retirer ce dossier ? Les fichiers restent, ils quittent juste le dossier.", cancel2: "Annuler", tidy: "Ranger par dossiers", tidyBusy: "Rangement…", tidyDone: "Terminé — rangé par dossiers", misc: "Divers", all: "Tout", add: "Ajouter une photo ou un document", sub: "Photographie un reçu, une garantie ou un moment important — je comprends et garde le sens. Ou envoie la photo au bot.", analyzing: "Je lis la photo…", empty: "Ta mémoire visuelle vivra ici. Photographie ton premier document, reçu ou moment.", review: "à vérifier", addNote: "Ajouter une note", editNote: "Modifier la note", notePh: "Qu'est-ce qui compte dans ce moment ? Lieu, événement, quoi en faire…", save: "Enregistrer", cancel: "Annuler", recording: "Enregistrement… touche pour arrêter", recHint: "Tu peux le dicter", changeCat: "Changer de catégorie", catNames: { moment: "Moments clés", document: "Documents & reçus", thing: "Objets", person: "Personnes & famille", place: "Lieux & voyages", project: "Projets", info: "Infos utiles", other: "Autre" } },
  es: { expTitle: "Vencen pronto", expLeft: "en {n} d.", expToday: "hoy", expOver: "vencio hace {n} d.", send: "Enviar", sendDownload: "Descargar", sendLink: "Enlace", sendTg: "A Telegram", copied: "Enlace copiado", tgSent: "Enviado a Telegram", tgNo: "Primero conecta el bot de Telegram", failMsg: "No funcionó, intenta de nuevo", rootFolder: "Todas las carpetas", newSub: "Nueva subcarpeta aquí…", manage: "Seleccionar", manageDone: "Listo", selected: "seleccionado(s)", moveTo: "A carpeta", newFolder: "Nueva carpeta…", delSel: "Eliminar", delAsk: "¿Eliminar la selección permanentemente?", rename: "Renombrar", renameAsk: "Nuevo nombre de carpeta:", delFolder: "Quitar carpeta", delFolderAsk: "¿Quitar esta carpeta? Los archivos quedan, solo salen de la carpeta.", cancel2: "Cancelar", tidy: "Ordenar en carpetas", tidyBusy: "Ordenando…", tidyDone: "Listo — ordenado en carpetas", misc: "Otros", all: "Todo", add: "Añadir foto o documento", sub: "Fotografía un recibo, una garantía o un momento importante — yo entiendo y guardo el sentido. O simplemente envía la foto al bot.", analyzing: "Leyendo la foto…", empty: "Aquí vivirá tu memoria visual. Fotografía tu primer documento, recibo o momento.", review: "por revisar", addNote: "Añadir nota", editNote: "Editar nota", notePh: "¿Qué es lo importante de este momento? Lugar, evento, qué hacer con ello…", save: "Guardar", cancel: "Cancelar", recording: "Grabando… toca para detener", recHint: "Puedes dictarlo por voz", changeCat: "Cambiar categoría", catNames: { moment: "Momentos clave", document: "Documentos y recibos", thing: "Cosas", person: "Personas y familia", place: "Lugares y viajes", project: "Proyectos", info: "Información útil", other: "Otro" } },
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
  const [manage, setManage] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [moveOpen, setMoveOpen] = useState(false);
  const [path, setPath] = useState<string[]>([]); // текущий путь внутри категории (дерево папок)
  const [sendId, setSendId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");
  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  // Скачать оригинал: тянем подписанную ссылку в blob и отдаём файлом (кросс-доменный
  // download-атрибут не сработал бы). Если не вышло — открываем в новой вкладке.
  async function downloadFile(m: Memory) {
    const url = m.file_url || m.image_url;
    if (!url) return;
    const name = m.file_name || `${(m.title || "file").replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 60)}${m.file_url ? "" : ".jpg"}`;
    try {
      const blob = await fetch(url).then((r) => r.blob());
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    } catch { window.open(url, "_blank"); }
    setSendId(null);
  }
  async function shareLink(m: Memory) {
    setSendId(null);
    try {
      const r = await fetch("/api/memory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "share", id: m.id }) }).then((x) => x.json());
      if (!r?.url) return flash(s.failMsg);
      const nav: any = navigator;
      if (nav.share) { try { await nav.share({ title: m.title || "LIFE OS", url: r.url }); return; } catch {} }
      await navigator.clipboard.writeText(r.url); flash(s.copied);
    } catch { flash(s.failMsg); }
  }
  async function sendToTelegram(m: Memory) {
    setSendId(null);
    try {
      const r = await fetch("/api/memory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "telegram", id: m.id }) }).then((x) => x.json());
      flash(r?.ok ? s.tgSent : (r?.error === "no_telegram" ? s.tgNo : s.failMsg));
    } catch { flash(s.failMsg); }
  }
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

  function toggleSel(id: string) {
    setSel((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function exitManage() { setManage(false); setSel(new Set()); setMoveOpen(false); }

  // Имя новой папки с учётом текущего пути: внутри открытой папки создаёт подпапку.
  function newFolderPath(name: string): string {
    const clean = name.replace(/\//g, " ").trim();
    return activeCat !== "all" && path.length ? [...path, clean].join("/") : clean;
  }
  // Переместить выбранные в папку (folder=null — вынуть из папки).
  async function moveSelected(folder: string | null) {
    const ids = [...sel];
    if (!ids.length) return;
    setItems((p) => p.map((m) => (sel.has(m.id) ? { ...m, folder } : m)));
    setMoveOpen(false); exitManage();
    try { await fetch("/api/memory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "bulkFolder", ids, folder }) }); } catch {}
  }
  async function deleteSelected() {
    const ids = [...sel];
    if (!ids.length || !confirm(s.delAsk)) return;
    setItems((p) => p.filter((m) => !sel.has(m.id)));
    exitManage();
    try { await fetch("/api/memory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "bulkDelete", ids }) }); } catch {}
  }
  // Все вещи под папкой parentPath+seg (включая вложенные). rewrite строит новый путь.
  async function rewriteSubtree(catKey: string, parentPath: string[], seg: string, rewrite: (segs: string[]) => string[]) {
    const idx = parentPath.length;
    const affected = items.filter((m) => {
      if (m.category !== catKey) return false;
      const pp = pathOf(m);
      return pp.length > idx && pp.slice(0, idx).join("/") === parentPath.join("/") && pp[idx] === seg;
    });
    if (!affected.length) return;
    // Группируем по новому пути и шлём пачками.
    const byFolder = new Map<string | null, string[]>();
    for (const m of affected) {
      const next = rewrite(pathOf(m));
      const folder = next.length ? next.join("/") : null;
      if (!byFolder.has(folder)) byFolder.set(folder, []);
      byFolder.get(folder)!.push(m.id);
    }
    for (const [folder, ids] of byFolder) await setFolderForIds(ids, folder);
  }
  // Переименовать подпапку: меняем сегмент на её уровне, вложенное сохраняется.
  async function renameSubfolder(catKey: string, parentPath: string[], seg: string) {
    const to = (prompt(s.renameAsk, seg) || "").replace(/\//g, " ").trim();
    if (!to || to === seg) return;
    await rewriteSubtree(catKey, parentPath, seg, (segs) => segs.map((x, i) => (i === parentPath.length ? to : x)));
  }
  // Убрать подпапку: содержимое поднимается на уровень выше (файлы не удаляются).
  async function removeSubfolder(catKey: string, parentPath: string[], seg: string) {
    if (!confirm(s.delFolderAsk)) return;
    await rewriteSubtree(catKey, parentPath, seg, (segs) => segs.filter((_, i) => i !== parentPath.length));
  }

  // Имена уже существующих папок (для меню «В папку»).
  const allFolders = [...new Set(items.map((m) => folderOf(m)).filter(Boolean) as string[])];

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
  // Путь вещи как массив сегментов: «Документы/Паспорта» → ["Документы","Паспорта"].
  const pathOf = (m: Memory): string[] => (folderOf(m) || "").split("/").map((x) => x.trim()).filter(Boolean);
  const eqPath = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
  // Установить путь как строку папки для набора id (переименование/перемещение по дереву).
  async function setFolderForIds(ids: string[], folder: string | null) {
    if (!ids.length) return;
    setItems((p) => p.map((m) => (ids.includes(m.id) ? { ...m, folder } : m)));
    try { await fetch("/api/memory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "bulkFolder", ids, folder }) }); } catch {}
  }

  const todayISO = (() => { const off = new Date().getTimezoneOffset(); const d = new Date(Date.now() - off * 60000); return d.toISOString().slice(0, 10); })();
  const expiring = items
    .map((m) => { const e = documentExpiry(m.category, m.fields); return e ? { m, date: e.date, days: daysLeft(e.date, todayISO) } : null; })
    .filter((x): x is { m: Memory; date: string; days: number } => !!x && x.days <= 90)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  const used = CATS.filter((c) => items.some((m) => m.category === c.key));

  const Card = (m: Memory) => {
    const cm = catMeta(m.category);
    const open = openId === m.id;
    const checked = sel.has(m.id);
    return (
      <div key={m.id} className="card" onClick={manage ? () => toggleSel(m.id) : undefined} style={{ padding: 0, overflow: "hidden", position: "relative", cursor: manage ? "pointer" : "default", outline: checked ? "2px solid var(--accent)" : "none", outlineOffset: -2 }}>
        {manage && (
          <span style={{ position: "absolute", top: 8, left: 8, zIndex: 2, width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: checked ? "var(--accent)" : "rgba(0,0,0,.5)", color: "#fff", border: "2px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }}>{checked && <i className="ti ti-check" style={{ fontSize: 14 }} />}</span>
        )}
        {manage ? (
          <div style={{ height: m.image_url ? 150 : 110, background: m.image_url ? `center/cover no-repeat url(${m.image_url})` : cm.bg, display: "flex", alignItems: "center", justifyContent: "center", opacity: checked ? 0.85 : 1 }}>{!m.image_url && <i className={`ti ${m.file_url ? "ti-file-type-pdf" : cm.icon}`} style={{ fontSize: 34, color: cm.c }} />}</div>
        ) : m.image_url ? (
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
          {/* Шапка карточки — клик раскрывает/сворачивает детали (в режиме выбора — не раскрывает). */}
          <div onClick={manage ? undefined : () => { setOpenId(open ? null : m.id); if (open) setCatId(null); }} style={{ cursor: manage ? "pointer" : "pointer" }}>
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

          {(m.file_url || m.image_url) && (
            <span style={{ position: "relative", marginLeft: 14 }}>
              <button onClick={() => setSendId(sendId === m.id ? null : m.id)} style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12.5, padding: 0 }}>
                <i className="ti ti-send" style={{ fontSize: 15 }} />{s.send}
              </button>
              {sendId === m.id && (
                <div style={{ position: "absolute", left: 0, top: "calc(100% + 4px)", minWidth: 190, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 11, boxShadow: "0 8px 24px rgba(0,0,0,.14)", padding: 6, zIndex: 6 }}>
                  <button onClick={() => downloadFile(m)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", background: "none", color: "var(--text)", fontSize: 13, cursor: "pointer" }}><i className="ti ti-download" style={{ fontSize: 15, color: "var(--text-3)" }} />{s.sendDownload}</button>
                  <button onClick={() => shareLink(m)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", background: "none", color: "var(--text)", fontSize: 13, cursor: "pointer" }}><i className="ti ti-link" style={{ fontSize: 15, color: "var(--text-3)" }} />{s.sendLink}</button>
                  <button onClick={() => sendToTelegram(m)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", background: "none", color: "var(--text)", fontSize: 13, cursor: "pointer" }}><i className="ti ti-brand-telegram" style={{ fontSize: 15, color: "var(--text-3)" }} />{s.sendTg}</button>
                </div>
              )}
            </span>
          )}

          <button onClick={() => del(m.id)} aria-label="delete" style={{ marginTop: 10, marginLeft: 14, background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 12, padding: 0 }}><i className="ti ti-trash" style={{ fontSize: 14 }} /></button>
          </>
          )}
        </div>
      </div>
    );
  };

  // Разбить набор на стопки-папки: {folderKeys, groups, loose}. Папка заводится,
  // только если в ней 2+ вещи — одиночки остаются обычными карточками.
  function folderize(arr: Memory[]) {
    const order: string[] = [];
    const groups = new Map<string, Memory[]>();
    for (const m of arr) {
      // В общей ленте группируем по ВЕРХНЕМУ сегменту пути (вложенное — внутри).
      const pp = pathOf(m);
      const key = pp.length ? pp[0] : "__none__";
      if (!groups.has(key)) { groups.set(key, []); order.push(key); }
      groups.get(key)!.push(m);
    }
    const folderKeys = order.filter((k) => k !== "__none__" && groups.get(k)!.length >= 2);
    const loose = order.filter((k) => !folderKeys.includes(k)).flatMap((k) => groups.get(k)!);
    return { folderKeys, groups, loose };
  }

  // Плитка-папка: стопка карточек с обложкой первого фото, названием и счётчиком.
  // Клик открывает категорию (там папка раскрыта секцией).
  const FolderTile = (catKey: string, name: string, arr: Memory[]) => {
    const cm = catMeta(catKey);
    const cover = arr.find((m) => m.image_url)?.image_url || null;
    return (
      <div key={`${catKey}:${name}`} style={{ position: "relative", width: 232, flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 0, transform: "translate(7px,7px)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }} />
        <div style={{ position: "absolute", inset: 0, transform: "translate(3.5px,3.5px)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }} />
        <button onClick={() => { setActiveCat(catKey); setPath([name]); }} className="card" style={{ position: "relative", display: "block", width: "100%", padding: 0, overflow: "hidden", cursor: "pointer", textAlign: "left", border: "1px solid var(--border)" }}>
          <div style={{ height: 150, background: cover ? `center/cover no-repeat url(${cover})` : cm.bg, display: "flex", alignItems: cover ? "flex-start" : "center", justifyContent: cover ? "flex-start" : "center", position: "relative" }}>
            {!cover && <i className={`ti ${cm.icon}`} style={{ fontSize: 34, color: cm.c }} />}
            <span style={{ position: "absolute", top: 8, left: 8, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#fff", background: "rgba(0,0,0,.55)", padding: "3px 8px", borderRadius: 999, backdropFilter: "blur(2px)" }}><i className="ti ti-folder" style={{ fontSize: 12 }} />{arr.length}</span>
          </div>
          <div style={{ padding: "10px 12px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 24, height: 24, borderRadius: 7, background: cm.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><i className="ti ti-folder" style={{ fontSize: 14, color: cm.c }} /></span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            </div>
          </div>
        </button>
      </div>
    );
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: 26, transform: "translateX(-50%)", zIndex: 50, background: "var(--text)", color: "var(--surface)", padding: "10px 18px", borderRadius: 999, fontSize: 13.5, fontWeight: 500, boxShadow: "0 6px 20px rgba(0,0,0,.22)" }}>{toast}</div>
      )}
      {expiring.length > 0 && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, background: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <i className="ti ti-clock-exclamation" style={{ fontSize: 18, color: "#d97706" }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>{s.expTitle}</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {expiring.map(({ m, date, days }) => {
              const warn = days < 0 ? "#ef4444" : days <= 14 ? "#d97706" : "var(--text-3)";
              const label = days < 0 ? s.expOver.replace("{n}", String(-days)) : days === 0 ? s.expToday : s.expLeft.replace("{n}", String(days));
              return (
                <button key={m.id} onClick={() => { setActiveCat(m.category); setPath([]); setOpenId(m.id); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", padding: "4px 2px", cursor: "pointer" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: m.image_url ? `center/cover no-repeat url(${m.image_url})` : catMeta(m.category).bg }}>{!m.image_url && <i className={`ti ${catMeta(m.category).icon}`} style={{ fontSize: 15, color: catMeta(m.category).c }} />}</span>
                  <span style={{ fontSize: 13.5, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{m.title}</span>
                  <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{dateStr(date)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: warn, flexShrink: 0 }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", justifyContent: "center", padding: "13px", borderRadius: 13, border: "1px dashed var(--border)", background: "var(--surface)", color: busy ? "var(--text-3)" : "var(--accent)", fontSize: 14.5, fontWeight: 500, cursor: busy ? "default" : "pointer" }}>
          {busy ? <><i className="ti ti-loader-2" style={{ fontSize: 17 }} />{s.analyzing}</> : <><i className="ti ti-camera" style={{ fontSize: 18 }} />{s.add}</>}
        </button>
        <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, marginTop: 8, textAlign: "center" }}>{s.sub}</div>
        {items.length > 1 && (
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            <button onClick={tidyFolders} disabled={tidying} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: tidying ? "var(--text-3)" : "var(--accent)", cursor: tidying ? "default" : "pointer", fontSize: 12.5, padding: 0 }}>
              <i className={`ti ${tidying ? "ti-loader-2" : "ti-folders"}`} style={{ fontSize: 15 }} />{tidying ? s.tidyBusy : tidyMsg || s.tidy}
            </button>
            <button onClick={() => (manage ? exitManage() : setManage(true))} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: manage ? "var(--text-2)" : "var(--accent)", cursor: "pointer", fontSize: 12.5, padding: 0 }}>
              <i className={`ti ${manage ? "ti-circle-check" : "ti-checkbox"}`} style={{ fontSize: 15 }} />{manage ? s.manageDone : s.manage}
            </button>
          </div>
        )}
      </div>

      {/* Панель массовых действий над выбранными карточками. */}
      {manage && sel.size > 0 && (
        <div style={{ position: "sticky", top: 8, zIndex: 5, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, boxShadow: "0 4px 14px rgba(0,0,0,.08)" }}>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{sel.size} {s.selected}</span>
          <div style={{ flex: 1 }} />
          <div style={{ position: "relative" }}>
            <button onClick={() => setMoveOpen((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--accent)", fontSize: 13, cursor: "pointer" }}><i className="ti ti-folder-plus" style={{ fontSize: 15 }} />{s.moveTo}</button>
            {moveOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", minWidth: 200, maxHeight: 280, overflowY: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 11, boxShadow: "0 8px 24px rgba(0,0,0,.14)", padding: 6, zIndex: 6 }}>
                <button onClick={() => { const n = (prompt(activeCat !== "all" && path.length ? s.newSub : s.newFolder) || "").trim(); if (n) moveSelected(newFolderPath(n)); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", background: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer" }}><i className="ti ti-folder-plus" style={{ fontSize: 15 }} />{activeCat !== "all" && path.length ? s.newSub : s.newFolder}</button>
                {allFolders.map((f) => (
                  <button key={f} onClick={() => moveSelected(f)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", background: "none", color: "var(--text)", fontSize: 13, cursor: "pointer" }}><i className="ti ti-folder" style={{ fontSize: 15, color: "var(--text-3)" }} />{f}</button>
                ))}
                <button onClick={() => moveSelected(null)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", background: "none", color: "var(--text-2)", fontSize: 13, cursor: "pointer", borderTop: "1px solid var(--border)", marginTop: 4 }}><i className="ti ti-folder-off" style={{ fontSize: 15 }} />{s.misc}</button>
              </div>
            )}
          </div>
          <button onClick={deleteSelected} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 13, cursor: "pointer" }}><i className="ti ti-trash" style={{ fontSize: 15 }} />{s.delSel}</button>
          <button onClick={exitManage} style={{ background: "none", border: "none", color: "var(--text-2)", fontSize: 13, cursor: "pointer", padding: "7px 8px" }}>{s.cancel2}</button>
        </div>
      )}

      {items.length === 0 && !busy ? (
        <div className="card" style={{ textAlign: "center", padding: "30px 20px" }}>
          <i className="ti ti-photo" style={{ fontSize: 32, color: "var(--accent)", display: "block", marginBottom: 9 }} />
          <div style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.55, maxWidth: 420, margin: "0 auto" }}>{s.empty}</div>
        </div>
      ) : (
        <>
          {/* Полка категорий: счётчики + фильтр. «Все» — общая лента. */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 15 }}>
            <button onClick={() => { setActiveCat("all"); setPath([]); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: "1px solid " + (activeCat === "all" ? "var(--accent)" : "var(--border)"), background: activeCat === "all" ? "var(--accent)" : "var(--surface)", color: activeCat === "all" ? "#fff" : "var(--text-2)" }}>
              {s.all}<span style={{ opacity: 0.75 }}>{items.length}</span>
            </button>
            {used.map((c) => (
              <button key={c.key} onClick={() => { setActiveCat(activeCat === c.key ? "all" : c.key); setPath([]); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: "1px solid " + (activeCat === c.key ? c.c : "var(--border)"), background: activeCat === c.key ? c.bg : "var(--surface)", color: activeCat === c.key ? c.c : "var(--text-2)" }}>
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
                  <button onClick={() => { setActiveCat(c.key); setPath([]); }} style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 2px 10px", background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text)" }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><i className={`ti ${c.icon}`} style={{ fontSize: 16, color: c.c }} /></span>
                    <span style={{ fontSize: 15.5, fontWeight: 600 }}>{s.catNames[c.key]}</span>
                    <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>{inCat.length}</span>
                    <i className="ti ti-chevron-right" style={{ fontSize: 15, color: "var(--text-3)" }} />
                  </button>
                  {(() => {
                    const { folderKeys, groups, loose } = folderize(inCat);
                    return (
                      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "thin" }}>
                        {folderKeys.map((k) => FolderTile(c.key, k, groups.get(k)!))}
                        {loose.map((m) => (
                          <div key={m.id} style={{ width: 232, flexShrink: 0 }}>{Card(m)}</div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              );
            })
          ) : (
            (() => {
              const cm = catMeta(activeCat);
              const inCat = items.filter((m) => m.category === activeCat);
              // На текущем уровне пути: прямые карточки + подпапки (следующий сегмент).
              const under = inCat.filter((m) => { const pp = pathOf(m); return pp.length >= path.length && eqPath(pp.slice(0, path.length), path); });
              const direct = under.filter((m) => pathOf(m).length === path.length);
              const subOrder: string[] = [];
              const subMap = new Map<string, Memory[]>();
              for (const m of under) {
                const pp = pathOf(m);
                if (pp.length > path.length) {
                  const seg = pp[path.length];
                  if (!subMap.has(seg)) { subMap.set(seg, []); subOrder.push(seg); }
                  subMap.get(seg)!.push(m);
                }
              }
              const Grid = (arr: Memory[]) => (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>{arr.map(Card)}</div>
              );
              const fullPath = (seg: string) => [...path, seg].join("/");
              return (
                <div style={{ display: "grid", gap: 18 }}>
                  {/* Хлебные крошки: категория › папка › подпапка. */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 13.5 }}>
                    <button onClick={() => setPath([])} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: path.length ? "var(--accent)" : "var(--text)", fontWeight: 600, padding: 0 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, background: cm.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><i className={`ti ${cm.icon}`} style={{ fontSize: 14, color: cm.c }} /></span>{s.catNames[activeCat]}
                    </button>
                    {path.map((seg, i) => (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <i className="ti ti-chevron-right" style={{ fontSize: 13, color: "var(--text-3)" }} />
                        <button onClick={() => setPath(path.slice(0, i + 1))} style={{ background: "none", border: "none", cursor: "pointer", color: i === path.length - 1 ? "var(--text)" : "var(--accent)", fontWeight: 600, padding: 0 }}>{seg}</button>
                      </span>
                    ))}
                  </div>

                  {/* Подпапки текущего уровня — плитки, клик уводит внутрь. */}
                  {subOrder.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                      {subOrder.map((seg) => {
                        const arr = subMap.get(seg)!;
                        const cover = arr.find((m) => m.image_url)?.image_url || null;
                        return (
                          <div key={seg} className="card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
                            <button onClick={() => setPath([...path, seg])} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                              <div style={{ height: 120, background: cover ? `center/cover no-repeat url(${cover})` : cm.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{!cover && <i className="ti ti-folder" style={{ fontSize: 32, color: cm.c }} />}</div>
                              <div style={{ padding: "10px 12px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 24, height: 24, borderRadius: 7, background: cm.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><i className="ti ti-folder" style={{ fontSize: 14, color: cm.c }} /></span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seg}</span>
                                <span style={{ fontSize: 12.5, color: "var(--text-3)", marginLeft: "auto" }}>{arr.length}</span>
                              </div>
                            </button>
                            <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 2 }}>
                              <button onClick={() => renameSubfolder(activeCat, path, seg)} title={s.rename} style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "rgba(0,0,0,.5)", color: "#fff", cursor: "pointer" }}><i className="ti ti-pencil" style={{ fontSize: 13 }} /></button>
                              <button onClick={() => removeSubfolder(activeCat, path, seg)} title={s.delFolder} style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "rgba(0,0,0,.5)", color: "#fff", cursor: "pointer" }}><i className="ti ti-folder-off" style={{ fontSize: 13 }} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Карточки, лежащие прямо на этом уровне. */}
                  {direct.length > 0 && Grid(direct)}
                  {direct.length === 0 && subOrder.length === 0 && (
                    <div style={{ fontSize: 13.5, color: "var(--text-3)", padding: "8px 2px" }}>{s.misc}: 0</div>
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
