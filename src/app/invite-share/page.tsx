"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

// Мини-апп кнопки меню «🎁 Позвать друга»: открывается внутри Telegram,
// молча берёт initData, получает у сервера готовую ссылку t.me/share и сразу
// показывает системное окно «кому отправить» — без промежуточного сообщения.
export default function InviteSharePage() {
  const [state, setState] = useState<"loading" | "outside" | "fail">("loading");
  const started = useRef(false);

  const run = async () => {
    if (started.current) return;
    started.current = true;
    const tg = (window as any).Telegram?.WebApp;
    if (!tg || !tg.initData) {
      setState("outside");
      return;
    }
    try {
      tg.ready?.();
      const r = await fetch("/api/invite-share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData: tg.initData }),
      }).then((x) => x.json());
      if (r?.share) {
        tg.openTelegramLink(r.share);
        setTimeout(() => tg.close?.(), 400);
      } else {
        setState("fail");
      }
    } catch {
      setState("fail");
    }
  };

  // Скрипт может быть уже в кэше и «onLoad» не сработает — пробуем и по таймеру.
  useEffect(() => {
    const t = setInterval(() => {
      if ((window as any).Telegram?.WebApp) {
        clearInterval(t);
        run();
      }
    }, 150);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, font: "400 16px/1.5 system-ui, sans-serif", color: "#555" }}>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onLoad={run} />
      {state === "loading" && <div>✨</div>}
      {state === "outside" && <div>Эта страница открывается из бота LIFE OS — кнопка «🎁 Позвать друга».<br />This page opens from the LIFE OS bot — the “Invite a friend” button.</div>}
      {state === "fail" && <div>Не получилось открыть окно отправки. Попробуй ещё раз или команду /invite в боте.</div>}
    </div>
  );
}
