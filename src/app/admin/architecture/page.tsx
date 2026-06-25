import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

function Sec({ icon, title, sub, children }: any) {
  return (
    <div style={{ marginBottom: 30 }}>
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

export default async function ArchitecturePage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");
  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <Link href="/admin" style={{ color: "var(--accent)", fontSize: 13 }}>← Admin</Link>

        <div style={{ margin: "12px 0 6px", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-blueprint" style={{ fontSize: 26, color: "var(--accent)" }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Архитектура проекта</h1>
        </div>
        <p style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.6, marginTop: 0, marginBottom: 28, maxWidth: 640 }}>
          Полная карта LIFE OS — стек, как всё устроено, база данных и инфраструктура. Можно открыть в любой момент и показать программисту или инвестору.
        </p>

        <Sec icon="ti-stack-2" title="Технологический стек">
          <Table head={["Слой", "Технология"]} rows={STACK} />
        </Sec>

        <Sec icon="ti-layers-intersect" title="Как всё устроено — 4 слоя">
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

        <Sec icon="ti-route-2" title="Путь данных" sub="Что происходит, когда ты говоришь боту:">
          <div className="card">
            {FLOW.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 11, padding: "6px 0", alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.55 }}>{step}</span>
              </div>
            ))}
          </div>
        </Sec>

        <Sec icon="ti-database" title="База данных (Supabase · PostgreSQL)" sub="Центр — таблица entries (записи). К ней через таблицы-связи привязаны категории, теги, люди, места и проекты. Прямые «дети» записи — задачи, инсайты, благодарности. Отдельно по пользователю — цели, эксперименты, история Биографа и кэш аналитики.">
          <Table head={["Таблица", "Назначение", "Ключевые поля"]} rows={TABLES} />
        </Sec>

        <Sec icon="ti-robot" title="AI-модели">
          <Table head={["Модель", "Для чего", "Провайдер"]} rows={MODELS} />
        </Sec>

        <Sec icon="ti-api" title="API-эндпоинты">
          <Table head={["Маршрут", "Назначение"]} rows={ENDPOINTS} />
        </Sec>

        <Sec icon="ti-message-2-bolt" title="Команды бота">
          <Table head={["Команда", "Что делает"]} rows={COMMANDS} />
        </Sec>

        <Sec icon="ti-shield-lock" title="Безопасность и приватность">
          <div className="card">
            {SECURITY.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 9, padding: "5px 0", fontSize: 13.5, lineHeight: 1.55 }}>
                <i className="ti ti-check" style={{ fontSize: 15, color: "var(--positive)", marginTop: 2, flexShrink: 0 }} />{s}
              </div>
            ))}
          </div>
        </Sec>

        <Sec icon="ti-cloud" title="Инфраструктура — где что хостится">
          <Table head={["Сервис", "Роль"]} rows={INFRA} />
        </Sec>

        <Sec icon="ti-coin" title="Примерная стоимость" sub="Грубые оценки для понимания экономики (зависят от активности пользователя):">
          <Table head={["Что", "Сколько примерно"]} rows={COSTS} />
        </Sec>

        <Sec icon="ti-map-2" title="Что дальше (роадмап)">
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
