"use client";

import { useState } from "react";

type Config = { slug: string; enabled: boolean; bio: string; blocks: string[] };

const STR: Record<string, any> = {
  ru: { title: "Публичная страница", sub: "Витрина твоих успехов по ссылке — как профиль в Strava. Уходят только цифры и то, что ты включишь. Содержимого дневника тут нет.", enable: "Включить публичную страницу", slugLabel: "Адрес страницы", bioLabel: "О себе (необязательно)", bioPh: "Например: «Веду жизнь осознанно, бегаю по утрам»", showLabel: "Что показывать", b_voice: "Голосовые", b_deeds: "Добрые дела", b_dreams: "Сбывшиеся мечты", b_streak: "Серию", save: "Сохранить", saving: "Сохраняю…", saved: "Сохранено ✓", taken: "Этот адрес занят, выбери другой", badSlug: "Адрес: 3–30 символов, латиница, цифры, дефис", yourLink: "Твоя ссылка", copy: "Копировать", copied: "Скопировано ✓", open: "Открыть", offHint: "Страница выключена — её никто не видит." },
  en: { title: "Public page", sub: "A showcase of your wins at a link — like a Strava profile. Only numbers and what you enable go out. No diary content here.", enable: "Enable public page", slugLabel: "Page address", bioLabel: "About you (optional)", bioPh: "e.g. “Living mindfully, running every morning”", showLabel: "What to show", b_voice: "Voice notes", b_deeds: "Good deeds", b_dreams: "Dreams come true", b_streak: "Streak", save: "Save", saving: "Saving…", saved: "Saved ✓", taken: "That address is taken, pick another", badSlug: "Address: 3–30 chars, latin, digits, hyphen", yourLink: "Your link", copy: "Copy", copied: "Copied ✓", open: "Open", offHint: "Page is off — no one can see it." },
  uk: { title: "Публічна сторінка", sub: "Вітрина твоїх успіхів за посиланням — як профіль у Strava. Виходять лише цифри й те, що ти увімкнеш. Вмісту щоденника тут немає.", enable: "Увімкнути публічну сторінку", slugLabel: "Адреса сторінки", bioLabel: "Про себе (необов'язково)", bioPh: "Напр.: «Живу усвідомлено, бігаю вранці»", showLabel: "Що показувати", b_voice: "Голосові", b_deeds: "Добрі справи", b_dreams: "Здійснені мрії", b_streak: "Серію", save: "Зберегти", saving: "Зберігаю…", saved: "Збережено ✓", taken: "Цю адресу зайнято, обери іншу", badSlug: "Адреса: 3–30 символів, латиниця, цифри, дефіс", yourLink: "Твоє посилання", copy: "Копіювати", copied: "Скопійовано ✓", open: "Відкрити", offHint: "Сторінку вимкнено — її ніхто не бачить." },
  fr: { title: "Page publique", sub: "Une vitrine de tes réussites via un lien — comme un profil Strava. Seuls les chiffres et ce que tu actives sortent. Aucun contenu du journal ici.", enable: "Activer la page publique", slugLabel: "Adresse de la page", bioLabel: "À propos (optionnel)", bioPh: "Ex. : « Vivre en pleine conscience, courir le matin »", showLabel: "Quoi afficher", b_voice: "Vocaux", b_deeds: "Bonnes actions", b_dreams: "Rêves réalisés", b_streak: "Série", save: "Enregistrer", saving: "Enregistrement…", saved: "Enregistré ✓", taken: "Cette adresse est prise, choisis-en une autre", badSlug: "Adresse : 3–30 caractères, latin, chiffres, tiret", yourLink: "Ton lien", copy: "Copier", copied: "Copié ✓", open: "Ouvrir", offHint: "Page désactivée — personne ne la voit." },
};

const BLOCKS = ["voice", "deeds", "dreams", "streak"] as const;

