"use client";

import { useState } from "react";

type Prefill = {
  progress: { title: string; from: string; to: string; unit: string } | null;
  dreams: string[];
  thoughts: string[];
};

const STR: Record<string, any> = {
  ru: {
    kCustom: "Своё", kProgress: "Прогресс", kDream: "Мечта", kThought: "Мысль",
    fHeadline: "Заголовок", fBig: "Число (необязательно)", fSub: "Подпись (необязательно)", fTitle: "Что измеряешь", fFrom: "Было", fTo: "Стало", fUnit: "Единица",
    phHeadline: "Например: Пробежал первый марафон", phBig: "42 км", phSub: "и это только начало", phDream: "Например: Съездил в Японию", phThought: "Красивая мысль или вывод",
    emoji: "Эмодзи", color: "Цвет", fillDream: "Из твоих сбывшихся мечт:", fillThought: "Из твоих записей:", pick: "выбрать…",
    lblDream: "Сбылось", lblThought: "Моя мысль",
    preview: "Так увидят друзья", share: "Поделиться", download: "Скачать картинку", shareText: "Мой момент в LIFE OS:", viaLink: "Или ссылкой:",
    tagline: "Записываю свою жизнь во времени",
  },
  en: {
    kCustom: "Custom", kProgress: "Progress", kDream: "Dream", kThought: "Thought",
    fHeadline: "Headline", fBig: "Number (optional)", fSub: "Caption (optional)", fTitle: "What you track", fFrom: "From", fTo: "To", fUnit: "Unit",
    phHeadline: "e.g. Ran my first marathon", phBig: "42 km", phSub: "and it's just the start", phDream: "e.g. Visited Japan", phThought: "A beautiful thought or takeaway",
    emoji: "Emoji", color: "Color", fillDream: "From your dreams come true:", fillThought: "From your entries:", pick: "pick…",
    lblDream: "Came true", lblThought: "My thought",
    preview: "What friends will see", share: "Share", download: "Download image", shareText: "My moment on LIFE OS:", viaLink: "Or via link:",
    tagline: "Capturing my life over time",
  },
  uk: {
    kCustom: "Своє", kProgress: "Прогрес", kDream: "Мрія", kThought: "Думка",
    fHeadline: "Заголовок", fBig: "Число (необов'язково)", fSub: "Підпис (необов'язково)", fTitle: "Що вимірюєш", fFrom: "Було", fTo: "Стало", fUnit: "Одиниця",
    phHeadline: "Напр.: Пробіг перший марафон", phBig: "42 км", phSub: "і це лише початок", phDream: "Напр.: З'їздив до Японії", phThought: "Гарна думка або висновок",
    emoji: "Емодзі", color: "Колір", fillDream: "З твоїх здійснених мрій:", fillThought: "З твоїх записів:", pick: "обрати…",
    lblDream: "Збулося", lblThought: "Моя думка",
    preview: "Так побачать друзі", share: "Поділитися", download: "Завантажити картинку", shareText: "Мій момент у LIFE OS:", viaLink: "Або посиланням:",
    tagline: "Записую своє життя у часі",
  },
  fr: {
    kCustom: "Perso", kProgress: "Progrès", kDream: "Rêve", kThought: "Pensée",
    fHeadline: "Titre", fBig: "Nombre (optionnel)", fSub: "Légende (optionnel)", fTitle: "Ce que tu suis", fFrom: "De", fTo: "À", fUnit: "Unité",
    phHeadline: "Ex. : Mon premier marathon", phBig: "42 km", phSub: "et ce n'est que le début", phDream: "Ex. : Voyagé au Japon", phThought: "Une belle pensée ou un constat",
    emoji: "Emoji", color: "Couleur", fillDream: "Parmi tes rêves réalisés :", fillThought: "Parmi tes entrées :", pick: "choisir…",
    lblDream: "Réalisé", lblThought: "Ma pensée",
    preview: "Ce que verront tes amis", share: "Partager", download: "Télécharger l'image", shareText: "Mon moment sur LIFE OS :", viaLink: "Ou par lien :",
    tagline: "Je capture ma vie dans le temps",
  },
  es: {
    kCustom: "Personalizado", kProgress: "Progreso", kDream: "Sueño", kThought: "Pensamiento",
    fHeadline: "Título", fBig: "Número (opcional)", fSub: "Leyenda (opcional)", fTitle: "Qué mides", fFrom: "Antes", fTo: "Ahora", fUnit: "Unidad",
    phHeadline: "Ej.: Corrí mi primer maratón", phBig: "42 km", phSub: "y esto es solo el comienzo", phDream: "Ej.: Visité Japón", phThought: "Un pensamiento o conclusión bonita",
    emoji: "Emoji", color: "Color", fillDream: "De tus sueños cumplidos:", fillThought: "De tus entradas:", pick: "elegir…",
    lblDream: "Cumplido", lblThought: "Mi pensamiento",
    preview: "Así lo verán tus amigos", share: "Compartir", download: "Descargar imagen", shareText: "Mi momento en LIFE OS:", viaLink: "O por enlace:",
    tagline: "Registrando mi vida a través del tiempo",
  },
};

