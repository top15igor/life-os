import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { sendMessage, type SentMessage } from "./telegram";
import { logClaude } from "./usage";

// Самопроверка бота: агент-тестировщик, который «пишет» боту как живой человек и
// сверяет ответы с ожидаемыми.
//
// Как это возможно без Telegram: вебхук принимает те же самые обновления, но с
// заголовком самопроверки — тогда ответы не уходят в чат, а возвращаются нам
// (см. runCaptured в telegram.ts). То есть проверяется НАСТОЯЩИЙ боевой код на
// проде, а не отдельная копия логики, которая рано или поздно разъедется с ней.
//
// Сценарии гоняются на служебном пользователе (отрицательный chat_id, в приватных
// чатах Telegram такие не встречаются), а его записи после прогона удаляются, чтобы
// не мешаться в статистике.
//
// Стоимость: часть сценариев дёргает AI и стоит денег, поэтому режимов два.
// light — только те, что не тратят AI (можно гонять часто).
// full  — плюс запись мысли и вопрос ассистенту (реже, обычно раз в несколько часов).

const TEST_CHAT = -777001;
const TEST_NAME = "🤖 Selftest";

export type StepResult = { name: string; ok: boolean; why?: string; ms: number };
export type RunResult = { mode: Mode; ok: number; failed: number; ms: number; steps: StepResult[] };
export type Mode = "light" | "full";

type Check = (sent: SentMessage[]) => string | null; // null = всё хорошо, строка = что не так

type Scenario = {
  name: string;
  heavy?: boolean;            // тратит AI → только в режиме full
  send?: () => any;           // тело обновления Telegram
  // Некоторые пути живут только в связке: наговорил — ответил — нажал кнопку.
  // Проверять их по одному шагу бессмысленно: ломается именно стык.
  chain?: () => any[];
  check: Check;
  // Проверка в базе: бот мог ответить «записал», но реально ничего не сохранить —
  // для человека это худший из багов, потому что он замечается только потом.
  verifyDb?: () => Promise<string | null>;
};

// Маркер тестовой записи: по нему проверяем, что мысль реально легла в дневник.
const ENTRY_MARK = "набережной";
// Тестовая задача: заводим её командой и следом убираем командой же.
const TASK_MARK = "заказать воду для самопроверки";

async function testTaskState(): Promise<"gone" | "done" | "open"> {
  try {
    const db = supabaseAdmin();
    const { data: u } = await db.from("users").select("id").eq("chat_id", TEST_CHAT).maybeSingle();
    if (!(u as any)?.id) return "gone";
    const { data } = await db.from("tasks").select("id, done").eq("user_id", (u as any).id).ilike("text", `%${TASK_MARK}%`).limit(1);
    const row = ((data as any[]) || [])[0];
    if (!row) return "gone";
    return row.done ? "done" : "open";
  } catch {
    return "gone";
  }
}

async function testTaskExists(): Promise<boolean> {
  try {
    const db = supabaseAdmin();
    const { data: u } = await db.from("users").select("id").eq("chat_id", TEST_CHAT).maybeSingle();
    if (!(u as any)?.id) return false;
    const { data } = await db.from("tasks").select("id").eq("user_id", (u as any).id).ilike("text", `%${TASK_MARK}%`).limit(1);
    return (((data as any[]) || []).length > 0);
  } catch {
    return false;
  }
}

// ===== Помощники для сборки обновлений =====

let seq = 0;
const uid = () => Number(String(Date.now()).slice(-9)) * 10 + (seq++ % 10);

const from = () => ({ id: TEST_CHAT, is_bot: false, first_name: TEST_NAME, language_code: "ru" });

const message = (text: string) => ({
  update_id: uid(),
  message: { message_id: uid(), from: from(), chat: { id: TEST_CHAT, type: "private" }, date: Math.floor(Date.now() / 1000), text },
});

const callback = (data: string) => ({
  update_id: uid(),
  callback_query: {
    id: String(uid()), from: from(), data,
    message: { message_id: uid(), chat: { id: TEST_CHAT, type: "private" }, date: Math.floor(Date.now() / 1000) },
  },
});

// ===== Общие проверки =====

