import { supabaseAdmin } from "./supabaseAdmin";
import { sendMessage } from "./telegram";
import { userTzOffsetMin } from "./pushSchedule";

// Доставка напоминаний ботом точно в срок. До этого напоминание уведомляло
// только через Google Календарь (если подключён) — без него «напомни в 9»
// было тихой строчкой в списке. Теперь GitHub Actions каждые ~5 минут дёргает
// /api/cron-reminders, а этот модуль шлёт всё, чему пришло время, в Telegram.

type Lang = "ru" | "en" | "uk" | "fr" | "es";
const pickLang = (l: any): Lang => (["ru", "en", "uk", "fr", "es"].includes(l) ? l : "ru");

const HEAD: Record<Lang, string> = {
  ru: "⏰ Напоминание",
  en: "⏰ Reminder",
  uk: "⏰ Нагадування",
  fr: "⏰ Rappel",
  es: "⏰ Recordatorio",
};
export const REM_BTN: Record<Lang, { done: string; snooze: string }> = {
  ru: { done: "✅ Готово", snooze: "⏰ Через час" },
  en: { done: "✅ Done", snooze: "⏰ In an hour" },
  uk: { done: "✅ Готово", snooze: "⏰ За годину" },
  fr: { done: "✅ Fait", snooze: "⏰ Dans une heure" },
  es: { done: "✅ Hecho", snooze: "⏰ En una hora" },
};

// Окно почасового повтора: "hourly:9-21" → { from: 9, to: 21 } (местные часы).
export function parseHourly(recurrence: string): { from: number; to: number } | null {
  const m = /^hourly(?::(\d{1,2})-(\d{1,2}))?$/.exec(recurrence || "");
  if (!m) return null;
  const from = m[1] === undefined ? 0 : Math.min(23, Math.max(0, Number(m[1])));
  const to = m[2] === undefined ? 23 : Math.min(23, Math.max(0, Number(m[2])));
  return from <= to ? { from, to } : { from: to, to: from };
}

// Для повторяющихся: следующее срабатывание ПОСЛЕ «сейчас», с сохранением времени дня.
// Почасовой повтор идёт по местным часам и не выходит за окно (9→21, потом
// следующее утро в 9) — иначе «каждый час» будило бы ночью.
function nextOccurrence(dueISO: string, recurrence: string, nowMs: number, offMin = 0): string {
  const hourly = parseHourly(recurrence);
  if (hourly) {
    let t = Date.parse(dueISO);
    for (let guard = 0; t <= nowMs && guard < 24 * 400; guard++) {
      t += 3600000;
      const loc = new Date(t + offMin * 60000);
      const h = loc.getUTCHours();
      if (h < hourly.from || h > hourly.to) {
        if (h > hourly.to) loc.setUTCDate(loc.getUTCDate() + 1);
        loc.setUTCHours(hourly.from, 0, 0, 0);
        t = loc.getTime() - offMin * 60000;
      }
    }
    return new Date(t).toISOString();
  }
  const d = new Date(dueISO);
  let guard = 0;
  while (d.getTime() <= nowMs && guard < 500) {
    if (recurrence === "daily") d.setUTCDate(d.getUTCDate() + 1);
    else if (recurrence === "weekly") d.setUTCDate(d.getUTCDate() + 7);
    else if (recurrence === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
    else d.setUTCFullYear(d.getUTCFullYear() + 1);
    guard++;
  }
  return d.toISOString();
}

const isRepeating = (r?: string | null) =>
  !!r && (["daily", "weekly", "monthly", "yearly"].includes(r) || !!parseHourly(r));

// Пройти по просроченным неотправленным напоминаниям и доставить их в Telegram.
export async function deliverDueReminders(): Promise<{ sent: number; rolled: number; expired: number; skipped: number }> {
  const db = supabaseAdmin();
  const now = Date.now();
  const stats = { sent: 0, rolled: 0, expired: 0, skipped: 0 };

  // Запас 24ч: всё, что старше, считаем пропущенным окном (например, накопилось
  // до включения доставки) — гасим без рассылки, чтобы не бомбить людей старьём.
  const { data: rows } = await db
    .from("reminders")
    .select("id, user_id, text, due_at, recurrence, all_day, remind_min, done, notified_at")
    .eq("done", false)
    .is("notified_at", null)
    .lte("due_at", new Date(now + 60 * 60000).toISOString()) // с запасом: remind_min может сдвинуть раньше
    .limit(300);
  if (!rows?.length) return stats;

  const userIds = [...new Set(rows.map((r: any) => r.user_id))];
  const { data: users } = await db.from("users").select("id, chat_id, lang, tz_offset, morning_prefs, push_enabled").in("id", userIds);
  const byId = new Map((users || []).map((u: any) => [u.id, u]));

  for (const r of rows as any[]) {
    try {
      const due = Date.parse(r.due_at);
      const u = byId.get(r.user_id);
      const offMin = userTzOffsetMin(u?.tz_offset, u?.morning_prefs?.tz) ?? 0;

      // Момент срабатывания: обычные — в срок (минус remind_min, если задан);
      // «на весь день» — в 9 утра по местному времени (due_at хранит местную
      // полночь уже в UTC, поэтому просто +9 часов).
      const fireAt = r.all_day
        ? due + 9 * 3600 * 1000
        : due - (typeof r.remind_min === "number" ? r.remind_min : 0) * 60000;

      if (fireAt > now) { stats.skipped++; continue; } // ещё рано

      if (now - fireAt > 24 * 3600 * 1000) {
        // Пропущенное окно: не шлём, но переводим повторы вперёд, разовые гасим.
        if (isRepeating(r.recurrence)) {
          await db.from("reminders").update({ due_at: nextOccurrence(r.due_at, r.recurrence, now, offMin) }).eq("id", r.id);
          stats.rolled++;
        } else {
          await db.from("reminders").update({ notified_at: new Date().toISOString() }).eq("id", r.id);
          stats.expired++;
        }
        continue;
      }

      if (!u?.chat_id) { stats.skipped++; continue; } // веб-аккаунт без бота — подождём подключения

      const lang = pickLang(u.lang);
      const B = REM_BTN[lang];
      await sendMessage(Number(u.chat_id), `${HEAD[lang]}\n${String(r.text || "").slice(0, 3500)}`, {
        reply_markup: { inline_keyboard: [[
          { text: B.done, callback_data: `remok:${r.id}` },
          { text: B.snooze, callback_data: `remsn:${r.id}` },
        ]] },
      });
      stats.sent++;

      if (isRepeating(r.recurrence)) {
        // Повтор: катим дату вперёд, notified_at не трогаем — следующее сработает само.
        await db.from("reminders").update({ due_at: nextOccurrence(r.due_at, r.recurrence, now, offMin) }).eq("id", r.id);
        stats.rolled++;
      } else {
        await db.from("reminders").update({ notified_at: new Date().toISOString() }).eq("id", r.id);
      }
    } catch (e) {
      console.error("deliver reminder", r.id, e);
      stats.skipped++;
    }
  }
  return stats;
}
