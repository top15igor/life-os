"use client";

import { useState, useRef } from "react";

type Dream = { id: string; sphere: string; text: string; emoji?: string; image_url?: string; status: string; created_at: string };

const SPHERES = [
  { key: "home", icon: "ti-home", c: "#0F6E56", bg: "#E1F5EE" },
  { key: "transport", icon: "ti-car", c: "#185FA5", bg: "#E6F1FB" },
  { key: "body", icon: "ti-barbell", c: "#993C1D", bg: "#FAECE7" },
  { key: "travel", icon: "ti-plane", c: "#854F0B", bg: "#FAEEDA" },
  { key: "family", icon: "ti-heart", c: "#993556", bg: "#FBEAF0" },
  { key: "business", icon: "ti-rocket", c: "#534AB7", bg: "#EEEDFE" },
  { key: "money", icon: "ti-coin", c: "#3B6D11", bg: "#EAF3DE" },
  { key: "growth", icon: "ti-seedling", c: "#0F6E56", bg: "#E1F5EE" },
  { key: "other", icon: "ti-sparkles", c: "#5F5E5A", bg: "#F1EFE8" },
];

const STR: Record<string, any> = {
  ru: {
    title: "Карта желаний", subtitle: "AI собирает твои мечты из дневника и голосовых — и помогает превращать их в реальность.",
    center: "Моя карта желаний", statAll: "всего мечт", statSpheres: "сфер жизни", statProgress: "в работе", viewMap: "Карта", viewList: "Список",
    add: "Добавить мечту", ph: "О чём мечтаешь? Например «Дом у моря»", emojiPh: "🙂", photo: "Фото", save: "Добавить", cancel: "Отмена",
    sph: { home: "Жильё", transport: "Транспорт", body: "Тело и здоровье", travel: "Путешествия", family: "Семья", business: "Дело", money: "Деньги", growth: "Развитие", other: "Другое" },
    status: { dream: "Мечтаю", progress: "В процессе", done: "Сбылось ✨" },
    makeGoal: "В цели", del: "Удалить",
    empty: "Здесь живёт карта твоих мечт. Добавь первую — или просто наговори боту «мечтаю…», и она появится сама.",
    emptyHint: "Например: дом у моря, своя машина, путешествие в Японию, сильное тело…",
  },
  en: {
    title: "Wish Map", subtitle: "AI gathers your dreams from the diary and voice notes — and helps turn them real.",
    center: "My Wish Map", statAll: "dreams total", statSpheres: "life areas", statProgress: "in progress", viewMap: "Map", viewList: "List",
    add: "Add a dream", ph: "What do you dream of? e.g. “A house by the sea”", emojiPh: "🙂", photo: "Photo", save: "Add", cancel: "Cancel",
    sph: { home: "Home", transport: "Transport", body: "Body & health", travel: "Travel", family: "Family", business: "Work", money: "Money", growth: "Growth", other: "Other" },
    status: { dream: "Dreaming", progress: "In progress", done: "Came true ✨" },
    makeGoal: "To goals", del: "Delete",
    empty: "This is your dream map. Add the first one — or just say “I dream of…” to the bot and it appears by itself.",
    emptyHint: "E.g.: a house by the sea, my own car, a trip to Japan, a strong body…",
  },
  uk: {
    title: "Карта бажань", subtitle: "AI збирає твої мрії з щоденника й голосових — і допомагає втілювати їх.",
    center: "Моя карта бажань", statAll: "усього мрій", statSpheres: "сфер життя", statProgress: "у роботі", viewMap: "Карта", viewList: "Список",
    add: "Додати мрію", ph: "Про що мрієш? Напр. «Дім біля моря»", emojiPh: "🙂", photo: "Фото", save: "Додати", cancel: "Скасувати",
    sph: { home: "Житло", transport: "Транспорт", body: "Тіло і здоров'я", travel: "Подорожі", family: "Сім'я", business: "Справа", money: "Гроші", growth: "Розвиток", other: "Інше" },
    status: { dream: "Мрію", progress: "У процесі", done: "Збулося ✨" },
    makeGoal: "У цілі", del: "Видалити",
    empty: "Тут живе карта твоїх мрій. Додай першу — або просто наговори боту «мрію…», і вона з'явиться сама.",
    emptyHint: "Наприклад: дім біля моря, своя машина, подорож до Японії, сильне тіло…",
  },
  fr: {
    title: "Carte des rêves", subtitle: "L'IA réunit tes rêves du journal et des notes vocales — et aide à les réaliser.",
    center: "Ma carte des rêves", statAll: "rêves au total", statSpheres: "domaines", statProgress: "en cours", viewMap: "Carte", viewList: "Liste",
    add: "Ajouter un rêve", ph: "De quoi rêves-tu ? Ex. « Une maison au bord de mer »", emojiPh: "🙂", photo: "Photo", save: "Ajouter", cancel: "Annuler",
    sph: { home: "Logement", transport: "Transport", body: "Corps & santé", travel: "Voyages", family: "Famille", business: "Travail", money: "Argent", growth: "Développement", other: "Autre" },
    status: { dream: "Je rêve", progress: "En cours", done: "Réalisé ✨" },
    makeGoal: "Aux objectifs", del: "Supprimer",
    empty: "Voici la carte de tes rêves. Ajoute le premier — ou dis « je rêve de… » au bot, il apparaîtra tout seul.",
    emptyHint: "Ex. : une maison au bord de mer, ma voiture, un voyage au Japon, un corps fort…",
  },
};

