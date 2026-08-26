"use client";

// Две карты под одним интерфейсом.
//
// Карта жизни умеет больше, чем «показать плитки»: стопки точек считаются в
// пикселях, маршрут рисуется линией, к точке нужно подлетать, а по щелчку в
// пустое место — ставить снимок. Всё это одинаково для любой подложки, поэтому
// сама подложка спрятана за общим набором действий: OpenStreetMap (Leaflet) и
// Apple Maps (MapKit JS) отличаются только внутри.

export type LatLng = [number, number];

export type MapEngine = {
  kind: "osm" | "apple";
  destroy(): void;
  invalidate(): void;                 // размер контейнера изменился
  clearPins(): void;
  addPin(lat: number, lng: number, el: HTMLElement, onClick: () => void): void;
  setRoute(coords: LatLng[] | null): void;
  fit(coords: LatLng[], maxZoom?: number): void;
  flyTo(lat: number, lng: number, zoom?: number): void;
  zoom(): number;
  size(): { x: number; y: number };
  project(lat: number, lng: number): { x: number; y: number };
  boundsZoom(coords: LatLng[], padding?: number): number;
  setTheme(dark: boolean): void;
};

type Handlers = { onIdle: () => void; onMapClick: (lat: number, lng: number) => void };

// Уровень масштаба ↔ ширина видимого куска мира в градусах. Одна и та же
// формула для обеих карт: у Leaflet это встроено, Apple же меряет регионами.
const zoomOfSpan = (spanLng: number, width: number) => Math.log2((360 * width) / (256 * Math.max(spanLng, 1e-9)));
const spanOfZoom = (zoom: number, width: number) => (360 * width) / (256 * Math.pow(2, zoom));

// ============================================================
//  OpenStreetMap (Leaflet)
// ============================================================

// Чувствительность приближения. Трекпад шлёт мелкие движения, колесо мыши —
// редкие крупные щелчки; один делитель на двоих не работает.
const ZOOM_PX_TRACKPAD = 60;
const ZOOM_PX_WHEEL = 110;
const ZOOM_PX_PINCH = 12;
const ZOOM_BOOST_MAX = 1.5;
const ZOOM_MAX_PER_EVENT = 1.1;

async function createOsm(el: HTMLElement, h: Handlers): Promise<MapEngine> {
  const L = (await import("leaflet")).default;
  const map = L.map(el, {
    zoomControl: true,
    worldCopyJump: true,
    // Дробный масштаб: карта может стоять между уровнями, а не только на целых.
    zoomSnap: 0,
    zoomDelta: 0.6,
    // Колесо обрабатываем сами: родной обработчик копит движение, ждёт паузу и
    // только потом играет анимацию — отсюда «медленно, с задержкой».
    scrollWheelZoom: false,
    zoomAnimation: true,
    fadeAnimation: false,
    inertia: true,
  }).setView([30, 10], 2);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    updateWhenZooming: false,
    updateInterval: 150,
    keepBuffer: 3,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const layer = L.layerGroup().addTo(map);
  let line: any = null;

  // ===== Приближение колесом и щипком =====
  let target: number | null = null;
  let anchor: any = null;
  let raf = 0;
  const ease = (k: number) => {
    if (target === null) return false;
    const cur = map.getZoom();
    const diff = target - cur;
    if (Math.abs(diff) < 0.004) { target = null; return false; }
    const at = anchor ? map.containerPointToLatLng(anchor) : map.getCenter();
    map.setZoomAround(at, cur + diff * k, { animate: false });
    return true;
  };
  const step = () => { raf = 0; if (ease(0.55)) raf = requestAnimationFrame(step); };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    const per = e.ctrlKey ? ZOOM_PX_PINCH : Math.abs(px) >= 100 ? ZOOM_PX_WHEEL : ZOOM_PX_TRACKPAD;
    const boost = e.ctrlKey ? 1 : Math.min(ZOOM_BOOST_MAX, 1 + Math.abs(px) / 60);
    const raw = (-px / per) * boost;
    const delta = Math.max(-ZOOM_MAX_PER_EVENT, Math.min(ZOOM_MAX_PER_EVENT, raw));
    const base = target === null ? map.getZoom() : target;
    target = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), base + delta));
    anchor = map.mouseEventToContainerPoint(e);
    ease(0.6); // первый шаг — прямо в событии, чтобы карта отзывалась сразу
    if (!raf) raf = requestAnimationFrame(step);
  };
  el.addEventListener("wheel", onWheel, { passive: false });

  map.on("zoomend moveend", () => h.onIdle());
  map.on("click", (e: any) => h.onMapClick(e.latlng.lat, e.latlng.lng));

  return {
    kind: "osm",
    destroy() {
      try { el.removeEventListener("wheel", onWheel as any); } catch {}
      if (raf) cancelAnimationFrame(raf);
      try { map.remove(); } catch {}
    },
    invalidate() { try { map.invalidateSize(); } catch {} },
    clearPins() { layer.clearLayers(); },
    addPin(lat, lng, node, onClick) {
      const m = L.marker([lat, lng], {
        icon: L.divIcon({ html: node, className: "", iconSize: [44, 44], iconAnchor: [22, 22] }),
        keyboard: false,
      });
      m.on("click", onClick);
      m.addTo(layer);
    },
    setRoute(coords) {
      if (line) { try { map.removeLayer(line); } catch {} line = null; }
      if (!coords || coords.length < 2) return;
      line = L.polyline(coords, { color: "#6366f1", weight: 2, opacity: 0.55, dashArray: "5 7" }).addTo(map);
    },
    fit(coords, maxZoom = 13) {
      if (!coords.length) return;
      try { map.flyToBounds(L.latLngBounds(coords), { padding: [46, 46], maxZoom, duration: 0.55 }); } catch {}
    },
    flyTo(lat, lng, zoom) {
      try { map.flyTo([lat, lng], zoom ?? map.getZoom(), { duration: 0.7 }); } catch {}
    },
    zoom() { return map.getZoom(); },
    size() { const s = map.getSize(); return { x: s.x, y: s.y }; },
    project(lat, lng) { const p = map.latLngToContainerPoint([lat, lng]); return { x: p.x, y: p.y }; },
    boundsZoom(coords, padding = 70) {
      try { return map.getBoundsZoom(L.latLngBounds(coords), false, L.point(padding, padding)); } catch { return map.getZoom(); }
    },
    setTheme() { /* у растровых плиток тема одна, ночь делается фильтром в CSS */ },
  };
}

