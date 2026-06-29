import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { normalizeMorningPrefs } from "@/lib/morningPrefs";
import { personalMorning } from "@/lib/morningPersonal";
import { morningMessage } from "@/lib/morningPush";

export const runtime = "nodejs";
export const maxDuration = 30;

const pickLang = (l: any) => (["ru", "en", "uk", "fr"].includes(l) ? l : "ru");

// Предпросмотр утреннего сообщения по ТЕКУЩИМ (возможно, несохранённым)
// настройкам — чтобы пользователь увидел пример прямо в профиле.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const prefs = normalizeMorningPrefs(body?.prefs ?? body);
  const lang = pickLang(body?.locale);

  // С учётом настроек; если по выбранным темам нечего сказать — тёплая статичная фраза.
  const personal = await personalMorning(user.id, (user as any).name ?? null, lang, prefs);
  const text = personal || morningMessage(lang, Math.floor(Date.now() / 86400000));
  return NextResponse.json({ ok: true, text, personalized: !!personal });
}
