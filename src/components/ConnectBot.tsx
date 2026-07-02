"use client";

import { useEffect, useRef, useState } from "react";

// Экран сразу после регистрации. Бот — главный способ ввода, поэтому предлагаем
// подключить его первым делом. Кнопка ведёт в бота с одноразовым токеном; страница
// сама ловит момент связки (опрос /api/link-telegram/status) и впускает в портал.
// «Пока пропустить» ведёт в портал с плашкой-напоминалкой.
export default function ConnectBot({ deepLink }: { deepLink: string }) {
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      try {
        const r = await fetch("/api/link-telegram/status", { cache: "no-store" }).then((x) => x.json());
        if (!stopped && r?.connected) {
          if (timer.current) clearInterval(timer.current);
          window.location.href = "/";
        }
      } catch {}
    };
    timer.current = setInterval(poll, 2500);
    return () => { stopped = true; if (timer.current) clearInterval(timer.current); };
  }, []);

  const card: React.CSSProperties = {
    display: "flex", gap: 13, alignItems: "flex-start", textAlign: "left",
    background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "13px 15px",
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 18px", background: "#229ED9", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-brand-telegram" style={{ fontSize: 34, color: "#fff" }} />
        </div>

        <h1 style={{ fontSize: 25, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
          Подключи Telegram-бота
        </h1>
        <p style={{ fontSize: 15.5, color: "var(--text-2)", lineHeight: 1.55, margin: "0 auto 22px", maxWidth: 380 }}>
          Это <b style={{ color: "var(--text)" }}>главный способ вести дневник</b>. Наговариваешь голосом на ходу — AI сам расшифрует и разложит по местам.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          <div style={card}>
            <i className="ti ti-microphone" style={{ fontSize: 20, color: "var(--accent)", marginTop: 1 }} />
            <div><div style={{ fontSize: 14.5, fontWeight: 600 }}>Голосом за секунды</div><div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 1 }}>Рассказал, как прошёл день — запись готова.</div></div>
          </div>
          <div style={card}>
            <i className="ti ti-photo" style={{ fontSize: 20, color: "var(--accent)", marginTop: 1 }} />
            <div><div style={{ fontSize: 14.5, fontWeight: 600 }}>Текст, фото, ссылки</div><div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 1 }}>Кидай что угодно прямо в чат — сохранится и разберётся.</div></div>
          </div>
          <div style={card}>
            <i className="ti ti-bolt" style={{ fontSize: 20, color: "var(--accent)", marginTop: 1 }} />
            <div><div style={{ fontSize: 14.5, fontWeight: 600 }}>Всегда под рукой</div><div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 1 }}>Не нужно открывать сайт — записал из любого чата.</div></div>
          </div>
        </div>

        <a
          href={deepLink}
          target="_blank"
          rel="noreferrer"
          onClick={() => setWaiting(true)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%",
            padding: "15px 18px", borderRadius: 14, background: "#229ED9", color: "#fff",
            fontSize: 16, fontWeight: 700, textDecoration: "none", boxSizing: "border-box",
          }}
        >
          <i className="ti ti-brand-telegram" style={{ fontSize: 20 }} />
          Подключить Telegram
        </a>

        {waiting && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, fontSize: 13.5, color: "var(--text-2)" }}>
            <span className="cb-spin" style={{ width: 14, height: 14, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", display: "inline-block" }} />
            Жду подключения… нажми «Начать» в боте
          </div>
        )}

        <button
          onClick={() => (window.location.href = "/")}
          style={{ marginTop: 16, background: "none", border: "none", color: "var(--text-3)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}
        >
          Пока пропустить
        </button>

        <div style={{ marginTop: 22, fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5 }}>
          Уже вёл дневник в этом боте? Открой его и отправь <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 600, color: "var(--text-2)" }}>/link</span>.
        </div>
      </div>

      <style>{`@keyframes cb-spin{to{transform:rotate(360deg)}} .cb-spin{animation:cb-spin .8s linear infinite}`}</style>
    </div>
  );
}