const texts = (sent: SentMessage[]) => sent.filter((s) => s.method === "sendMessage").map((s) => s.text || "");
const allButtons = (sent: SentMessage[]) => sent.flatMap((s) => s.buttons);

// Фразы, которыми бот отвечает, когда внутри что-то упало. Для человека это
// «бот сломался», и именно их важнее всего ловить автоматически.
const BROKEN = [/что-то сбилось/i, /что-то пошло не так/i, /не получилось сохранить/i, /^…$/];

function notBroken(sent: SentMessage[]): string | null {
  const t = texts(sent);
  if (!t.length) return "бот вообще ничего не ответил";
  for (const m of t) for (const re of BROKEN) if (re.test(m.trim())) return `бот ответил ошибкой: «${m.slice(0, 80)}»`;
  return null;
}

const contains = (needle: RegExp | string, label: string): Check => (sent) => {
  const broken = notBroken(sent);
  if (broken) return broken;
  const joined = texts(sent).join("\n");
  const hit = typeof needle === "string" ? joined.includes(needle) : needle.test(joined);
  return hit ? null : `в ответе нет ${label}`;
};

const hasButtons = (min: number, label: string): Check => (sent) => {
  const broken = notBroken(sent);
  if (broken) return broken;
  const b = allButtons(sent);
  return b.length >= min ? null : `${label}: ожидались кнопки (минимум ${min}), пришло ${b.length}`;
};

// ===== Сценарии =====
//
// Каждый — реальный путь живого человека. Проверки нарочно мягкие к формулировкам
// (тексты и ответы AI меняются), но жёсткие к поломкам: молчание, ошибка, пропавшая
// кнопка, несохранённая запись.

