"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const STR: Record<string, any> = {
  ru: {
    btn: "Пригласить друга", title: "Подари другу его Книгу жизни",
    sub: "Отправь ссылку — друг начнёт вести свой дневник, а ты увидишь это в своей статистике.",
    copy: "Копировать", copied: "Скопировано", tg: "Telegram", wa: "WhatsApp", more: "Поделиться…", close: "Закрыть",
    pitch: "📖 Представь, что через 10 лет ты сможешь открыть любой день своей жизни. LIFE OS помогает создать такую «Книгу жизни» — просто записывай мысли голосом, а AI сохранит и свяжет их. Попробуй:",
    reward: {
      line: "🎁 Пригласи друзей — получи свою печатную книгу бесплатно.",
      toNext: (n: number) => `Осталось активных друзей: ${n}. И печатная книга «Classic» — бесплатно.`,
      have: "🎁 Тебе уже доступна бесплатная печатная книга — оформи её в разделе «Книга жизни».",
      activeOf: (a: number, p: number) => `Активных друзей: ${a} из ${p}`,
    },
  },
  en: {
    btn: "Invite a friend", title: "Give a friend their Book of Life",
    sub: "Send the link — your friend starts their own diary, and you'll see it in your stats.",
    copy: "Copy", copied: "Copied", tg: "Telegram", wa: "WhatsApp", more: "Share…", close: "Close",
    pitch: "📖 Imagine opening any day of your life 10 years from now. LIFE OS helps you build that Book of Life — just record your thoughts by voice and AI saves and connects them. Try it:",
    reward: {
      line: "🎁 Invite friends — get your printed book for free.",
      toNext: (n: number) => `${n} more active ${n === 1 ? "friend" : "friends"} to go — then the «Classic» printed book is free.`,
      have: "🎁 You already have a free printed book — claim it in the «Book of Life» section.",
      activeOf: (a: number, p: number) => `Active friends: ${a} of ${p}`,
    },
  },
  uk: {
    btn: "Запросити друга", title: "Подаруй другу його Книгу життя",
    sub: "Надішли посилання — друг почне вести свій щоденник, а ти побачиш це у своїй статистиці.",
    copy: "Копіювати", copied: "Скопійовано", tg: "Telegram", wa: "WhatsApp", more: "Поділитися…", close: "Закрити",
    pitch: "📖 Уяви, що через 10 років ти зможеш відкрити будь-який день свого життя. LIFE OS допомагає створити таку «Книгу життя» — просто записуй думки голосом, а AI збереже й пов'яже їх. Спробуй:",
    reward: {
      line: "🎁 Запроси друзів — отримай свою друковану книгу безкоштовно.",
      toNext: (n: number) => `Залишилось активних друзів: ${n}. І друкована книга «Classic» — безкоштовно.`,
      have: "🎁 Тобі вже доступна безкоштовна друкована книга — оформи її в розділі «Книга життя».",
      activeOf: (a: number, p: number) => `Активних друзів: ${a} з ${p}`,
    },
  },
  fr: {
    btn: "Inviter un ami", title: "Offre à un ami son Livre de vie",
    sub: "Envoie le lien — ton ami commence son journal, et tu le verras dans tes statistiques.",
    copy: "Copier", copied: "Copié", tg: "Telegram", wa: "WhatsApp", more: "Partager…", close: "Fermer",
    pitch: "📖 Imagine pouvoir ouvrir n'importe quel jour de ta vie dans 10 ans. LIFE OS t'aide à créer ce Livre de vie — enregistre tes pensées à la voix et l'IA les sauvegarde et les relie. Essaie :",
    reward: {
      line: "🎁 Invite des amis — obtiens ton livre imprimé gratuitement.",
      toNext: (n: number) => `Encore ${n} ${n === 1 ? "ami actif" : "amis actifs"} — et le livre « Classic » est gratuit.`,
      have: "🎁 Tu as déjà un livre imprimé gratuit — réclame-le dans la section « Livre de vie ».",
      activeOf: (a: number, p: number) => `Amis actifs : ${a} sur ${p}`,
    },
  },
};

