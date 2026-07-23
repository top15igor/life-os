import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { normalizeMorningPrefs } from "@/lib/morningPrefs";
import { bookPromptMessage } from "@/lib/bookPrompts";
import { personalEvening } from "@/lib/eveningPersonal";

export const runtime = "nodejs";
export const maxDuration = 30;

const pickLang = (l: any) => (["ru", "en", "uk", "fr", "es"].includes(l) ? l : "ru");

// Предпросмотр вечернего «вопроса для книги» по ТЕКУЩИМ (возможно, несохранённым)
// настройкам — темы, свои подсказки, режим AI.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const prefs = normalizeMorningPrefs(body?.prefs ?? body);
  const lang = pickLang(body?.locale);

  const q = await personalEvening(user.id, lang, prefs);
  const text = q ? bookPromptMessage(lang, q) : "—";
  return NextResponse.json({ ok: true, text });
}