const SCENARIOS: Scenario[] = [
  {
    // Живая жалоба Игоря: шесть вопросов подряд про один поход в магазин, а
    // день так и остался нерассказанным. Проверяем, что второй вопрос уходит
    // в ДРУГУЮ сторону дня, а не углубляется в первый ответ.
    name: "Разбор дня: вопросы не топчутся на одном",
    heavy: true,
    chain: () => [
      message("помоги зафиксировать день"),
      callback("day:len:6"),
      message("был в булочной и в био магазине, купил помидоры и инжир"),
      // Обязательно выходим из режима: иначе следующие сценарии утонут в
      // разборе дня. Ровно этот класс ошибок — режим с состоянием, который
      // не отпускает, — уже дважды ломал живых людей.
      message("/stop"),
    ],
    check: (sent) => {
      const broken = notBroken(sent);
      if (broken) return broken;
      const qs = texts(sent).filter((t) => /\d\/\d/.test(t));
      const last = qs[qs.length - 1] || "";
      if (qs.length < 2) return "бот не задал второй вопрос — разбор дня оборвался";
      if (!last) return "после ответа бот не задал следующий вопрос";
      // Второй вопрос про ту же еду и покупки — значит, разбор пошёл вглубь,
      // а не вширь.
      if (/магазин|купил|продукт|еда|ел\b|блюдо|булочн/i.test(last)) {
        return `второй вопрос снова про покупки и еду: «${last.slice(0, 90)}» — разбор дня не раскрывает день`;
      }
      return null;
    },
  },
  {
    // Ровно то место, где Коля спотыкался дважды: обсуждали идею, он сказал
    // «вернёмся к доработке идеи» — и получил «не нашёл такой идеи», потому
    // что искали в сохранённых, а разговор был не закончен.
    name: "Идея: «вернёмся к доработке» подхватывает разговор",
    heavy: true,
    chain: () => [
      message("идея по life os: было бы удобно видеть сводку недели одной картинкой"),
      message("давай вернёмся к доработке идеи"),
    ],
    check: (sent) => {
      const broken = notBroken(sent);
      if (broken) return broken;
      const joined = texts(sent).join("\n");
      if (/не нашёл такой идеи/i.test(joined)) return "бот не увидел незаконченный разговор и ответил «не нашёл такой идеи»";
      if (/запись сохранена|записал твоими словами/i.test(joined)) return "реплика обсуждения ушла в дневник вместо разговора";
      return null;
    },
  },
  {
    // Самый ценный путь канала идей и самый хрупкий: он живёт на стыке трёх
    // шагов. Коля дважды доходил до конца и не получал ничего — сначала из-за
    // молчащей кнопки, потом из-за того, что кнопка обещала отправку, а
    // показывала предпросмотр. По одному шагу это не ловится.
    name: "Идея: разговор доходит до сохранения",
    heavy: true,
    chain: () => [
      message("идея по life os: хочу чтобы бот сам напоминал оплатить счета за квартиру"),
      message("нужно всем, кто платит коммуналку; напоминать за три дня до срока, чтобы не набежала пеня"),
      callback("idea:sum"),
    ],
    check: (sent) => {
      const broken = notBroken(sent);
      if (broken) return broken;
      const joined = texts(sent).join("\n");
      if (!/отправил как идею|идея №\d/i.test(joined)) return "после «хватит, отправляй» бот не подтвердил, что идея сохранена";
      return null;
    },
    verifyDb: async () => {
      try {
        const db = supabaseAdmin();
        const { data: u } = await db.from("users").select("id").eq("chat_id", TEST_CHAT).maybeSingle();
        const id = (u as any)?.id;
        if (!id) return "тестовый пользователь не найден";
        const { data } = await db.from("ideas").select("id, title").eq("user_id", id).limit(1);
        return (data as any[])?.length ? null : "бот сказал, что отправил, но идея в базе не появилась";
      } catch {
        return "не удалось проверить таблицу идей (миграция ideas.sql?)";
      }
    },
  },
  {
    name: "/start отвечает",
    send: () => message("/start"),
    check: (sent) => notBroken(sent),
  },
  {
    name: "/help упоминает /problem",
    send: () => message("/help"),
    check: contains("/problem", "команды /problem — человек не узнает, куда жаловаться"),
  },
  {
    name: "«Сообщить о проблеме» открывает меню",
    send: () => message("/problem"),
    check: hasButtons(6, "меню типов проблемы"),
  },
  {
    name: "Выбор типа проблемы просит описание",
    send: () => callback("pb:freeze"),
    check: contains(/🔒/, "обещания приватности — человек не увидит, что уходит владельцу"),
  },
  {
    name: "Отмена жалобы выходит из режима",
    send: () => callback("pb:cancel"),
    check: (sent) => notBroken(sent),
  },
  {
    name: "«Помоги рассказать» спрашивает глубину",
    send: () => callback("day:start"),
    check: hasButtons(3, "выбор длины разбора дня"),
  },
  {
    name: "Разбор дня задаёт первый вопрос",
    heavy: true,
    send: () => callback("day:len:3"),
    check: (sent) => {
      const broken = notBroken(sent);
      if (broken) return broken;
      const joined = texts(sent).join("\n");
      return /1\/3|\?/.test(joined) ? null : "бот не задал первый вопрос";
    },
  },
  {
    name: "Выход из разбора дня",
    send: () => message("/stop"),
    check: (sent) => notBroken(sent),
  },
  {
    name: "Мысль сохраняется в дневник",
    heavy: true,
    send: () => message(`сегодня пробежал 6 км по ${ENTRY_MARK}, чувствую себя отлично`),
    check: (sent) => notBroken(sent),
    verifyDb: async () => {
      const db = supabaseAdmin();
      const { data: u } = await db.from("users").select("id").eq("chat_id", TEST_CHAT).maybeSingle();
      const id = (u as any)?.id;
      if (!id) return "тестовый пользователь не создался";
      const { data } = await db.from("entries").select("id").eq("user_id", id).ilike("raw_text", `%${ENTRY_MARK}%`).limit(1);
      return ((data as any[]) || []).length ? null : "бот ответил, но записи в дневнике нет";
    },
  },
  {
    name: "Команда «добавь задачу» заводит задачу",
    heavy: true,
    send: () => message(`добавь задачу ${TASK_MARK}`),
    check: (sent) => notBroken(sent),
    verifyDb: async () => (await testTaskExists()) ? null : "задача не появилась в базе",
  },
  {
    name: "Команда «убери задачу» действительно её убирает",
    heavy: true,
    send: () => message(`убери задачу ${TASK_MARK}`),
    check: (sent) => notBroken(sent),
    // Именно тут раньше был провал: удаления задач не существовало, и бот в
    // лучшем случае помечал её выполненной — то есть делал не то, о чём просят.
    verifyDb: async () => {
      const st = await testTaskState();
      if (st === "gone") return null;
      // Разделяем два разных провала: бот вообще не понял команду или понял её
      // как «отметить выполненной». Лечится это по-разному.
      if (st === "done") return "бот отметил задачу выполненной вместо удаления";
      return "задача осталась в базе — «убери» не сработало";
    },
  },
  {
    name: "Единый поиск находит сохранённое на другой полке",
    heavy: true,
    // Заметка легла в хранилище, а ищем её обычным вопросом «где я записывал».
    // Раньше такой вопрос уходил в дневник и честно отвечал «не нашёл».
    send: () => message("запиши: код от домофона для самопроверки 4582"),
    check: (sent) => notBroken(sent),
  },
  {
    name: "«Где я записывал код от домофона?» — находит",
    heavy: true,
    send: () => message("где я записывал код от домофона для самопроверки?"),
    check: (sent) => {
      const broken = notBroken(sent);
      if (broken) return broken;
      const joined = texts(sent).join("\n");
      return joined.includes("4582") ? null : "поиск не нашёл сохранённый код — ответ без него";
    },
  },
  {
    name: "Контекст: «перенеси его на завтра» после напоминания",
    heavy: true,
    send: () => message("напомни завтра в 15:00 позвонить в банк для самопроверки"),
    check: (sent) => notBroken(sent),
  },
  {
    name: "Контекст: отсылка «его» понята без повтора названия",
    heavy: true,
    // Раньше это был тупик: в «перенеси его» нет ни слова из напоминания,
    // и роутеру было не за что зацепиться.
    send: () => message("перенеси его на 18:00"),
    check: (sent) => {
      const broken = notBroken(sent);
      if (broken) return broken;
      const joined = texts(sent).join("\n");
      return /18:00|18\.00|перенёс|перенес/i.test(joined) ? null : "бот не понял, о каком напоминании речь";
    },
  },
  {
    name: "Рассказ о дне НЕ предлагают убрать в хранилище",
    heavy: true,
    send: () => message("вчера ездили с детьми на пляж, ели пиццу, был потрясающий закат"),
    check: (sent) => {
      const broken = notBroken(sent);
      if (broken) return broken;
      // Кусок жизни — не справка. Кнопка «Это в хранилище» под ним выглядит так,
      // будто бот не понял, что прочитал.
      const b = allButtons(sent).join(" ");
      return /хранилищ/i.test(b) ? "под рассказом о дне предложено убрать в хранилище" : null;
    },
  },
  {
    name: "Справку — наоборот, предлагают убрать в хранилище",
    heavy: true,
    send: () => message("код от подъезда 7734, домофон снизу справа"),
    check: (sent) => notBroken(sent),
  },
  {
    name: "Агент: поправку решает мозг, а не регулярка",
    heavy: true,
    // Фраза-поправка, которая раньше перехватывалась ДО роутера и уходила
    // править дневник, даже когда речь шла о другом.
    send: () => message("я ошибся, на самом деле бежал не 6, а 8 километров"),
    check: (sent) => notBroken(sent),
  },
  {
    name: "Агент: не упирается с первой попытки",
    heavy: true,
    // Просьба про несуществующий объект: первый инструмент ответит «не нашёл»,
    // и агент обязан попробовать иначе, а не оставить человека в тупике.
    send: () => message("убери задачу про полёт на луну"),
    check: (sent) => {
      const broken = notBroken(sent);
      if (broken) return broken;
      const joined = texts(sent).join("\n");
      return joined.trim().length > 15 ? null : "ответ пустой — агент не предложил ничего взамен";
    },
  },
  {
    name: "«Верни как было» восстанавливает удалённое",
    heavy: true,
    send: () => message("отмени последнее, верни как было"),
    check: (sent) => notBroken(sent),
    // Задачу убрали предыдущим сценарием — после отмены она обязана вернуться.
    // Это главная защита от нашей же новой способности удалять по команде.
    verifyDb: async () => {
      const st = await testTaskState();
      if (st === "gone") return "отмена не вернула удалённую задачу";
      return null;
    },
  },
  {
    name: "«Перебери всё про…» даёт разбор, а не отписку",
    heavy: true,
    send: () => message("перебери всё, что у меня есть про пробежки, и дай саммари"),
    check: (sent) => {
      const broken = notBroken(sent);
      if (broken) return broken;
      // Материала у тестового пользователя мало — важно, что бот честно ответил
      // по теме, а не промолчал и не свалился в общий разговор.
      const joined = texts(sent).join("\n");
      if (joined.length < 60) return "разбор вышел пустым";
      return /пробеж|бег|км|набережной|мало|нет запис/i.test(joined) ? null : "ответ не про запрошенную тему";
    },
  },
  {
    name: "«Что у меня сегодня?» отвечает",
    heavy: true,
    send: () => message("что у меня сегодня?"),
    check: (sent) => notBroken(sent),
  },
];

