import { supabaseAdmin } from "./supabaseAdmin";
import { sendMessage } from "./telegram";
import { normalizeMorningPrefs } from "./morningPrefs";
import { userTzOffsetMin } from "./pushSchedule";

// «Сообщить о проблеме»: канал жалоб прямо из бота.
//
// Зачем отдельная механика, а не «напиши мне в личку»: человек, у которого что-то
// сломалось, почти никогда не пишет сам — он молча уходит. А если и пишет, то
// «не работает» без единой детали, и починить по такому сообщению нечего.
// Поэтому: тип проблемы выбирается кнопкой (один тап), описание — своими словами
// или голосом, а техданные бот прикладывает сам.
//
// Приватность: к жалобе уходят ТОЛЬКО метаданные (когда была последняя запись,
// сколько записей сегодня, язык, тариф) — никакого содержимого дневника. Мы прямо
// говорим об этом человеку перед тем, как он начнёт писать.
//
// Хранится в существующей таблице feedback (kind = "bug"), поэтому жалобы падают
// в тот же раздел «Обратная связь» в /admin и никакого нового SQL не нужно.

type Lang = "ru" | "en" | "uk" | "fr" | "es";
const L = (lang: string): Lang => (["ru", "en", "uk", "fr", "es"].includes(lang) ? (lang as Lang) : "ru");

// Через столько ожидание описания само сбрасывается: иначе завтрашняя запись
// дневника уехала бы в жалобу.
const WAIT_MS = 60 * 60 * 1000;

export const PROBLEM_KINDS = ["freeze", "wrong", "lost", "web", "pay", "other"] as const;
export type ProblemKind = (typeof PROBLEM_KINDS)[number];

const KIND_LABEL: Record<Lang, Record<ProblemKind, string>> = {
  ru: {
    freeze: "🧊 Бот завис / не отвечает",
    wrong: "🤔 Ответил не то или не понял",
    lost: "🕳 Пропала запись или данные",
    web: "🌐 Ошибка на сайте или в приложении",
    pay: "💳 Оплата и тарифы",
    other: "❓ Другое",
  },
  en: {
    freeze: "🧊 Bot froze / no reply",
    wrong: "🤔 Wrong or confused answer",
    lost: "🕳 An entry or data went missing",
    web: "🌐 Error on the site or in the app",
    pay: "💳 Payments and plans",
    other: "❓ Something else",
  },
  uk: {
    freeze: "🧊 Бот завис / не відповідає",
    wrong: "🤔 Відповів не те або не зрозумів",
    lost: "🕳 Зник запис або дані",
    web: "🌐 Помилка на сайті чи в застосунку",
    pay: "💳 Оплата й тарифи",
    other: "❓ Інше",
  },
  fr: {
    freeze: "🧊 Le bot a planté / ne répond pas",
    wrong: "🤔 Réponse à côté ou incomprise",
    lost: "🕳 Une entrée ou des données ont disparu",
    web: "🌐 Erreur sur le site ou dans l'app",
    pay: "💳 Paiements et abonnements",
    other: "❓ Autre chose",
  },
  es: {
    freeze: "🧊 El bot se colgó / no responde",
    wrong: "🤔 Respondió mal o no entendió",
    lost: "🕳 Se perdió una entrada o datos",
    web: "🌐 Error en la web o en la app",
    pay: "💳 Pagos y planes",
    other: "❓ Otra cosa",
  },
};

const MENU_TEXT: Record<Lang, string> = {
  ru: "🛠 <b>Что-то сломалось?</b>\n\nСпасибо, что говоришь — я правда чиню по таким сообщениям. Выбери, что ближе к твоему случаю, и расскажешь подробнее 👇",
  en: "🛠 <b>Something broke?</b>\n\nThank you for speaking up — reports like yours are what actually get fixed. Pick what's closest to your case, then tell me more 👇",
  uk: "🛠 <b>Щось зламалося?</b>\n\nДякую, що кажеш — я справді лагоджу за такими повідомленнями. Обери, що ближче до твого випадку, і розкажеш детальніше 👇",
  fr: "🛠 <b>Quelque chose est cassé ?</b>\n\nMerci de le signaler — ce sont ces messages qui font vraiment avancer les corrections. Choisis ce qui correspond le mieux, puis raconte-moi 👇",
  es: "🛠 <b>¿Algo se rompió?</b>\n\nGracias por avisar — con mensajes así es como se arregla de verdad. Elige lo que más se parezca a tu caso y me cuentas 👇",
};