function resizeImage(file: File, max = 1200): Promise<Blob> {
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

const statusStyle = (st: string) => st === "done" ? { bg: "#FAEEDA", c: "#854F0B" } : st === "progress" ? { bg: "#E6F1FB", c: "#185FA5" } : { bg: "var(--surface-2)", c: "var(--text-2)" };

const EMOJIS = ["✨", "⭐", "🌟", "🎯", "🏆", "🎉", "🔥", "❤️", "🥰", "😊", "🌈", "🍀", "☀️", "🌊", "🏝️", "✈️", "🌍", "🗾", "🏠", "🏡", "🏖️", "🚗", "🚀", "💼", "💡", "📈", "💰", "💵", "💪", "🏃", "🧘", "🚴", "🥗", "📚", "🎓", "🎨", "🎸", "🐶", "🐱", "👨‍👩‍👧‍👦", "👶", "💍", "🌱", "🛏️"];

export default function DreamsBoard({ initial, locale }: { initial: Dream[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [dreams, setDreams] = useState<Dream[]>(initial);
  const [adding, setAdding] = useState(false);
  const [sphere, setSphere] = useState("home");
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");
  const [selSphere, setSelSphere] = useState<string | null>(null);
  const addFileRef = useRef<HTMLInputElement | null>(null);
  const cardFileRef = useRef<HTMLInputElement | null>(null);
  const cardTargetRef = useRef<string | null>(null);

  async function uploadImage(id: string, f: File) {
    try {
      const blob = await resizeImage(f);
      const fd = new FormData();
      fd.append("id", id);
      fd.append("image", blob, "dream.jpg");
      const res = await fetch("/api/dream-image", { method: "POST", body: fd });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.ok && j.url) setDreams((p) => p.map((d) => (d.id === id ? { ...d, image_url: j.url } : d)));
    } catch {}
  }
  async function add() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/dream", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "add", sphere, text: text.trim(), emoji }) });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.ok && j.dream) {
        setDreams((p) => [j.dream, ...p]);
        if (pendingFile) uploadImage(j.dream.id, pendingFile);
        setText(""); setEmoji(""); setPendingFile(null); setAdding(false);
      }
    } finally { setBusy(false); }
  }
  async function cycleStatus(d: Dream) {
    const order = ["dream", "progress", "done"];
    const next = order[(order.indexOf(d.status) + 1) % order.length];
    setDreams((p) => p.map((x) => (x.id === d.id ? { ...x, status: next } : x)));
    try { await fetch("/api/dream", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "status", id: d.id, status: next }) }); } catch {}
  }
  async function del(id: string) {
    setDreams((p) => p.filter((x) => x.id !== id));
    try { await fetch("/api/dream", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", id }) }); } catch {}
  }
  async function makeGoal(id: string) {
    setDreams((p) => p.map((x) => (x.id === id ? { ...x, status: "progress" } : x)));
    try { await fetch("/api/dream", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "makeGoal", id }) }); } catch {}
  }

  const used = SPHERES.filter((sp) => dreams.some((d) => d.sphere === sp.key));
  const inProgress = dreams.filter((d) => d.status === "progress").length;

  const SM = (k: string) => SPHERES.find((x) => x.key === k) || SPHERES[8];

  function DreamCard(d: Dream, showSphere = false) {
    const sp = SM(d.sphere); const ss = statusStyle(d.status);
    return (
      <div key={d.id} className="card" style={{ padding: 0, overflow: "hidden", opacity: d.status === "done" ? 0.92 : 1 }}>
        <div style={{ height: 118, background: d.image_url ? `center/cover no-repeat url(${d.image_url})` : sp.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {!d.image_url && <span style={{ fontSize: 40 }}>{d.emoji || "✨"}</span>}
          {d.status === "done" && <span style={{ position: "absolute", top: 8, right: 8, fontSize: 18 }}>✨</span>}
          {showSphere && <span style={{ position: "absolute", top: 8, left: 8, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: sp.c, background: "rgba(255,255,255,0.85)", padding: "3px 8px", borderRadius: 999 }}><i className={`ti ${sp.icon}`} style={{ fontSize: 12 }} />{s.sph[d.sphere]}</span>}
        </div>
        <div style={{ padding: "11px 12px 12px" }}>
          <div style={{ fontSize: 14, lineHeight: 1.35, marginBottom: 9, minHeight: 38 }}>{d.text}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <button onClick={() => cycleStatus(d)} style={{ fontSize: 11.5, fontWeight: 500, padding: "4px 10px", borderRadius: 999, border: "none", cursor: "pointer", background: ss.bg, color: ss.c }}>{s.status[d.status] || s.status.dream}</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => { cardTargetRef.current = d.id; cardFileRef.current?.click(); }} aria-label="photo" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 2 }}><i className="ti ti-photo" style={{ fontSize: 15 }} /></button>
            <button onClick={() => makeGoal(d.id)} aria-label="goal" title={s.makeGoal} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 2 }}><i className="ti ti-target" style={{ fontSize: 15 }} /></button>
            <button onClick={() => del(d.id)} aria-label="delete" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 2 }}><i className="ti ti-x" style={{ fontSize: 15 }} /></button>
          </div>
        </div>
      </div>
    );
  }

  // ===== РАДИАЛЬНАЯ КАРТА (сферы вокруг центра, клик раскрывает мечты сферы) =====
  function MapView() {
    const W = 600, H = 408, cx = 300, cy = 196, Rs = 150;
    const N = used.length || 1;
    const active = selSphere && used.some((u) => u.key === selSphere) ? selSphere : used[0]?.key || null;
    const nodes = used.map((sp, i) => {
      const ang = (-90 + i * (360 / N)) * Math.PI / 180;
      return { sp, x: cx + Rs * Math.cos(ang), y: cy + Rs * Math.sin(ang), count: dreams.filter((d) => d.sphere === sp.key).length };
    });
    const curve = (x1: number, y1: number, x2: number, y2: number) => {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, off = 0.08;
      return `M ${x1} ${y1} Q ${mx - dy * off} ${my + dx * off} ${x2} ${y2}`;
    };
    const aMeta = active ? SM(active) : null;
    const aDreams = active ? dreams.filter((d) => d.sphere === active) : [];
    return (
      <div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ position: "relative", width: W, height: H, margin: "0 auto" }}>
            <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {nodes.map((n, i) => <path key={i} d={curve(cx, cy, n.x, n.y)} stroke={n.sp.c} strokeWidth={n.sp.key === active ? 3.5 : 2.5} fill="none" opacity={n.sp.key === active ? 0.7 : 0.35} />)}
            </svg>

            <div style={{ position: "absolute", left: cx, top: cy, transform: "translate(-50%,-50%)", width: 116, height: 116, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #efeafe, #ddd6fb)", border: "2px solid #c7bdf5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", boxShadow: "0 8px 26px rgba(99,70,255,.18)", zIndex: 3 }}>
              <i className="ti ti-user" style={{ fontSize: 25, color: "var(--accent)", marginBottom: 2 }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--accent-text)", lineHeight: 1.2, padding: "0 12px" }}>{s.center} ✨</span>
            </div>

            {nodes.map((n, i) => {
              const on = n.sp.key === active;
              return (
                <button key={i} onClick={() => setSelSphere(n.sp.key)} style={{ position: "absolute", left: n.x, top: n.y, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", zIndex: 2 }}>
                  <div style={{ position: "relative", width: 60, height: 60, borderRadius: "50%", background: n.sp.bg, border: `${on ? 3 : 2}px solid ${n.sp.c}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: on ? `0 0 0 5px ${n.sp.c}22, 0 6px 16px rgba(0,0,0,.12)` : "0 4px 14px rgba(0,0,0,.08)", transition: "box-shadow .15s" }}>
                    <i className={`ti ${n.sp.icon}`} style={{ fontSize: 25, color: n.sp.c }} />
                    {n.count > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 19, height: 19, padding: "0 5px", borderRadius: 999, background: n.sp.c, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{n.count}</span>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: n.sp.c, whiteSpace: "nowrap" }}>{s.sph[n.sp.key]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* мечты выбранной сферы */}
        {aMeta && (
          <div style={{ marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 2px 11px" }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: aMeta.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><i className={`ti ${aMeta.icon}`} style={{ fontSize: 16, color: aMeta.c }} /></span>
              <span style={{ fontSize: 15.5, fontWeight: 600 }}>{s.sph[aMeta.key]}</span>
              <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>· {aDreams.length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 11 }}>
              {aDreams.map((d) => DreamCard(d))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== СПИСОК (сплошная сетка по всем сферам) =====
  function ListView() {
    const all = used.flatMap((sp) => dreams.filter((d) => d.sphere === sp.key));
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 11 }}>
        {all.map((d) => DreamCard(d, true))}
      </div>
    );
  }

  return (
    <div>
      <input ref={addFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setPendingFile(e.target.files?.[0] || null)} />
      <input ref={cardFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f && cardTargetRef.current) uploadImage(cardTargetRef.current, f); e.target.value = ""; }} />

      {/* БАННЕР */}
      <div style={{ borderRadius: 20, padding: "22px 22px", marginBottom: 16, background: "linear-gradient(135deg, var(--accent-bg), #fdf2f8 55%, #fff7ed)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>{s.title} ✨</div>
            <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5, marginTop: 6, maxWidth: 480 }}>{s.subtitle}</div>
            <button onClick={() => setAdding((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, padding: "10px 16px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              <i className="ti ti-plus" style={{ fontSize: 17 }} />{s.add}
            </button>
          </div>
          <div style={{ display: "flex", gap: 18, background: "rgba(255,255,255,0.55)", borderRadius: 14, padding: "12px 18px" }}>
            {[[dreams.length, s.statAll], [used.length, s.statSpheres], [inProgress, s.statProgress]].map(([n, l]: any, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{n}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-2)", maxWidth: 70, lineHeight: 1.25 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ФОРМА ДОБАВЛЕНИЯ */}
      {adding && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
            {SPHERES.map((sp) => {
              const on = sphere === sp.key;
              return (
                <button key={sp.key} onClick={() => setSphere(sp.key)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 11px", borderRadius: 999, fontSize: 12.5, cursor: "pointer", border: "1px solid " + (on ? sp.c : "var(--border)"), background: on ? sp.bg : "var(--surface)", color: on ? sp.c : "var(--text-2)" }}>
                  <i className={`ti ${sp.icon}`} style={{ fontSize: 14 }} />{s.sph[sp.key]}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ position: "relative" }}>
              <button type="button" onClick={() => setEmojiOpen((v) => !v)} title={s.emojiPh} style={{ width: 52, height: 44, borderRadius: 10, border: "1px solid " + (emojiOpen ? "var(--accent)" : "var(--border)"), background: "var(--surface)", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {emoji || "🙂"}
              </button>
              {emojiOpen && (
                <>
                  <div onClick={() => setEmojiOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                  <div style={{ position: "absolute", top: "112%", left: 0, zIndex: 41, width: 280, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,.16)", padding: 9, display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {emoji && <button type="button" onClick={() => { setEmoji(""); setEmojiOpen(false); }} title="—" style={{ width: 34, height: 34, fontSize: 14, border: "none", background: "var(--surface-2)", cursor: "pointer", borderRadius: 8, color: "var(--text-3)" }}>✕</button>}
                    {EMOJIS.map((em) => (
                      <button key={em} type="button" onClick={() => { setEmoji(em); setEmojiOpen(false); }} style={{ width: 34, height: 34, fontSize: 19, border: "none", background: emoji === em ? "var(--accent-bg)" : "none", cursor: "pointer", borderRadius: 8 }}>{em}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={s.ph} autoFocus onKeyDown={(e) => e.key === "Enter" && add()} style={{ flex: 1, padding: "10px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14.5 }} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => addFileRef.current?.click()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 10, border: "1px solid var(--border)", background: pendingFile ? "var(--accent-bg)" : "var(--surface)", color: pendingFile ? "var(--accent-text)" : "var(--text-2)", fontSize: 13, cursor: "pointer" }}>
              <i className="ti ti-photo" style={{ fontSize: 15 }} />{pendingFile ? "✓ " + s.photo : s.photo}
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={() => { setAdding(false); setText(""); setEmoji(""); setPendingFile(null); }} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "none", color: "var(--text-2)", fontSize: 13.5, cursor: "pointer" }}>{s.cancel}</button>
            <button onClick={add} disabled={!text.trim() || busy} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: !text.trim() || busy ? 0.6 : 1 }}>{s.save}</button>
          </div>
        </div>
      )}

      {dreams.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "28px 20px" }}>
          <i className="ti ti-sparkles" style={{ fontSize: 30, color: "var(--accent)", display: "block", marginBottom: 9 }} />
          <div style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.55, maxWidth: 420, margin: "0 auto 6px" }}>{s.empty}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5 }}>{s.emptyHint}</div>
        </div>
      ) : (
        <>
          {/* ПЕРЕКЛЮЧАТЕЛЬ */}
          <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
            <button onClick={() => setView("map")} style={tabBtn(view === "map")}><i className="ti ti-affiliate" style={{ fontSize: 15 }} />{s.viewMap}</button>
            <button onClick={() => setView("list")} style={tabBtn(view === "list")}><i className="ti ti-list" style={{ fontSize: 15 }} />{s.viewList}</button>
          </div>
          {view === "map" ? <MapView /> : <ListView />}
        </>
      )}
    </div>
  );
}

const tabBtn = (active: boolean): any => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid " + (active ? "var(--accent)" : "var(--border)"), background: active ? "var(--accent-bg)" : "var(--surface)", color: active ? "var(--accent-text)" : "var(--text-2)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" });