// ===== Готовность базы =====
//
// Самая коварная поломка этого проекта: миграция не применена, код мягко
// деградирует — и фича молча не работает. Так пропали напоминания (нет колонки
// notified_at → выборка падает → «слать нечего»). Снаружи всё выглядит здоровым.
// Поэтому проверяем прямо: есть ли то, на что код рассчитывает.

const SCHEMA_CHECKS: { table: string; column?: string; sql: string; why: string }[] = [
  { table: "reminders", column: "notified_at", sql: "reminders_notify.sql", why: "напоминания не доставляются вообще" },
  { table: "tg_updates", sql: "tg_updates.sql", why: "длинное голосовое может сохраниться дважды" },
  { table: "feedback", sql: "feedback.sql", why: "жалобы из /problem не сохраняются" },
  { table: "error_log", sql: "error_log.sql", why: "сбои не пишутся, диагносту нечего читать" },
  { table: "selftest_runs", sql: "selftest.sql", why: "нет истории самопроверки" },
  { table: "push_log", column: "question", sql: "question_quality.sql", why: "не считается отклик на вопросы" },
  { table: "agent_actions", sql: "agent_actions.sql", why: "нельзя отменить удаление — «верни как было» не работает" },
  { table: "memories", column: "embedding", sql: "pgvector_vault.sql", why: "хранилище ищется только по буквам: «жильё» не найдёт «квартиру»" },
  { table: "sort_rules", sql: "sort_rules.sql", why: "поправки на «Разобрать» применяются, но не запоминаются правилом" },
  { table: "ideas", sql: "ideas.sql", why: "идеи от людей некуда сохранять — обсуждение проходит впустую" },
];

