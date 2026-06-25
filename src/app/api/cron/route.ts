import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage } from "@/lib/telegram";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const REMINDER = "🌙 Как прошёл твой день?\nНаговори пару строк — я сохраню и найду главное. Даже короткая запись важна для твоей Книги жизни.";

async function weeklyDigest(userId: string): Promise<string | null> {
  const db = supabaseAdmin();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const { data } = await db
    .from("entries")
    .select("entry_date, summary, raw_text")
    .eq("user_id", userId)
    .gte("entry_date", weekAgo)
    .order("entry_date", { ascending: true });
  if (!data?.length) return null;

  const list = data.map((e) => `${e.entry_date}: ${e.summary || e.raw_text}`).join("\n");
  const prompt = `Ты — AI-биограф дневника LIFE OS. Сделай тёплый короткий обзор недели пользователя на русском по записям ниже: главные события, повторяющаяся тема, 1 инсайт и 1 мягкий совет на следующую неделю. 5–7 строк, по-человечески, без канцелярита.\n\nЗАПИСИ:\n${list}`;
  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });
    const text = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim();
    return `📅 <b>Твоя неделя</b>\n\n${text}`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  // Vercel Cron присылает Authorization: Bearer <CRON_SECRET> (если задан).
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data: users } = await db.from("users").select("id, chat_id").not("chat_id", "is", null);
  const today = new Date().toISOString().slice(0, 10);
  const isSunday = new Date().getUTCDay() === 0;

  let reminders = 0;
  let digests = 0;

  for (const u of users || []) {
    try {
      const { count } = await db
        .from("entries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", u.id)
        .eq("entry_date", today);
      if (!count) {
        await sendMessage(u.chat_id, REMINDER);
        reminders++;
      }
      if (isSunday) {
        const digest = await weeklyDigest(u.id);
        if (digest) {
          await sendMessage(u.chat_id, digest);
          digests++;
        }
      }
    } catch (e) {
      console.error("cron user", u.id, e);
    }
  }

  return NextResponse.json({ ok: true, reminders, digests, sunday: isSunday });
}
