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

// «Как человек, не как ИИ»: добавляется ко ВСЕМ ответам бота (чат, голос, реакции,
// знакомство, «Спроси свою жизнь»). Длинные тире дополнительно вычищаются фильтром
// на отправке (humanizeDashes в telegram.ts) — здесь задаём общий живой стиль.
const HUMAN_STYLE =
  "Пиши как живой человек в мессенджере, а не как ИИ: естественно и коротко, без канцелярита. " +
  "Не используй длинное тире (—) — вместо него запятая, точка или обычный дефис. " +
  "Не начинай ответ с заготовок вроде «Отличный вопрос», «Конечно!», «Понимаю тебя». Без пафоса и штампов";

// Строка-инструкция для промпта: тон + человеческий стиль + (если задано) пожелание пользователя.
// Достоверность фактов всегда важнее стиля — это оговорено в самих промптах.
export function voiceLine(tone: MorningTone, style: string): string {
  const base = `${TONE_PROMPT[tone]}. ${HUMAN_STYLE}`;
  return style
    ? `${base}. Дополнительно учитывай пожелание пользователя по стилю: «${style}» (но факты и правила достоверности важнее стиля)`
    : base;
}