// Подсказки под каждый тип: человек не знает, что именно нам важно, — говорим прямо.
const ASK_HINT: Record<Lang, Record<ProblemKind, string>> = {
  ru: {
    freeze: "Когда это было и что ты отправлял боту перед тишиной? Если это было голосовое — примерно какой длины.",
    wrong: "Что ты написал или сказал и что бот ответил вместо этого?",
    lost: "Что пропало и когда ты это записывал? Где смотрел — в боте или на сайте?",
    web: "На какой странице и что именно случилось? Скриншот очень поможет.",
    pay: "Что ты хотел оплатить и на каком шаге застряло?",
    other: "Опиши своими словами, что случилось.",
  },
  en: {
    freeze: "When was it, and what did you send the bot before the silence? If it was a voice note — roughly how long?",
    wrong: "What did you write or say, and what did the bot answer instead?",
    lost: "What went missing and when did you record it? Where did you look — in the bot or on the site?",
    web: "Which page, and what exactly happened? A screenshot helps a lot.",
    pay: "What were you trying to pay for, and at which step did it get stuck?",
    other: "Describe in your own words what happened.",
  },
  uk: {
    freeze: "Коли це було і що ти надсилав боту перед тишею? Якщо це було голосове — приблизно якої довжини.",
    wrong: "Що ти написав або сказав і що бот відповів замість цього?",
    lost: "Що зникло і коли ти це записував? Де дивився — у боті чи на сайті?",
    web: "На якій сторінці і що саме сталося? Скріншот дуже допоможе.",
    pay: "Що ти хотів оплатити і на якому кроці застрягло?",
    other: "Опиши своїми словами, що сталося.",
  },
  fr: {
    freeze: "C'était quand, et qu'avais-tu envoyé au bot avant le silence ? Si c'était un vocal — de quelle durée environ ?",
    wrong: "Qu'as-tu écrit ou dit, et qu'a répondu le bot à la place ?",
    lost: "Qu'est-ce qui a disparu et quand l'avais-tu enregistré ? Où as-tu regardé — dans le bot ou sur le site ?",
    web: "Sur quelle page, et que s'est-il passé exactement ? Une capture d'écran aide beaucoup.",
    pay: "Que voulais-tu payer, et à quelle étape ça a bloqué ?",
    other: "Raconte avec tes mots ce qui s'est passé.",
  },
  es: {
    freeze: "¿Cuándo fue y qué le enviaste al bot antes del silencio? Si era un audio — ¿de cuánto tiempo más o menos?",
    wrong: "¿Qué escribiste o dijiste y qué respondió el bot en su lugar?",
    lost: "¿Qué se perdió y cuándo lo grabaste? ¿Dónde lo buscaste — en el bot o en la web?",
    web: "¿En qué página y qué pasó exactamente? Una captura ayuda mucho.",
    pay: "¿Qué querías pagar y en qué paso se atascó?",
    other: "Cuéntame con tus palabras qué pasó.",
  },
};

const ASK_LEAD: Record<Lang, string> = {
  ru: "Расскажи своими словами — можно голосом, так даже быстрее.",
  en: "Tell me in your own words — a voice note works too, it's even faster.",
  uk: "Розкажи своїми словами — можна голосом, так навіть швидше.",
  fr: "Raconte-moi avec tes mots — un vocal marche aussi, c'est même plus rapide.",
  es: "Cuéntamelo con tus palabras — un audio también vale, incluso es más rápido.",
};

const ASK_PRIVACY: Record<Lang, string> = {
  ru: "🔒 Вместе с сообщением уйдут только техданные: когда была твоя последняя запись, сколько записей сегодня, язык и тариф. Тексты записей не отправляются.",
  en: "🔒 Only technical details go with your message: when your last entry was, how many entries today, language and plan. The content of your entries is never sent.",
  uk: "🔒 Разом із повідомленням підуть лише техдані: коли був твій останній запис, скільки записів сьогодні, мова й тариф. Тексти записів не надсилаються.",
  fr: "🔒 Seules des données techniques accompagnent ton message : date de ta dernière entrée, nombre d'entrées aujourd'hui, langue et formule. Le contenu de tes entrées n'est jamais envoyé.",
  es: "🔒 Con tu mensaje solo van datos técnicos: cuándo fue tu última entrada, cuántas hoy, idioma y plan. El contenido de tus entradas nunca se envía.",
};

