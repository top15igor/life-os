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
  send: () => any;            // тело обновления Telegram
  check: Check;
  // Проверка в базе: бот мог ответить «записал», но реально ничего не сохранить —
  // для человека это худший из багов, потому что он замечается только потом.
  verifyDb?: () => Promise<string | null>;
};

// Маркер тестовой записи: по нему проверяем, что мысль реально легла в дневник.
const ENTRY_MARK = "набережной";

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
    name: "«Что у меня сегодня?» отвечает",
    heavy: true,
    send: () => message("что у меня сегодня?"),
    check: (sent) => notBroken(sent),
  },
];

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
  for (const t of ["entries", "reminders", "companion_messages", "feedback"]) {
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
      const sent = await fire(origin, secret, sc.send());
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

  // Качество ответов — только в полном прогоне: каждый случай стоит двух вызовов
  // модели (ответ бота + оценка судьи), гонять это каждые 15 минут незачем.
  if (mode === "full") {
    for (const c of QUALITY_CASES) {
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
async function saveRun(res: RunResult): Promise<{ prevFailed: number | null }> {
  const db = supabaseAdmin();
  let prevFailed: number | null = null;
  try {
    // Сравниваем ТОЛЬКО с прогоном того же режима. Иначе выходит качели: полный
    // прогон (14 сценариев) находит слабый ответ, следующий лёгкий (7 сценариев,
    // без проверок качества) рапортует «бот снова в порядке», и так по кругу —
    // уведомления начинают врать и их перестают читать.
    const { data } = await db.from("selftest_runs").select("failed")
      .eq("mode", res.mode).order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (data) prevFailed = Number((data as any).failed);
  } catch { /* таблицы нет — просто без истории */ }
  try {
    await db.from("selftest_runs").insert({
      mode: res.mode, ok: res.ok, failed: res.failed, ms: res.ms,
      failures: res.steps.filter((s) => !s.ok).map((s) => ({ name: s.name, why: s.why })),
    });
  } catch { /* таблицы нет — не мешаем прогону */ }
  return { prevFailed };
}

export async function reportSelftest(res: RunResult): Promise<{ alerted: boolean }> {
  const { prevFailed } = await saveRun(res);
  const owner = Number(process.env.TELEGRAM_ALLOWED_CHAT_ID || 0);
  if (!owner) return { alerted: false };

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
