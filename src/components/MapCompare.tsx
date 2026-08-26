"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";

// Витрина подложек карты: одно и то же место, твои же точки — в четырёх
// исполнениях. Страница временная, чтобы выбрать глазами, а не по описанию.

export type CmpPoint = { lat: number; lng: number; url: string | null };

const CSS = `
.cmp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 16px; }
.cmp-box { border: 1px solid var(--border); border-radius: 13px; overflow: hidden; background: var(--surface); }
.cmp-map { height: 340px; width: 100%; background: #e8eef2; }
.cmp-head { padding: 11px 14px 9px; }
.cmp-title { font-size: 14px; font-weight: 650; color: var(--text); display: flex; align-items: center; gap: 8px; }
.cmp-sub { font-size: 12.5px; color: var(--text-3); margin-top: 3px; line-height: 1.45; }
.cmp-tag { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: #E1F5EE; color: #0F6E56; }
.cmp-tag.pay { background: #FDE7E7; color: #b91c1c; }
.cmp-pin { width: 34px; height: 34px; border-radius: 50%; overflow: hidden; border: 2px solid #fff; box-shadow: 0 2px 7px rgba(0,0,0,.35); background: #7c8b96; }
.cmp-pin img { width: 100%; height: 100%; object-fit: cover; display: block; }
`;

// Подписи на карте — на русском там, где они есть в данных.
function ruLabels(map: any) {
  try {
    for (const l of map.getStyle().layers || []) {
      if (l.type === "symbol" && (l.layout as any)?.["text-field"]) {
        map.setLayoutProperty(l.id, "text-field", ["coalesce", ["get", "name:ru"], ["get", "name:latin"], ["get", "name"]]);
      }
    }
  } catch {}
}

function pinEl(url: string | null) {
  const d = document.createElement("div");
  d.className = "cmp-pin";
  if (url) {
    const img = document.createElement("img");
    img.src = url;
    d.appendChild(img);
  }
  return d;
}

export default function MapCompare({ points }: { points: CmpPoint[] }) {
  const [note, setNote] = useState("");
  const osmRef = useRef<HTMLDivElement | null>(null);
  const satRef = useRef<HTMLDivElement | null>(null);
  const libRef = useRef<HTMLDivElement | null>(null);
  const darkRef = useRef<HTMLDivElement | null>(null);
  const syncing = useRef(false);

  useEffect(() => {
    let cleanup: Array<() => void> = [];
    (async () => {
      const L = (await import("leaflet")).default;
      const gl = (await import("maplibre-gl")).default;

      const center: [number, number] = points.length
        ? [points[points.length - 1].lat, points[points.length - 1].lng]
        : [64.1466, -21.9426];
      const zoom = 13;

      const leafMaps: any[] = [];
      const glMaps: any[] = [];

      // ==== Растровые (как сейчас) ====
      const mkLeaflet = (el: HTMLDivElement, url: string, maxZoom: number) => {
        const m = L.map(el, { zoomSnap: 0, attributionControl: true }).setView(center, zoom);
        L.tileLayer(url, { maxZoom }).addTo(m);
        for (const p of points) {
          L.marker([p.lat, p.lng], { icon: L.divIcon({ html: pinEl(p.url), className: "", iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(m);
        }
        m.on("move", () => {
          if (syncing.current) return;
          syncing.current = true;
          const c = m.getCenter(), z = m.getZoom();
          for (const o of leafMaps) if (o !== m) o.setView([c.lat, c.lng], z, { animate: false });
          for (const o of glMaps) o.jumpTo({ center: [c.lng, c.lat], zoom: z });
          syncing.current = false;
        });
        leafMaps.push(m);
        cleanup.push(() => { try { m.remove(); } catch {} });
        setTimeout(() => m.invalidateSize(), 80);
        return m;
      };

      if (osmRef.current) mkLeaflet(osmRef.current, "https://tile.openstreetmap.org/{z}/{x}/{y}.png", 19);
      if (satRef.current) mkLeaflet(satRef.current, "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", 19);

      // ==== Векторные ====
      const mkGl = (el: HTMLDivElement, style: string) => {
        const m = new gl.Map({ container: el, style, center: [center[1], center[0]], zoom });
        m.on("load", () => {
          ruLabels(m);
          for (const p of points) new gl.Marker({ element: pinEl(p.url) }).setLngLat([p.lng, p.lat]).addTo(m);
        });
        m.on("move", () => {
          if (syncing.current) return;
          syncing.current = true;
          const c = m.getCenter(), z = m.getZoom();
          for (const o of glMaps) if (o !== m) o.jumpTo({ center: [c.lng, c.lat], zoom: z });
          for (const o of leafMaps) o.setView([c.lat, c.lng], z, { animate: false });
          syncing.current = false;
        });
        glMaps.push(m);
        cleanup.push(() => { try { m.remove(); } catch {} });
        return m;
      };

      if (libRef.current) mkGl(libRef.current, "https://tiles.openfreemap.org/styles/liberty");
      if (darkRef.current) mkGl(darkRef.current, "https://tiles.openfreemap.org/styles/dark");

      setNote(points.length ? `На всех картах — твои ${points.length} точек и один и тот же вид: подвинешь одну, поедут остальные.` : "Точек пока нет — карты показывают Рейкьявик.");
    })();
    return () => { cleanup.forEach((f) => f()); cleanup = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Box = ({ title, tag, pay, sub, inner }: any) => (
    <div className="cmp-box">
      <div ref={inner} className="cmp-map" />
      <div className="cmp-head">
        <div className="cmp-title">{title}<span className={`cmp-tag ${pay ? "pay" : ""}`}>{tag}</span></div>
        <div className="cmp-sub">{sub}</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      {note && <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>{note}</div>}
      <div className="cmp-grid">
        <Box
          inner={osmRef} title="Как сейчас — OpenStreetMap" tag="бесплатно"
          sub="Картинки, нарисованные заранее. На ретине мылят, подписи на местном языке (Ísland, Sverige), тёмной версии нет."
        />
        <Box
          inner={libRef} title="Векторная — OpenFreeMap Liberty" tag="бесплатно"
          sub="Карта рисуется у тебя в браузере: чёткая на любом масштабе, зум непрерывный, подписи можно попросить по-русски. Ключи и счета не нужны."
        />
        <Box
          inner={darkRef} title="Векторная тёмная — OpenFreeMap Dark" tag="бесплатно"
          sub="Та же карта для ночной темы приложения. Сейчас тёмный режим делается фильтром поверх светлых картинок — выглядит серо."
        />
        <Box
          inner={satRef} title="Спутник — Esri World Imagery" tag="только личное" pay
          sub="Вид со спутника: дом, пляж и двор видно буквально. Бесплатен для личного использования; для платного продукта нужна лицензия Esri."
        />
      </div>
    </>
  );
}
