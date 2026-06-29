import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage } from "@/lib/telegram";
import { mainKeyboard } from "@/lib/botKeyboard";

export const runtime = "nodejs";
export const maxDuration = 60;

// Разовая рассылка для обновления клавиатуры у всех пользователей.
// Telegram не умеет менять постоянную клавиатуру без сообщения, поэтому
// отправляем короткую заметку с актуальным reply_markup.
//
//   GET /api/broadcast-keyboard?key=<TELEGRAM_WEBHOOK_SECRET>          — всем
//   GET /api/broadcast-keyboard?key=<...>&test=1                       — только владельцу
const NOTE: Record<string, string> = {
  ru: "✨ Обновили меню! Теперь под рукой: дневник, задачи, мотивация и приглашение друга. Пользуйся как обычно 🙂",
  en: "✨ We've updated the menu! Now at hand: diary, tasks, motivation and inviting a friend. Use it as usual 🙂",
  uk: "✨ Оновили меню! Тепер під рукою: щоденник, завдання, мотивація та запрошення друга. Користуйся як завжди 🙂",
  fr: "✨ Nous avons mis à jour le menu ! Désormais à portée de main : journal, tâches, motivation et inviter un ami. Utilise-le comme d'habitude 🙂",
};

const langOf = (l: any) => (["ru", "en", "uk", "fr"].includes(l) ? l : "ru");

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Безопасный самотест: отправить только владельцу.
  if (req.nextUrl.searchParams.get("test") !== null) {
    const chat = process.env.TELEGRAM_ALLOWED_CHAT_ID;
    if (!chat) return NextResponse.json({ ok: false, error: "no TELEGRAM_ALLOWED_CHAT_ID" });
    await sendMessage(Number(chat), NOTE.ru, { reply_markup: mainKeyboard("ru") });
    return NextResponse.json({ ok: true, test: true });
  }

  const db = supabaseAdmin();
  // push_enabled может ещё не существовать (миграция не запущена) — мягкий фолбэк, как в кронах.
  let users: any[] | null = null;
  {
    const r = await db.from("users").select("chat_id, lang, push_enabled").not("chat_id", "is", null);
    if (r.error) {
      const r2 = await db.from("users").select("chat_id, lang").not("chat_id", "is", null);
      users = r2.data as any;
    } else users = r.data as any;
  }

  let sent = 0, skipped = 0, failed = 0;
  for (const u of users || []) {
    if (u.push_enabled === false) { skipped++; continue; } // уважаем выключенные пуши
    try {
      const lang = langOf(u.lang);
      await sendMessage(u.chat_id, NOTE[lang] || NOTE.ru, { reply_markup: mainKeyboard(lang) });
      sent++;
    } catch (e) {
      failed++;
      console.error("broadcast-keyboard", u.chat_id, e);
    }
  }
  return NextResponse.json({ ok: true, sent, skipped, failed });
}
