"use client";

import { useState } from "react";

type Stats = { entries: number; days: number; voice: number; deeds: number; dreamsDone: number };
type Period = { key: string; title: string; stats: Stats };

const STR: Record<string, any> = {
  ru: { lblEntries: "Записи", lblDays: "Дни", lblVoice: "Голосовые", lblDeeds: "Добрые дела", lblDreams: "Мечты сбылись", lblStreak: "Серия", tagline: "Записываю свою жизнь во времени", share: "Поделиться", download: "Скачать картинку", shareText: "Веду свою жизнь в LIFE OS. Вот мои итоги:", viaLink: "Или ссылкой:", periodMonth: "Месяц", periodYear: "Год", periodAll: "Всё время", preview: "Так увидят друзья" },
  en: { lblEntries: "Entries", lblDays: "Days", lblVoice: "Voice notes", lblDeeds: "Good deeds", lblDreams: "Dreams come true", lblStreak: "Streak", tagline: "Capturing my life over time", share: "Share", download: "Download image", shareText: "I journal my life in LIFE OS. Here are my numbers:", viaLink: "Or via link:", periodMonth: "Month", periodYear: "Year", periodAll: "All time", preview: "What friends will see" },
  uk: { lblEntries: "Записи", lblDays: "Дні", lblVoice: "Голосові", lblDeeds: "Добрі справи", lblDreams: "Мрії збулися", lblStreak: "Серія", tagline: "Записую своє життя у часі", share: "Поділитися", download: "Завантажити картинку", shareText: "Веду своє життя в LIFE OS. Ось мої підсумки:", viaLink: "Або посиланням:", periodMonth: "Місяць", periodYear: "Рік", periodAll: "Весь час", preview: "Так побачать друзі" },
  fr: { lblEntries: "Entrées", lblDays: "Jours", lblVoice: "Vocaux", lblDeeds: "Bonnes actions", lblDreams: "Rêves réalisés", lblStreak: "Série", tagline: "Je capture ma vie dans le temps", share: "Partager", download: "Télécharger l'image", shareText: "Je tiens le journal de ma vie sur LIFE OS. Voici mon bilan :", viaLink: "Ou par lien :", periodMonth: "Mois", periodYear: "Année", periodAll: "Tout", preview: "Ce que verront tes amis" },
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Карточка достижений в SVG (без внешних шрифтов/картинок — чтобы безопасно растеризовать в PNG).
function buildSvg(title: string, tiles: { n: number; label: string }[], tagline: string, host: string) {
  const W = 1080, H = 1350;
  const tileW = 440, tileH = 290, gap = 40, x0 = 80, y0 = 480;
  const tilesSvg = tiles.slice(0, 4).map((t, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = x0 + col * (tileW + gap);
    const y = y0 + row * (tileH + gap);
    return `<rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" rx="28" fill="#ffffff" fill-opacity="0.14"/>
      <text x="${x + 40}" y="${y + 165}" font-size="100" font-weight="800" fill="#ffffff" font-family="-apple-system, Arial, sans-serif">${t.n}</text>
      <text x="${x + 42}" y="${y + 228}" font-size="34" fill="#ffffff" fill-opacity="0.88" font-family="-apple-system, Arial, sans-serif">${esc(t.label)}</text>`;
  }).join("\n");
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#7c6ff0"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="80" y="150" font-size="42" font-weight="700" letter-spacing="5" fill="#ffffff" fill-opacity="0.85" font-family="-apple-system, Arial, sans-serif">LIFE OS</text>
  <text x="80" y="320" font-size="78" font-weight="800" fill="#ffffff" font-family="-apple-system, Arial, sans-serif">${esc(title)}</text>
  ${tilesSvg}
  <text x="80" y="1235" font-size="36" fill="#ffffff" fill-opacity="0.92" font-family="-apple-system, Arial, sans-serif">${esc(tagline)}</text>
  <text x="80" y="1290" font-size="30" fill="#ffffff" fill-opacity="0.7" font-family="-apple-system, Arial, sans-serif">${esc(host)}</text>
</svg>`;
}

function tilesFor(s: Stats, L: any) {
  const out = [{ n: s.entries, label: L.lblEntries }, { n: s.days, label: L.lblDays }];
  if (s.voice > 0) out.push({ n: s.voice, label: L.lblVoice });
  if (s.deeds > 0) out.push({ n: s.deeds, label: L.lblDeeds });
  if (s.dreamsDone > 0) out.push({ n: s.dreamsDone, label: L.lblDreams });
  return out.slice(0, 4);
}

async function svgToBlob(svg: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 1080; c.height = 1350;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("no ctx"));
      ctx.drawImage(img, 0, 0, 1080, 1350);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("no blob"))), "image/png");
    };
    img.onerror = () => reject(new Error("img error"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

export default function ShareCard({ periods, streak, host, refLink, locale }: { periods: Period[]; streak: number; host: string; refLink: string; locale: string }) {
  const L = STR[locale] || STR.ru;
  const [pi, setPi] = useState(0);
  const [busy, setBusy] = useState(false);

  const period = periods[pi];
  const tiles = tilesFor(period.stats, L);
  // серию добавляем последним тайлом, если есть место и она есть
  if (streak > 1 && tiles.length < 4) tiles.push({ n: streak, label: L.lblStreak });
  const svg = buildSvg(period.title, tiles, L.tagline, host);
  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

  const periodLabels = [L.periodMonth, L.periodYear, L.periodAll];
  const text = `${L.shareText} ${tiles.map((t) => `${t.n} ${t.label.toLowerCase()}`).join(" · ")}`;
  const tgLink = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(text + " " + refLink)}`;

  async function doDownload() {
    setBusy(true);
    try {
      const blob = await svgToBlob(svg);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `lifeos-${period.key}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      setBusy(false);
    }
  }

  async function doShare() {
    setBusy(true);
    try {
      const blob = await svgToBlob(svg);
      const file = new File([blob], "lifeos.png", { type: "image/png" });
      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text, url: refLink }).catch(() => {});
      } else {
        await doDownload();
      }
    } finally {
      setBusy(false);
    }
  }

  const tab: any = (active: boolean) => ({ fontSize: 13, padding: "7px 14px", borderRadius: 9, border: "1px solid var(--border)", background: active ? "var(--accent)" : "var(--surface)", color: active ? "#fff" : "var(--text-2)", cursor: "pointer", fontWeight: active ? 600 : 400 });
  const btn: any = (primary: boolean) => ({ flex: 1, minWidth: 150, fontSize: 14, fontWeight: 500, padding: "12px", borderRadius: 11, border: primary ? "none" : "1px solid var(--border)", background: primary ? "var(--accent)" : "var(--surface)", color: primary ? "#fff" : "var(--text)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 });

  return (
    <div>
      {/* выбор периода */}
      <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {periods.map((p, i) => (
          <button key={p.key} onClick={() => setPi(i)} style={tab(i === pi)}>{periodLabels[i]}</button>
        ))}
      </div>

      {/* превью карточки */}
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 7 }}>{L.preview}</div>
      <div style={{ maxWidth: 340, margin: "0 0 18px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="" style={{ width: "100%", borderRadius: 16, display: "block", boxShadow: "0 10px 30px rgba(79,70,229,.25)" }} />
      </div>

      {/* действия */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 480, marginBottom: 16 }}>
        <button disabled={busy} onClick={doShare} style={btn(true)}>
          <i className="ti ti-share-2" style={{ fontSize: 17 }} />{L.share}
        </button>
        <button disabled={busy} onClick={doDownload} style={btn(false)}>
          <i className="ti ti-download" style={{ fontSize: 17 }} />{L.download}
        </button>
      </div>

      {/* шеринг ссылкой (для десктопа / текстом) */}
      <div style={{ fontSize: 12.5, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span>{L.viaLink}</span>
        <a href={tgLink} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 5 }}><i className="ti ti-brand-telegram" style={{ fontSize: 16 }} />Telegram</a>
        <a href={waLink} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 5 }}><i className="ti ti-brand-whatsapp" style={{ fontSize: 16 }} />WhatsApp</a>
      </div>
    </div>
  );
}
