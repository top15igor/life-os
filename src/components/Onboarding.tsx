"use client";

import { useState } from "react";
import LangMenu from "./LangMenu";
import type { Locale } from "@/lib/i18n";

type Screen = { t: string; s?: string; list?: string[]; cta?: string; trust?: boolean };

const ONB: Record<string, { next: string; privacy: string; skip: string; login: string; openCode: string; screens: Screen[] }> = {
  ru: {
    next: "Далее",
    privacy: "Приватность",
    skip: "Пропустить",
    login: "Уже есть аккаунт?",
    openCode: "Открытый код",
    screens: [
      { t: "Добро пожаловать в LIFE OS", s: "Ваша жизнь заслуживает быть сохранённой." },
      { t: "Вы забудете почти всё, что произошло сегодня.", s: "Но именно из таких дней складывается вся ваша жизнь." },
      { t: "Мы фотографируем отпуск.", s: "Но почти никогда не сохраняем свои мысли." },
      { t: "Каждая идея может изменить жизнь.", s: "Но только если вы её не потеряете." },
      { t: "LIFE OS всё делает сам.", s: "Вы говорите — AI делает остальное.", list: ["распознаёт речь", "выделяет инсайты", "связывает проекты", "хранит здоровье", "строит историю жизни"] },
      { t: "Представьте…", s: "«Покажи момент, когда появилась идея бизнеса» — ответ за секунды.", list: ["Когда я был счастливее всего?", "Что помогало моему здоровью?", "Какие решения изменили мою жизнь?"] },
      { t: "Со временем LIFE OS понимает вас.", list: ["что вас вдохновляет", "что даёт энергию", "какие привычки работают", "какие проекты важнее всего"] },
      { t: "Это больше, чем дневник.", list: ["Второй мозг", "Книга жизни", "История проектов", "Архив семьи", "Карта здоровья", "Коллекция инсайтов"] },
      { t: "Через десять лет…", s: "Вы проживёте свою историю заново — не по фотографиям, а по настоящим мыслям и решениям." },
      { t: "Ваши данные — только ваши.", s: "Честно, без мелкого шрифта:", list: ["Дневник видите только вы", "Команда записи не читает", "Код открыт — проверьте сами", "Скачать или удалить всё — в один клик"], trust: true },
      { t: "Начните первую страницу своей книги жизни.", s: "Просто расскажите, как прошёл сегодняшний день.", cta: "🎤 Записать первое сообщение" },
    ],
  },
  en: {
    next: "Next",
    privacy: "Privacy",
    skip: "Skip",
    login: "Already have an account?",
    openCode: "Open source",
    screens: [
      { t: "Welcome to LIFE OS", s: "Your life deserves to be saved." },
      { t: "You'll forget almost everything that happened today.", s: "Yet your whole life is made of days like this." },
      { t: "We photograph our vacations.", s: "But we almost never save our thoughts." },
      { t: "Every idea can change your life.", s: "But only if you don't lose it." },
      { t: "LIFE OS does it all for you.", s: "You speak — AI does the rest.", list: ["transcribes your voice", "extracts insights", "links projects", "tracks health", "builds your life story"] },
      { t: "Imagine…", s: "“Show me the moment my business idea was born” — answered in seconds.", list: ["When was I happiest?", "What helped my health?", "Which decisions changed my life?"] },
      { t: "Over time, LIFE OS understands you.", list: ["what inspires you", "what gives you energy", "which habits work", "which projects matter most"] },
      { t: "It's more than a diary.", list: ["A second brain", "A book of life", "A history of projects", "A family archive", "A health map", "A collection of insights"] },
      { t: "Ten years from now…", s: "You'll relive your story — not through photos, but real thoughts and decisions." },
      { t: "Your data is yours alone.", s: "Honestly, no fine print:", list: ["Only you see your diary", "The team doesn't read entries", "Open source — check it yourself", "Export or delete everything in one click"], trust: true },
      { t: "Start the first page of your life book.", s: "Just tell it how your day went.", cta: "🎤 Record your first message" },
    ],
  },
  uk: {
    next: "Далі",
    privacy: "Приватність",
    skip: "Пропустити",
    login: "Вже маєш акаунт?",
    openCode: "Відкритий код",
    screens: [
      { t: "Ласкаво просимо до LIFE OS", s: "Твоє життя варте того, щоб його зберегти." },
      { t: "Ти забудеш майже все, що сталося сьогодні.", s: "Але саме з таких днів складається все твоє життя." },
      { t: "Ми фотографуємо відпустку.", s: "Але майже ніколи не зберігаємо свої думки." },
      { t: "Кожна ідея може змінити життя.", s: "Але лише якщо ти її не втратиш." },
      { t: "LIFE OS усе робить сам.", s: "Ти говориш — AI робить решту.", list: ["розпізнає мовлення", "виділяє інсайти", "пов'язує проєкти", "зберігає здоров'я", "будує історію життя"] },
      { t: "Уяви…", s: "«Покажи момент, коли народилася ідея бізнесу» — відповідь за секунди.", list: ["Коли я був найщасливішим?", "Що допомагало моєму здоров'ю?", "Які рішення змінили моє життя?"] },
      { t: "З часом LIFE OS починає тебе розуміти.", list: ["що тебе надихає", "що дає енергію", "які звички працюють", "які проєкти найважливіші"] },
      { t: "Це більше, ніж щоденник.", list: ["Другий мозок", "Книга життя", "Історія проєктів", "Архів сім'ї", "Карта здоров'я", "Колекція інсайтів"] },
      { t: "За десять років…", s: "Ти проживеш свою історію знову — не за фото, а за справжніми думками й рішеннями." },
      { t: "Твої дані — лише твої.", s: "Чесно, без дрібного шрифту:", list: ["Щоденник бачиш лише ти", "Команда записи не читає", "Код відкритий — перевір сам", "Завантажити чи видалити все — в один клік"], trust: true },
      { t: "Почни першу сторінку своєї книги життя.", s: "Просто розкажи, як минув сьогоднішній день.", cta: "🎤 Записати перше повідомлення" },
    ],
  },
  fr: {
    next: "Suivant",
    privacy: "Confidentialité",
    skip: "Passer",
    login: "Déjà un compte ?",
    openCode: "Code ouvert",
    screens: [
      { t: "Bienvenue dans LIFE OS", s: "Ta vie mérite d'être sauvegardée." },
      { t: "Tu oublieras presque tout ce qui s'est passé aujourd'hui.", s: "Pourtant ta vie entière est faite de jours comme celui-ci." },
      { t: "On photographie nos vacances.", s: "Mais on ne sauvegarde presque jamais nos pensées." },
      { t: "Chaque idée peut changer ta vie.", s: "Mais seulement si tu ne la perds pas." },
      { t: "LIFE OS fait tout pour toi.", s: "Tu parles — l'IA fait le reste.", list: ["transcrit ta voix", "extrait les insights", "relie les projets", "suit la santé", "construit l'histoire de ta vie"] },
      { t: "Imagine…", s: "« Montre le moment où l'idée de mon business est née » — réponse en quelques secondes.", list: ["Quand étais-je le plus heureux ?", "Qu'est-ce qui aidait ma santé ?", "Quelles décisions ont changé ma vie ?"] },
      { t: "Avec le temps, LIFE OS te comprend.", list: ["ce qui t'inspire", "ce qui te donne de l'énergie", "quelles habitudes fonctionnent", "quels projets comptent le plus"] },
      { t: "C'est plus qu'un journal.", list: ["Un second cerveau", "Un livre de vie", "Une histoire de projets", "Une archive familiale", "Une carte de santé", "Une collection d'insights"] },
      { t: "Dans dix ans…", s: "Tu revivras ton histoire — pas par les photos, mais par de vraies pensées et décisions." },
      { t: "Tes données n'appartiennent qu'à toi.", s: "Honnêtement, sans petits caractères :", list: ["Toi seul vois ton journal", "L'équipe ne lit pas les entrées", "Code ouvert — vérifie toi-même", "Exporte ou supprime tout en un clic"], trust: true },
      { t: "Commence la première page de ton livre de vie.", s: "Raconte simplement ta journée.", cta: "🎤 Enregistrer ton premier message" },
    ],
  },
};