// ============================================================
//  Apple Maps (MapKit JS)
// ============================================================

const MAPKIT_SRC = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";

// Загрузка и авторизация. Ключ Apple лежит на сервере: браузер получает лишь
// короткоживущий токен по адресу /api/mapkit-token.
async function loadMapkit(): Promise<any> {
  const w = window as any;
  if (w.__mapkitReady) return w.mapkit;

  if (!w.mapkit) {
    await new Promise<void>((resolve, reject) => {
      const el = document.createElement("script");
      el.src = MAPKIT_SRC;
      el.crossOrigin = "anonymous";
      el.onload = () => resolve();
      el.onerror = () => reject(new Error("mapkit script"));
      document.head.appendChild(el);
    });
  }
  const mapkit = w.mapkit;
  if (!mapkit) throw new Error("mapkit missing");

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("mapkit timeout")), 9000);
    const done = (ok: boolean, why?: string) => { clearTimeout(timer); ok ? resolve() : reject(new Error(why || "mapkit auth")); };
    try {
      mapkit.addEventListener("configuration-change", (e: any) => {
        if (e.status === "Initialized") done(true);
        else if (e.status === "Refreshed") done(true);
      });
      mapkit.addEventListener("error", (e: any) => done(false, e?.status || "error"));
      mapkit.init({
        authorizationCallback: (give: (t: string) => void) => {
          fetch("/api/mapkit-token")
            .then((r) => { if (!r.ok) throw new Error(`token ${r.status}`); return r.text(); })
            .then((t) => give(t))
            .catch((err) => done(false, String(err?.message || err)));
        },
        language: (document.documentElement.lang || "ru").slice(0, 2),
      });
    } catch (e: any) {
      done(false, String(e?.message || e));
    }
  });

  w.__mapkitReady = true;
  return mapkit;
}

