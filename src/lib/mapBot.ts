// Карта жизни со стороны бота: что бот отвечает на фото с координатами,
// на присланную геометку и как подсказывает про отправку файлом.
//
// Главная неприятность здесь не наша: Telegram вырезает координаты из сжатых
// фотографий. Поэтому у человека есть три честных пути поставить точку —
// прислать снимок файлом, следом кинуть геометку или поставить точку руками на
// самой карте. Бот об этом напоминает, но не назойливо: не чаще раза в неделю.

import { supabaseAdmin } from "./supabaseAdmin";
import { placeNameAt, saveGeo, lastPhotoWithoutGeo } from "./photoGeo";

type Lang = string;

const M: Record<string, any> = {
  ru: {
    open: "🗺 Карта жизни",
    at: (place: string) => `📍 ${place} — точка встала на карту жизни`,
    atRaw: "📍 Точка встала на карту жизни",
    fileHint: "💡 Чтобы фото само вставало на карту, присылай его файлом («Отправить без сжатия») — при обычной отправке Telegram стирает координаты. Или кинь геометку следом, я привяжу её к снимку.",
    attached: (title: string) => `📍 Отметил на карте: <b>${title}</b>`,
    pointSaved: (place: string) => `📍 Записал, что ты был здесь: ${place}`,
    pointSavedRaw: "📍 Записал точку на карте",
    hereTitle: "Был здесь",
    mapIntro: "🗺 <b>Карта жизни</b>\n\nВсе места, где ты был, — точками из твоих же фотографий, соединёнными по времени. Нажми на точку — увидишь снимок и сможешь оставить к нему свой комментарий, голосом или текстом.\n\nЧтобы фото само вставало на карту, присылай его файлом («Отправить без сжатия») или кидай геометку следом за снимком.",
    failed: "Не получилось поставить точку, попробуй ещё раз.",
  },
  en: {
    open: "🗺 Life map",
    at: (place: string) => `📍 ${place} — the point is on your life map`,
    atRaw: "📍 The point is on your life map",
    fileHint: "💡 To make photos land on the map by themselves, send them AS A FILE (“without compression”) — Telegram wipes the coordinates from compressed photos. Or send a location pin right after, and I'll attach it to the shot.",
    attached: (title: string) => `📍 Marked on the map: <b>${title}</b>`,
    pointSaved: (place: string) => `📍 Noted that you were here: ${place}`,
    pointSavedRaw: "📍 Point saved on the map",
    hereTitle: "Was here",
    mapIntro: "🗺 <b>Life map</b>\n\nEvery place you have been — as points from your own photos, connected in time. Tap a point to see the shot and leave your own comment on it, by voice or text.\n\nTo make a photo land on the map by itself, send it as a FILE (“without compression”) or send a location pin right after the shot.",
    failed: "Could not save the point, try again.",
  },
  uk: {
    open: "🗺 Карта життя",
    at: (place: string) => `📍 ${place} — точка стала на карту життя`,
    atRaw: "📍 Точка стала на карту життя",
    fileHint: "💡 Щоб фото саме ставало на карту, надсилай його файлом («без стиснення») — при звичайній відправці Telegram стирає координати. Або кинь геомітку слідом, я прив'яжу її до знімка.",
    attached: (title: string) => `📍 Відмітив на карті: <b>${title}</b>`,
    pointSaved: (place: string) => `📍 Записав, що ти був тут: ${place}`,
    pointSavedRaw: "📍 Записав точку на карті",
    hereTitle: "Був тут",
    mapIntro: "🗺 <b>Карта життя</b>\n\nУсі місця, де ти був, — точками з твоїх же фотографій, з'єднаними за часом. Натисни на точку — побачиш знімок і зможеш лишити свій коментар, голосом або текстом.\n\nЩоб фото саме ставало на карту, надсилай його файлом («без стиснення») або кидай геомітку слідом.",
    failed: "Не вийшло поставити точку, спробуй ще раз.",
  },
  fr: {
    open: "🗺 Carte de vie",
    at: (place: string) => `📍 ${place} — le point est sur ta carte de vie`,
    atRaw: "📍 Le point est sur ta carte de vie",
    fileHint: "💡 Pour que les photos arrivent seules sur la carte, envoie-les EN FICHIER (« sans compression ») — Telegram efface les coordonnées des photos compressées. Ou envoie une position juste après, je l'attacherai à la photo.",
    attached: (title: string) => `📍 Placé sur la carte : <b>${title}</b>`,
    pointSaved: (place: string) => `📍 Noté que tu étais ici : ${place}`,
    pointSavedRaw: "📍 Point enregistré sur la carte",
    hereTitle: "J'étais ici",
    mapIntro: "🗺 <b>Carte de vie</b>\n\nTous les endroits où tu es allé — en points issus de tes propres photos, reliés dans le temps. Touche un point pour voir la photo et y laisser ton commentaire, à la voix ou au clavier.\n\nPour qu'une photo arrive seule sur la carte, envoie-la EN FICHIER (« sans compression ») ou envoie une position juste après.",
    failed: "Le point n'a pas pu être enregistré, réessaie.",
  },
  es: {
    open: "🗺 Mapa de vida",
    at: (place: string) => `📍 ${place} — el punto está en tu mapa de vida`,
    atRaw: "📍 El punto está en tu mapa de vida",
    fileHint: "💡 Para que las fotos lleguen solas al mapa, mándalas COMO ARCHIVO («sin compresión») — Telegram borra las coordenadas de las fotos comprimidas. O manda una ubicación justo después y la uno a la foto.",
    attached: (title: string) => `📍 Marcado en el mapa: <b>${title}</b>`,
    pointSaved: (place: string) => `📍 Anotado que estuviste aquí: ${place}`,
    pointSavedRaw: "📍 Punto guardado en el mapa",
    hereTitle: "Estuve aquí",
    mapIntro: "🗺 <b>Mapa de vida</b>\n\nTodos los lugares donde estuviste — como puntos de tus propias fotos, unidos en el tiempo. Toca un punto para ver la foto y dejar tu comentario, por voz o texto.\n\nPara que una foto llegue sola al mapa, mándala COMO ARCHIVO («sin compresión») o manda una ubicación justo después.",
    failed: "No se pudo guardar el punto, inténtalo de nuevo.",
  },
};

