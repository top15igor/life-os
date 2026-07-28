"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { INVITE, inviteShareUrl } from "@/lib/invitePitch";

// Мини-апп кнопки меню «🎁 Позвать друга»: раньше сразу открывал телеграмовское
// «кому отправить» — но оно умеет делиться только внутри Telegram. Теперь это
// мини-выбор канала: Telegram / системное меню телефона (там Instagram, Viber,
// WhatsApp — всё установленное) / WhatsApp / Viber напрямую / скопировать текст.
// Telegram НЕ передаёт initData веб-аппам из нижней клавиатуры, поэтому identity:
//  1) публичный handle владельца в URL кнопки (?h=…&lang=…);
//  2) запасной — сессионная кука (GET /api/invite-share).

const STR: Record<string, any> = {
  ru: { title: "Позвать друга", sub: "Куда отправить приглашение?", tg: "Telegram", sys: "Другие приложения…", sysHint: "Instagram, Viber, WhatsApp — системное меню телефона", wa: "WhatsApp", vb: "Viber", copy: "Скопировать текст", copied: "Скопировано! Открой Instagram (или что угодно) и вставь в сообщение.", fail: "Не получилось. Отправь боту /invite — пришлю приглашение с кнопкой.", outside: "Эта страница открывается из бота LIFE OS — кнопка «🎁 Позвать друга»." },
  en: { title: "Invite a friend", sub: "Where should the invite go?", tg: "Telegram", sys: "Other apps…", sysHint: "Instagram, Viber, WhatsApp — your phone's share menu", wa: "WhatsApp", vb: "Viber", copy: "Copy the text", copied: "Copied! Open Instagram (or anything) and paste it into a message.", fail: "Didn't work. Send /invite to the bot — I'll reply with a share button.", outside: "This page opens from the LIFE OS bot — the “🎁 Invite a friend” button." },
  uk: { title: "Покликати друга", sub: "Куди надіслати запрошення?", tg: "Telegram", sys: "Інші застосунки…", sysHint: "Instagram, Viber, WhatsApp — системне меню телефона", wa: "WhatsApp", vb: "Viber", copy: "Скопіювати текст", copied: "Скопійовано! Відкрий Instagram (або будь-що) і встав у повідомлення.", fail: "Не вийшло. Надішли боту /invite — надішлю запрошення з кнопкою.", outside: "Ця сторінка відкривається з бота LIFE OS — кнопка «🎁 Покликати друга»." },
  fr: { title: "Inviter un ami", sub: "Où envoyer l'invitation ?", tg: "Telegram", sys: "Autres applis…", sysHint: "Instagram, Viber, WhatsApp — le menu de partage du téléphone", wa: "WhatsApp", vb: "Viber", copy: "Copier le texte", copied: "Copié ! Ouvre Instagram (ou autre) et colle-le dans un message.", fail: "Ça n'a pas marché. Envoie /invite au bot — je répondrai avec un bouton.", outside: "Cette page s'ouvre depuis le bot LIFE OS — bouton « 🎁 Inviter un ami »." },
  es: { title: "Invitar a un amigo", sub: "¿A dónde enviar la invitación?", tg: "Telegram", sys: "Otras apps…", sysHint: "Instagram, Viber, WhatsApp — el menú de compartir del teléfono", wa: "WhatsApp", vb: "Viber", copy: "Copiar el texto", copied: "¡Copiado! Abre Instagram (o lo que sea) y pégalo en un mensaje.", fail: "No funcionó. Envía /invite al bot — responderé con un botón.", outside: "Esta página se abre desde el bot LIFE OS — botón «🎁 Invitar a un amigo»." },
};

