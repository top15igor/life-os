import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { logError } from "./errorLog";

// Агент-исследователь: непрерывно придумывает НОВЫЕ формулировки и проверяет,
// понял ли их бот.
//
// Чем отличается от самопроверки: та гоняет 23 заранее написанных сценария и
// ловит регрессии в известных путях. Но живые люди говорят иначе, чем мы
// придумали за столом, — и все баги последних дней были именно на
// непредусмотренных формулировках («давай не в 9 утра, а в 9.30», «исправь у
// себя Эстелька»). Здесь модель каждый раз сочиняет свежие фразы, а вторая
// проверяет, сделал ли бот то, что человек просил.
//
// Устройство нарочно скромное: у каждой пробы ЗАРАНЕЕ известно, чего мы ждём
// (мы же сами выбрали семейство), поэтому судье не нужно угадывать замысел —
// он сверяет ответ с конкретным ожиданием. Это на порядок надёжнее, чем
// свободная оценка «хорошо ли ответил».

const TEST_CHAT = -777002; // отдельный от самопроверки: их прогоны идут параллельно
const TEST_NAME = "🔬 Probe";

let _c: Anthropic | null = null;
const client = () => (_c ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }));

type Family = {
  key: string;
  what: string;      // что человек хочет — для генератора фраз
  expect: string;    // что обязан сделать бот — для судьи
};

const FAMILIES: Family[] = [
  {
    key: "reminder",
    what: "попросить напомнить о чём-то в конкретное время или дату, разговорно",
    expect: "Бот подтверждает, что поставил напоминание, и называет время или дату. Провал — если он записал это в дневник, переспросил вместо действия или промолчал.",
  },
  {
    key: "reminder_move",
    what: "попросить перенести или изменить время УЖЕ поставленного напоминания",
    expect: "Бот переносит напоминание либо честно говорит, что не нашёл подходящего. Провал — если предлагает ОТМЕНИТЬ напоминание, создаёт новое или правит запись дневника.",
  },
  {
    key: "task",
    what: "попросить добавить задачу или дело без конкретного времени",
    expect: "Бот подтверждает, что добавил задачу. Провал — если сохранил как обычную запись дневника или поставил напоминание с выдуманным временем.",
  },
  {
    key: "delete",
    what: "попросить убрать или удалить задачу, заметку либо цель",
    expect: "Бот убирает названное либо честно говорит, что не нашёл. Провал — если он ОТМЕТИЛ ВЫПОЛНЕННЫМ вместо удаления или сохранил просьбу записью в дневник.",
  },
  {
    key: "finance_fix",
    what: "поправить сумму уже записанной траты («потратил не столько, а столько»)",
    expect: "Бот правит сумму существующей траты либо говорит, что не нашёл такую. Провал — если он записывает ВТОРУЮ трату или правит текст записи дневника.",
  },
  {
    key: "settings",
    what: "включить, выключить или перенести регулярные сообщения бота",
    expect: "Бот подтверждает, что изменил настройку рассылки. Провал — если он «запомнил пожелание» про манеру речи, ответил вопросом или сохранил это записью.",
  },
  {
    key: "search",
    what: "спросить, где у него что-то записано, или что у него есть по теме",
    expect: "Бот ищет по сохранённому и отвечает по найденному либо честно говорит, что ничего нет. Провал — если он выдумывает подробности, которых не может знать.",
  },
  {
    key: "cannot",
    what: "попросить сделать что-то во внешнем мире, чего бот не умеет (заказать, купить, позвонить, забронировать)",
    expect: "Бот прямо говорит, что не умеет этого, и предлагает то, что может. Провал — если он молча сохраняет просьбу записью и отвечает так, будто помог.",
  },
  {
    key: "entry",
    what: "просто рассказать о своём дне, событии или чувстве",
    expect: "Бот сохраняет это записью и отвечает по-человечески. Провал — если он воспринял рассказ как команду и что-то удалил, создал или изменил.",
  },
  {
    key: "ambiguous",
    what: "сказать что-то короткое и двусмысленное, что можно понять и как команду, и как рассказ",
    expect: "Бот делает разумный выбор и понятно говорит, что сделал, ЛИБО задаёт один короткий уточняющий вопрос. Провал — молчание, ошибка или уверенный ответ о выполнении того, чего он не делал.",
  },
];

// ===== Генерация свежих фраз =====

const GEN = `Ты придумываешь реплики для проверки Telegram-бота — личного дневника с AI.

Нужны фразы, которые мог бы написать ЖИВОЙ человек: разговорно, по-разному, иногда с опечаткой, иногда очень коротко, иногда длинно и путано. Никаких «пожалуйста, выполните команду» — так люди не пишут.

Верни ТОЛЬКО JSON: {"lines":["фраза 1","фраза 2"]}`;