async function checkSchema(): Promise<StepResult[]> {
  const db = supabaseAdmin();
  const out: StepResult[] = [];
  for (const c of SCHEMA_CHECKS) {
    const t0 = Date.now();
    try {
      const { error } = await db.from(c.table).select(c.column ? `id, ${c.column}` : "*").limit(1);
      out.push({
        name: `База готова: ${c.sql}`,
        ok: !error,
        why: error ? `не применён supabase/${c.sql} — ${c.why}` : undefined,
        ms: Date.now() - t0,
      });
    } catch (e: any) {
      out.push({ name: `База готова: ${c.sql}`, ok: false, why: `не применён supabase/${c.sql} — ${c.why}`, ms: Date.now() - t0 });
    }
  }
  return out;
}

// ===== Качество ответов =====
//
// Отдельная задача: не «упало или нет», а «хорошо ли бот ответил». Проверяем
// ТОЛЬКО на выдуманных репликах служебного пользователя — чужие диалоги не
// читаем никогда, это прямо обещано людям в «Сообщить о проблеме».
//
// Судит вторая модель по узким признакам, а не по «понравилось». Смысл в том,
// чтобы ловить деградацию: бот начал уходить от вопроса, выдумывать факты или
// сбиваться на казённый тон — это видно раньше, чем кто-то пожалуется.

const OWNER_ID = "00000000-0000-0000-0000-000000000000";
let _judge: Anthropic | null = null;
const judge = () => (_judge ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }));

type QualityCase = { name: string; say: string; expect: string };

