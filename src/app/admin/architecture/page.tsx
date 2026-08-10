import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

// Страница для владельца: как устроен бот-агент и агенты вокруг него.
// Живёт в админке, а не в README, чтобы Игорь мог заглянуть с телефона —
// и чтобы описание старело вместе с кодом, а не в отдельном документе.

function H({ children }: { children: any }) {
  return <div style={{ fontSize: 16, fontWeight: 600, margin: "26px 0 10px" }}>{children}</div>;
}

function P({ children }: { children: any }) {
  return <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-2)", margin: "0 0 10px" }}>{children}</p>;
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
      <span style={{ width: 26, height: 26, borderRadius: 99, background: "var(--surface-2)", color: "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>{n}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, marginTop: 2 }}>{text}</div>
      </div>
    </div>
  );
}

function Agent({ name, when, what, out }: { name: string; when: string; what: string; out: string }) {
  return (
    <div className="card" style={{ padding: "12px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{when}</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, marginTop: 5 }}>{what}</div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 5 }}>Куда попадает результат: {out}</div>
    </div>
  );
}

export default async function ArchitecturePage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");

  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main" style={{ maxWidth: 760 }}>
        <Link href="/admin" style={{ color: "var(--accent)", fontSize: 13 }}>← Admin</Link>
        <div style={{ fontSize: 19, fontWeight: 500, margin: "10px 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-sitemap" style={{ color: "var(--accent)" }} />Как устроен агент
        </div>
        <P>Две части: путь сообщения от человека до ответа — и агенты, которые крутятся вокруг и следят, чтобы всё работало.</P>

        <H>Путь сообщения</H>
        <div className="card" style={{ padding: "16px 16px 6px" }}>
          <Step n="1" title="Приём" text="Проверяется секрет вебхука и то, что это сообщение ещё не обрабатывалось: Telegram присылает его повторно, если бот ответил медленно." />
          <Step n="2" title="Голос в текст" text="Голосовое расшифровывается. Дальше по пути с ним работают как с обычным текстом." />
          <Step n="3" title="Быстрые ветки без AI" text="Команды со слешем, нажатия кнопок, фото и файлы уходят по своим коротким путям — там всё однозначно, мозг не нужен." />
          <Step n="4" title="Режимы с состоянием" text="Если идёт знакомство, разбор дня или беседа с AI-другом, сообщение принадлежит этому разговору." />
          <Step n="5" title="Мозг" text="Один проход быстрой модели. На виду 37 инструментов, последняя реплика бота, объекты недавнего разговора и местное время. Решает: действие, вопрос или запись." />
          <Step n="6" title="Вторая попытка" text="Если инструмент ответил «не нашёл» или «не понял», агент смотрит на свой результат и пробует другой инструмент. Ровно один раз." />
          <Step n="7" title="Ответ" text="Текст плюс кнопки по ситуации: вернуть как было, переложить на другую полку, открыть источники." />
        </div>

        <H>Что умеет мозг</H>
        <P>
          Записать мысль, поставить и перенести напоминание, добавить и убрать задачу, заметку, цель, мечту,
          список покупок, книгу или фильм. Поправить или удалить трату. Включить и выключить рассылку,
          поменять время утреннего сообщения, поставить тихие дни. Найти по всем полкам сразу и сделать
          разбор по теме. Передать сообщение другому человеку. Вернуть удалённое и показать журнал изменений.
          И честно сказать «не умею», если просят то, чего он не может.
        </P>

        <H>Что происходит с записью</H>
        <P>
          Разбор вытаскивает из одной фразы двенадцать вещей: смысл, настроение, энергию, категории, теги,
          людей, места, проекты, задачи, инсайты, благодарности, обещания и траты. Поэтому «потратил 500 на
          бензин» одновременно становится записью дневника и строкой в деньгах. Отдельно мозг помечает,
          похоже это на справку или на кусок жизни — от этого зависит, предложит ли бот переложить в хранилище.
        </P>

        <H>Агенты вокруг</H>
        <Agent
          name="Самопроверка"
          when="каждые 15 минут"
          what="Пишет боту настоящие сообщения через настоящий вебхук на проде — ответы перехватываются и не уходят в чат. Проверяет известные пути и то, что все миграции базы применены."
          out="При поломке и при восстановлении — сообщение владельцу в Telegram."
        />
        <Agent
          name="Исследователь"
          when="каждые 2 часа"
          what="Сам сочиняет свежие формулировки по десяти семействам намерений и проверяет, понял ли их бот. Ловит то, чего не предусмотрели заранее."
          out="Журнал сбоев и таблица прогонов."
        />
        <Agent
          name="Диагност"
          when="каждое утро"
          what="Читает падения самопроверки, журнал сбоев и жалобы людей. Сводит в разбор: что чинить первым, кого задевает, где искать."
          out="Отложенные задачи и сообщение владельцу."
        />
        <Agent
          name="Починщик"
          when="по кнопке"
          what="Готовит правку и открывает pull request. В main не пишет никогда — выкатывает человек, увидев зелёную сборку."
          out="Pull request на GitHub."
        />
        <Agent
          name="Редактор вопросов"
          when="по понедельникам"
          what="Смотрит, на какие вечерние вопросы люди отвечают, а какие пролистывают, и предлагает переписать слабые."
          out="Страница «Вопросы бота», одобрение одним тапом."
        />

        <H>Часы</H>
        <P>
          Напоминания проверяются раз в минуту планировщиком внутри базы — это единственный способ доставить
          их точно в срок. Бесплатные расписания GitHub на деле срабатывают раз в один-три часа, поэтому там
          живёт только то, что ко времени не критично: самопроверка и утренний разбор.
        </P>

        <H>Если что-то сломалось</H>
        <P>
          Всё это — на странице <Link href="/admin/health" style={{ color: "var(--accent)" }}>«Здоровье бота»</Link>: кнопка
          «быстрая проверка», «полная» и «разбор за сутки», с показом, что упало и почему. Раньше это были ссылки на голый
          JSON, и было непонятно, идёт работа или всё зависло: полная проверка шлёт боту сорок четыре живых сообщения и
          судит ответы второй моделью — это две-три минуты.
        </P>
        <P>
          Если нужен сырой ответ: <code>/api/selftest?mode=full</code>, <code>/api/probe?n=1</code>,{" "}
          <code>/api/diagnose?hours=3</code> — открываются в браузере, где ты вошёл владельцем.
        </P>
        <P>
          Если бот отвечает, но ничего не делает — почти всегда это непринятая миграция базы. Самопроверка
          показывает это отдельной строкой «База готова: имя_файла.sql».
        </P>

        <div style={{ height: 40 }} />
      </main>
    </div>
  );
}
