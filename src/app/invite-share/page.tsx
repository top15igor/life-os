"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { inviteShareUrl } from "@/lib/invitePitch";

// Мини-апп кнопки меню «🎁 Позвать друга»: открывается внутри Telegram и сразу
// показывает системное окно «кому отправить» — без промежуточного сообщения.
// Telegram НЕ передаёт initData веб-аппам из нижней клавиатуры, поэтому:
//  1) основной путь — публичный handle владельца в URL кнопки (?h=…&lang=…);
//  2) запасной — сессионная кука (GET /api/invite-share), если вебвью делит
//     куки с браузером, где пользователь уже входил.
function InviteShareInner() {
  const [state, setState] = useState<"loading" | "outside" | "fail">("loading");
  const started = useRef(false);
  const sp = useSearchParams();

  const run = async () => {
    if (started.current) return;
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.openTelegramLink) return; // ещё не загрузился — подождём следующего тика
    started.current = true;
    tg.ready?.();

    const open = (share: string) => {
      tg.openTelegramLink(share);
      // Телефоны закрывают мини-апп сами; десктоп держит панельку открытой, пока
      // человек выбирает получателя (close в этот момент игнорируется), поэтому
      // стучимся в close каждые полсекунды — панелька исчезнет, как только клиент
      // разрешит (сразу после отправки), и «Success!» не повиснет.
      const t = setInterval(() => tg.close?.(), 500);
      setTimeout(() => clearInterval(t), 15000);
    };

    const h = sp.get("h");
    if (h && /^[a-z0-9_.-]{2,64}$/i.test(h)) {
      open(inviteShareUrl("https://life-os.today", h, sp.get("lang") || "ru"));
      return;
    }
    try {
      const r = await fetch("/api/invite-share").then((x) => x.json());
      if (r?.share) { open(r.share); return; }
    } catch {}
    setState("fail");
  };

  // Скрипт Telegram может прийти из кэша без onLoad — страхуемся таймером.
  useEffect(() => {
    const t = setInterval(() => {
      if ((window as any).Telegram?.WebApp) { clearInterval(t); run(); }
    }, 150);
    const stop = setTimeout(() => {
      clearInterval(t);
      if (!started.current) setState("outside");
    }, 4000);
    return () => { clearInterval(t); clearTimeout(stop); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, font: "400 16px/1.5 system-ui, sans-serif", color: "#555" }}>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onLoad={run} />
      {state === "loading" && <div>✨</div>}
      {state === "outside" && <div>Эта страница открывается из бота LIFE OS — кнопка «🎁 Позвать друга».<br />This page opens from the LIFE OS bot — the “Invite a friend” button.</div>}
      {state === "fail" && <div>Не получилось открыть окно отправки. Отправь боту /invite — пришлю приглашение с кнопкой.</div>}
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
