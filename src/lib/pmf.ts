// PMF-опрос (вопрос Шона Эллиса) в боте: «как отнесёшься, если продукт исчезнет?»
// Классика замера продукт-маркет-фита: если ≥40% активных отвечают
// «сильно расстроюсь» — фит есть. Ответы пишем в pmf_responses (1 ответ на юзера).
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type PmfScore = "very" | "somewhat" | "no";
export const PMF_SCORES: PmfScore[] = ["very", "somewhat", "no"];

type Lang = "ru" | "en" | "uk" | "fr" | "es";

const OWNER = "00000000-0000-0000-0000-000000000000";

const QUESTION: Record<Lang, string> = {
  ru: "Короткий вопрос, одно нажатие 🙏\n\nПредставь: завтра LIFE OS исчезает навсегда. Бот, дневник, все разделы. Что почувствуешь?\n\nОтвет анонимно не уйдёт в никуда, он реально помогает решить, что развивать дальше.",
  en: "Quick question, one tap 🙏\n\nImagine LIFE OS disappears tomorrow. The bot, the diary, everything. How would you feel?\n\nYour answer really helps decide what to build next.",
  uk: "Коротке питання, один дотик 🙏\n\nУяви: завтра LIFE OS зникає назавжди. Бот, щоденник, усі розділи. Що відчуєш?\n\nВідповідь справді допомагає вирішити, що розвивати далі.",
  fr: "Petite question, un seul clic 🙏\n\nImagine que LIFE OS disparaisse demain. Le bot, le journal, tout. Que ressentirais-tu ?\n\nTa réponse aide vraiment à décider quoi construire ensuite.",
  es: "Pregunta rápida, un solo toque 🙏\n\nImagina que LIFE OS desaparece mañana. El bot, el diario, todo. ¿Qué sentirías?\n\nTu respuesta ayuda de verdad a decidir qué construir después.",
};

const BTN: Record<Lang, Record<PmfScore, string>> = {
  ru: { very: "😨 Сильно расстроюсь", somewhat: "🤔 Немного расстроюсь", no: "😌 Спокойно, проживу" },
  en: { very: "😨 Very disappointed", somewhat: "🤔 Somewhat disappointed", no: "😌 Not disappointed" },
  uk: { very: "😨 Дуже засмучусь", somewhat: "🤔 Трохи засмучусь", no: "😌 Спокійно, проживу" },
  fr: { very: "😨 Très déçu(e)", somewhat: "🤔 Un peu déçu(e)", no: "😌 Pas déçu(e)" },
  es: { very: "😨 Muy decepcionado", somewhat: "🤔 Algo decepcionado", no: "😌 Nada, sobreviviré" },
};

const THANKS: Record<Lang, Record<PmfScore, string>> = {
  ru: {
    very: "Спасибо! Ты из тех, ради кого это всё делается 🙌 Если захочешь, напиши мне, что для тебя тут самое ценное. Просто сообщением.",
    somewhat: "Спасибо за честный ответ 🙏 Если чего-то не хватает, напиши мне об этом прямо тут, я передам.",
    no: "Спасибо за честность 🙏 Такой ответ помогает не меньше остальных.",
  },
  en: {
    very: "Thank you! You are exactly who this is built for 🙌 If you feel like it, tell me what you value most here.",
    somewhat: "Thanks for the honest answer 🙏 If something is missing, just tell me here.",
    no: "Thanks for being honest 🙏 This answer helps just as much.",
  },
  uk: {
    very: "Дякую! Ти саме з тих, заради кого це все робиться 🙌 Якщо захочеш, напиши, що тут для тебе найцінніше.",
    somewhat: "Дякую за чесну відповідь 🙏 Якщо чогось бракує, напиши мені про це прямо тут.",
    no: "Дякую за чесність 🙏 Така відповідь допомагає не менше за інші.",
  },
  fr: {
    very: "Merci ! C'est pour toi que tout ça existe 🙌 Si tu veux, dis-moi ce qui compte le plus pour toi ici.",
    somewhat: "Merci pour ta franchise 🙏 S'il manque quelque chose, dis-le moi ici.",
    no: "Merci pour ton honnêteté 🙏 Cette réponse aide tout autant.",
  },
  es: {
    very: "¡Gracias! Eres justo la persona para quien se hace todo esto 🙌 Si quieres, cuéntame qué es lo más valioso para ti aquí.",
    somewhat: "Gracias por la respuesta sincera 🙏 Si falta algo, cuéntamelo aquí mismo.",
    no: "Gracias por la sinceridad 🙏 Esta respuesta ayuda igual que las demás.",
  },
};

