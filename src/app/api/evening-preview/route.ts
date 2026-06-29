import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { normalizeMorningPrefs } from "@/lib/morningPrefs";
import { getBookPrompt, bookPromptMessage } from "@/lib/bookPrompts";

export const runtime = "nodejs";
export const maxDuration = 20;

const pickLang = (l: any) => (["ru", "en", "uk", "fr"].includes(l) ? l : "ru");

// Предпросмотр вечернего «вопроса для книги» по ТЕКУЩИМ (возможно, несохранённым)
// настройкам — темы + свои подсказки.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const prefs = normalizeMorningPrefs(body?.prefs ?? body);
  const lang = pickLang(body?.locale);
  const seed = Math.floor(Date.now() / 86400000);

  const bp = await getBookPrompt(user.id, lang, seed, { themes: prefs.evening.themes, customPrompts: prefs.evening.customPrompts });
  const text = bp ? bookPromptMessage(lang, bp.question) : "—";
  return NextResponse.json({ ok: true, text });
}
