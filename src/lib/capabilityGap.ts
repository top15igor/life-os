import { supabaseAdmin } from "./supabaseAdmin";
import { normalizeMorningPrefs } from "./morningPrefs";

// «Хочу, чтобы умел» — сбор спроса в момент отказа.
//
// Самый ценный продуктовый сигнал — когда человек попросил, а продукт не смог.
// Обычно этот момент исчезает бесследно: человек пожал плечами и ушёл, и никто
// никогда не узнал, чего ему не хватило. Здесь мы его ловим: как только бот
// честно говорит «не умею», под ответом появляется кнопка.
//
// Приватность — почему именно кнопка, а не тихий сбор. Мы обещали людям, что
// содержимое их переписки не уходит владельцу. Поэтому просьба уезжает ТОЛЬКО
// после явного тапа: человек сам решает, чем поделиться, и видит, что услышан.
// До тапа текст лежит в его собственных настройках и никуда не отправляется.

type Lang = "ru" | "en" | "uk" | "fr" | "es";
const L = (l: string): Lang => (["ru", "en", "uk", "fr", "es"].includes(l) ? (l as Lang) : "ru");

// Как звучит честный отказ на пяти языках. Ловим широко, но по характерным
// оборотам: важно не поймать обычное «не знаю, что тебе сказать» в беседе.
const REFUSAL = [
  /\bне умею\b/i, /\bпока не умею\b/i, /\bя (?:этого|такого) не умею\b/i,
  /\bне могу (?:этого|такого|пока)\b/i, /\bнет такой возможности\b/i, /\bя не (?:могу|умею) (?:заказ|вызыв|звон|отправ|куп)/i,
  /\bне вмію\b/i, /\bне можу (?:цього|такого)\b/i,
  /\bI (?:can't|cannot|don't know how to) (?:do|order|call|book|send|buy)\b/i, /\bI'm not able to\b/i, /\bthat's not something I can\b/i,
  /\bje ne (?:peux|sais) pas (?:faire|commander|appeler)\b/i, /\bce n'est pas (?:quelque chose|une chose) que je peux\b/i,
  /\bno (?:puedo|sé) (?:hacer|pedir|llamar)\b/i, /\beso no lo puedo hacer\b/i,
];

export function looksLikeRefusal(reply: string): boolean {
  const t = (reply || "").trim();
  if (t.length < 10 || t.length > 4000) return false;
  return REFUSAL.some((re) => re.test(t));
}

export const WANT_BTN: Record<Lang, string> = {
  ru: "💡 Хочу, чтобы умел",
  en: "💡 I'd want this",
  uk: "💡 Хочу, щоб умів",
  fr: "💡 J'aimerais qu'il sache",
  es: "💡 Quiero que lo haga",
};

const THANKS: Record<Lang, string> = {
  ru: "💡 Записал: тебе не хватает именно этого. Такие просьбы я собираю и показываю создателю — по ним решают, что делать дальше. Спасибо, это правда помогает.",
  en: "💡 Noted: this is what you're missing. I collect these requests and show them to the maker — they decide what gets built next. Thank you, it genuinely helps.",
  uk: "💡 Записав: тобі бракує саме цього. Такі прохання я збираю й показую творцю — за ними вирішують, що робити далі. Дякую, це справді допомагає.",
  fr: "💡 C'est noté : voilà ce qui te manque. Je rassemble ces demandes et les montre au créateur — c'est ce qui décide de la suite. Merci, ça aide vraiment.",
  es: "💡 Anotado: esto es lo que te falta. Reúno estas peticiones y se las muestro al creador — con ellas se decide qué sigue. Gracias, ayuda de verdad.",
};

const NOTHING: Record<Lang, string> = {
  ru: "Не нашёл, о какой просьбе речь — напиши её ещё раз, и я запишу 🙂",
  en: "I couldn't tell which request you meant — say it once more and I'll note it 🙂",
  uk: "Не знайшов, про яке прохання йдеться — напиши ще раз, і я запишу 🙂",
  fr: "Je n'ai pas retrouvé la demande — redis-la et je la note 🙂",
  es: "No encontré a qué petición te refieres — dilo otra vez y lo anoto 🙂",
};

// Запомнить, о чём была просьба, — в собственных настройках человека.
// Никуда не отправляется, пока он не нажмёт кнопку.
export async function rememberGap(userId: string, request: string): Promise<void> {
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const prefs: any = { ...normalizeMorningPrefs((data as any)?.morning_prefs) };
    prefs.gapText = String(request || "").slice(0, 500);
    prefs.gapAt = new Date().toISOString();
    await supabaseAdmin().from("users").update({ morning_prefs: prefs }).eq("id", userId);
  } catch { /* не записалось — просто не покажем кнопку смысла */ }
}

// Тап по кнопке: просьба уходит владельцу в общий список обратной связи.
// Живёт в feedback (kind = "gap"), поэтому видна в /admin рядом с идеями и
// жалобами и не требует новых таблиц.
export async function confirmGap(userId: string, lang: string, name?: string | null): Promise<string> {
  const l = L(lang);
  let request = "";
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const prefs: any = normalizeMorningPrefs((data as any)?.morning_prefs);
    const at = Date.parse(prefs.gapAt || "");
    // Просьба живёт сутки: кнопка под старым сообщением не должна записать
    // случайную фразу, о которой человек уже забыл.
    if (prefs.gapText && (Number.isNaN(at) || Date.now() - at < 24 * 3600_000)) request = prefs.gapText;
    if (prefs.gapText) {
      const next: any = { ...prefs, gapText: "", gapAt: "" };
      await supabaseAdmin().from("users").update({ morning_prefs: next }).eq("id", userId);
    }
  } catch { /* не прочиталось — ответим мягко ниже */ }

  if (!request) return NOTHING[l];

  try {
    await supabaseAdmin().from("feedback").insert({
      user_id: userId,
      kind: "gap",
      text: `[БОТ НЕ УМЕЕТ]${name ? ` (${name})` : ""}\n${request}`,
    });
  } catch { /* нет таблицы — человеку всё равно отвечаем тепло */ }

  return THANKS[l];
}
