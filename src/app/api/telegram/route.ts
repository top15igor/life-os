import { NextRequest, NextResponse } from "next/server";
import { getFileUrl, sendMessage } from "@/lib/telegram";
import { transcribe } from "@/lib/transcribe";
import { analyze, type Analysis } from "@/lib/ai";
import { saveEntry } from "@/lib/saveEntry";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Защита вебхука: Telegram присылает наш секрет в заголовке.
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new NextResponse("forbidden", { status: 403 });
  }

  const update = await req.json().catch(() => null);
  const msg = update?.message;
  if (!msg) return NextResponse.json({ ok: true });

  const chatId: number = msg.chat.id;

  // Команда /start — показываем chat_id, чтобы привязать «своего» пользователя.
  if (msg.text === "/start") {
    await sendMessage(
      chatId,
      `Привет! Это твой личный дневник LIFE OS.\nТвой chat_id: <b>${chatId}</b>\n\nПросто наговори голосовое или напиши текст — я разложу всё по полочкам.`
    );
    return NextResponse.json({ ok: true });
  }

  // Доступ только своим (если задан разрешённый chat_id).
  const allowed = process.env.TELEGRAM_ALLOWED_CHAT_ID;
  if (allowed && String(chatId) !== allowed) {
    await sendMessage(chatId, "Этот дневник личный 🙂");
    return NextResponse.json({ ok: true });
  }

  try {
    let text: string | undefined = msg.text;
    const isVoice = Boolean(msg.voice || msg.audio);

    if (isVoice) {
      await sendMessage(chatId, "🎧 Распознаю голос…");
      const fileId = (msg.voice || msg.audio).file_id;
      const url = await getFileUrl(fileId);
      text = await transcribe(url);
    }

    if (!text || !text.trim()) {
      await sendMessage(chatId, "Пришли текст или голосовое сообщение 🙂");
      return NextResponse.json({ ok: true });
    }

    const analysis = await analyze(text);
    await saveEntry({
      raw_text: text,
      source: isVoice ? "telegram_voice" : "telegram_text",
      analysis,
    });
    await sendMessage(chatId, formatConfirm(analysis));
  } catch (e: any) {
    console.error(e);
    await sendMessage(chatId, "Упс, что-то пошло не так при сохранении. Попробуй ещё раз.");
  }

  return NextResponse.json({ ok: true });
}

function formatConfirm(a: Analysis): string {
  const lines = ["✅ <b>Запись сохранена</b>", "", a.summary];
  const extra: string[] = [];
  if (a.insights?.length) extra.push(`💡 ${a.insights.length} инсайт(ов)`);
  if (a.tasks?.length) extra.push(`🎯 ${a.tasks.length} задач(и)`);
  if (a.tags?.length) extra.push(`#️⃣ ${a.tags.length} тег(ов)`);
  if (extra.length) lines.push("", extra.join("\n"));
  const m = [
    a.mood != null ? `Mood ${a.mood}` : null,
    a.energy != null ? `Energy ${a.energy}` : null,
    a.health != null ? `Health ${a.health}` : null,
  ].filter(Boolean);
  if (m.length) lines.push("", m.join(" · "));
  return lines.join("\n");
}