const ASK_SCREENSHOT: Record<Lang, string> = {
  ru: "📷 Есть скриншот — пришли картинкой, я приложу его к обращению.",
  en: "📷 Got a screenshot? Send it as a photo and I'll attach it to the report.",
  uk: "📷 Є скріншот — надішли картинкою, я додам його до звернення.",
  fr: "📷 Tu as une capture ? Envoie-la en photo et je la joindrai au signalement.",
  es: "📷 ¿Tienes una captura? Mándala como foto y la adjunto al reporte.",
};

const THANKS: Record<Lang, (n: string) => string> = {
  ru: (n) => `✅ Принял, обращение <b>№${n}</b>.\n\nСпасибо — честно, именно такие сообщения чинят продукт быстрее всего. Я посмотрю и, если понадобится уточнить, напишу прямо сюда.`,
  en: (n) => `✅ Got it, report <b>#${n}</b>.\n\nThank you — honestly, messages like this are what fix the product fastest. I'll look into it and write here if I need details.`,
  uk: (n) => `✅ Прийняв, звернення <b>№${n}</b>.\n\nДякую — чесно, саме такі повідомлення лагодять продукт найшвидше. Я подивлюся і, якщо треба буде уточнити, напишу прямо сюди.`,
  fr: (n) => `✅ C'est noté, signalement <b>n°${n}</b>.\n\nMerci — franchement, ce sont ces messages qui font avancer le produit le plus vite. Je regarde ça et je t'écris ici si j'ai besoin de précisions.`,
  es: (n) => `✅ Recibido, reporte <b>n.º ${n}</b>.\n\nGracias — de verdad, estos mensajes son los que más rápido arreglan el producto. Lo reviso y, si necesito detalles, te escribo aquí.`,
};

const SHORT: Record<Lang, string> = {
  ru: "Расскажи чуть подробнее — пары слов мне не хватит, чтобы найти причину 🙂",
  en: "Tell me a bit more — a couple of words won't be enough to track down the cause 🙂",
  uk: "Розкажи трохи детальніше — пари слів мені замало, щоб знайти причину 🙂",
  fr: "Donne-moi un peu plus de détails — deux mots ne suffiront pas à trouver la cause 🙂",
  es: "Cuéntame un poco más — con dos palabras no puedo encontrar la causa 🙂",
};

const PHOTO_OK: Record<Lang, string> = {
  ru: "📷 Скриншот приложил к обращению, спасибо.",
  en: "📷 Screenshot attached to the report, thank you.",
  uk: "📷 Скріншот додав до звернення, дякую.",
  fr: "📷 Capture jointe au signalement, merci.",
  es: "📷 Captura adjuntada al reporte, gracias.",
};

export const MORE_BTN: Record<Lang, string> = {
  ru: "➕ Добавить детали", en: "➕ Add details", uk: "➕ Додати деталі", fr: "➕ Ajouter des détails", es: "➕ Añadir detalles",
};
export const CANCEL_BTN: Record<Lang, string> = {
  ru: "✖️ Отмена", en: "✖️ Cancel", uk: "✖️ Скасувати", fr: "✖️ Annuler", es: "✖️ Cancelar",
};
const CANCELLED: Record<Lang, string> = {
  ru: "Хорошо, отменил. Если что-то сломается — просто напиши «проблема» 🙂",
  en: "Okay, cancelled. If anything breaks — just write “problem” 🙂",
  uk: "Гаразд, скасував. Якщо щось зламається — просто напиши «проблема» 🙂",
  fr: "D'accord, annulé. Si quelque chose casse — écris simplement « problème » 🙂",
  es: "Vale, cancelado. Si algo se rompe — solo escribe «problema» 🙂",
};

// Естественные формулировки. Общие глаголы («не работает», «завис») требуют, чтобы
// рядом стоял объект — бот/сайт/приложение: иначе «не работает кран» — обычная
// запись дневника — была бы принята за жалобу.
const DIRECT_RE = [
  /^\s*(сообщить о проблеме|проблема|баг|глюк|жалоба|report a problem|bug|glitch|problema|probl[eè]me)\s*[.!]?\s*$/i,
];
const OBJECT_RE = /(бот|бота|боту|сайт|сайте|приложени|life\s*os|лайф\s*ос|дневник|app|website)/i;
const BROKEN_RE = /(не\s*работа|не\s*отвеча|завис|глюч|слома|туп(ит|ит)|не\s*грузит|ошибка|не\s*приход|пропал|not\s*work|broke|frozen|stuck|crash|error)/i;

