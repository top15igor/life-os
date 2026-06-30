"use client";

import { useState } from "react";

// Shown once, right after a brand-new Google/email account is created. Prevents
// the "I logged in and my diary is empty" confusion: if the person actually kept
// a diary in Telegram, this points them to link that account instead.
export default function JustJoined({ botLink }: { botLink: string }) {
  const [hadTelegram, setHadTelegram] = useState<null | boolean>(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-5 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-stone-200 p-7">
        <div className="text-4xl mb-3">👋</div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Добро пожаловать в LIFE OS</h1>

        {hadTelegram === null && (
          <>
            <p className="text-stone-600 mb-6 leading-relaxed">
              Один короткий вопрос, чтобы ты ничего не потерял:
              <br />
              <span className="font-semibold text-stone-800">
                ты уже вёл дневник в нашем Telegram-боте?
              </span>
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full rounded-xl bg-indigo-600 text-white font-bold py-3.5 mb-3 active:opacity-80"
            >
              Нет, я тут впервые
            </button>
            <button
              onClick={() => setHadTelegram(true)}
              className="w-full rounded-xl bg-stone-100 text-stone-700 font-semibold py-3.5 active:opacity-80"
            >
              Да, уже вёл
            </button>
          </>
        )}

        {hadTelegram === true && (
          <>
            <p className="text-stone-600 mb-4 leading-relaxed">
              Тогда <span className="font-semibold">этот аккаунт — новый и пустой</span>. Твои записи
              остались под аккаунтом в Telegram. Чтобы попасть в свой дневник:
            </p>
            <ol className="text-stone-700 space-y-3 mb-6 list-decimal pl-5">
              <li>
                Открой нашего бота и отправь команду <span className="font-mono font-semibold">/link</span>,
                затем нажми на пришедшую ссылку.
              </li>
              <li>
                Зайди в <span className="font-semibold">Профиль → Аккаунт и вход</span> и нажми
                <span className="font-semibold"> «Подключить Google»</span>.
              </li>
            </ol>
            <p className="text-stone-500 text-sm mb-6">
              После этого вход через Google всегда будет открывать твой настоящий дневник, а этот пустой
              аккаунт исчезнет сам.
            </p>
            <a
              href={botLink}
              className="block text-center w-full rounded-xl bg-indigo-600 text-white font-bold py-3.5 mb-3 active:opacity-80"
            >
              Открыть бота
            </a>
            <button
              onClick={() => setHadTelegram(null)}
              className="w-full rounded-xl bg-stone-100 text-stone-600 font-semibold py-3 active:opacity-80"
            >
              ← Назад
            </button>
          </>
        )}
      </div>
    </div>
  );
}
