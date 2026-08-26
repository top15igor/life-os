"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Locale } from "@/lib/i18n";

// Карта жизни: где ты был — по своим же фотографиям.
//
// Точка на карте — это снимок (или стопка снимков, сделанных рядом). Точки
// соединены по времени: получается видимый маршрут жизни. Нажал на точку —
// увидел фото и свой комментарий к нему; комментарий пишет только сам хозяин,
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
  title: string;
  place: string | null;
  date: string | null;
  note: string | null;
};
export type Orphan = { id: string; url: string | null; title: string; date: string | null };

const S: Record<string, any> = {
  ru: {
    all: "Все годы", route: "Маршрут", pointsN: (n: number) => `${n} точек`, photosN: (n: number) => `${n} фото`,
    empty: "Пока на карте пусто", emptyHow: "Точка появляется из координат внутри снимка. Telegram вырезает их при обычной отправке, поэтому есть два надёжных пути: прислать фото боту ФАЙЛОМ («Отправить без сжатия») или загрузить его на сайте в «Память». А любое фото всегда можно поставить на карту руками — ниже.",
    orphans: "Фото без точки", orphansHint: "Выбери снимок — и ткни в карту, где это было.",
    placing: "Ткни в карту — сюда встанет фото", cancel: "Отмена", placed: "Точка поставлена",
    addNote: "Добавить комментарий", editNote: "Изменить комментарий",
    notePh: "Что здесь было? Расскажи своими словами…", save: "Сохранить",
    recording: "Запись… нажми, чтобы остановить", recHint: "Можно наговорить голосом",
    noMic: "Нет доступа к микрофону", close: "Закрыть", here: "Здесь", showAll: "Показать все",
  },
  en: {
    all: "All years", route: "Route", pointsN: (n: number) => `${n} points`, photosN: (n: number) => `${n} photos`,
    empty: "The map is still empty", emptyHow: "A point comes from the coordinates inside the photo. Telegram strips them from compressed photos, so there are two reliable ways: send the photo to the bot AS A FILE (“without compression”) or upload it on the site into Memory. And any photo can always be placed by hand — below.",
    orphans: "Photos without a point", orphansHint: "Pick a photo — then tap the map where it happened.",
    placing: "Tap the map — the photo goes there", cancel: "Cancel", placed: "Point set",
    addNote: "Add a comment", editNote: "Edit comment",
    notePh: "What happened here? In your own words…", save: "Save",
    recording: "Recording… tap to stop", recHint: "You can speak it",
    noMic: "No microphone access", close: "Close", here: "Here", showAll: "Show all",
  },
  uk: {
    all: "Усі роки", route: "Маршрут", pointsN: (n: number) => `${n} точок`, photosN: (n: number) => `${n} фото`,
    empty: "Поки на карті порожньо", emptyHow: "Точка з'являється з координат усередині знімка. Telegram вирізає їх при звичайній відправці, тож є два надійні шляхи: надіслати фото боту ФАЙЛОМ («без стиснення») або завантажити його на сайті в «Пам'ять». А будь-яке фото завжди можна поставити на карту руками — нижче.",
    orphans: "Фото без точки", orphansHint: "Обери знімок — і тицьни в карту, де це було.",
    placing: "Тицьни в карту — сюди стане фото", cancel: "Скасувати", placed: "Точку поставлено",
    addNote: "Додати коментар", editNote: "Змінити коментар",
    notePh: "Що тут було? Розкажи своїми словами…", save: "Зберегти",
    recording: "Запис… натисни, щоб зупинити", recHint: "Можна наговорити голосом",
    noMic: "Немає доступу до мікрофона", close: "Закрити", here: "Тут", showAll: "Показати всі",
  },
  fr: {
    all: "Toutes les années", route: "Itinéraire", pointsN: (n: number) => `${n} points`, photosN: (n: number) => `${n} photos`,
    empty: "La carte est encore vide", emptyHow: "Un point vient des coordonnées à l'intérieur de la photo. Telegram les supprime des photos compressées : envoie la photo au bot EN FICHIER (« sans compression ») ou dépose-la sur le site dans « Mémoire ». Et toute photo peut être placée à la main — ci-dessous.",
    orphans: "Photos sans point", orphansHint: "Choisis une photo — puis touche la carte à l'endroit.",
    placing: "Touche la carte — la photo ira là", cancel: "Annuler", placed: "Point placé",
    addNote: "Ajouter un commentaire", editNote: "Modifier le commentaire",
    notePh: "Que s'est-il passé ici ? Avec tes mots…", save: "Enregistrer",
    recording: "Enregistrement… touche pour arrêter", recHint: "Tu peux le dicter",
    noMic: "Pas d'accès au micro", close: "Fermer", here: "Ici", showAll: "Tout afficher",
  },
  es: {
    all: "Todos los años", route: "Ruta", pointsN: (n: number) => `${n} puntos`, photosN: (n: number) => `${n} fotos`,
    empty: "El mapa aún está vacío", emptyHow: "Un punto nace de las coordenadas dentro de la foto. Telegram las borra en las fotos comprimidas: envía la foto al bot COMO ARCHIVO («sin compresión») o súbela en la web a «Memoria». Y cualquier foto se puede colocar a mano — abajo.",
    orphans: "Fotos sin punto", orphansHint: "Elige una foto — y toca el mapa donde ocurrió.",
    placing: "Toca el mapa — ahí irá la foto", cancel: "Cancelar", placed: "Punto colocado",
    addNote: "Añadir comentario", editNote: "Editar comentario",
    notePh: "¿Qué pasó aquí? Con tus palabras…", save: "Guardar",
    recording: "Grabando… toca para parar", recHint: "Puedes dictarlo",
    noMic: "Sin acceso al micrófono", close: "Cerrar", here: "Aquí", showAll: "Mostrar todo",
  },
};