const ACCENTS: Record<string, [string, string]> = {
  indigo: ["#4f46e5", "#7c6ff0"], green: ["#0f9d6e", "#34d399"], amber: ["#c2620a", "#f59e0b"], pink: ["#be1d6a", "#f472b6"], dark: ["#111827", "#374151"],
};
const EMOJIS = ["🏆", "🔥", "💪", "🎯", "✨", "🏃", "📚", "❤️", "🌱", "⭐", "🎉", "🧘"];

function esc(s: string) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = []; let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) lines[maxLines - 1] = lines[maxLines - 1].replace(/.{1}$/, "…");
  return lines;
}

function buildSvg(o: { label?: string; emoji?: string; headline: string; value?: string; sub?: string; accent: string; host: string }) {
  const [c1, c2] = ACCENTS[o.accent] || ACCENTS.indigo;
  const W = 1080, H = 1350;
  const F = `font-family="-apple-system, Segoe UI, Roboto, Arial, sans-serif"`;
  const parts: string[] = [];
  parts.push(`<text x="80" y="148" font-size="40" font-weight="700" letter-spacing="5" fill="#ffffff" fill-opacity="0.85" ${F}>LIFE OS</text>`);
  let y = 300;
  if (o.emoji) { parts.push(`<text x="76" y="320" font-size="150" ${F}>${esc(o.emoji)}</text>`); y = 470; }
  if (o.label) { parts.push(`<text x="82" y="${y}" font-size="38" fill="#ffffff" fill-opacity="0.82" ${F}>${esc(o.label)}</text>`); y += 78; }
  for (const line of wrap(o.headline, 16, 3)) { parts.push(`<text x="80" y="${y + 80}" font-size="88" font-weight="800" fill="#ffffff" ${F}>${esc(line)}</text>`); y += 112; }
  if (o.value) { y += 24; parts.push(`<text x="80" y="${y + 130}" font-size="150" font-weight="800" fill="#ffffff" ${F}>${esc(o.value)}</text>`); y += 180; }
  if (o.sub) { y += 8; for (const line of wrap(o.sub, 30, 2)) { parts.push(`<text x="82" y="${y + 46}" font-size="42" fill="#ffffff" fill-opacity="0.9" ${F}>${esc(line)}</text>`); y += 58; } }
  parts.push(`<text x="80" y="1290" font-size="30" fill="#ffffff" fill-opacity="0.7" ${F}>${esc(o.host)}</text>`);
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>${parts.join("")}</svg>`;
}

async function svgToBlob(svg: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = 1080; c.height = 1350;
      const ctx = c.getContext("2d"); if (!ctx) return reject(new Error("no ctx"));
      ctx.drawImage(img, 0, 0, 1080, 1350);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("no blob"))), "image/png");
    };
    img.onerror = () => reject(new Error("img error"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

export default function ShareCard({ prefill, host, refLink, locale }: { prefill: Prefill; host: string; refLink: string; locale: string }) {
  const L = STR[locale] || STR.ru;
  const [kind, setKind] = useState<"custom" | "progress" | "dream" | "thought">("custom");
  const [accent, setAccent] = useState("indigo");
  const [busy, setBusy] = useState(false);

  // поля
  const [headline, setHeadline] = useState("");
  const [big, setBig] = useState("");
  const [sub, setSub] = useState("");
  const [emoji, setEmoji] = useState("🏆");
  const [pTitle, setPTitle] = useState(prefill.progress?.title || "");
  const [pFrom, setPFrom] = useState(prefill.progress?.from || "");
  const [pTo, setPTo] = useState(prefill.progress?.to || "");
  const [pUnit, setPUnit] = useState(prefill.progress?.unit || "");
  const [dream, setDream] = useState(prefill.dreams[0] || "");
  const [thought, setThought] = useState(prefill.thoughts[0] || "");

  // собрать опции карточки из текущего типа
  let opts: any = { accent, host, emoji };
  if (kind === "custom") {
    opts = { ...opts, headline: headline || L.phHeadline, value: big || undefined, sub: sub || undefined };
  } else if (kind === "progress") {
    const from = parseFloat(pFrom.replace(",", ".")), to = parseFloat(pTo.replace(",", "."));
    const delta = isFinite(from) && isFinite(to) ? Math.round((to - from) * 10) / 10 : null;
    opts = { ...opts, emoji: emoji || "💪", headline: pTitle || L.fTitle, value: `${pFrom || "—"} → ${pTo || "—"}`, sub: delta != null ? `${delta > 0 ? "+" : ""}${delta} ${pUnit}` : pUnit };
  } else if (kind === "dream") {
    opts = { ...opts, emoji: "✨", label: L.lblDream, headline: dream || L.phDream };
  } else {
    opts = { ...opts, emoji: "💭", label: L.lblThought, headline: `«${thought || L.phThought}»` };
  }
  const svg = buildSvg(opts);
  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const text = `${L.shareText} ${opts.headline}${opts.value ? " — " + opts.value : ""}`;
  const tgLink = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(text + " " + refLink)}`;

  async function doDownload() {
    setBusy(true);
    try {
      const blob = await svgToBlob(svg);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `lifeos-${kind}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally { setBusy(false); }
  }
  async function doShare() {
    setBusy(true);
    try {
      const blob = await svgToBlob(svg);
      const file = new File([blob], "lifeos.png", { type: "image/png" });
      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [file] })) await nav.share({ files: [file], text, url: refLink }).catch(() => {});
      else await doDownload();
    } finally { setBusy(false); }
  }

  const kinds: { k: any; label: string; icon: string }[] = [
    { k: "custom", label: L.kCustom, icon: "ti-pencil" },
    { k: "progress", label: L.kProgress, icon: "ti-trending-up" },
    { k: "dream", label: L.kDream, icon: "ti-sparkles" },
    { k: "thought", label: L.kThought, icon: "ti-quote" },
  ];
  const inp: any = { fontSize: 14, padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", width: "100%", boxSizing: "border-box" };
  const lbl: any = { fontSize: 12, color: "var(--text-2)", marginBottom: 4 };
  const tab = (active: boolean): any => ({ fontSize: 12.5, padding: "8px 13px", borderRadius: 9, border: "1px solid " + (active ? "var(--accent)" : "var(--border)"), background: active ? "var(--accent)" : "var(--surface)", color: active ? "#fff" : "var(--text-2)", cursor: "pointer", fontWeight: active ? 600 : 400, display: "inline-flex", alignItems: "center", gap: 6 });
  const btn = (primary: boolean): any => ({ flex: 1, minWidth: 150, fontSize: 14, fontWeight: 500, padding: "12px", borderRadius: 11, border: primary ? "none" : "1px solid var(--border)", background: primary ? "var(--accent)" : "var(--surface)", color: primary ? "#fff" : "var(--text)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 });

  return (
    <div>
      {/* тип карточки */}
      <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {kinds.map((x) => <button key={x.k} onClick={() => setKind(x.k)} style={tab(kind === x.k)}><i className={`ti ${x.icon}`} style={{ fontSize: 15 }} />{x.label}</button>)}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 22, alignItems: "start" }}>
        {/* редактор полей */}
        <div style={{ flex: "1 1 300px", minWidth: 0, maxWidth: 420 }}>
          {kind === "custom" && (
            <>
              <div style={lbl}>{L.fHeadline}</div>
              <input value={headline} onChange={(e) => setHeadline(e.target.value.slice(0, 60))} placeholder={L.phHeadline} style={{ ...inp, marginBottom: 11 }} />
              <div style={{ display: "flex", gap: 10, marginBottom: 11 }}>
                <div style={{ flex: 1 }}><div style={lbl}>{L.fBig}</div><input value={big} onChange={(e) => setBig(e.target.value.slice(0, 20))} placeholder={L.phBig} style={inp} /></div>
              </div>
              <div style={lbl}>{L.fSub}</div>
              <input value={sub} onChange={(e) => setSub(e.target.value.slice(0, 60))} placeholder={L.phSub} style={{ ...inp, marginBottom: 11 }} />
            </>
          )}
          {kind === "progress" && (
            <>
              <div style={lbl}>{L.fTitle}</div>
              <input value={pTitle} onChange={(e) => setPTitle(e.target.value.slice(0, 30))} placeholder={L.fTitle} style={{ ...inp, marginBottom: 11 }} />
              <div style={{ display: "flex", gap: 10, marginBottom: 11 }}>
                <div style={{ flex: 1 }}><div style={lbl}>{L.fFrom}</div><input value={pFrom} onChange={(e) => setPFrom(e.target.value.slice(0, 10))} placeholder="65" style={inp} /></div>
                <div style={{ flex: 1 }}><div style={lbl}>{L.fTo}</div><input value={pTo} onChange={(e) => setPTo(e.target.value.slice(0, 10))} placeholder="61" style={inp} /></div>
                <div style={{ width: 90 }}><div style={lbl}>{L.fUnit}</div><input value={pUnit} onChange={(e) => setPUnit(e.target.value.slice(0, 8))} placeholder="кг" style={inp} /></div>
              </div>
            </>
          )}
          {kind === "dream" && (
            <>
              <div style={lbl}>{L.fHeadline}</div>
              <input value={dream} onChange={(e) => setDream(e.target.value.slice(0, 60))} placeholder={L.phDream} style={{ ...inp, marginBottom: 8 }} />
              {prefill.dreams.length > 0 && (
                <select onChange={(e) => e.target.value && setDream(e.target.value)} value="" style={{ ...inp, marginBottom: 11, cursor: "pointer", color: "var(--text-2)" }}>
                  <option value="">{L.fillDream}</option>
                  {prefill.dreams.map((d, i) => <option key={i} value={d}>{d.slice(0, 50)}</option>)}
                </select>
              )}
            </>
          )}
          {kind === "thought" && (
            <>
              <div style={lbl}>{L.fHeadline}</div>
              <textarea value={thought} onChange={(e) => setThought(e.target.value.slice(0, 120))} placeholder={L.phThought} rows={2} style={{ ...inp, marginBottom: 8, resize: "vertical", fontFamily: "inherit", lineHeight: 1.45 }} />
              {prefill.thoughts.length > 0 && (
                <select onChange={(e) => e.target.value && setThought(e.target.value)} value="" style={{ ...inp, marginBottom: 11, cursor: "pointer", color: "var(--text-2)" }}>
                  <option value="">{L.fillThought}</option>
                  {prefill.thoughts.map((d, i) => <option key={i} value={d}>{d.slice(0, 50)}</option>)}
                </select>
              )}
            </>
          )}

          {/* эмодзи (для своё/прогресс) */}
          {(kind === "custom" || kind === "progress") && (
            <>
              <div style={lbl}>{L.emoji}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                {EMOJIS.map((em) => (
                  <button key={em} onClick={() => setEmoji(em === emoji ? "" : em)} style={{ fontSize: 18, width: 36, height: 36, borderRadius: 8, border: `1px solid ${em === emoji ? "var(--accent)" : "var(--border)"}`, background: em === emoji ? "var(--accent-bg)" : "var(--surface)", cursor: "pointer" }}>{em}</button>
                ))}
              </div>
            </>
          )}

          {/* цвет */}
          <div style={lbl}>{L.color}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            {Object.keys(ACCENTS).map((k) => (
              <button key={k} onClick={() => setAccent(k)} aria-label={k} style={{ width: 34, height: 34, borderRadius: 9, cursor: "pointer", border: accent === k ? "3px solid var(--text)" : "1px solid var(--border)", background: `linear-gradient(135deg, ${ACCENTS[k][0]}, ${ACCENTS[k][1]})` }} />
            ))}
          </div>
        </div>

        {/* превью */}
        <div style={{ flex: "1 1 220px", minWidth: 0, maxWidth: 280 }}>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 7 }}>{L.preview}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="" style={{ width: "100%", borderRadius: 16, display: "block", boxShadow: "0 10px 30px rgba(79,70,229,.22)" }} />
        </div>
      </div>

      {/* действия */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 480, margin: "18px 0 14px" }}>
        <button disabled={busy} onClick={doShare} style={btn(true)}><i className="ti ti-share-2" style={{ fontSize: 17 }} />{L.share}</button>
        <button disabled={busy} onClick={doDownload} style={btn(false)}><i className="ti ti-download" style={{ fontSize: 17 }} />{L.download}</button>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span>{L.viaLink}</span>
        <a href={tgLink} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 5 }}><i className="ti ti-brand-telegram" style={{ fontSize: 16 }} />Telegram</a>
        <a href={waLink} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 5 }}><i className="ti ti-brand-whatsapp" style={{ fontSize: 16 }} />WhatsApp</a>
      </div>
    </div>
  );
}