// Понимание команд — отдельный класс проверок. Восемь багов за одну ночь были
// про одно: бот не понял, что от него хотят, или понял не то. Здесь проверяется
// не формулировка ответа, а КУДА ушла команда: выключить рассылку, перенести,
// отменить, поправить — это разные действия, и путать их нельзя.
const COMMAND_CASES: QualityCase[] = [
  {
    name: "Команда: идея по продукту уходит в обсуждение, а не в дневник",
    say: "идея по life os: хочу, чтобы бот сам напоминал оплатить счета за квартиру",
    expect: "Бот понимает, что это предложение по САМОМУ приложению, и начинает уточнять детали — задаёт вопрос про идею. Провал — если он сохранил это как запись дневника, поставил задачу, завёл напоминание или ответил общей похвалой без вопроса.",
  },
  {
    name: "Команда: «запомни правило» реально запоминает",
    say: "запомни: мои чеки всегда клади в документы, а не в моменты",
    expect: "Бот подтверждает, что ЗАПОМНИЛ ПРАВИЛО и будет применять его к новым записям. Провал — если он просто сохранил это записью в дневник, ответил общей фразой или обещал «учту» без упоминания правила.",
  },
  {
    name: "Команда: «покажи мои правила» перечисляет их",
    say: "покажи мои правила",
    expect: "Бот показывает список правил или честно говорит, что правил пока нет. Провал — рассказ о настройках рассылки, о манере речи или запись в дневник.",
  },
  {
    name: "Команда: массовое изменение сначала спрашивает",
    say: "отметь все задачи про спорт выполненными",
    expect: "Бот НЕ делает молча: он либо показывает, что именно попадёт под изменение, и просит подтвердить, либо честно говорит, что таких задач не нашёл. Провал — бодрый рапорт «готово» без показа списка и без подтверждения.",
  },
  {
    name: "Команда: правка СТАРОЙ записи ищет нужную",
    say: "исправь запись про поездку в Лиссабон — там было не 200 евро, а 300",
    expect: "Бот либо называет, какую именно запись он поправил (с датой или цитатой), либо честно говорит, что записи про Лиссабон не нашёл. Провал — «поправил последнюю запись» без указания какой, или сохранение этой фразы новой записью дневника.",
  },
  {
    name: "Команда: «не пиши мне по утрам» выключает рассылку",
    say: "не пиши мне по утрам",
    expect: "Бот подтверждает, что ВЫКЛЮЧИЛ утренние сообщения (реально изменил настройку). Провал — если он просто «запомнил пожелание» про манеру речи, ответил вопросом или сохранил это записью в дневник.",
  },
  {
    name: "Команда: «пиши мне каждое утро в 7» включает и ставит час",
    say: "пиши мне каждое утро в 7",
    expect: "Бот подтверждает, что утренние сообщения включены и время — 7 часов. Провал — общий ответ без времени или запись в дневник.",
  },
  {
    name: "Команда: «не трогай меня по выходным» ставит тихие дни",
    say: "не трогай меня по выходным",
    expect: "Бот подтверждает тихие дни на субботу и воскресенье. Провал — если это ушло в манеру речи, в дневник или в вопрос.",
  },
];

const QUALITY_CASES: QualityCase[] = [
  {
    name: "Отвечает на прямой вопрос, а не отписывается",
    say: "а на какую почту зарегистрирован мой аккаунт?",
    expect: "Бот отвечает по существу вопроса про аккаунт (или честно говорит, что почты нет / не может показать). Провал — если он проигнорировал вопрос и завёл разговор о дневнике.",
  },
  {
    name: "Не выдумывает того, чего не было",
    say: "напомни, что я вчера писал про поездку в Японию?",
    expect: "Бот говорит, что таких записей нет или что не нашёл. Провал — если он придумывает подробности несуществующей поездки.",
  },
  {
    name: "Держит тёплый человеческий тон",
    say: "что-то мне сегодня совсем тяжело",
    expect: "Ответ человечный и бережный, без казёнщины, без списка советов и без обесценивания. Провал — сухая инструкция или игнор чувства.",
  },
  {
    name: "Честно говорит о том, чего не умеет",
    say: "закажи мне такси до аэропорта",
    expect: "Бот прямо говорит, что этого не умеет, и предлагает то, что умеет. Провал — обещание сделать или вид, что заказал.",
  },
];

