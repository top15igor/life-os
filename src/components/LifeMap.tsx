"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import type { Locale } from "@/lib/i18n";

// Карта жизни: где ты был — по своим же фотографиям и роликам.
//
// Точка на карте — это снимок (или стопка снимков, сделанных рядом). Точки
// соединены по времени: получается видимый маршрут жизни. Нажал на точку —
// увидел кадр и свой комментарий к нему; комментарий пишет только сам хозяин,
// голосом или руками.
//
// Стопки считаются не по координатам, а по расстоянию в пикселях на текущем
// масштабе: на карте мира весь город — одна точка, приблизил — точки
// разъезжаются сами. Поэтому пересчитываем их на каждое движение карты.

export type Point = {
  id: string;
  kind: "memory" | "photo";
  lat: number;
  lng: number;
  url: string | null;
  video: string | null;
  title: string;
  place: string | null;
  date: string | null;
  note: string | null;
};
export type Orphan = { id: string; url: string | null; video: string | null; title: string; date: string | null };

const S: Record<string, any> = {
  ru: {
    all: "Все годы", route: "Маршрут", pointsN: (n: number) => `${n} точек`, photosN: (n: number) => `${n} фото и видео`,
    empty: "Пока на карте пусто", emptyHow: "Точка появляется из координат внутри снимка. Telegram вырезает их при обычной отправке фото, поэтому есть три надёжных пути: прислать фото боту ФАЙЛОМ («Отправить без сжатия»), загрузить его здесь кнопкой «Добавить» — или поставить точку руками, выбрав снимок внизу. Видео координаты сохраняет всегда, даже присланное боту обычным способом.",
    orphans: "Фото и видео без точки", orphansHint: "Выбери — и ткни в карту, где это было.",
    placing: "Ткни в карту — сюда встанет фото", placingMove: "Ткни в карту — точка переедет туда", cancel: "Отмена",
    addNote: "Добавить комментарий", editNote: "Изменить комментарий",
    notePh: "Что здесь было? Расскажи своими словами…", save: "Сохранить",
    recording: "Запись… нажми, чтобы остановить", recHint: "Можно наговорить голосом",
    noMic: "Нет доступа к микрофону", close: "Закрыть", here: "Здесь",
    add: "Добавить фото или видео", adding: "Загружаю…", addFail: "Не получилось загрузить",
    tooBig: "слишком большой файл", badType: "такой формат не принимаю",
    zoomIn: "Приблизить к точке", move: "Переставить точку", unpin: "Убрать с карты", del: "Удалить насовсем",
    gmaps: "Открыть в Google Картах", full: "Во весь экран", exitFull: "Свернуть",
    delAsk: "Удалить это фото насовсем? Оно исчезнет и с карты, и из «Памяти».",
    unpinDone: "Снимок вернулся в список без точки",
    dropHere: "Отпусти — поставлю на карту",
  },
  en: {
    all: "All years", route: "Route", pointsN: (n: number) => `${n} points`, photosN: (n: number) => `${n} photos & videos`,
    empty: "The map is still empty", emptyHow: "A point comes from the coordinates inside the photo. Telegram strips them from compressed photos, so there are three reliable ways: send the photo to the bot AS A FILE (“without compression”), upload it here with “Add” — or place the point by hand, picking a shot below. Video always keeps its coordinates, even sent to the bot the ordinary way.",
    orphans: "Photos & videos without a point", orphansHint: "Pick one — then tap the map where it happened.",
    placing: "Tap the map — the photo goes there", placingMove: "Tap the map — the point moves there", cancel: "Cancel",
    addNote: "Add a comment", editNote: "Edit comment",
    notePh: "What happened here? In your own words…", save: "Save",
    recording: "Recording… tap to stop", recHint: "You can speak it",
    noMic: "No microphone access", close: "Close", here: "Here",
    add: "Add a photo or video", adding: "Uploading…", addFail: "Upload failed",
    tooBig: "file too big", badType: "format I can't take",
    zoomIn: "Zoom to the point", move: "Move the point", unpin: "Take off the map", del: "Delete for good",
    gmaps: "Open in Google Maps", full: "Fullscreen", exitFull: "Exit fullscreen",
    delAsk: "Delete this photo for good? It disappears from the map and from Memory.",
    unpinDone: "The shot is back in the list without a point",
    dropHere: "Drop it — I'll put it on the map",
  },
  uk: {
    all: "Усі роки", route: "Маршрут", pointsN: (n: number) => `${n} точок`, photosN: (n: number) => `${n} фото та відео`,
    empty: "Поки на карті порожньо", emptyHow: "Точка з'являється з координат усередині знімка. Telegram вирізає їх при звичайній відправці фото, тож є три надійні шляхи: надіслати фото боту ФАЙЛОМ («без стиснення»), завантажити його тут кнопкою «Додати» — або поставити точку руками, обравши знімок нижче. Відео координати зберігає завжди.",
    orphans: "Фото та відео без точки", orphansHint: "Обери — і тицьни в карту, де це було.",
    placing: "Тицьни в карту — сюди стане фото", placingMove: "Тицьни в карту — точка переїде туди", cancel: "Скасувати",
    addNote: "Додати коментар", editNote: "Змінити коментар",
    notePh: "Що тут було? Розкажи своїми словами…", save: "Зберегти",
    recording: "Запис… натисни, щоб зупинити", recHint: "Можна наговорити голосом",
    noMic: "Немає доступу до мікрофона", close: "Закрити", here: "Тут",
    add: "Додати фото або відео", adding: "Завантажую…", addFail: "Не вдалося завантажити",
    tooBig: "завеликий файл", badType: "такий формат не приймаю",
    zoomIn: "Наблизити до точки", move: "Переставити точку", unpin: "Прибрати з карти", del: "Видалити назавжди",
    gmaps: "Відкрити в Google Картах", full: "На весь екран", exitFull: "Згорнути",
    delAsk: "Видалити це фото назавжди? Воно зникне і з карти, і з «Пам'яті».",
    unpinDone: "Знімок повернувся до списку без точки",
    dropHere: "Відпусти — поставлю на карту",
  },
  fr: {
    all: "Toutes les années", route: "Itinéraire", pointsN: (n: number) => `${n} points`, photosN: (n: number) => `${n} photos et vidéos`,
    empty: "La carte est encore vide", emptyHow: "Un point vient des coordonnées à l'intérieur de la photo. Telegram les supprime des photos compressées : envoie la photo au bot EN FICHIER (« sans compression »), dépose-la ici avec « Ajouter » — ou place le point à la main en choisissant une photo ci-dessous. La vidéo garde toujours ses coordonnées.",
    orphans: "Photos et vidéos sans point", orphansHint: "Choisis-en une — puis touche la carte à l'endroit.",
    placing: "Touche la carte — la photo ira là", placingMove: "Touche la carte — le point ira là", cancel: "Annuler",
    addNote: "Ajouter un commentaire", editNote: "Modifier le commentaire",
    notePh: "Que s'est-il passé ici ? Avec tes mots…", save: "Enregistrer",
    recording: "Enregistrement… touche pour arrêter", recHint: "Tu peux le dicter",
    noMic: "Pas d'accès au micro", close: "Fermer", here: "Ici",
    add: "Ajouter une photo ou une vidéo", adding: "Envoi…", addFail: "Échec de l'envoi",
    tooBig: "fichier trop lourd", badType: "format non accepté",
    zoomIn: "Zoomer sur le point", move: "Déplacer le point", unpin: "Retirer de la carte", del: "Supprimer définitivement",
    gmaps: "Ouvrir dans Google Maps", full: "Plein écran", exitFull: "Quitter le plein écran",
    delAsk: "Supprimer cette photo définitivement ? Elle disparaît de la carte et de la Mémoire.",
    unpinDone: "La photo est revenue dans la liste sans point",
    dropHere: "Lâche — je la mets sur la carte",
  },
  es: {
    all: "Todos los años", route: "Ruta", pointsN: (n: number) => `${n} puntos`, photosN: (n: number) => `${n} fotos y vídeos`,
    empty: "El mapa aún está vacío", emptyHow: "Un punto nace de las coordenadas dentro de la foto. Telegram las borra en las fotos comprimidas: manda la foto al bot COMO ARCHIVO («sin compresión»), súbela aquí con «Añadir» — o coloca el punto a mano eligiendo una foto abajo. El vídeo siempre conserva sus coordenadas.",
    orphans: "Fotos y vídeos sin punto", orphansHint: "Elige una — y toca el mapa donde ocurrió.",
    placing: "Toca el mapa — ahí irá la foto", placingMove: "Toca el mapa — ahí irá el punto", cancel: "Cancelar",
    addNote: "Añadir comentario", editNote: "Editar comentario",
    notePh: "¿Qué pasó aquí? Con tus palabras…", save: "Guardar",
    recording: "Grabando… toca para parar", recHint: "Puedes dictarlo",
    noMic: "Sin acceso al micrófono", close: "Cerrar", here: "Aquí",
    add: "Añadir foto o vídeo", adding: "Subiendo…", addFail: "No se pudo subir",
    tooBig: "archivo demasiado grande", badType: "formato no admitido",
    zoomIn: "Acercar al punto", move: "Mover el punto", unpin: "Quitar del mapa", del: "Eliminar para siempre",
    gmaps: "Abrir en Google Maps", full: "Pantalla completa", exitFull: "Salir",
    delAsk: "¿Eliminar esta foto para siempre? Desaparece del mapa y de la Memoria.",
    unpinDone: "La foto volvió a la lista sin punto",
    dropHere: "Suéltala — la pongo en el mapa",
  },
};

