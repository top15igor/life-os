import { supabaseAdmin } from "./supabaseAdmin";
import { getStreak } from "./queries";
import { capabilities } from "./capabilities";
import type { Locale } from "./i18n";

// ===== Универсальные факты об аккаунте для AI-ассистента и AI-друга. =====
// Вместо точечных действий («научили отвечать про почту — не умеет про дату»)
// даём модели ГОТОВЫЙ блок фактов: профиль + вся статистика по данным. Любой
// вопрос «сколько/когда/какой у меня…» закрывается одним механизмом, без
// нового кода на каждый вопрос.

const count = async (table: string, userId: string, extra?: (q: any) => any): Promise<number | null> => {
  try {
    let q: any = supabaseAdmin().from(table).select("id", { count: "exact", head: true }).eq("user_id", userId);
    if (extra) q = extra(q);
    const { count: n } = await q;
    return typeof n === "number" ? n : null;
  } catch {
    return null; // таблицы может не быть — факт просто не попадёт в блок
  }
};

export async function getAccountFacts(userId: string): Promise<string> {
  const db = supabaseAdmin();
  try {
    const [userRow, entriesTotal, voiceTotal, firstEntry, textsRes, streak, tasksOpen, goalsN, dreamsN, savedN, memsN, notesN, listOpenN, remindersN] = await Promise.all([
      Promise.resolve(db.from("users").select("email, tg_username, name, created_at, plan").eq("id", userId).maybeSingle()).then((r) => r.data as any).catch(() => null),
      count("entries", userId),
      count("entries", userId, (q) => q.eq("source", "telegram_voice")),
      Promise.resolve(db.from("entries").select("entry_date").eq("user_id", userId).order("entry_date", { ascending: true }).limit(1)).then((r) => ((r.data || [])[0] as any)?.entry_date || null).catch(() => null),
      Promise.resolve(db.from("entries").select("raw_text").eq("user_id", userId).limit(3000)).then((r) => r.data || []).catch(() => [] as any[]),
      getStreak(userId).catch(() => 0),
      count("tasks", userId, (q) => q.eq("done", false)),
      count("goals", userId),
      count("dreams", userId),
      count("saved_items", userId),
      count("memories", userId),
      count("notes", userId),
      count("list_items", userId, (q) => q.eq("done", false)),
      count("reminders", userId, (q) => q.eq("done", false)),
    ]);

    let chars = 0, words = 0;
    for (const e of textsRes as any[]) {
      const t = String(e?.raw_text || "");
      chars += t.length;
      words += t ? t.split(/\s+/).filter(Boolean).length : 0;
    }
    const approx = (entriesTotal || 0) > 3000 ? "≈" : "";

    const lines: string[] = [];
    if (userRow?.name) lines.push(`Имя: ${userRow.name}`);
    lines.push(userRow?.email ? `Почта входа: ${userRow.email}` : "Почта не привязана — вход через Telegram (привязать: Профиль → Аккаунт и вход)");
    if (userRow?.tg_username) lines.push(`Telegram: @${userRow.tg_username}`);
    if (userRow?.created_at) lines.push(`Дата регистрации в LIFE OS: ${String(userRow.created_at).slice(0, 10)}`);
    lines.push(`Тариф: ${userRow?.plan || "free"}`);
    if (entriesTotal != null) lines.push(`Записей в дневнике всего: ${entriesTotal}${voiceTotal != null ? ` (из них голосовых: ${voiceTotal})` : ""}`);
    if (firstEntry) lines.push(`Первая запись: ${firstEntry}`);
    if (chars) lines.push(`Всего написано/наговорено: ${approx}${words} слов (${approx}${chars} символов)`);
    if (streak) lines.push(`Текущая серия дней с записями: ${streak}`);
    if (tasksOpen != null) lines.push(`Открытых задач: ${tasksOpen}`);
    if (goalsN != null) lines.push(`Целей: ${goalsN}`);
    if (dreamsN != null) lines.push(`Мечт в Карте желаний: ${dreamsN}`);
    if (savedN != null) lines.push(`Сохранённого в Базе знаний: ${savedN}`);
    if (memsN != null) lines.push(`Фото и документов в Памяти: ${memsN}`);
    // Заметки ≠ записи дневника: если спрашивают «что по заметкам» — это раздел «Заметки».
    if (notesN != null) lines.push(`Заметок (раздел «Заметки», справка — коды/адреса/размеры): ${notesN}`);
    if (listOpenN != null) lines.push(`Невычеркнутых пунктов в списках (покупки и др.): ${listOpenN}`);
    if (remindersN != null) lines.push(`Активных напоминаний: ${remindersN}`);
    return lines.join("\n");
  } catch {
    return "(не удалось получить)";
  }
}

// ===== Шпаргалка по приложению (что умеет LIFE OS и как этим пользоваться). =====
// Собирается из того же каталога возможностей, что и лендинг (единый источник
// правды), + базовые «как зайти». Статична для языка → дружит с кэшем промпта.
const cheatCache: Partial<Record<Locale, string>> = {};

export function appCheatsheet(locale: Locale = "ru"): string {
  const cached = cheatCache[locale];
  if (cached) return cached;
  let caps = "";
  try {
    caps = capabilities(locale)
      .groups.map((g) => `${g.title}:\n` + g.items.map((it) => `• ${it.name} — ${it.desc}`).join("\n"))
      .join("\n");
  } catch {
    // каталог не собрался — остаются базовые пункты ниже
  }
  const text = `КАК ЗАЙТИ В ПРИЛОЖЕНИЕ (веб-версия LIFE OS): нажать кнопку «📔 Сохранённое» в меню бота — сайт откроется сразу под своим аккаунтом. Или команда /link — бот пришлёт личную ссылку для входа (её никому не пересылать). Сайт: life-os.today.
ПРИВЯЗКА ПОЧТЫ/GOOGLE: Профиль → Аккаунт и вход. PIN-код тоже в Профиле, сброс — /resetpin.
ПОЛНАЯ ИНСТРУКЦИЯ: раздел «Инструкция» в приложении (/guide), по боту — /guide/bot.
ПОЛЕЗНЫЕ КОМАНДЫ БОТА: /chat — беседа с AI-другом (выход /stop), /ask — вопрос о своей жизни, /save — сохранить принудительно, /money — финансовый разбор, /spend и /income — записать расход/доход, /wish <ссылка> — в Вишлист, /invite — пригласить друга, /lang — язык, /demo — приветствие заново.

ВОЗМОЖНОСТИ ПО РАЗДЕЛАМ:
${caps}`;
  cheatCache[locale] = text;
  return text;
}
