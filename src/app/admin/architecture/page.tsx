import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import GuideToc from "@/components/GuideToc";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

function Sec({ id, icon, title, sub, children }: any) {
  return (
    <div id={id} style={{ marginBottom: 30, scrollMarginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: sub ? 3 : 12 }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 18, color: "var(--accent)" }} />
        </span>
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</h2>
      </div>
      {sub && <div style={{ fontSize: 13, color: "var(--text-2)", margin: "0 0 12px 42px", lineHeight: 1.5 }}>{sub}</div>}
      {children}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="card" style={{ padding: 0, overflowX: "auto", marginBottom: 6 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "var(--text-2)", fontSize: 11.5, textAlign: "left" }}>
            {head.map((h, i) => <th key={i} style={{ padding: "10px 13px", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ borderTop: "1px solid var(--border)" }}>
              {r.map((c, ci) => (
                <td key={ci} style={{ padding: "10px 13px", color: ci === 0 ? "var(--text)" : "var(--text-2)", verticalAlign: "top", lineHeight: 1.5, fontWeight: ci === 0 ? 500 : 400, whiteSpace: ci === 0 ? "nowrap" : "normal" }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TOC: { id: string; label: string }[] = [
  { id: "storage", label: "Где живёт код и данные" },
  { id: "positioning", label: "Позиционирование" },
  { id: "stack", label: "Технологический стек" },
  { id: "layers", label: "Как всё устроено — 4 слоя" },
  { id: "flow", label: "Путь данных" },
  { id: "routes", label: "Входные двери и маршруты" },
  { id: "database", label: "База данных" },
  { id: "models", label: "AI-модели" },
  { id: "endpoints", label: "API-эндпоинты" },
  { id: "commands", label: "Команды бота" },
  { id: "security", label: "Безопасность и приватность" },
  { id: "safety", label: "Сохранность данных" },
  { id: "pushes", label: "Пуши и напоминания" },
  { id: "infra", label: "Инфраструктура" },
  { id: "costs", label: "Примерная стоимость" },
  { id: "roadmap", label: "Что дальше (роадмап)" },
];

const POSITIONING = {
  oneLiner: "ChatGPT — инструмент, который достаёшь, когда есть вопрос. LIFE OS — система, которая сама записывает твою жизнь и возвращает её тебе со смыслом.",
  diff: [
    ["Запись без усилий", "Голос в Telegram за 5 сек против «открой и продумай промпт». Трение капчи → ноль, а трение — главный враг привычки."],
    ["Память о тебе", "Структурированный архив жизни (категории, настроение, люди, проекты, годы), а не разрозненные забываемые чаты."],
    ["Понимание во времени", "Ответы из всей истории: «когда был счастливее», «что влияло на здоровье». У ChatGPT этой истории нет."],
    ["Заточенный продукт", "Дашборд, Биограф, Книга жизни, Зеркало, эксперименты — опыт об одном: понять и сохранить жизнь."],
  ] as string[][],
  moat: [
    ["Гравитация данных", "После года записей у пользователя есть его структурированная жизнь — не скопировать и не унести. Чем дольше, тем дороже уйти."],
    ["Ежедневная привычка", "Голос + напоминания + серии делают сервис частью дня."],
    ["Доверие для личного", "Отдельное прозрачное пространство (экспорт, открытый код) именно для интимных данных."],
  ] as string[][],
  honest: "Честно: мы не «умнее» ChatGPT — внутри тот же класс моделей, и в лоб мы не конкурируем. Ров — не технология AI, а гравитация данных, ежедневная привычка и доверие.",
};

const STACK = [
  ["Веб-интерфейс", "Next.js 15 (App Router) + React 19, TypeScript"],
  ["Стили", "Инлайн-стили + CSS-переменные, иконки Tabler. Без Tailwind"],
  ["Приложение (PWA)", "manifest + генерация иконок (next/og) — установка «на экран Домой»"],
  ["Бот", "Telegram Bot API (webhook)"],
  ["База данных", "Supabase — управляемый PostgreSQL"],
  ["AI · текст", "Anthropic Claude — Sonnet 4.6 и Haiku 4.5"],
  ["AI · голос", "OpenAI Whisper (whisper-1)"],
  ["Хостинг кода", "Vercel — serverless, Fluid Compute"],
  ["Код и деплой", "GitHub → авто-деплой на Vercel при каждом push"],
  ["Языки", "4 интерфейса: RU · EN · UK · FR"],
  ["Вход", "Личная ссылка из бота (magic-link, cookie) + опциональный PIN"],
];

const LAYERS = [
  { icon: "ti-brand-telegram", color: "#229ED9", t: "1. Ты — входные точки", d: "Telegram-бот (голос и текст) и веб-дашборд (сайт + PWA «как приложение»)." },
  { icon: "ti-server", color: "#6366f1", t: "2. Vercel — приложение (Next.js)", d: "Серверный код без хранилища: бот-вебхук /api/telegram, веб + API-эндпоинты, крон (напоминания и недельный дайджест)." },
  { icon: "ti-sparkles", color: "#f59e0b", t: "3. AI-провайдеры", d: "Whisper переводит голос в текст; Claude Sonnet разбирает записи, отвечает Биографом и собирает аналитику; Claude Haiku решает «вопрос или запись»." },
  { icon: "ti-database", color: "#1D9E75", t: "4. Supabase — твоя база знаний", d: "Облачный PostgreSQL. Здесь живёт ВСЁ постоянное: записи и все связанные данные, аккаунты, кэш аналитики." },
];

const FLOW = [
  "Голос или текст приходит в бот → /api/telegram (на Vercel).",
  "Голос → Whisper → текст.",
  "Haiku-классификатор решает: это вопрос к ассистенту или запись в дневник.",
  "Если запись → Claude Sonnet разбирает её в структуру (резюме, настроение, категории, теги, люди, задачи, инсайты).",
  "Vercel сохраняет всё в Supabase.",
  "Бот присылает подтверждение, а на сайте запись сразу видна — сайт читает из Supabase.",
];

const DOORS = [
  ["/about", "Главная дверь — лендинг-витрина", "История проекта, основатель, отзывы, гарантии «данные навсегда твои», вход через Google/почту. Для вошедшего кнопки регистрации спрятаны — вместо них «В приложение»."],
  ["/welcome", "Telegram-онбординг", "Карусель «Запиши первое сообщение» → бот. Для приглашённых (/i/код) и тех, кто пришёл из Telegram. Внизу ссылки на /login и /about."],
  ["/login", "Вход для своих", "Почта, Google, Telegram. Сюда ведёт «Уже есть аккаунт?» с обеих дверей."],
];

const ROUTING = [
  "Гость открыл любую защищённую страницу → middleware редиректит на /about (главная дверь).",
  "Логотип «LIFE OS» в меню → всегда ведёт на /about (витрина проекта).",
  "Выход из аккаунта (/api/logout) → /about, cookie lifeos_token очищается.",
  "PIN-замок без активного юзера (/lock) → /about.",
  "Ссылка-приглашение /i/[code] → показывает /welcome (тот же Onboarding) с реф-кодом пригласившего.",
  "У вошедшего есть cookie lifeos_token → middleware пропускает на все страницы приложения.",
];

// Публичные маршруты (middleware их НЕ закрывает): /welcome, /login, /about, /privacy,
// /u/* (вход по ссылке), /i/* (инвайт), /p/* (публичная книга), /path/* (публичный путь), /api/*.
const PUBLIC_ROUTES = "/welcome · /login · /about · /privacy · /u/* · /i/* · /p/* · /path/* · /api/*";

const TABLES = [
  ["entries", "Записи — центр базы", "id, user_id, raw_text, summary, source, mood, energy, health, sleep_hours, weight, focus, importance, entry_date, entry_time"],
  ["users", "Аккаунты", "id, token, name, chat_id, referred_by, pin_hash, created_at"],
  ["categories", "16 общих категорий", "id, slug"],
  ["tags / people / places / projects", "Сущности пользователя", "id, user_id, name"],
  ["entry_categories/tags/people/places/projects", "Связи запись ↔ сущность", "entry_id, *_id"],
  ["tasks", "Задачи из записей", "id, user_id, entry_id, text, done, created_at"],
  ["insights", "Инсайты", "id, user_id, entry_id, text, created_at"],
  ["gratitude", "Благодарности", "id, user_id, entry_id, text, created_at"],
  ["goals", "Цели на год", "id, user_id, title, progress, year"],
  ["experiments", "Эксперименты Лаборатории", "id, user_id, title, hypothesis, duration_days, start_date, status, result (jsonb)"],
  ["biographer_chats", "История Биографа", "id, user_id, question, answer, created_at"],
  ["life_overview", "Кэш «Что заметил AI»", "user_id, day, entry_count, data (jsonb), updated_at"],
];

const MODELS = [
  ["claude-sonnet-4-6", "Разбор записи, Биограф, «Что заметил AI», Лаборатория, дайджест", "Anthropic"],
  ["claude-haiku-4-5", "Классификатор «вопрос / запись» (быстрый и дешёвый)", "Anthropic"],
  ["whisper-1", "Распознавание голоса → текст", "OpenAI"],
];

const ENDPOINTS = [
  ["/api/telegram", "Вебхук бота: приём голоса/текста, команды, кнопки"],
  ["/api/entry · /api/capture-voice", "Запись с сайта: текстом и голосом (через Whisper)"],
  ["/api/biographer", "Вопрос Биографу (ответ по всем записям)"],
  ["/api/intelligence", "Связи записи: причины, последствия, закономерности"],
  ["/api/life-overview", "«Что заметил AI» и «Зеркало жизни» (с кэшем)"],
  ["/api/task · /api/goal · /api/project · /api/experiment", "Управление задачами, целями, проектами, экспериментами"],
  ["/api/pin · /api/account · /api/logout · /api/me", "Безопасность и аккаунт (PIN, удаление, выход)"],
  ["/api/cron", "По расписанию: вечерние напоминания и недельный дайджест"],
  ["/api/setup-webhook · /api/setup-commands", "Настройка бота (вебхук, меню команд)"],
  ["/api/check-db · /api/resummarize · /api/diag", "Служебные: проверка миграций, перегенерация, диагностика"],
];

const COMMANDS = [
  ["/start", "Приветствие и личная ссылка на дневник"],
  ["/link", "Получить ссылку на веб-дневник заново"],
  ["/ask · /q", "Спросить ассистента (можно и просто текстом — поймёт по смыслу)"],
  ["/save", "Принудительно сохранить как запись"],
  ["/invite", "Пригласить друга (реферальная ссылка)"],
  ["/resetpin", "Сбросить PIN-замок"],
  ["/demo", "Показать приветственный диалог заново"],
];

const INFRA = [
  ["Supabase", "База данных (PostgreSQL) — все данные пользователей"],
  ["Vercel", "Код приложения, API-эндпоинты, крон. Serverless"],
  ["GitHub", "Исходный код. Push → авто-деплой на Vercel"],
  ["Telegram", "Платформа бота (хранит сами сообщения чата)"],
  ["Anthropic", "Claude — разбор и генерация текста"],
  ["OpenAI", "Whisper — распознавание голоса"],
];

const SECURITY = [
  "RLS (Row Level Security) включён на всех таблицах — прямой доступ к базе извне закрыт.",
  "К базе ходит только серверный ключ (service_role); анонимный ключ нигде не используется.",
  "PIN-замок на веб-вход (опционально, по желанию пользователя).",
  "Данные шифруются в покое и передаются по защищённому каналу (TLS), есть резервные копии.",
  "AI-провайдеры по условиям API не используют текст для обучения моделей.",
  "Вход по личной ссылке (magic-link); каждый может удалить аккаунт со всеми данными.",
  "Экспорт: пользователь может скачать ВСЕ свои данные одним файлом в любой момент (/api/export).",
  "Открытый код: репозиторий публичный (github.com/top15igor/life-os) — любой может проверить, что именно происходит с данными.",
];

const SAFETY_Q = [
  { t: "Открытый код ≠ открытый доступ", d: "В коде нет ни одного ключа. Пароли от базы, бота и AI хранятся в защищённых переменных Vercel, не в репозитории. Знать устройство замка — не то же самое, что иметь ключ. Так же открыты протоколы банков и Telegram." },
  { t: "Каждый трогает только свои данные", d: "Любое изменение или удаление жёстко привязано к user_id владельца (во всех эндпоинтах .eq(\"user_id\", …)). До чужого дневника дотянуться нельзя — запрос к чужим данным возвращает пусто. Удаление аккаунта стирает только свои строки." },
  { t: "Живой сайт меняет только владелец", d: "Публичный репозиторий = любой может читать и копировать код, но писать в проект и деплоить — только владелец (по SSH-ключу). Чьи-то форки или правки на сайт не попадают." },
];

const SAFETY_RISKS = [
  ["Личная ссылка = ключ", "Если переслать свою ссылку /u/… — получивший войдёт в этот дневник (только в данные того, кто переслал)", "PIN-замок; не пересылать ссылку"],
  ["Серверный ключ базы", "Всемогущий, но не в коде и не в браузере — только на сервере", "Никогда не коммитить .env (стоит в .gitignore)"],
];

const PUSHES = [
  ["Первый /start", "Живое приветствие (серия сообщений) + строка про приватность + личная ссылка"],
  ["Возврат в бота /start", "Короткое «с возвращением» + ссылка на дневник"],
  ["После каждой записи", "Тёплое резюме, серия 🔥, вехи (1/10/25/50/100…), воспоминания «год/месяц назад», кнопки «Книга жизни» и «Спросить»"],
  ["Вечер · ежедневно", "Напоминание тем, кто не писал сегодня. Учитывает серию (писал вчера → «не разорви цепочку») и язык пользователя"],
  ["Возврат · 3 / 7 / 14 / 30-й день тишины", "Мягкие «скучаем» по нарастающей. Дальше — не беспокоим (без ежедневного спама)"],
  ["Воскресенье вечером", "AI-обзор прошедшей недели на языке пользователя"],
];

const COSTS = [
  ["Распознавание голоса (Whisper)", "≈ $0.006 за минуту аудио"],
  ["Разбор записи (Claude Sonnet)", "≈ несколько центов за запись (вход + выход токенов)"],
  ["Классификатор (Claude Haiku)", "доли цента за сообщение"],
  ["AI-страницы (Биограф, аналитика)", "≈ 3–8 центов за запрос; кэшируются на день"],
  ["Хостинг (Vercel + Supabase)", "бесплатные тарифы на старте, далее по росту"],
];

const ROADMAP = [
  "💳 Платная подписка (Stripe + тарифы) — после первых платящих пользователей.",
  "🍎 Нативное приложение в App Store (обёртка) — при росте аудитории.",
  "✉️ Email для восстановления доступа.",
  "📷 Фото в записях и 🌤️ реальная погода на главном экране.",
];

const STORAGE = [
  ["Код программы", "Компьютер + GitHub + Vercel", "Три синхронные копии ОДНОГО кода: на компе — папка ~/life-os, на GitHub — копия в облаке, на Vercel — работающий сайт mylifebookai.vercel.app. Это не разные файлы, а копии одного."],
  ["Твои записи", "Supabase (облако)", "Всё, что ты надиктовал боту голосом и текстом. На компьютере их нет — они всегда в облаке."],
];

const WORKPLACE = [
  {
    icon: "ti-device-laptop", color: "#6366f1", t: "Локально — на твоём компе",
    plus: ["Быстро, ничего не ждёшь", "Сразу видно результат на твоей машине", "Ничего не уходит в облако, пока сам не отправишь"],
    minus: ["Работает, только пока комп включён и приложение открыто", "Привязано к этому компьютеру"],
  },
  {
    icon: "ti-cloud-cog", color: "#1D9E75", t: "В облаке — удалённая машина",
    plus: ["Можно закрыть ноут — задача доделается сама", "Удобно для долгих задач (20–40 минут)", "Запустить с одного устройства, проверить с другого"],
    minus: ["Сложнее сразу «потрогать» результат глазами", "Иногда нужно настраивать доступы (ключи)"],
  },
];

export default async function ArchitecturePage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");
  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <GuideToc items={TOC} />
      <main className="main">
        <Link href="/admin" style={{ color: "var(--accent)", fontSize: 13 }}>← Admin</Link>

        <div style={{ margin: "12px 0 6px", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-blueprint" style={{ fontSize: 26, color: "var(--accent)" }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Архитектура проекта</h1>
        </div>
        <p style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.6, marginTop: 0, marginBottom: 22, maxWidth: 640 }}>
          Полная карта LIFE OS — стек, как всё устроено, база данных и инфраструктура. Можно открыть в любой момент и показать программисту или инвестору.
        </p>

        {/* Содержание — как в Инструкции */}
        <div className="card" style={{ marginBottom: 26, padding: "18px 18px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, paddingBottom: 12, marginBottom: 4, borderBottom: "1px solid var(--border)" }}>
            <i className="ti ti-book" style={{ fontSize: 18, color: "var(--accent)" }} />
            <span style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 18, fontWeight: 600, letterSpacing: "0.01em" }}>Содержание</span>
          </div>
          <div className="toc-book">
            {TOC.map((it, i) => (
              <a key={it.id} href={`#${it.id}`}>
                <span className="toc-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="toc-t">{it.label}</span>
                <span className="toc-dots" />
                <i className="ti ti-chevron-right toc-arrow" />
              </a>
            ))}
          </div>
        </div>

        <Sec id="storage" icon="ti-server-2" title="Где живёт код и данные — на компе или в облаке?" sub="Частый вопрос: «мои файлы на компьютере или в облаке?» Разбираем по-простому.">
          <div className="card" style={{ background: "var(--accent-bg)", border: "none", color: "var(--accent-text)", fontSize: 14, fontWeight: 500, lineHeight: 1.55, marginBottom: 12 }}>
            Главное: <b>код программы</b> и <b>твои записи</b> — это разные вещи, и хранятся они в разных местах.
          </div>
          <Table head={["Что", "Где хранится", "Подробнее"]} rows={STORAGE} />

          <div style={{ fontSize: 13.5, fontWeight: 600, margin: "20px 0 4px" }}>Работать локально или в облаке?</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 10, lineHeight: 1.5 }}>
            Когда Claude помогает с кодом, можно выбрать, где он работает. На итог это не влияет — только на удобство.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
            {WORKPLACE.map((w, i) => (
              <div key={i} className="card">
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 9 }}>
                  <i className={`ti ${w.icon}`} style={{ fontSize: 22, color: w.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{w.t}</div>
                </div>
                {w.plus.map((p, pi) => (
                  <div key={pi} style={{ display: "flex", gap: 8, padding: "3px 0", fontSize: 12.5, lineHeight: 1.5 }}>
                    <i className="ti ti-plus" style={{ fontSize: 13, color: "var(--positive)", marginTop: 3, flexShrink: 0 }} />{p}
                  </div>
                ))}
                {w.minus.map((m, mi) => (
                  <div key={mi} style={{ display: "flex", gap: 8, padding: "3px 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--text-2)" }}>
                    <i className="ti ti-minus" style={{ fontSize: 13, color: "var(--text-3)", marginTop: 3, flexShrink: 0 }} />{m}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="card" style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "flex-start" }}>
            <i className="ti ti-bulb" style={{ fontSize: 20, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, lineHeight: 1.55 }}>
              <b>Совет для тебя — оставляй «Local».</b> Сидишь за компом, сразу видишь результат, всё в одной папке. Облако нужно, только если задача очень долгая и хочешь закрыть ноут.
            </div>
          </div>

          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10, lineHeight: 1.55 }}>
            Где бы Claude ни работал — итог один: правки кода едут в GitHub → авто-деплой на Vercel (сайт), а записи как лежали, так и лежат в Supabase. Это выбор «где стоит рабочий стол», а не «где хранятся вещи».
          </div>
        </Sec>

        <Sec id="positioning" icon="ti-rocket" title="Позиционирование — почему не ChatGPT" sub="Мы не конкурируем с ChatGPT «в лоб». Внутри тот же класс AI; мы — продукт для задачи, которую он структурно не делает.">
          <div className="card" style={{ background: "var(--accent-bg)", border: "none", color: "var(--accent-text)", fontSize: 14.5, fontWeight: 500, lineHeight: 1.5, marginBottom: 12 }}>
            «{POSITIONING.oneLiner}»
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", margin: "0 0 7px" }}>Что ChatGPT структурно не делает:</div>
          <Table head={["Отличие", "В чём суть"]} rows={POSITIONING.diff} />
          <div style={{ fontSize: 12.5, color: "var(--text-3)", margin: "14px 0 7px" }}>Ров — что защищает (не AI, а это):</div>
          <Table head={["Ров", "Почему держит"]} rows={POSITIONING.moat} />
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10, lineHeight: 1.55 }}>{POSITIONING.honest}</div>
        </Sec>

        <Sec id="stack" icon="ti-stack-2" title="Технологический стек">
          <Table head={["Слой", "Технология"]} rows={STACK} />
        </Sec>

        <Sec id="layers" icon="ti-layers-intersect" title="Как всё устроено — 4 слоя">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
            {LAYERS.map((l, i) => (
              <div key={i} className="card" style={{ display: "flex", gap: 11 }}>
                <i className={`ti ${l.icon}`} style={{ fontSize: 22, color: l.color, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{l.t}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55 }}>{l.d}</div>
                </div>
              </div>
            ))}
          </div>
        </Sec>

        <Sec id="flow" icon="ti-route-2" title="Путь данных" sub="Что происходит, когда ты говоришь боту:">
          <div className="card">
            {FLOW.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 11, padding: "6px 0", alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.55 }}>{step}</span>
              </div>
            ))}
          </div>
        </Sec>

        <Sec id="routes" icon="ti-door-enter" title="Входные двери и маршруты" sub="Куда попадает человек до входа и как устроена защита страниц. Единая главная дверь — /about.">
          <Table head={["Маршрут", "Роль", "Что показывает / для кого"]} rows={DOORS} />
          <div className="card" style={{ marginTop: 10 }}>
            {ROUTING.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 11, padding: "6px 0", alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.55 }}>{step}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6, margin: "10px 0 0 2px" }}>
            <b>Защита (middleware):</b> без cookie lifeos_token всё закрыто и редиректит на /about. Публичные исключения:{" "}
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>{PUBLIC_ROUTES}</span>. Сам токен проверяется по базе уже в страницах (requireUser).
          </div>
        </Sec>

        <Sec id="database" icon="ti-database" title="База данных (Supabase · PostgreSQL)" sub="Центр — таблица entries (записи). К ней через таблицы-связи привязаны категории, теги, люди, места и проекты. Прямые «дети» записи — задачи, инсайты, благодарности. Отдельно по пользователю — цели, эксперименты, история Биографа и кэш аналитики.">
          <Table head={["Таблица", "Назначение", "Ключевые поля"]} rows={TABLES} />
        </Sec>

        <Sec id="models" icon="ti-robot" title="AI-модели">
          <Table head={["Модель", "Для чего", "Провайдер"]} rows={MODELS} />
        </Sec>

        <Sec id="endpoints" icon="ti-api" title="API-эндпоинты">
          <Table head={["Маршрут", "Назначение"]} rows={ENDPOINTS} />
        </Sec>

        <Sec id="commands" icon="ti-message-2-bolt" title="Команды бота">
          <Table head={["Команда", "Что делает"]} rows={COMMANDS} />
        </Sec>

        <Sec id="security" icon="ti-shield-lock" title="Безопасность и приватность">
          <div className="card">
            {SECURITY.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 9, padding: "5px 0", fontSize: 13.5, lineHeight: 1.55 }}>
                <i className="ti ti-check" style={{ fontSize: 15, color: "var(--positive)", marginTop: 2, flexShrink: 0 }} />{s}
              </div>
            ))}
          </div>
        </Sec>

        <Sec id="safety" icon="ti-lock-check" title="Может ли кто-то удалить или испортить данные?" sub="Короткий ответ: посторонний — нет. Открытие кода этого не изменило. Почему:">
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {SAFETY_Q.map((q, i) => (
              <div key={i} className="card">
                <div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 5 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 99, background: "var(--positive)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{q.t}</div>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, paddingLeft: 31 }}>{q.d}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", margin: "2px 0 7px" }}>Что честно остаётся риском (и как закрыто):</div>
          <Table head={["Риск", "Суть", "Защита"]} rows={SAFETY_RISKS} />
        </Sec>

        <Sec id="pushes" icon="ti-bell" title="Пуши и напоминания" sub="Принцип: мягко помогать вернуться, но не спамить. Язык — из Telegram (RU·EN·UK·FR). Шлёт Vercel Cron раз в день вечером (защита CRON_SECRET); мгновенные — сам бот при записи.">
          <Table head={["Когда", "Что приходит"]} rows={PUSHES} />
        </Sec>

        <Sec id="infra" icon="ti-cloud" title="Инфраструктура — где что хостится">
          <Table head={["Сервис", "Роль"]} rows={INFRA} />
        </Sec>

        <Sec id="costs" icon="ti-coin" title="Примерная стоимость" sub="Грубые оценки для понимания экономики (зависят от активности пользователя):">
          <Table head={["Что", "Сколько примерно"]} rows={COSTS} />
        </Sec>

        <Sec id="roadmap" icon="ti-map-2" title="Что дальше (роадмап)">
          <div className="card">
            {ROADMAP.map((r, i) => (
              <div key={i} style={{ fontSize: 13.5, lineHeight: 1.6, padding: "4px 0" }}>{r}</div>
            ))}
          </div>
        </Sec>

        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 20 }}>
          Домен: mylifebookai.vercel.app · Обновляется вместе с проектом.
        </div>
      </main>
    </div>
  );
}