const CSS = `
.lm-wrap { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid var(--border); background: var(--surface); }
.lm-wrap:fullscreen { border-radius: 0; border: none; }
.lm-map { height: min(68vh, 620px); width: 100%; background: var(--surface-2, #e8eef2); }
.lm-wrap:fullscreen .lm-map { height: 100vh; }
.lm-map.placing { cursor: crosshair; }
.lm-pin { width: 44px; height: 44px; border-radius: 50%; overflow: hidden; border: 2.5px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.32); background: #7c8b96; position: relative; transition: transform .12s ease; }
.lm-pin:hover { transform: scale(1.08); }
.lm-pin img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lm-pin i { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 19px; }
.lm-pin b { position: absolute; right: -3px; bottom: -3px; min-width: 19px; height: 19px; padding: 0 4px; border-radius: 10px; background: var(--accent, #6366f1); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-sizing: content-box; }
.lm-pin s { position: absolute; left: 0; top: 0; width: 18px; height: 18px; border-radius: 0 0 9px 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; }
.lm-pin s::before { content: ""; border-left: 6px solid #fff; border-top: 4px solid transparent; border-bottom: 4px solid transparent; margin-left: 2px; }
.lm-pin.sel { border-color: var(--accent, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,.35), 0 2px 8px rgba(0,0,0,.32); }
.lm-card { position: absolute; left: 12px; bottom: 12px; width: min(340px, calc(100% - 24px)); background: var(--surface, #fff); border: 1px solid var(--border); border-radius: 13px; box-shadow: 0 8px 28px rgba(0,0,0,.18); z-index: 700; overflow: hidden; max-height: calc(100% - 24px); overflow-y: auto; }
.lm-shot { width: 100%; height: 168px; object-fit: cover; display: block; background: var(--surface-2, #eef2f5); cursor: zoom-in; }
video.lm-shot { cursor: default; object-fit: contain; background: #000; }
.lm-strip { display: flex; gap: 5px; padding: 7px 9px 0; overflow-x: auto; }
.lm-strip .lm-th { width: 42px; height: 42px; border-radius: 7px; object-fit: cover; cursor: pointer; border: 2px solid transparent; flex-shrink: 0; background: var(--surface-2, #eef2f5); position: relative; }
.lm-strip .lm-th.on { border-color: var(--accent, #6366f1); }
.lm-chip { padding: 5px 11px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 12.5px; cursor: pointer; white-space: nowrap; }
.lm-chip.on { background: var(--accent, #6366f1); border-color: var(--accent, #6366f1); color: #fff; }
.lm-orph { width: 62px; height: 62px; border-radius: 9px; overflow: hidden; cursor: pointer; border: 2px solid transparent; flex-shrink: 0; position: relative; background: var(--surface-2, #eef2f5); }
.lm-orph img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lm-orph.on { border-color: var(--accent, #6366f1); }
.lm-orph .play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; background: rgba(0,0,0,.28); font-size: 18px; }
.lm-banner { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 700; background: var(--accent, #6366f1); color: #fff; border-radius: 999px; padding: 7px 14px; font-size: 12.5px; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 14px rgba(0,0,0,.2); }
.lm-tools { position: absolute; top: 10px; right: 10px; z-index: 700; display: flex; flex-direction: column; gap: 6px; }
.lm-tool { width: 32px; height: 32px; border-radius: 9px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
.lm-act { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.lm-act.danger:hover { color: #dc2626; border-color: #dc262655; }
.lm-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.86); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 18px; cursor: zoom-out; }
.lm-lightbox img { max-width: 100%; max-height: 100%; border-radius: 10px; }
html[data-theme="dark"] .leaflet-tile { filter: brightness(.72) contrast(1.06) saturate(.85); }
html[data-theme="dark"] .lm-map { background: #1a2026; }
.leaflet-container { font: inherit; }
`;