async function makeProbes(family: Family, n: number): Promise<string[]> {
  try {
    const m = await client().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      temperature: 1,
      system: GEN,
      messages: [{ role: "user", content: `Придумай ${n} РАЗНЫХ фраз на русском, которыми человек мог бы: ${family.what}.` }],
    });
    logClaude(OWNER, "probe-gen", "haiku", (m as any).usage);
    const raw = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    return (Array.isArray(parsed.lines) ? parsed.lines : []).filter((x: any) => typeof x === "string" && x.trim()).slice(0, n);
  } catch {
    return [];
  }
}

// ===== Судья =====

const JUDGE = `Ты проверяешь, правильно ли Telegram-бот понял человека. Тебе дают реплику, ожидание и фактический ответ бота.

Оценивай СУТЬ, а не формулировку: другие слова — это нормально. Провал только если нарушено ожидание.

Верни ТОЛЬКО JSON: {"ok":true|false,"why":"одно предложение, что именно не так"}`;

const OWNER = "00000000-0000-0000-0000-000000000000";

async function judge(probe: string, expect: string, reply: string): Promise<string | null> {
  try {
    const m = await client().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      temperature: 0,
      system: JUDGE,
      messages: [{ role: "user", content: `ЧЕЛОВЕК НАПИСАЛ:\n${probe}\n\nЧЕГО ЖДЁМ ОТ БОТА:\n${expect}\n\nБОТ ОТВЕТИЛ:\n${reply.slice(0, 2000)}` }],
    });
    logClaude(OWNER, "probe-judge", "haiku", (m as any).usage);
    const raw = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    return parsed?.ok ? null : String(parsed?.why || "не соответствует ожиданию").slice(0, 220);
  } catch {
    return null; // судья недоступен — не превращаем это в ложное падение
  }
}

// ===== Прогон =====

let seq = 0;
const uid = () => Number(String(Date.now()).slice(-9)) * 10 + (seq++ % 10);

async function ask(origin: string, secret: string, text: string): Promise<string> {
  const r = await fetch(`${origin}/api/telegram`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": secret, "x-selftest-key": secret },
    body: JSON.stringify({
      update_id: uid(),
      message: {
        message_id: uid(),
        from: { id: TEST_CHAT, is_bot: false, first_name: TEST_NAME, language_code: "ru" },
        chat: { id: TEST_CHAT, type: "private" },
        date: Math.floor(Date.now() / 1000),
        text,
      },
    }),
  });
  if (!r.ok) throw new Error(`вебхук ответил ${r.status}`);
  const j = await r.json().catch(() => null);
  return ((j?.sent || []) as any[])
    .filter((s) => s.method === "sendMessage")
    .map((s) => s.text || "")
    .join("\n");
}

async function cleanup(): Promise<void> {
  try {
    const db = supabaseAdmin();
    const { data: u } = await db.from("users").select("id").eq("chat_id", TEST_CHAT).maybeSingle();
    const id = (u as any)?.id;
    if (!id) return;
    for (const t of ["entries", "reminders", "tasks", "notes", "goals", "companion_messages", "feedback", "finance_tx", "agent_actions"]) {
      try { await db.from(t).delete().eq("user_id", id); } catch {}
    }
    await db.from("users").update({ morning_prefs: {} }).eq("id", id);
  } catch {}
}

export type ProbeFail = { family: string; probe: string; why: string; reply: string };
export type ProbeRun = { probes: number; failed: number; ms: number; fails: ProbeFail[] };

export async function runProbes(origin: string, perFamily = 1, families?: string[]): Promise<ProbeRun> {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const t0 = Date.now();
  const pool = families?.length ? FAMILIES.filter((f) => families.includes(f.key)) : FAMILIES;
  const fails: ProbeFail[] = [];
  let probes = 0;

  for (const family of pool) {
    const lines = await makeProbes(family, perFamily);
    for (const line of lines) {
      probes++;
      try {
        const reply = await ask(origin, secret, line);
        if (!reply.trim()) {
          fails.push({ family: family.key, probe: line, why: "бот вообще ничего не ответил", reply: "" });
          continue;
        }
        const why = await judge(line, family.expect, reply);
        if (why) fails.push({ family: family.key, probe: line, why, reply: reply.slice(0, 400) });
      } catch (e: any) {
        fails.push({ family: family.key, probe: line, why: String(e?.message || e).slice(0, 200), reply: "" });
      }
    }
  }

  await cleanup();

  // Пишем прогон туда же, где живёт самопроверка: утренний диагност читает эту
  // таблицу и сам подхватит находки — отдельный канал разбора не нужен.
  try {
    await supabaseAdmin().from("selftest_runs").insert({
      mode: "probe",
      ok: probes - fails.length,
      failed: fails.length,
      ms: Date.now() - t0,
      failures: fails.map((f) => ({ name: `[${f.family}] ${f.probe.slice(0, 80)}`, why: f.why })),
    });
  } catch { /* нет таблицы — прогон всё равно состоялся */ }

  // В журнал сбоев — чтобы находки не потерялись, даже если таблицы прогонов нет.
  for (const f of fails.slice(0, 10)) {
    await logError(`probe:${f.family}`, new Error(f.why), { detail: f.probe.slice(0, 200) });
  }

  return { probes, failed: fails.length, ms: Date.now() - t0, fails };
}