export function isProblemPhrase(text: string): boolean {
  const t = (text || "").trim();
  if (!t || t.length > 120) return false;
  if (DIRECT_RE.some((re) => re.test(t))) return true;
  return BROKEN_RE.test(t) && OBJECT_RE.test(t);
}

// ===== Состояние ожидания описания =====

async function readState(userId: string): Promise<{ prefs: any; kind: string; ticket: string; at: number }> {
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const prefs = normalizeMorningPrefs((data as any)?.morning_prefs);
    return { prefs, kind: prefs.pbKind, ticket: prefs.pbTicket, at: Date.parse(prefs.pbAt || "") };
  } catch {
    return { prefs: normalizeMorningPrefs(null), kind: "", ticket: "", at: NaN };
  }
}

async function writeState(userId: string, prefs: any, patch: { kind?: string; ticket?: string }): Promise<void> {
  const next = { ...prefs };
  if (patch.kind !== undefined) next.pbKind = patch.kind;
  if (patch.ticket !== undefined) next.pbTicket = patch.ticket;
  next.pbAt = patch.kind === "" ? "" : new Date().toISOString();
  try {
    await supabaseAdmin().from("users").update({ morning_prefs: next }).eq("id", userId);
  } catch { /* нет колонки — фича мягко деградирует */ }
}

export async function isAwaitingProblem(userId: string): Promise<boolean> {
  const st = await readState(userId);
  if (!st.kind) return false;
  if (!Number.isNaN(st.at) && Date.now() - st.at > WAIT_MS) {
    await writeState(userId, st.prefs, { kind: "" });
    return false;
  }
  return true;
}

export async function cancelProblem(userId: string, lang: string): Promise<string> {
  const st = await readState(userId);
  if (st.kind) await writeState(userId, st.prefs, { kind: "", ticket: "" });
  return CANCELLED[L(lang)];
}

// ===== Шаги =====

// Меню типов проблемы. Один тап — и человек уже внутри.
export function problemMenu(lang: string): { text: string; kinds: { key: ProblemKind; label: string }[] } {
  const l = L(lang);
  return { text: MENU_TEXT[l], kinds: PROBLEM_KINDS.map((k) => ({ key: k, label: KIND_LABEL[l][k] })) };
}

// Тип выбран — просим описание с подсказкой, что именно нам полезно.
export async function askProblemDetails(userId: string, lang: string, kind: ProblemKind): Promise<string> {
  const l = L(lang);
  const st = await readState(userId);
  await writeState(userId, st.prefs, { kind, ticket: "" });
  const parts = [
    `<b>${KIND_LABEL[l][kind]}</b>`,
    `${ASK_LEAD[l]} ${ASK_HINT[l][kind]}`,
    kind === "web" || kind === "wrong" ? ASK_SCREENSHOT[l] : "",
    ASK_PRIVACY[l],
  ].filter(Boolean);
  return parts.join("\n\n");
}

// ===== Техконтекст (только метаданные, без содержимого записей) =====

async function techContext(userId: string): Promise<{ line: string; tzOff: number | null }> {
  const db = supabaseAdmin();
  const bits: string[] = [];
  let tzOff: number | null = null;
  try {
    // Колонок plan/tester может не быть (SQL не применён) — тогда селект упал бы
    // целиком и увёл с собой язык и таймзону. Поэтому есть запасной, минимальный.
    let { data: u } = await db.from("users").select("lang, plan, tester, tz_offset, morning_prefs, created_at").eq("id", userId).maybeSingle();
    if (!u) ({ data: u } = await db.from("users").select("lang, tz_offset, morning_prefs, created_at").eq("id", userId).maybeSingle());
    if (u) {
      tzOff = userTzOffsetMin((u as any).tz_offset, (u as any).morning_prefs?.tz);
      if ((u as any).lang) bits.push(`язык ${(u as any).lang}`);
      bits.push(`тариф ${(u as any).plan || "free"}`);
      if ((u as any).tester) bits.push("тестировщик");
      const reg = (u as any).created_at ? String((u as any).created_at).slice(0, 10) : "";
      if (reg) bits.push(`с ${reg}`);
    }
  } catch { /* колонок может не быть */ }
  try {
    const { data: last } = await db.from("entries").select("entry_date, entry_time, source").eq("user_id", userId).order("entry_date", { ascending: false }).order("entry_time", { ascending: false }).limit(1);
    const e = ((last as any[]) || [])[0];
    if (e) bits.push(`последняя запись ${e.entry_date}${e.entry_time ? " " + String(e.entry_time).slice(0, 5) : ""}${e.source ? ` (${e.source})` : ""}`);
    else bits.push("записей нет");
  } catch { /* таблицы может не быть */ }
  return { line: bits.join(" · "), tzOff };
}