const JUDGE_SYS = `Ты — придирчивый рецензент ответов чат-бота личного дневника. Тебе дают реплику человека, ожидание и фактический ответ бота.

Оцени строго по ожиданию, а не по своему вкусу к формулировкам. Разные слова — это нормально; провал — только если нарушена суть ожидания.

Верни ТОЛЬКО JSON: {"ok":true|false,"why":"одно предложение — что именно не так, если не так"}`;

async function judgeAnswer(c: QualityCase, answer: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null; // без ключа просто не судим
  try {
    const m = await judge().messages.create({
      model: "claude-haiku-4-5-20251001", max_tokens: 300, temperature: 0,
      system: JUDGE_SYS,
      messages: [{ role: "user", content: `РЕПЛИКА ЧЕЛОВЕКА:\n${c.say}\n\nЧЕГО ЖДЁМ:\n${c.expect}\n\nОТВЕТ БОТА:\n${answer.slice(0, 2000)}` }],
    });
    logClaude(OWNER_ID, "selftest-judge", "haiku", (m as any).usage);
    const raw = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    return parsed?.ok ? null : `качество ответа: ${String(parsed?.why || "не соответствует ожиданию").slice(0, 200)}`;
  } catch {
    return null; // судья недоступен — не превращаем это в ложное падение
  }
}

// ===== Прогон =====

async function fire(origin: string, secret: string, update: any): Promise<SentMessage[]> {
  const r = await fetch(`${origin}/api/telegram`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": secret,
      "x-selftest-key": secret,
    },
    body: JSON.stringify(update),
  });
  if (!r.ok) throw new Error(`вебхук ответил ${r.status}`);
  const j = await r.json().catch(() => null);
  if (!j?.ok) throw new Error("вебхук вернул не ok");
  return (j.sent || []) as SentMessage[];
}

// Записи тестового пользователя после прогона удаляем: он служебный, его «пробежки»
// не должны попадать ни в статистику, ни в чью-то ленту.
async function cleanup(): Promise<void> {
  const db = supabaseAdmin();
  const { data: u } = await db.from("users").select("id").eq("chat_id", TEST_CHAT).maybeSingle();
  const id = (u as any)?.id;
  if (!id) return;
  for (const t of ["entries", "reminders", "companion_messages", "feedback", "tasks", "notes", "goals", "ideas"]) {
    try { await db.from(t).delete().eq("user_id", id); } catch { /* таблицы может не быть */ }
  }
  // Сбрасываем ведущие режимы, чтобы следующий прогон стартовал с чистого листа.
  try { await db.from("users").update({ morning_prefs: {} }).eq("id", id); } catch {}
}

export async function runSelftest(origin: string, mode: Mode = "light"): Promise<RunResult> {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const t0 = Date.now();
  const steps: StepResult[] = [];

  for (const sc of SCENARIOS) {
    if (sc.heavy && mode !== "full") continue;
    const s0 = Date.now();
    try {
      let sent: SentMessage[] = [];
      if (sc.chain) {
        for (const upd of sc.chain()) sent = [...sent, ...(await fire(origin, secret, upd))];
      } else {
        sent = await fire(origin, secret, sc.send!());
      }
      let why = sc.check(sent);
      // Разбор записи идёт в фоне уже после ответа бота — даём ему секунду.
      if (!why && sc.verifyDb) {
        await new Promise((r) => setTimeout(r, 1200));
        why = await sc.verifyDb();
      }
      steps.push({ name: sc.name, ok: !why, why: why || undefined, ms: Date.now() - s0 });
    } catch (e: any) {
      steps.push({ name: sc.name, ok: false, why: String(e?.message || e).slice(0, 200), ms: Date.now() - s0 });
    }
  }

  // Готовность базы — в любом режиме: проверка дешёвая, а цена пропущенной
  // миграции высокая (у людей молча не работает целая фича).
  steps.push(...await checkSchema());

  // Качество ответов — только в полном прогоне: каждый случай стоит двух вызовов
  // модели (ответ бота + оценка судьи), гонять это каждые 15 минут незачем.
  //
  // ВАЖНО: чистим ПЕРЕД проверками качества. Иначе тест подставляет сам себя:
  // сценарий выше только что сохранил запись «пробежал 6 км по набережной», и на
  // вопрос «что я писал про поездку в Японию?» бот честно ссылается на неё —
  // а судья считает это выдумкой. Проверять «не выдумывает ли» надо на человеке
  // без истории, иначе ловим не галлюцинацию, а собственный мусор.
  if (mode === "full") {
    await cleanup().catch(() => {});
    for (const c of [...COMMAND_CASES, ...QUALITY_CASES]) {
      const s0 = Date.now();
      try {
        const sent = await fire(origin, secret, message(c.say));
        const broken = notBroken(sent);
        const why = broken || await judgeAnswer(c, texts(sent).join("\n"));
        steps.push({ name: c.name, ok: !why, why: why || undefined, ms: Date.now() - s0 });
      } catch (e: any) {
        steps.push({ name: c.name, ok: false, why: String(e?.message || e).slice(0, 200), ms: Date.now() - s0 });
      }
    }
  }

  await cleanup().catch(() => {});

  const failed = steps.filter((s) => !s.ok).length;
  return { mode, ok: steps.length - failed, failed, ms: Date.now() - t0, steps };
}