export default function PublicProfileEditor({ initial, host, suggestedSlug, locale }: { initial: Config; host: string; suggestedSlug: string; locale: string }) {
  const L = STR[locale] || STR.ru;
  const [enabled, setEnabled] = useState(initial.enabled);
  const [slug, setSlug] = useState(initial.slug || suggestedSlug);
  const [bio, setBio] = useState(initial.bio);
  const [blocks, setBlocks] = useState<string[]>(initial.blocks || []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const cleanSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
  const link = `${host}/p/${slug}`;

  function toggleBlock(b: string) {
    setBlocks((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  }

  async function save() {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/public-profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled, slug, bio, blocks }) });
    setBusy(false);
    const j = await r.json().catch(() => null);
    if (r.ok && j?.ok) { setMsg({ ok: true, text: L.saved }); setTimeout(() => setMsg(null), 2500); }
    else if (j?.error === "slug_taken") setMsg({ ok: false, text: L.taken });
    else if (j?.error === "bad_slug") setMsg({ ok: false, text: L.badSlug });
    else setMsg({ ok: false, text: "—" });
  }

  function copy() {
    navigator.clipboard?.writeText(`https://${link}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  }

  const inputStyle: any = { fontSize: 14, padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", width: "100%", boxSizing: "border-box" };

  return (
    <div className="card" style={{ marginTop: 26 }}>
      <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
        <i className="ti ti-world" style={{ fontSize: 17, color: "var(--accent)" }} />{L.title}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, margin: "6px 0 14px" }}>{L.sub}</div>

      {/* тумблер */}
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 14 }}>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--accent)" }} />
        <span style={{ fontSize: 14, fontWeight: 500 }}>{L.enable}</span>
      </label>

      {/* адрес */}
      <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 5 }}>{L.slugLabel}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--text-3)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRight: "none", borderRadius: "9px 0 0 9px", padding: "9px 8px", whiteSpace: "nowrap" }}>{host}/p/</span>
        <input value={slug} onChange={(e) => setSlug(cleanSlug(e.target.value))} placeholder="igor" style={{ ...inputStyle, borderRadius: "0 9px 9px 0" }} />
      </div>

      {/* био */}
      <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 5 }}>{L.bioLabel}</div>
      <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))} placeholder={L.bioPh} rows={2} style={{ ...inputStyle, resize: "vertical", marginBottom: 14, fontFamily: "inherit", lineHeight: 1.45 }} />

      {/* что показывать */}
      <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 7 }}>{L.showLabel}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {BLOCKS.map((b) => {
          const on = blocks.includes(b);
          return (
            <button key={b} onClick={() => toggleBlock(b)} style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 20, border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`, background: on ? "var(--accent-bg)" : "var(--surface)", color: on ? "var(--accent-text)" : "var(--text-2)", cursor: "pointer", fontWeight: on ? 500 : 400 }}>
              {on ? "✓ " : ""}{L[`b_${b}`]}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button disabled={busy} onClick={save} style={{ fontSize: 14, fontWeight: 500, padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>{busy ? L.saving : L.save}</button>
        {msg && <span style={{ fontSize: 12.5, color: msg.ok ? "#10b981" : "#ef4444" }}>{msg.text}</span>}
      </div>

      {/* ссылка (если включено и сохранён slug) */}
      {enabled && initial.enabled && initial.slug && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 6 }}>{L.yourLink}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <code style={{ fontSize: 13, background: "var(--surface-2)", padding: "8px 11px", borderRadius: 9, flex: 1, minWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{link}</code>
            <button onClick={copy} style={{ fontSize: 12.5, padding: "8px 13px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer" }}>{copied ? L.copied : L.copy}</button>
            <a href={`https://${link}`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, padding: "8px 13px", borderRadius: 9, background: "var(--accent)", color: "#fff", textDecoration: "none" }}>{L.open}</a>
          </div>
        </div>
      )}
      {!enabled && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10 }}>{L.offHint}</div>}
    </div>
  );
}
