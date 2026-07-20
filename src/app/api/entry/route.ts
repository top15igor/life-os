import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { analyze } from "@/lib/ai";
import { saveEntry } from "@/lib/saveEntry";
import { friendReaction } from "@/lib/entryReaction";
import { getLocale } from "@/lib/locale";

export const runtime = "nodejs";

// Быстрый ввод записи с сайта (тот же AI-разбор, что и в боте).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const text = String(body?.text || "").trim();
  if (!text) return NextResponse.json({ ok: false }, { status: 400 });

  // Местные дата/время клиента — чтобы запись была по времени пользователя, а не сервера (UTC).
  const entry_date = /^\d{4}-\d{2}-\d{2}$/.test(String(body?.date || "")) ? body.date : undefined;
  const entry_time = /^\d{2}:\d{2}(:\d{2})?$/.test(String(body?.time || "")) ? body.time : undefined;
  // Источник записи: сайт по умолчанию, приложение помечает себя (только буквы, до 16).
  const source = /^[a-z]{1,16}$/.test(String(body?.source || "")) ? body.source : "web";

  try {
    const locale = await getLocale().catch(() => "ru");
    // «Реакция друга» в выбранном тоне — параллельно с разбором, best-effort.
    const reactionP = friendReaction(user.id, text, locale);
    const analysis = await analyze(text, user.id);
    const entry = await saveEntry({ userId: user.id, raw_text: text, source, analysis, entry_date, entry_time });
    const reaction = await reactionP;
    return NextResponse.json({ ok: true, id: entry.id, reaction });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