export const mapMsg = (lang: Lang) => M[lang] || M.ru;

// Кнопка «открыть карту» — тем же путём, что и остальные кнопки бота (/go),
// чтобы человек попадал в приложение уже залогиненным.
export function mapButton(origin: string, lang: Lang) {
  return { text: mapMsg(lang).open, url: `${origin}/go?next=/map` };
}

// Подсказка про отправку файлом — не чаще раза в неделю.
const HINT_DAYS = 7;

export async function shouldHintFile(userId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const raw = (data as any)?.morning_prefs;
    const at = raw && typeof raw === "object" ? raw.mapHintAt : null;
    if (!at) return true;
    return Date.now() - Date.parse(at) > HINT_DAYS * 24 * 3600 * 1000;
  } catch {
    return false;
  }
}

export async function markFileHinted(userId: string): Promise<void> {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const raw = (data as any)?.morning_prefs && typeof (data as any).morning_prefs === "object" ? (data as any).morning_prefs : {};
    await db.from("users").update({ morning_prefs: { ...raw, mapHintAt: new Date().toISOString() } }).eq("id", userId);
  } catch {}
}

// Присланная геометка. Сначала пытаемся привязать её к только что отправленному
// снимку — так человек и делает: сперва фото, следом «вот это место». Если
// свежего фото нет, точка живёт сама по себе: «я тут был».
export async function handleLocation(
  userId: string,
  lat: number,
  lng: number,
  lang: Lang,
  venue?: string | null,
): Promise<{ text: string; attached: boolean }> {
  const S = mapMsg(lang);
  const place = venue || (await placeNameAt(lat, lng, lang));

  const last = await lastPhotoWithoutGeo(userId);
  if (last) {
    const ok = await saveGeo(last.id, userId, { lat, lng, place: place || null, source: "telegram" });
    if (ok) return { text: S.attached(last.title || S.hereTitle), attached: true };
  }

  try {
    await supabaseAdmin().from("memories").insert({
      user_id: userId,
      category: "place",
      title: place || S.hereTitle,
      summary: "",
      fields: [],
      mem_date: new Date().toISOString().slice(0, 10),
      status: "ok",
      lat,
      lng,
      place_name: place || null,
      geo_source: "telegram",
      shot_at: new Date().toISOString(),
    });
  } catch {
    // Миграция photo_map.sql ещё не применена — точку сохранить некуда.
    return { text: S.pointSavedRaw, attached: false };
  }
  return { text: place ? S.pointSaved(place) : S.pointSavedRaw, attached: false };
}