async function createApple(el: HTMLElement, h: Handlers): Promise<MapEngine> {
  const mapkit = await loadMapkit();
  const dark = (() => {
    try {
      return document.documentElement.dataset.theme === "dark"
        || (!document.documentElement.dataset.theme && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    } catch { return false; }
  })();

  const map = new mapkit.Map(el, {
    showsMapTypeControl: false,
    showsCompass: mapkit.FeatureVisibility.Hidden,
    showsZoomControl: true,
    showsScale: mapkit.FeatureVisibility.Adaptive,
    isRotationEnabled: false,
    colorScheme: dark ? mapkit.Map.ColorSchemes.Dark : mapkit.Map.ColorSchemes.Light,
  });

  let overlay: any = null;
  const rect = () => el.getBoundingClientRect();

  map.addEventListener("region-change-end", () => h.onIdle());
  // Щелчок по пустому месту карты — координаты под курсором. У самих точек
  // обработчик свой, и он останавливает всплытие, чтобы не сработали оба.
  const onClick = (e: MouseEvent) => {
    try {
      const c = map.convertPointOnPageToCoordinate(new DOMPoint(e.pageX, e.pageY));
      if (c) h.onMapClick(c.latitude, c.longitude);
    } catch {}
  };
  el.addEventListener("click", onClick);

  const coord = (lat: number, lng: number) => new mapkit.Coordinate(lat, lng);

  const regionFor = (coords: LatLng[], maxZoom: number) => {
    const lats = coords.map((c) => c[0]);
    const lngs = coords.map((c) => c[1]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const width = el.clientWidth || 800;
    const minSpan = spanOfZoom(maxZoom, width); // не приближаемся ближе, чем просили
    const padLng = Math.max((maxLng - minLng) * 1.3, minSpan);
    const padLat = Math.max((maxLat - minLat) * 1.3, minSpan * ((el.clientHeight || 500) / width));
    return new mapkit.CoordinateRegion(
      coord((minLat + maxLat) / 2, (minLng + maxLng) / 2),
      new mapkit.CoordinateSpan(padLat, padLng),
    );
  };

  return {
    kind: "apple",
    destroy() {
      try { el.removeEventListener("click", onClick); } catch {}
      try { map.destroy(); } catch {}
    },
    invalidate() { /* MapKit сам следит за размером контейнера */ },
    clearPins() { try { map.removeAnnotations(map.annotations || []); } catch {} },
    addPin(lat, lng, node, onPinClick) {
      node.addEventListener("click", (ev) => { ev.stopPropagation(); onPinClick(); });
      const a = new mapkit.Annotation(coord(lat, lng), () => node, { anchorOffset: new DOMPoint(0, 0) });
      a.calloutEnabled = false;
      map.addAnnotation(a);
    },
    setRoute(coords) {
      if (overlay) { try { map.removeOverlay(overlay); } catch {} overlay = null; }
      if (!coords || coords.length < 2) return;
      try {
        overlay = new mapkit.PolylineOverlay(coords.map((c) => coord(c[0], c[1])), {
          style: new mapkit.Style({ lineWidth: 2, lineDash: [5, 7], strokeColor: "#6366f1", strokeOpacity: 0.55 }),
        });
        map.addOverlay(overlay);
      } catch {}
    },
    fit(coords, maxZoom = 13) {
      if (!coords.length) return;
      try { map.setRegionAnimated(regionFor(coords, maxZoom), true); } catch {}
    },
    flyTo(lat, lng, zoom) {
      try {
        const width = el.clientWidth || 800;
        const z = zoom ?? zoomOfSpan(map.region.span.longitudeDelta, width);
        const spanLng = spanOfZoom(z, width);
        const spanLat = spanLng * ((el.clientHeight || 500) / width);
        map.setRegionAnimated(new mapkit.CoordinateRegion(coord(lat, lng), new mapkit.CoordinateSpan(spanLat, spanLng)), true);
      } catch {}
    },
    zoom() {
      try { return zoomOfSpan(map.region.span.longitudeDelta, el.clientWidth || 800); } catch { return 3; }
    },
    size() { return { x: el.clientWidth, y: el.clientHeight }; },
    project(lat, lng) {
      try {
        const p = map.convertCoordinateToPointOnPage(coord(lat, lng));
        const r = rect();
        return { x: p.x - r.left - window.scrollX, y: p.y - r.top - window.scrollY };
      } catch {
        return { x: -1e6, y: -1e6 };
      }
    },
    boundsZoom(coords, padding = 70) {
      if (!coords.length) return 3;
      const width = Math.max((el.clientWidth || 800) - padding * 2, 100);
      const lngs = coords.map((c) => c[1]);
      const span = Math.max(Math.max(...lngs) - Math.min(...lngs), 1e-6);
      return zoomOfSpan(span, width);
    },
    setTheme(isDark) {
      try { map.colorScheme = isDark ? mapkit.Map.ColorSchemes.Dark : mapkit.Map.ColorSchemes.Light; } catch {}
    },
  };
}

// Apple может не ответить: не оплачен аккаунт разработчика, не заведён ключ,
// сеть. Тогда молча возвращаемся к OpenStreetMap — карта важнее подложки.
export async function createEngine(kind: "osm" | "apple", el: HTMLElement, h: Handlers): Promise<MapEngine> {
  // Контейнер мог остаться от прежней подложки: обе библиотеки вешают в него
  // свою разметку и свои классы, и вторая на чужих следах ведёт себя странно.
  try {
    el.innerHTML = "";
    el.className = el.className.split(/\s+/).filter((c) => c && !/^(leaflet|mk)-/.test(c)).join(" ");
    el.removeAttribute("style");
  } catch {}

  if (kind === "apple") {
    try {
      return await createApple(el, h);
    } catch (e) {
      console.error("apple maps", e);
      return createOsm(el, h);
    }
  }
  return createOsm(el, h);
}
