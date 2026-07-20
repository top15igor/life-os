import { supabaseAdmin } from "./supabaseAdmin";
import { normalizeMorningPrefs, TONE_PROMPT, type MorningTone } from "./morningPrefs";

// Единый источник «как бот звучит» для всех мест, где бот ГОВОРИТ пользователю:
// живой чат (companion), голос и «Спроси свою жизнь» (biographer). Тон и свободный
// стиль пользователь задаёт в Профиле (morning_prefs.chatTone / chatStyle).
export async function getChatVoice(userId: string): Promise<{ tone: MorningTone; style: string }> {
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const p = normalizeMorningPrefs((data as any)?.morning_prefs);
    return { tone: p.chatTone, style: p.chatStyle };
  } catch {
    return { tone: "friend", style: "" };
  }
}

// Строка-инструкция для промпта: тон + (если задано) свободное пожелание пользователя.
// Достоверность фактов всегда важнее стиля — это оговорено в самих промптах.
export function voiceLine(tone: MorningTone, style: string): string {
  const base = `${TONE_PROMPT[tone]}`;
  return style
    ? `${base}. Дополнительно учитывай пожелание пользователя по стилю: «${style}» (но факты и правила достоверности важнее стиля)`
    : base;
}