function shareBtn(bg: string, fg = "#fff"): any {
  return { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 11, background: bg, color: fg, fontSize: 13.5, fontWeight: 500, textDecoration: "none", border: "none", cursor: "pointer" };
}

export default function InviteButton({ link, locale, variant }: { link: string; locale: string; variant?: "side" | "drawer" }) {
  const s = STR[locale] || STR.ru;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rwStatus, setRwStatus] = useState<any>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open || rwStatus) return;
    fetch("/api/referral").then((r) => r.json()).then((d) => { if (d?.ok) setRwStatus(d.status); }).catch(() => {});
  }, [open, rwStatus]);

  function copy() {
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {});
  }
  function nativeShare() {
    if (typeof navigator !== "undefined" && (navigator as any).share) (navigator as any).share({ title: "LIFE OS", text: s.pitch, url: link }).catch(() => {});
    else copy();
  }
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(s.pitch)}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(s.pitch + " " + link)}`;

  const btnStyle: any = {
    display: "flex", alignItems: "center", justifyContent: variant === "drawer" ? "flex-start" : "center", gap: 9,
    padding: variant === "drawer" ? "11px 12px" : "10px 12px", borderRadius: 11, background: "var(--accent)", color: "#fff",
    width: "100%", border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 500, marginBottom: variant === "drawer" ? 14 : 10,
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={btnStyle}>
        <i className="ti ti-gift" style={{ fontSize: 17 }} />{s.btn}
      </button>

      {open && mounted && createPortal(
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 18, padding: "26px 22px", maxWidth: 400, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎁</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 7 }}>{s.title}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5 }}>{s.sub}</div>
            </div>

            {s.reward && (
              <div style={{ borderRadius: 12, padding: "12px 14px", marginBottom: 14, background: rwStatus && rwStatus.available >= 1 ? "var(--accent-bg)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
                {rwStatus && rwStatus.available >= 1 ? (
                  <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.5, fontWeight: 500 }}>{s.reward.have}</div>
                ) : (
                  <>
                    <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: rwStatus ? 9 : 0 }}>{s.reward.line}</div>
                    {rwStatus && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}>
                          <div style={{ height: 6, borderRadius: 99, background: "var(--surface)", overflow: "hidden", flex: 1 }}>
                            <div style={{ height: "100%", width: `${Math.round(((rwStatus.active % rwStatus.perBook) / rwStatus.perBook) * 100)}%`, background: "var(--accent)" }} />
                          </div>
                          <span style={{ fontSize: 11.5, color: "var(--text-3)", whiteSpace: "nowrap" }}>{s.reward.activeOf(rwStatus.active % rwStatus.perBook, rwStatus.perBook)}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{s.reward.toNext(rwStatus.toNext)}</div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} style={{ flex: 1, fontSize: 12.5, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-2)", minWidth: 0 }} />
              <button onClick={copy} style={{ flexShrink: 0, fontSize: 13, padding: "0 15px", borderRadius: 10, border: "none", background: copied ? "var(--positive)" : "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: 500 }}>
                <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} style={{ fontSize: 14, verticalAlign: "-2px", marginRight: 4 }} />{copied ? s.copied : s.copy}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <a href={tgUrl} target="_blank" rel="noreferrer" style={shareBtn("#229ED9")}><i className="ti ti-brand-telegram" style={{ fontSize: 17 }} />{s.tg}</a>
              <a href={waUrl} target="_blank" rel="noreferrer" style={shareBtn("#25D366")}><i className="ti ti-brand-whatsapp" style={{ fontSize: 17 }} />{s.wa}</a>
            </div>
            <button onClick={nativeShare} style={{ ...shareBtn("var(--surface-2)", "var(--text)"), width: "100%", marginBottom: 4 }}>
              <i className="ti ti-share" style={{ fontSize: 16 }} />{s.more}
            </button>
            <button onClick={() => setOpen(false)} style={{ width: "100%", padding: "9px", borderRadius: 10, border: "none", background: "transparent", color: "var(--text-2)", cursor: "pointer", fontSize: 13 }}>{s.close}</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
