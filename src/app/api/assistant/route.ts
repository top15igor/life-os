import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/auth";
import { logClaude } from "@/lib/usage";
import { APP_KNOWLEDGE } from "@/lib/assistant";

export const runtime = "nodejs";

const LANG: Record<string, string> = {
  ru: "русском", en: "English", uk: "українській", fr: "français", es: "español",
};

// Помощник по функционалу приложения. Дёшево (haiku), знает только устройство LIFE OS,
// НЕ читает личные записи пользователя — отвечает «куда нажать и как пользоваться».
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const q = String(body?.q || "").trim().slice(0, 500);
  const path = String(body?.path || "").slice(0, 100);
  const locale = String(body?.locale || "ru");
  if (!q) return NextResponse.json({ ok: false }, { status: 400 });

  const langName = LANG[locale] || LANG.ru;

  const system = `Ты — встроенный помощник приложения LIFE OS. Помогаешь пользователю сориентироваться в функционале: что где находится, куда нажать, как пользоваться. Отвечай коротко (2–4 предложения), просто и дружелюбно, как для нетехнического человека. Называй конкретные разделы по именам. Если действие проще сделать через Telegram-бота голосом — так и скажи. НЕ выдумывай функции, которых нет в описании ниже. Ты НЕ имеешь доступа к личным записям пользователя — не пытайся отвечать по содержанию его дневника, вместо этого подскажи раздел (например, Биограф) или как записать. Отвечай на ${langName} языке.

Описание приложения:
${APP_KNOWLEDGE}

Пользователь сейчас на странице: ${path || "/"}.`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 350,
      system,
      messages: [{ role: "user", content: q }],
    });
    logClaude(user.id, "assistant", "haiku", (msg as any).usage);
    const answer = msg.content.filter((b) => b.type === "text").map((b: any) => b.text).join("").trim();
    return NextResponse.json({ ok: true, answer });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