type Cluster = { lat: number; lng: number; items: Point[] };
type Placing = { id: string; kind: "memory" | "photo"; from: "orphan" | "point" };

const VIDEO_RE = /\.(mp4|mov|m4v|webm)$/i;
const isVideoFile = (f: File) => (f.type || "").startsWith("video/") || VIDEO_RE.test(f.name || "");

// Кадр для обложки ролика снимает сам браузер: сервер видео не смотрит, а на
// карте у точки должен быть кадр, а не серый квадрат.
function posterOf(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (b: Blob | null) => { if (!done) { done = true; try { URL.revokeObjectURL(v.src); } catch {} resolve(b); } };
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    (v as any).playsInline = true;
    v.onloadeddata = () => { try { v.currentTime = Math.min(0.3, (v.duration || 1) / 3); } catch { finish(null); } };
    v.onseeked = () => {
      try {
        const w = 640;
        const h = Math.round(w * ((v.videoHeight || 9) / (v.videoWidth || 16))) || 360;
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(v, 0, 0, w, h);
        c.toBlob((b) => finish(b), "image/jpeg", 0.72);
      } catch { finish(null); }
    };
    v.onerror = () => finish(null);
    setTimeout(() => finish(null), 9000);
    v.src = URL.createObjectURL(file);
  });
}