const CSS = `
.lm-wrap { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid var(--border); }
.lm-map { height: min(68vh, 620px); width: 100%; background: var(--surface-2, #e8eef2); }
.lm-map.placing { cursor: crosshair; }
.lm-pin { width: 44px; height: 44px; border-radius: 50%; overflow: hidden; border: 2.5px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.32); background: #7c8b96; position: relative; }
.lm-pin img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lm-pin i { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 19px; }
.lm-pin b { position: absolute; right: -3px; bottom: -3px; min-width: 19px; height: 19px; padding: 0 4px; border-radius: 10px; background: var(--accent, #6366f1); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-sizing: content-box; }
.lm-pin.sel { border-color: var(--accent, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,.35), 0 2px 8px rgba(0,0,0,.32); }
.lm-card { position: absolute; left: 12px; bottom: 12px; width: min(340px, calc(100% - 24px)); background: var(--surface, #fff); border: 1px solid var(--border); border-radius: 13px; box-shadow: 0 8px 28px rgba(0,0,0,.18); z-index: 700; overflow: hidden; }
.lm-shot { width: 100%; height: 168px; object-fit: cover; display: block; background: var(--surface-2, #eef2f5); cursor: zoom-in; }
.lm-strip { display: flex; gap: 5px; padding: 7px 9px 0; overflow-x: auto; }
.lm-strip img { width: 42px; height: 42px; border-radius: 7px; object-fit: cover; cursor: pointer; border: 2px solid transparent; flex-shrink: 0; }
.lm-strip img.on { border-color: var(--accent, #6366f1); }
.lm-chip { padding: 5px 11px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 12.5px; cursor: pointer; white-space: nowrap; }
.lm-chip.on { background: var(--accent, #6366f1); border-color: var(--accent, #6366f1); color: #fff; }
.lm-orph { width: 62px; height: 62px; border-radius: 9px; object-fit: cover; cursor: pointer; border: 2px solid transparent; flex-shrink: 0; }
.lm-orph.on { border-color: var(--accent, #6366f1); }
.lm-banner { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 700; background: var(--accent, #6366f1); color: #fff; border-radius: 999px; padding: 7px 14px; font-size: 12.5px; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 14px rgba(0,0,0,.2); }
.lm-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.86); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 18px; cursor: zoom-out; }
.lm-lightbox img { max-width: 100%; max-height: 100%; border-radius: 10px; }
html[data-theme="dark"] .leaflet-tile { filter: brightness(.72) contrast(1.06) saturate(.85); }
html[data-theme="dark"] .lm-map { background: #1a2026; }
.leaflet-container { font: inherit; }
`;

type Cluster = { lat: number; lng: number; items: Point[] };