export default function Onboarding({ locale, botLink }: { locale: string; botLink: string }) {
  const data = ONB[locale] || ONB.ru;
  const screens = data.screens;
  const [i, setI] = useState(0);
  const sc = screens[i];
  const last = i === screens.length - 1;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "26px 22px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", left: 0 }}>
          <LangMenu current={locale as Locale} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {screens.map((_, k) => (
            <span key={k} style={{ width: k === i ? 20 : 6, height: 6, borderRadius: 99, background: k === i ? "var(--accent)" : "var(--border)", transition: "all .3s" }} />
          ))}
        </div>
        {!last && (
          <button onClick={() => setI(screens.length - 1)} style={{ position: "absolute", right: 0, background: "none", border: "none", color: "var(--text-3)", fontSize: 13, cursor: "pointer", padding: 4 }}>{data.skip} →</button>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div key={i} className="fade-up" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(27px, 6.5vw, 42px)", fontWeight: 600, lineHeight: 1.13, margin: "0 0 18px", letterSpacing: "-0.02em" }}>{sc.t}</h1>
          {sc.s && <p style={{ fontSize: "clamp(16px, 3.6vw, 20px)", color: "var(--text-2)", lineHeight: 1.5, margin: "0 auto 8px", maxWidth: 460 }}>{sc.s}</p>}
          {sc.list && (
            <div style={{ display: "inline-flex", flexDirection: "column", gap: 11, textAlign: "left", marginTop: 18 }}>
              {sc.list.map((x, k) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 16.5 }}>
                  <i className="ti ti-circle-check" style={{ color: "var(--accent)", fontSize: 20, flexShrink: 0 }} />
                  <span>{x}</span>
                </div>
              ))}
            </div>
          )}
          {sc.trust && (
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 26, flexWrap: "wrap" }}>
              <a href="https://github.com/top15igor/life-os" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, textDecoration: "none" }}>
                <i className="ti ti-brand-github" style={{ fontSize: 16 }} />{data.openCode}
              </a>
              <a href="/privacy" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, textDecoration: "none" }}>
                🔒 {data.privacy}
              </a>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        {last ? (
          <a href={botLink} target="_blank" rel="noreferrer" style={{ display: "block", width: "100%", maxWidth: 360, textAlign: "center", padding: "15px 20px", borderRadius: 14, background: "var(--accent)", color: "#fff", fontSize: 16, fontWeight: 600 }}>
            {sc.cta}
          </a>
        ) : (
          <button onClick={() => setI(i + 1)} style={{ width: "100%", maxWidth: 360, padding: "14px 20px", borderRadius: 14, background: "var(--accent)", color: "#fff", fontSize: 16, fontWeight: 600, border: "none", cursor: "pointer" }}>
            {data.next} →
          </button>
        )}
        <button
          onClick={() => setI(i > 0 ? i - 1 : 0)}
          style={{ visibility: i > 0 ? "visible" : "hidden", background: "none", border: "none", color: "var(--text-3)", fontSize: 13, cursor: "pointer", padding: 4 }}
        >
          ← {data.next === "Next" ? "Back" : data.next === "Suivant" ? "Retour" : "Назад"}
        </button>
        <div style={{ display: "flex", gap: 18, marginTop: 2, alignItems: "center" }}>
          <a href={botLink} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>{data.login}</a>
          <a href="/privacy" style={{ color: "var(--text-3)", fontSize: 12, textDecoration: "none" }}>🔒 {data.privacy}</a>
        </div>
      </div>
    </div>
  );
}