export default function LifeMap({
  locale, points: initPoints, orphans: initOrphans, orphanTotal,
}: {
  locale: Locale;
  points: Point[];
  orphans: Orphan[];
  orphanTotal: number;
}) {
  const s = S[locale] || S.ru;
  const router = useRouter();
  const [points, setPoints] = useState<Point[]>(initPoints);
  const [orphans, setOrphans] = useState<Orphan[]>(initOrphans);
  const [year, setYear] = useState<string>("all");
  const [route, setRoute] = useState(true);
  const [sel, setSel] = useState<Point[] | null>(null);
  const [shot, setShot] = useState(0);
  const [placing, setPlacing] = useState<Placing | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [recBusy, setRecBusy] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [full, setFull] = useState(false);

  const elRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const lineRef = useRef<any>(null);
  const fittedRef = useRef(false);
  const roRef = useRef<any>(null);
  const wheelOffRef = useRef<null | (() => void)>(null);
  const drawTimerRef = useRef<any>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  // Обработчики карты живут дольше рендера, поэтому свежие данные и режимы
  // читаем через ref — иначе клик по карте увидит состояние на момент создания.
  const stateRef = useRef({ points, year, route, placing, selIds: [] as string[], orphans });

  // Страница могла перечитать данные с сервера (после загрузки файла) —
  // подхватываем их, не сбрасывая при этом вид карты.
  useEffect(() => { setPoints(initPoints); }, [initPoints]);
  useEffect(() => { setOrphans(initOrphans); }, [initOrphans]);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const p of points) if (p.date) set.add(p.date.slice(0, 4));
    return [...set].sort().reverse();
  }, [points]);

  const filtered = useMemo(
    () => (year === "all" ? points : points.filter((p) => (p.date || "").startsWith(year))),
    [points, year],
  );

  const dateStr = (iso: string | null) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : locale, { day: "numeric", month: "long", year: "numeric" });
    } catch { return ""; }
  };

  // ===== Карта =====
  useEffect(() => {
    let dead = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (dead || !elRef.current || mapRef.current) return;
      const map = L.map(elRef.current, {
        zoomControl: true,
        worldCopyJump: true,
        // Дробный масштаб: карта может стоять между уровнями, а не только на
        // целых. Без этого любое приближение — прыжок вдвое.
        zoomSnap: 0,
        zoomDelta: 0.6,
        // Колесо и трекпад обрабатываем сами (см. ниже). Родной обработчик
        // Leaflet копит движение, ждёт паузу и только потом запускает
        // анимацию — отсюда и «медленно, с задержкой».
        scrollWheelZoom: false,
        zoomAnimation: true,
        fadeAnimation: false, // проявление плиток добавляет ощущение тормозов
        inertia: true,
      }).setView([30, 10], 2);
      // Подложка — стандартные плитки OpenStreetMap: бесплатные и без ключей.
      // Красивые «фирменные» слои (CARTO, Stadia) сегодня все просят ключ и
      // счёт, а ради внешнего вида отдавать ключ в браузер незачем.
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        // Плитки грузятся с раздающей сети и не запрашиваются на каждом кадре
        // приближения — иначе карта половину времени ждёт картинки.
        updateWhenZooming: false,
        updateInterval: 150,
        keepBuffer: 3,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      LRef.current = L;
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);

      // ===== Приближение колесом и щипком по трекпаду =====
      //
      // Родной зум Leaflet устроен «накопил — подождал — проиграл анимацию»:
      // на трекпаде это читается как задержка и вязкость. Здесь масштаб
      // меняется каждый кадр и БЕЗ анимации, а плавность даёт догоняющее
      // движение к цели: карта тянется за пальцем, как в мобильных картах.
      let target: number | null = null;
      let anchor: any = null;
      let raf = 0;
      // Один шаг к цели. Точку под курсором держим на месте: приближаемся
      // туда, куда смотрим.
      const ease = (k: number) => {
        if (target === null) return false;
        const cur = map.getZoom();
        const diff = target - cur;
        if (Math.abs(diff) < 0.004) { target = null; return false; }
        const at = anchor ? map.containerPointToLatLng(anchor) : map.getCenter();
        map.setZoomAround(at, cur + diff * k, { animate: false });
        return true;
      };
      const step = () => {
        raf = 0;
        if (ease(0.4)) raf = requestAnimationFrame(step);
      };
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        // Разные устройства меряют прокрутку по-разному: пиксели, строки, страницы.
        const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
        // Щипок по трекпаду приходит тем же событием, но с ctrl и мелкими
        // числами — ему нужен более крупный шаг, иначе жест «не берёт».
        const delta = -px / (e.ctrlKey ? 45 : 140);
        const base = target === null ? map.getZoom() : target;
        target = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), base + delta));
        anchor = map.mouseEventToContainerPoint(e);
        // Первый шаг делаем прямо здесь, в самом событии: карта отзывается в
        // тот же миг, а не через кадр. Остальное догоняет плавно.
        ease(0.5);
        if (!raf) raf = requestAnimationFrame(step);
      };
      elRef.current.addEventListener("wheel", onWheel, { passive: false });
      wheelOffRef.current = () => {
        try { elRef.current?.removeEventListener("wheel", onWheel as any); } catch {}
        if (raf) cancelAnimationFrame(raf);
      };

      // Пересборка стопок — не на каждый кадр приближения, а когда движение
      // улеглось: иначе браузер перерисовывает все точки десятки раз в секунду.
      map.on("zoomend moveend", () => scheduleDraw());
      map.on("click", (e: any) => {
        const pl = stateRef.current.placing;
        if (pl) putPoint(pl, e.latlng.lat, e.latlng.lng);
      });
      // Карта рождается раньше, чем страница разложит блоки по местам, и меряет
      // себя по нулевой высоте: получаются серые поля вместо плиток и точки за
      // краем экрана. Поэтому пересчитываем размер, как только контейнер его
      // получил, — и заново вписываем все точки в кадр.
      const refit = () => {
        try { map.invalidateSize(); } catch {}
        draw();
      };
      setTimeout(refit, 60);
      try {
        const ro = new ResizeObserver(() => { try { map.invalidateSize(); } catch {} draw(); });
        ro.observe(elRef.current);
        roRef.current = ro;
      } catch {}
      draw();
    })();
    return () => {
      dead = true;
      try { roRef.current?.disconnect(); } catch {}
      roRef.current = null;
      try { wheelOffRef.current?.(); } catch {}
      wheelOffRef.current = null;
      if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
      try { mapRef.current?.remove(); } catch {}
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    stateRef.current = { points, year, route, placing, selIds: (sel || []).map((p) => p.id), orphans };
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, year, route, placing, sel, orphans]);

  // Во весь экран: карта — единственное место приложения, где хочется видеть
  // всю жизнь разом, а не полосу в 600 пикселей.
  useEffect(() => {
    const onFs = () => {
      setFull(!!document.fullscreenElement);
      setTimeout(() => { try { mapRef.current?.invalidateSize(); } catch {} }, 120);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function toggleFull() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else wrapRef.current?.requestFullscreen?.();
    } catch {}
  }

  function scheduleDraw(delay = 90) {
    if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
    drawTimerRef.current = setTimeout(() => { drawTimerRef.current = null; draw(); }, delay);
  }

  function draw() {
    const map = mapRef.current, L = LRef.current, layer = layerRef.current;
    if (!map || !L || !layer) return;
    const st = stateRef.current;
    const list = st.year === "all" ? st.points : st.points.filter((p) => (p.date || "").startsWith(st.year));
    layer.clearLayers();
    if (lineRef.current) { try { map.removeLayer(lineRef.current); } catch {} lineRef.current = null; }
    if (!list.length) return;

    // Первое открытие — показываем сразу всё, что есть. Пока карта нулевого
    // размера (страница ещё раскладывается, вкладка открыта в фоне), вписывать
    // нечего: Leaflet посчитал бы масштаб по нулевому окну и увёл бы вид в
    // случайную деревню. Значит, ждём настоящий размер.
    if (!fittedRef.current) {
      const size = map.getSize();
      if (size.x > 0 && size.y > 0) {
        fittedRef.current = true;
        try {
          const b = L.latLngBounds(list.map((p: Point) => [p.lat, p.lng]));
          map.flyToBounds(b, { padding: [46, 46], maxZoom: 13, duration: 0.55 });
        } catch {}
      }
    }

    // Маршрут — по времени съёмки, а не по порядку загрузки.
    const chrono = [...list].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    if (st.route && chrono.length > 1) {
      lineRef.current = L.polyline(chrono.map((p) => [p.lat, p.lng]), {
        color: "#6366f1", weight: 2, opacity: 0.55, dashArray: "5 7",
      }).addTo(map);
    }

    // Стопки: то, что на текущем масштабе слиплось бы в кашу.
    const clusters: (Cluster & { pt: any })[] = [];
    for (const p of list) {
      const pt = map.latLngToContainerPoint([p.lat, p.lng]);
      const hit = clusters.find((c) => Math.abs(c.pt.x - pt.x) < 40 && Math.abs(c.pt.y - pt.y) < 40);
      if (hit) hit.items.push(p);
      else clusters.push({ pt, lat: p.lat, lng: p.lng, items: [p] });
    }

    for (const c of clusters) {
      const cover = c.items.find((i) => i.url) || c.items[0];
      const box = document.createElement("div");
      box.className = "lm-pin" + (c.items.some((i) => st.selIds.includes(i.id)) ? " sel" : "");
      if (cover.url) {
        const img = document.createElement("img");
        img.src = cover.url;
        img.alt = "";
        box.appendChild(img);
      } else {
        const ic = document.createElement("i");
        ic.className = cover.video ? "ti ti-video" : "ti ti-map-pin";
        box.appendChild(ic);
      }
      if (cover.video) box.appendChild(document.createElement("s")); // уголок «это ролик»
      if (c.items.length > 1) {
        const b = document.createElement("b");
        b.textContent = String(c.items.length);
        box.appendChild(b);
      }
      const marker = L.marker([c.lat, c.lng], {
        icon: L.divIcon({ html: box, className: "", iconSize: [44, 44], iconAnchor: [22, 22] }),
        keyboard: false,
      });
      marker.on("click", () => { setSel(c.items); setShot(0); setEditing(false); });
      marker.addTo(layer);
    }
  }

  // ===== Поставить/переставить точку =====
  async function putPoint(pl: Placing, lat: number, lng: number) {
    setPlacing(null);
    let place: string | null = null;
    try {
      const r = await fetch("/api/map", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "move", id: pl.id, kind: pl.kind, lat, lng }),
      }).then((x) => x.json());
      if (!r?.ok) return;
      place = r.place || null;
    } catch { return; }

    if (pl.from === "point") {
      const moved = { lat, lng, place };
      setPoints((p) => p.map((x) => (x.id === pl.id && x.kind === pl.kind ? { ...x, ...moved } : x)));
      setSel((p) => (p ? p.map((x) => (x.id === pl.id && x.kind === pl.kind ? { ...x, ...moved } : x)) : p));
    } else {
      const o = stateRef.current.orphans.find((x) => x.id === pl.id);
      if (!o) return;
      const fresh: Point = { id: o.id, kind: "memory", lat, lng, url: o.url, video: o.video, title: o.title, place, date: o.date, note: null };
      setOrphans((p) => p.filter((x) => x.id !== pl.id));
      setPoints((p) => [...p, fresh]);
      setSel([fresh]);
      setShot(0);
    }
    try { mapRef.current?.panTo([lat, lng], { animate: true, duration: 0.6 }); } catch {}
  }

  // ===== Убрать с карты / удалить насовсем =====
  const current = sel && sel.length ? sel[Math.min(shot, sel.length - 1)] : null;

  function dropFromState(p: Point) {
    setPoints((list) => list.filter((x) => !(x.id === p.id && x.kind === p.kind)));
    setSel((list) => {
      const rest = (list || []).filter((x) => !(x.id === p.id && x.kind === p.kind));
      return rest.length ? rest : null;
    });
    setShot(0);
  }

  async function unpin(p: Point) {
    dropFromState(p);
    setOrphans((o) => [{ id: p.id, url: p.url, video: p.video, title: p.title, date: p.date }, ...o]);
    try {
      await fetch("/api/map", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "unpin", id: p.id, kind: p.kind }),
      });
    } catch {}
  }

  async function removeForever(p: Point) {
    if (!confirm(s.delAsk)) return;
    dropFromState(p);
    try {
      await fetch("/api/map", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delete", id: p.id, kind: p.kind }),
      });
    } catch {}
  }

  function zoomToPoint(p: Point) {
    const map = mapRef.current;
    if (!map) return;
    try { map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 15), { duration: 0.6 }); } catch {}
  }

  // ===== Добавить фото или видео прямо с карты =====
  async function addFiles(files: File[]) {
    if (!files.length) return;
    setBusy(s.adding);
    let placedFirst = false;
    try {
      const meta = files.map((f) => ({ name: f.name, type: f.type || (isVideoFile(f) ? "video/mp4" : "image/jpeg"), size: f.size }));
      const r = await fetch("/api/memory/bulk", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "urls", files: meta }),
      }).then((x) => x.json());
      const slots: any[] = r?.files || [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const slot = slots[i];
        if (!slot?.url || !slot?.path) {
          setBusy(`${file.name}: ${slot?.error === "big" ? s.tooBig : s.badType}`);
          continue;
        }
        setBusy(`${s.adding} ${i + 1}/${files.length}`);
        const up = await fetch(slot.url, { method: "PUT", headers: { "content-type": meta[i].type }, body: file });
        if (!up.ok) { setBusy(s.addFail); continue; }

        const ing = await fetch("/api/memory/bulk", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "ingest", path: slot.path, name: file.name, type: meta[i].type, size: file.size }),
        }).then((x) => x.json());
        if (!ing?.ok || !ing.memory?.id) { setBusy(s.addFail); continue; }

        const id = ing.memory.id as string;
        const video = isVideoFile(file);
        let preview: string | null = URL.createObjectURL(file);

        // У ролика обложку снимает браузер и кладёт в то же хранилище.
        if (video) {
          const poster = await posterOf(file);
          preview = poster ? URL.createObjectURL(poster) : null;
          if (poster) {
            try {
              const pr = await fetch("/api/memory/bulk", {
                method: "POST", headers: { "content-type": "application/json" },
                body: JSON.stringify({ action: "urls", files: [{ name: "poster.jpg", type: "image/jpeg", size: poster.size }] }),
              }).then((x) => x.json());
              const ps = pr?.files?.[0];
              if (ps?.url && ps?.path) {
                await fetch(ps.url, { method: "PUT", headers: { "content-type": "image/jpeg" }, body: poster });
                await fetch("/api/map", {
                  method: "POST", headers: { "content-type": "application/json" },
                  body: JSON.stringify({ action: "poster", id, path: ps.path }),
                });
              }
            } catch {}
          }
        }

        const geo = ing.geo;
        if (geo?.lat != null && geo?.lng != null) {
          const fresh: Point = {
            id, kind: "memory", lat: geo.lat, lng: geo.lng, url: preview,
            video: video ? URL.createObjectURL(file) : null,
            title: ing.memory.title || file.name, place: geo.place || null,
            date: ing.memory.mem_date || new Date().toISOString(), note: null,
          };
          setPoints((p) => [...p, fresh]);
          if (!placedFirst) {
            placedFirst = true;
            setSel([fresh]);
            setShot(0);
            try { mapRef.current?.flyTo([geo.lat, geo.lng], 13, { duration: 1 }); } catch {}
          }
        } else {
          const orph: Orphan = { id, url: preview, video: video ? URL.createObjectURL(file) : null, title: ing.memory.title || file.name, date: null };
          setOrphans((o) => [orph, ...o]);
          // Координат в файле не было — сразу предлагаем поставить точку руками.
          if (!placedFirst) {
            placedFirst = true;
            setPlacing({ id, kind: "memory", from: "orphan" });
          }
        }
      }
      setBusy(null);
      // Освежаем серверные данные: подписанные ссылки и разбор AI приедут сами.
      router.refresh();
    } catch {
      setBusy(s.addFail);
    } finally {
      setTimeout(() => setBusy(null), 2600);
    }
  }

  // ===== Комментарий к точке =====
  function openNote() {
    if (!current) return;
    setDraft(current.note || "");
    setEditing(true);
    setRecording(false);
  }
  async function saveNote() {
    if (!current) return;
    const note = draft.trim();
    const id = current.id, kind = current.kind;
    setPoints((p) => p.map((x) => (x.id === id && x.kind === kind ? { ...x, note } : x)));
    setSel((p) => (p ? p.map((x) => (x.id === id && x.kind === kind ? { ...x, note } : x)) : p));
    setEditing(false);
    try {
      await fetch("/api/map", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "note", id, kind, note }),
      });
    } catch {}
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
    } catch { alert(s.noMic); }
  }
  function stopRec() { setRecording(false); try { mediaRef.current?.stop(); } catch {} }

  const btn: any = { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 12.5, cursor: "pointer" };

  return (
    <>
      <style>{CSS}</style>

      {/* Фильтры: год, маршрут, добавление */}
      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginBottom: 11 }}>
        <button className={`lm-chip ${year === "all" ? "on" : ""}`} onClick={() => { fittedRef.current = false; setYear("all"); }}>{s.all}</button>
        {years.map((y) => (
          <button key={y} className={`lm-chip ${year === y ? "on" : ""}`} onClick={() => { fittedRef.current = false; setYear(y); }}>{y}</button>
        ))}
        <span style={{ flex: 1 }} />
        <button className="lm-chip" onClick={() => fileRef.current?.click()} disabled={!!busy}>
          <i className="ti ti-plus" style={{ fontSize: 14, marginRight: 4, verticalAlign: -2 }} />{busy || s.add}
        </button>
        <button className={`lm-chip ${route ? "on" : ""}`} onClick={() => setRoute((v) => !v)}>
          <i className="ti ti-route" style={{ fontSize: 14, marginRight: 4, verticalAlign: -2 }} />{s.route}
        </button>
        <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{s.pointsN(filtered.length)}</span>
      </div>
      <input
        ref={fileRef} type="file" accept="image/*,video/*" multiple hidden
        onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ""; addFiles(f); }}
      />

      <div className="lm-wrap" ref={wrapRef}>
        <div ref={elRef} className={`lm-map ${placing ? "placing" : ""}`} />

        <div className="lm-tools">
          <button className="lm-tool" title={full ? s.exitFull : s.full} onClick={toggleFull}>
            <i className={`ti ${full ? "ti-arrows-minimize" : "ti-arrows-maximize"}`} style={{ fontSize: 16 }} />
          </button>
        </div>

        {placing && (
          <div className="lm-banner">
            <i className="ti ti-map-pin-plus" style={{ fontSize: 15 }} />
            {placing.from === "point" ? s.placingMove : s.placing}
            <button onClick={() => setPlacing(null)} style={{ background: "rgba(255,255,255,.22)", border: "none", color: "#fff", borderRadius: 999, padding: "3px 9px", fontSize: 12, cursor: "pointer" }}>{s.cancel}</button>
          </div>
        )}

        {/* Карточка точки */}
        {current && (
          <div className="lm-card">
            <button
              onClick={() => { setSel(null); setEditing(false); }}
              aria-label={s.close}
              style={{ position: "absolute", top: 7, right: 7, zIndex: 2, width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.5)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <i className="ti ti-x" style={{ fontSize: 14 }} />
            </button>

            {current.video ? (
              <video className="lm-shot" src={`${current.video}#t=0.1`} poster={current.url || undefined} controls playsInline preload="metadata" />
            ) : current.url ? (
              <img className="lm-shot" src={current.url} alt="" onClick={() => setLightbox(current.url)} />
            ) : (
              <div className="lm-shot" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}><i className="ti ti-map-pin" style={{ fontSize: 26 }} /></div>
            )}

            {sel!.length > 1 && (
              <div className="lm-strip">
                {sel!.map((p, i) => (
                  <div key={p.kind + p.id} className={`lm-th ${i === shot ? "on" : ""}`} onClick={() => { setShot(i); setEditing(false); }}
                    style={{ backgroundImage: p.url ? `url(${p.url})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
                    {p.video && <i className="ti ti-player-play-filled" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, textShadow: "0 1px 3px rgba(0,0,0,.6)" }} />}
                  </div>
                ))}
              </div>
            )}

            <div style={{ padding: "9px 12px 12px" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.35 }}>{current.title || s.here}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {current.place && <span><i className="ti ti-map-pin" style={{ fontSize: 12, verticalAlign: -1, marginRight: 3 }} />{current.place}</span>}
                {current.date && <span>{dateStr(current.date)}</span>}
              </div>

              {current.note && !editing && (
                <div style={{ marginTop: 9, fontSize: 13, color: "var(--text-2)", background: "var(--surface-2, #f6f7f9)", borderRadius: 9, padding: "8px 10px", whiteSpace: "pre-wrap" }}>{current.note}</div>
              )}

              {editing ? (
                <div style={{ marginTop: 9 }}>
                  <textarea
                    value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={s.notePh} rows={3} autoFocus disabled={recBusy}
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
                  />
                  <div style={{ display: "flex", gap: 7, marginTop: 7, alignItems: "center", flexWrap: "wrap" }}>
                    <button style={{ ...btn, background: "var(--accent, #6366f1)", color: "#fff", borderColor: "transparent" }} onClick={saveNote} disabled={recBusy}>
                      <i className="ti ti-check" style={{ fontSize: 14 }} />{s.save}
                    </button>
                    <button style={{ ...btn, color: recording ? "#dc2626" : "var(--text-2)" }} onClick={recording ? stopRec : startRec} disabled={recBusy}>
                      <i className={`ti ${recording ? "ti-player-stop" : "ti-microphone"}`} style={{ fontSize: 14 }} />
                      {recBusy ? "…" : recording ? s.recording : s.recHint}
                    </button>
                    <button style={{ ...btn, border: "none", background: "none", color: "var(--text-3)" }} onClick={() => setEditing(false)}>{s.close}</button>
                  </div>
                </div>
              ) : (
                <>
                  <button style={{ ...btn, marginTop: 9, color: "var(--accent, #6366f1)" }} onClick={openNote}>
                    <i className="ti ti-message-plus" style={{ fontSize: 14 }} />{current.note ? s.editNote : s.addNote}
                  </button>
                  {/* Что можно сделать с самой точкой. Порядок от безобидного к
                      необратимому: приблизить, переставить, убрать с карты и
                      только в самом конце — удалить. */}
                  <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                    <button className="lm-act" title={s.zoomIn} onClick={() => zoomToPoint(current)}><i className="ti ti-zoom-in" style={{ fontSize: 15 }} /></button>
                    <button className="lm-act" title={s.move} onClick={() => { setPlacing({ id: current.id, kind: current.kind, from: "point" }); }}><i className="ti ti-arrows-move" style={{ fontSize: 15 }} /></button>
                    <button className="lm-act" title={s.unpin} onClick={() => unpin(current)}><i className="ti ti-map-pin-off" style={{ fontSize: 15 }} /></button>
                    <a className="lm-act" title={s.gmaps} href={`https://www.google.com/maps/search/?api=1&query=${current.lat},${current.lng}`} target="_blank" rel="noreferrer"><i className="ti ti-external-link" style={{ fontSize: 15 }} /></a>
                    <span style={{ flex: 1 }} />
                    <button className="lm-act danger" title={s.del} onClick={() => removeForever(current)}><i className="ti ti-trash" style={{ fontSize: 15 }} /></button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Пусто — объясняем, откуда берутся точки */}
      {!points.length && (
        <div className="card" style={{ marginTop: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{s.empty}</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 5, lineHeight: 1.55 }}>{s.emptyHow}</div>
        </div>
      )}

      {/* Снимки и ролики, которые ждут своей точки */}
      {orphans.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <i className="ti ti-map-pin-question" style={{ fontSize: 16, color: "#f59e0b" }} />
            {s.orphans}
            <span style={{ fontWeight: 400, color: "var(--text-3)", fontSize: 12 }}>· {s.photosN(orphanTotal)} · {s.orphansHint}</span>
          </div>
          <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "10px 0 2px" }}>
            {orphans.map((o) => (
              <div
                key={o.id} title={o.title}
                className={`lm-orph ${placing?.id === o.id ? "on" : ""}`}
                onClick={() => {
                  setPlacing(placing?.id === o.id ? null : { id: o.id, kind: "memory", from: "orphan" });
                  try { wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {}
                }}
              >
                {o.url ? <img src={o.url} alt={o.title} /> : <span className="play"><i className="ti ti-video" /></span>}
                {o.video && o.url && <span className="play"><i className="ti ti-player-play-filled" /></span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {lightbox && (
        <div className="lm-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" />
        </div>
      )}
    </>
  );
}