// ===== Приём жалобы =====

function ticketFrom(id: string | null): string {
  if (id) return id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return Date.now().toString(36).slice(-6).toUpperCase();
}

export async function submitProblem(
  userId: string,
  lang: string,
  text: string,
  who: { name?: string | null; username?: string | null; chatId?: number | null },
): Promise<{ text: string; ticket: string } | { text: string; ticket: null }> {
  const l = L(lang);
  const body = (text || "").trim().slice(0, 4000);
  if (body.length < 10) return { text: SHORT[l], ticket: null };

  const st = await readState(userId);
  const kind = (PROBLEM_KINDS as readonly string[]).includes(st.kind) ? (st.kind as ProblemKind) : "other";
  const isFollowUp = !!st.ticket;

  // Сохраняем в общую таблицу обратной связи: kind = "bug", чтобы жалоба попала
  // в раздел «Обратная связь» админки вместе с идеями и отзывами.
  const stored = `[${KIND_LABEL.ru[kind]}]${isFollowUp ? ` (дополнение к №${st.ticket})` : ""}\n${body}`;
  let ticket = st.ticket;
  try {
    const { data } = await supabaseAdmin().from("feedback").insert({ user_id: userId, kind: "bug", text: stored }).select("id").maybeSingle();
    if (!ticket) ticket = ticketFrom((data as any)?.id || null);
  } catch {
    if (!ticket) ticket = ticketFrom(null);
  }

  // Владельцу — карточка со всем, что нужно, чтобы начать разбираться.
  const owner = Number(process.env.TELEGRAM_ALLOWED_CHAT_ID || 0);
  if (owner) {
    const { line, tzOff } = await techContext(userId);
    const local = new Date(Date.now() + (tzOff ?? 0) * 60000);
    const when = `${String(local.getUTCDate()).padStart(2, "0")}.${String(local.getUTCMonth() + 1).padStart(2, "0")} ${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const head = `🐞 <b>${esc(KIND_LABEL.ru[kind])}</b> · №${ticket}${isFollowUp ? " (дополнение)" : ""}`;
    const from = `От: ${esc(who.name || "—")}${who.username ? ` (@${esc(who.username)})` : ""}${who.chatId ? ` · chat ${who.chatId}` : ""}`;
    try {
      await sendMessage(owner, `${head}\n${from}\nУ него сейчас: ${when}\n\n${esc(body)}\n\n<i>${esc(line)}</i>`);
    } catch { /* владельцу не дошло — человеку всё равно отвечаем */ }
  }

  // Ждём возможных деталей к этому же обращению, но ветку описания закрываем.
  await writeState(userId, st.prefs, { kind: "", ticket: ticket || "" });
  return { text: THANKS[l](ticket || "—"), ticket: ticket || null };
}

// Кнопка «Добавить детали»: снова ждём текст, номер обращения тот же.
export async function reopenProblem(userId: string, lang: string): Promise<string> {
  const l = L(lang);
  const st = await readState(userId);
  await writeState(userId, st.prefs, { kind: st.kind || "other", ticket: st.ticket });
  return `${ASK_LEAD[l]}${st.ticket ? `\n\n<i>№${st.ticket}</i>` : ""}`;
}

// Скриншот к обращению: пересылаем владельцу картинку по file_id.
export async function attachScreenshot(userId: string, lang: string, fileId: string, who: { name?: string | null }): Promise<string> {
  const l = L(lang);
  const st = await readState(userId);
  const owner = Number(process.env.TELEGRAM_ALLOWED_CHAT_ID || 0);
  if (owner) {
    const { sendPhoto } = await import("./telegram");
    const cap = `📷 Скриншот к обращению${st.ticket ? ` №${st.ticket}` : ""} от ${who.name || "—"}`;
    try { await sendPhoto(owner, fileId, { caption: cap }); } catch { /* не дошло — не страшно */ }
  }
  return PHOTO_OK[l];
}