// ===== История и оповещение владельца =====

// Пишем прогон в базу (если применён selftest.sql) и возвращаем прошлый результат —
// по нему решаем, когда писать владельцу: при поломке и при восстановлении.
async function saveRun(res: RunResult): Promise<{ prevFailed: number | null; prevNames: string[] }> {
  const db = supabaseAdmin();
  let prevFailed: number | null = null;
  let prevNames: string[] = [];
  try {
    // Сравниваем ТОЛЬКО с прогоном того же режима. Иначе выходит качели: полный
    // прогон (14 сценариев) находит слабый ответ, следующий лёгкий (7 сценариев,
    // без проверок качества) рапортует «бот снова в порядке», и так по кругу —
    // уведомления начинают врать и их перестают читать.
    const { data } = await db.from("selftest_runs").select("failed, failures")
      .eq("mode", res.mode).order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (data) {
      prevFailed = Number((data as any).failed);
      prevNames = (((data as any).failures as any[]) || []).map((f) => String(f?.name || "")).sort();
    }
  } catch { /* таблицы нет — просто без истории */ }
  try {
    await db.from("selftest_runs").insert({
      mode: res.mode, ok: res.ok, failed: res.failed, ms: res.ms,
      failures: res.steps.filter((s) => !s.ok).map((s) => ({ name: s.name, why: s.why })),
    });
  } catch { /* таблицы нет — не мешаем прогону */ }
  return { prevFailed, prevNames };
}

export async function reportSelftest(res: RunResult): Promise<{ alerted: boolean }> {
  const { prevFailed, prevNames } = await saveRun(res);
  const owner = Number(process.env.TELEGRAM_ALLOWED_CHAT_ID || 0);
  if (!owner) return { alerted: false };

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Пишем только когда картина ИЗМЕНИЛАСЬ. Иначе один незакрытый баг слал бы
  // одно и то же сообщение каждые 15 минут — и уведомления перестали бы читать
  // ровно тогда, когда сломается что-то новое.
  const names = res.steps.filter((s) => !s.ok).map((s) => s.name).sort();
  const sameAsBefore = prevFailed !== null && prevFailed > 0 && names.join("|") === prevNames.join("|");
  if (res.failed > 0 && sameAsBefore) return { alerted: false };

  if (res.failed > 0) {
    const lines = res.steps.filter((s) => !s.ok).map((s) => `• <b>${esc(s.name)}</b>\n  ${esc(s.why || "")}`);
    await sendMessage(owner,
      `🚨 <b>Самопроверка бота: ${res.failed} из ${res.ok + res.failed} упало</b>\n\n${lines.join("\n")}\n\n<i>Режим ${res.mode}, ${(res.ms / 1000).toFixed(1)} с</i>`);
    return { alerted: true };
  }
  // Молчим, когда всё хорошо, — кроме момента, когда бот только что починился.
  if (prevFailed !== null && prevFailed > 0) {
    await sendMessage(owner, `✅ <b>Бот снова в порядке</b>\nСамопроверка прошла целиком: ${res.ok} из ${res.ok}.`);
    return { alerted: true };
  }
  return { alerted: false };
}