const CB_OK: Record<Lang, string> = {
  ru: "Записал, спасибо!",
  en: "Got it, thanks!",
  uk: "Записав, дякую!",
  fr: "C'est noté, merci !",
  es: "¡Anotado, gracias!",
};

export function pmfQuestion(lang: Lang) {
  const b = BTN[lang] || BTN.ru;
  return {
    text: QUESTION[lang] || QUESTION.ru,
    reply_markup: {
      inline_keyboard: [
        [{ text: b.very, callback_data: "pmf:very" }],
        [{ text: b.somewhat, callback_data: "pmf:somewhat" }],
        [{ text: b.no, callback_data: "pmf:no" }],
      ],
    },
  };
}

export function pmfThanks(lang: Lang, score: PmfScore): string {
  return (THANKS[lang] || THANKS.ru)[score];
}

export function pmfCallbackOk(lang: Lang): string {
  return CB_OK[lang] || CB_OK.ru;
}

export async function savePmfAnswer(userId: string, score: PmfScore) {
  const db = supabaseAdmin();
  await db.from("pmf_responses").upsert(
    { user_id: userId, score, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

// Кому уместно задавать вопрос: люди, которые продукт реально попробовали
// (от 3 записей) и были живы в последние 30 дней. Владельца не считаем.
export async function pmfEligibleUsers() {
  const db = supabaseAdmin();
  const { data: users } = await db.from("users").select("id, chat_id, name, lang").not("chat_id", "is", null);
  const { data: entries } = await db.from("entries").select("user_id, created_at");
  const cutoff = Date.now() - 30 * 864e5;

  const stat = new Map<string, { count: number; last: number }>();
  for (const e of (entries as any[]) ?? []) {
    if (!e.user_id) continue;
    const s = stat.get(e.user_id) || { count: 0, last: 0 };
    s.count++;
    s.last = Math.max(s.last, new Date(e.created_at).getTime());
    stat.set(e.user_id, s);
  }

  return (((users as any[]) ?? []).filter((u) => {
    if (u.id === OWNER) return false;
    const s = stat.get(u.id);
    return s && s.count >= 3 && s.last >= cutoff;
  })) as { id: string; chat_id: number; name: string | null; lang: string | null }[];
}

// Сводка для админки: кому отправили, кто что ответил, PMF-балл.
export async function pmfSummary() {
  const db = supabaseAdmin();
  const [{ data: asks }, { data: resp }, { data: users }] = await Promise.all([
    db.from("pmf_asks").select("user_id, sent_at"),
    db.from("pmf_responses").select("user_id, score, updated_at"),
    db.from("users").select("id, name"),
  ]);
  const nameById = new Map((((users as any[]) ?? [])).map((u) => [u.id, u.name || "Без имени"]));
  const eligible = await pmfEligibleUsers();

  const counts = { very: 0, somewhat: 0, no: 0 } as Record<PmfScore, number>;
  const answers = (((resp as any[]) ?? [])).map((r) => {
    if (r.user_id !== OWNER) counts[r.score as PmfScore]++;
    return { name: nameById.get(r.user_id) || "?", score: r.score as PmfScore, at: r.updated_at, isOwner: r.user_id === OWNER };
  });
  const answered = counts.very + counts.somewhat + counts.no;
  const pmfPct = answered ? Math.round((counts.very / answered) * 100) : null;

  return {
    eligible: eligible.length,
    asked: ((asks as any[]) ?? []).length,
    answered,
    counts,
    pmfPct,
    answers: answers.sort((a, b) => (a.at < b.at ? 1 : -1)),
  };
}