function InviteShareInner() {
  const [state, setState] = useState<"loading" | "ready" | "outside" | "fail" | "copied">("loading");
  const [canSys, setCanSys] = useState(false);
  const idRef = useRef<{ handle: string; lang: string } | null>(null);
  const started = useRef(false);
  const sp = useSearchParams();

  const lang = (idRef.current?.lang || sp.get("lang") || "ru") as string;
  const s = STR[lang] || STR.ru;

  const fullText = () => {
    const id = idRef.current!;
    const I = INVITE[id.lang] || INVITE.ru;
    return I.text.replace("{bot}", `https://life-os.today/i/${id.handle}`).trim();
  };

  const run = async () => {
    if (started.current) return;
    started.current = true;
    (window as any).Telegram?.WebApp?.ready?.();
    setCanSys(typeof navigator !== "undefined" && !!(navigator as any).share);

    const h = sp.get("h");
    if (h && /^[a-z0-9_.-]{2,64}$/i.test(h)) {
      idRef.current = { handle: h, lang: sp.get("lang") || "ru" };
      setState("ready");
      return;
    }
    try {
      const r = await fetch("/api/invite-share").then((x) => x.json());
      if (r?.handle) { idRef.current = { handle: r.handle, lang: r.lang || "ru" }; setState("ready"); return; }
    } catch {}
    setState("fail");
  };

  useEffect(() => {
    // Скрипт Telegram может прийти из кэша без onLoad — страхуемся таймером;
    // вне Telegram тоже работаем (обычный браузер): просто без openTelegramLink.
    const t = setInterval(() => { if ((window as any).Telegram?.WebApp) { clearInterval(t); run(); } }, 150);
    const stop = setTimeout(() => { clearInterval(t); run(); }, 2500);
    return () => { clearInterval(t); clearTimeout(stop); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeSoon = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.close) return;
    // Десктоп-клиент игнорирует close, пока открыта панель выбора — стучимся
    // повторно, панелька закроется, как только клиент разрешит.
    const t = setInterval(() => tg.close?.(), 500);
    setTimeout(() => clearInterval(t), 15000);
  };

  const shareTg = () => {
    const id = idRef.current!;
    const url = inviteShareUrl("https://life-os.today", id.handle, id.lang);
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) { tg.openTelegramLink(url); closeSoon(); }
    else window.open(url, "_blank");
  };
  const shareSys = async () => {
    try { await (navigator as any).share({ text: fullText() }); closeSoon(); } catch { /* отменил — ок */ }
  };
  const shareWa = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(fullText())}`;
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openLink) tg.openLink(url); else window.open(url, "_blank");
  };
  const shareVb = () => { window.location.href = `viber://forward?text=${encodeURIComponent(fullText())}`; };
  const copyIt = async () => {
    try { await navigator.clipboard.writeText(fullText()); setState("copied"); } catch {}
  };

  const btn = (onClick: () => void, icon: string, label: string, primary?: boolean, hint?: string) => (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "13px 16px", borderRadius: 14, border: primary ? "none" : "1px solid rgba(120,120,140,0.25)", background: primary ? "#5b5bf5" : "rgba(120,120,140,0.07)", color: primary ? "#fff" : "inherit", fontSize: 15.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
      <span style={{ fontSize: 20, width: 26, textAlign: "center" }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        {label}
        {hint && <span style={{ display: "block", fontSize: 12, fontWeight: 400, opacity: 0.75, marginTop: 2 }}>{hint}</span>}
      </span>
    </button>
  );

  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, font: "400 16px/1.5 system-ui, sans-serif" }}>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onLoad={run} />
      {state === "loading" && <div>✨</div>}
      {state === "outside" && <div style={{ textAlign: "center", color: "#888" }}>{s.outside}</div>}
      {state === "fail" && <div style={{ textAlign: "center", color: "#888" }}>{s.fail}</div>}
      {state === "copied" && (
        <div style={{ textAlign: "center", maxWidth: 340 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 15.5, lineHeight: 1.5 }}>{s.copied}</div>
        </div>
      )}
      {state === "ready" && (
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ fontSize: 19, fontWeight: 700, textAlign: "center" }}>🎁 {s.title}</div>
          <div style={{ fontSize: 13.5, opacity: 0.7, textAlign: "center", margin: "6px 0 18px" }}>{s.sub}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {btn(shareTg, "✈️", s.tg, true)}
            {canSys && btn(shareSys, "📲", s.sys, false, s.sysHint)}
            {btn(shareWa, "🟢", s.wa)}
            {btn(shareVb, "🟣", s.vb)}
            {btn(copyIt, "📋", s.copy)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InviteSharePage() {
  return (
    <Suspense fallback={<div />}>
      <InviteShareInner />
    </Suspense>
  );
}