export default function LifeMap({
  locale, points: initPoints, orphans: initOrphans, orphanTotal,
}: {
  locale: Locale;
  points: Point[];
  orphans: Orphan[];
  orphanTotal: number;
}) {
  const s = S[locale] || S.ru;
  const [points, setPoints] = useState<Point[]>(initPoints);
  const [orphans, setOrphans] = useState<Orphan[]>(initOrphans);
  const [year, setYear] = useState<string>("all");
  const [route, setRoute] = useState(true);
  const [sel, setSel] = useState<Point[] | null>(null);
  const [shot, setShot] = useState(0);
  const [placing, setPlacing] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [recBusy, setRecBusy] = useState(false);

  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const lineRef = useRef<any>(null);
  const fittedRef = useRef(false);
  const roRef = useRef<any>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  // Обработчики карты живут дольше рендера, поэтому свежие данные и режимы
  // читаем через ref — иначе клик по карте увидит состояние на момент создания.
  const stateRef = useRef({ points, year, route, placing, selIds: [] as string[] });

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
      const map = L.map(elRef.current, { zoomControl: true, worldCopyJump: true, attributionControl: true }).setView([30, 10], 2);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      LRef.current = L;
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      map.on("zoomend moveend", () => draw());
      map.on("click", (e: any) => {
        const id = stateRef.current.placing;
        if (id) placeOrphan(id, e.latlng.lat, e.latlng.lng);
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
      try { mapRef.current?.remove(); } catch {}
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    stateRef.current = { points, year, route, placing, selIds: (sel || []).map((p) => p.id) };
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, year, route, placing, sel]);

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
          map.fitBounds(b, { padding: [46, 46], maxZoom: 13 });
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
        ic.className = "ti ti-map-pin";
        box.appendChild(ic);
      }
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

  // ===== Поставить точку руками =====
  async function placeOrphan(id: string, lat: number, lng: number) {
    const o = orphans.find((x) => x.id === id);
    setPlacing(null);
    if (!o) return;
    let place: string | null = null;
    try {
      const r = await fetch("/api/map", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "move", id, kind: "memory", lat, lng }),
      }).then((x) => x.json());
      if (!r?.ok) return;
      place = r.place || null;
    } catch { return; }
    const fresh: Point = { id: o.id, kind: "memory", lat, lng, url: o.url, title: o.title, place, date: o.date, note: null };
    setOrphans((p) => p.filter((x) => x.id !== id));
    setPoints((p) => [...p, fresh]);
    setSel([fresh]);
    setShot(0);
    try { mapRef.current?.panTo([lat, lng]); } catch {}
  }

  // ===== Комментарий к точке =====
  const current = sel && sel.length ? sel[Math.min(shot, sel.length - 1)] : null;

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

      {/* Фильтры: год и маршрут */}
      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginBottom: 11 }}>
        <button className={`lm-chip ${year === "all" ? "on" : ""}`} onClick={() => { fittedRef.current = false; setYear("all"); }}>{s.all}</button>
        {years.map((y) => (
          <button key={y} className={`lm-chip ${year === y ? "on" : ""}`} onClick={() => { fittedRef.current = false; setYear(y); }}>{y}</button>
        ))}
        <span style={{ flex: 1 }} />
        <button className={`lm-chip ${route ? "on" : ""}`} onClick={() => setRoute((v) => !v)}>
          <i className="ti ti-route" style={{ fontSize: 14, marginRight: 4, verticalAlign: -2 }} />{s.route}
        </button>
        <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{s.pointsN(filtered.length)}</span>
      </div>

      <div className="lm-wrap">
        <div ref={elRef} className={`lm-map ${placing ? "placing" : ""}`} />

        {placing && (
          <div className="lm-banner">
            <i className="ti ti-map-pin-plus" style={{ fontSize: 15 }} />
            {s.placing}
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

            {current.url
              ? <img className="lm-shot" src={current.url} alt="" onClick={() => setLightbox(current.url)} />
              : <div className="lm-shot" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}><i className="ti ti-map-pin" style={{ fontSize: 26 }} /></div>}

            {sel!.length > 1 && (
              <div className="lm-strip">
                {sel!.map((p, i) => (
                  <img key={p.kind + p.id} className={i === shot ? "on" : ""} src={p.url || ""} alt="" onClick={() => { setShot(i); setEditing(false); }} />
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
                <button style={{ ...btn, marginTop: 9, color: "var(--accent, #6366f1)" }} onClick={openNote}>
                  <i className="ti ti-message-plus" style={{ fontSize: 14 }} />{current.note ? s.editNote : s.addNote}
                </button>
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

      {/* Снимки, которые ждут своей точки */}
      {orphans.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 7 }}>
            <i className="ti ti-map-pin-question" style={{ fontSize: 16, color: "#f59e0b" }} />
            {s.orphans}
            <span style={{ fontWeight: 400, color: "var(--text-3)", fontSize: 12 }}>· {s.photosN(orphanTotal)} · {s.orphansHint}</span>
          </div>
          <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "10px 0 2px" }}>
            {orphans.map((o) => (
              <img
                key={o.id} src={o.url || ""} alt={o.title} title={o.title}
                className={`lm-orph ${placing === o.id ? "on" : ""}`}
                onClick={() => { setPlacing(placing === o.id ? null : o.id); try { elRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {} }}
              />
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
