import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { getStreak, getGoals, getOpenTasks, getInsights, getRecentGratitude } from "./queries";
import {
  type MorningPrefs, type MorningTopic,
  DEFAULT_MORNING_PREFS, normalizeMorningPrefs, TONE_PROMPT, TOPIC_PROMPT, LENGTH_PROMPT,
} from "./morningPrefs";

// Загрузить настройки утреннего пуша пользователя (мягкий фолбэк, если колонки нет).
export async function loadMorningPrefs(userId: string): Promise<MorningPrefs> {
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    return normalizeMorningPrefs((data as any)?.morning_prefs);
  } catch {
    return { ...DEFAULT_MORNING_PREFS };
  }
}

// Персональное утреннее сообщение, составленное AI под конкретного пользователя
// с учётом его настроек (тон + темы). Опирается на его записи, серию дней, цели,
// задачи, инсайты и благодарность — но только по выбранным темам.
// Возвращает текст ИЛИ null (нет ключа / мало данных / ошибка / темы выключены) —
// тогда вызывающий код шлёт обычную статичную фразу morningMessage.
export async function personalMorning(
  userId: string, name: string | null, lang: string, prefs?: MorningPrefs,
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const p = prefs || (await loadMorningPrefs(userId));
    const want = new Set<MorningTopic>(p.topics);
    if (want.size === 0) return null; // всё выключено → обычная короткая фраза

    const db = supabaseAdmin();
    const [streak, goals, tasks, insights, gratitude, entriesRes] = await Promise.all([
      getStreak(userId).catch(() => 0),
      want.has("goals") ? getGoals(userId).catch(() => [] as any[]) : Promise.resolve([] as any[]),
      want.has("tasks") ? getOpenTasks(userId, 5).catch(() => [] as any[]) : Promise.resolve([] as any[]),
      want.has("insight") ? getInsights(userId).catch(() => [] as any[]) : Promise.resolve([] as any[]),
      want.has("gratitude") ? getRecentGratitude(userId, 3).catch(() => [] as string[]) : Promise.resolve([] as string[]),
      // Записи тянем всегда — для понимания личности и манеры речи (а не только для темы «дневник»).
      db.from("entries").select("entry_date, summary, raw_text").eq("user_id", userId).order("entry_date", { ascending: false }).limit(7),
    ]);
    const entries = (entriesRes as any).data || [];

    // Какие темы реально «есть о чём сказать». motivation и movement не требуют данных.
    const effective: MorningTopic[] = [];
    if (want.has("motivation")) effective.push("motivation");
    if (want.has("movement")) effective.push("movement");
    if (want.has("goals") && goals.length) effective.push("goals");
    if (want.has("tasks") && tasks.length) effective.push("tasks");
    if (want.has("diary") && entries.length) effective.push("diary");
    if (want.has("insight") && insights.length) effective.push("insight");
    if (want.has("gratitude") && gratitude.length) effective.push("gratitude");
    if (!effective.length) return null; // нечего сказать по выбранным темам → статичная фраза

    const ctx: string[] = [`Имя: ${name || "—"}`, `Серия дней подряд: ${streak}`];
    if (effective.includes("diary"))
      ctx.push("Последние записи (дата: суть):\n" + entries.map((e: any) => `${e.entry_date}: ${(e.summary || e.raw_text || "").slice(0, 300)}`).join("\n"));
    if (effective.includes("goals"))
      ctx.push("Цели (прогресс): " + goals.slice(0, 5).map((g: any) => `${g.title} — ${g.progress ?? 0}%`).join("; "));
    if (effective.includes("tasks"))
      ctx.push("Открытые задачи: " + tasks.map((t: any) => t.text).filter(Boolean).join("; "));
    if (effective.includes("insight"))
      ctx.push("Недавний инсайт: " + (insights[0]?.text || "").slice(0, 300));
    if (effective.includes("gratitude"))
      ctx.push("Недавняя благодарность: " + gratitude.slice(0, 3).join("; "));

    const focus = effective.map((t) => TOPIC_PROMPT[t]).join("; ");

    const styleLine = p.customStyle
      ? `\nДополнительно учитывай пожелание пользователя по стилю: «${p.customStyle}». Если оно противоречит правилам про факты ниже — правила про факты важнее.`
      : "";
    const addressLine = p.address ? `\nОбращайся к пользователю так: «${p.address}».` : "";
    const autoLine = p.tone === "auto"
      ? `\nГлавное: говори в МАНЕРЕ самого пользователя — посмотри блок «КАК ГОВОРИТ ПОЛЬЗОВАТЕЛЬ» ниже и зеркаль это: длину фраз, формальность/неформальность, эмодзи, сленг, обращения. Будто пишет близкий человек, который говорит на его языке.`
      : "";

    // Слова самого пользователя — чтобы понять его личность, контекст и манеру речи (не для пересказа).
    const voice: string[] = entries.map((e: any) => (e.raw_text || e.summary || "").trim()).filter(Boolean).slice(0, 4).map((t: string) => t.slice(0, 220));

    const today = new Date().toISOString().slice(0, 10);
    const prompt = `Сейчас утро, сегодня ${today}. Составь ОДНО личное утреннее сообщение для пользователя.
Тон: ${TONE_PROMPT[p.tone]}.${addressLine}${autoLine}${styleLine}
Пиши на языке с кодом "${lang}" (ru — русский, en — English, uk — українська, fr — français).
${LENGTH_PROMPT[p.length]} Эмодзи — только если они в духе пользователя, не лепи их искусственно.

Сначала по словам пользователя пойми, КТО он и какой у него сейчас период (предприниматель, родитель, спортсмен, учитель, творческий человек, трудный момент…), и поддержи ИМЕННО его — по-человечески и к месту. Записи используй, чтобы понять человека и его манеру; НЕ пересказывай их как факты, если тема «дневник» не выбрана.

Сообщение должно касаться ТОЛЬКО этих тем (и ничего лишнего): ${focus}.

СТРОГО про факты (пользователь не должен ловить тебя на выдумках):
- Пиши ТОЛЬКО о том, что прямо есть в КОНТЕКСТЕ ниже. Ничего не додумывай и не «угадывай».
- Цели, задачи и инсайты упоминай так, как они записаны. НЕ превращай одно в другое (не называй задачу «письмами», «звонками», «встречами», если так не написано).
- Не придумывай несуществующих дел, людей, сроков и цифр. Мало данных → будь просто человечным и тёплым, без выдуманной конкретики.
- Не нагнетай: «висят и ждут», «срочно», «горит» — только если это реально в данных.
- ДАТЫ: записи с сегодняшней (${today}) или вчерашней датой — это происходит СЕЙЧАС, не в прошлом. Не предлагай «вернуться» к тому, что человек делает сегодня/вчера; наоборот, отметь как успех. Не пиши «последний раз тогда-то», если это было сегодня.
- Не связывай несвязанное: бытовые покупки (средства для посуды, хозтовары) НЕ относятся к диете/аскезе/режиму/спорту.

ЗВУЧИ КАК ЖИВОЙ ЧЕЛОВЕК, А НЕ КАК НЕЙРОСЕТЬ:
- Пиши просто и естественно, как короткое сообщение от близкого человека в мессенджере.
- Никакого markdown: без #, *, **, _, без заголовков, списков и «блоков».
- Не злоупотребляй длинными тире, обычная живая пунктуация.
- Без пафоса и шаблонов («новый день, наполненный возможностями»), без канцелярита и роботизированных фраз. Без «ты должен».
Пример КАК НЕ НАДО: «Доброе утро! Сегодня — новый день, полный возможностей и свершений.»
Пример КАК НАДО: «Доброе утро. Сегодня постарайся не хвататься за всё сразу, выбери одну важную вещь и начни с неё.»
Верни ТОЛЬКО текст сообщения, без кавычек.

КАК ГОВОРИТ ПОЛЬЗОВАТЕЛЬ (его собственные слова — для понимания личности и манеры, НЕ для пересказа):
${voice.length ? voice.join("\n---\n") : "(пока мало записей — будь просто человечным и тёплым, без штампов)"}

КОНТЕКСТ:
${ctx.join("\n")}`;

    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      temperature: 0.6, // живее и естественнее; факты держат строгие правила в промпте
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(userId, "morning", "haiku", (m as any).usage);
    const text = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim();
    return text || null;
  } catch (e) {
    console.error("personalMorning", userId, e);
    return null;
  }
}
