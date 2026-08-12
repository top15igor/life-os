import { isSafeExternalUrl } from "./safeUrl";

// Что находится по ссылке.
//
// Живой случай: человек скинул ссылку на Google Maps и написал «вот тут мы
// будем жить, найди что интересного вокруг». Бот сохранил запись «поделился
// ссылкой на Google Maps — зафиксировал какое-то место», ответил «я не хожу по
// ссылкам» и принялся угадывать город, предлагая Париж и Барселону. А в самой
// ссылке было написано: «Snorrabraut 29 · Reykjavík».
//
// Ходить по ссылке недорого: один запрос, заголовок страницы. Зато исчезает
// целый класс беспомощных ответов — «уточни, что ты имел в виду», когда всё
// уже сказано.

const URL_RE = /https?:\/\/[^\s<>"'）)]+/i;

export function firstUrl(text: string): string | null {
  const m = (text || "").match(URL_RE);
  return m ? m[0].replace(/[.,;!?]+$/, "") : null;
}

const pick = (html: string, re: RegExp): string => {
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
};

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

export type Peek = { url: string; title: string; description: string };

// Карты — отдельный случай. Полная ссылка Google Maps отдаёт заголовок «Google
// Карты» и ничего больше, зато сам адрес места записан прямо в пути:
// /maps/place/Snorrabraut+29,+105+Reykjavík,+Iceland. Берём оттуда — это
// надёжнее и не требует ни одного запроса.
const MAP_HOST = /(^|\.)(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl|apple\.com|maps\.apple\.com|yandex\.[a-z.]+|osm\.org|openstreetmap\.org|2gis\.[a-z.]+)$/i;
const GENERIC = /^(google\s*(maps|карты)|карты\s*google|apple\s*maps|Яндекс\s*Карты|yandex\s*maps|maps)$/i;

function placeFromUrl(raw: string): string {
  let u: URL;
  try { u = new URL(raw); } catch { return ""; }
  if (!MAP_HOST.test(u.hostname)) return "";
  const seg = u.pathname.match(/\/(?:place|search|dir)\/([^/@]+)/);
  const fromPath = seg ? decodeURIComponent(seg[1]).replace(/\+/g, " ") : "";
  const fromQuery = u.searchParams.get("q") || u.searchParams.get("daddr") || u.searchParams.get("text") || "";
  const s = (fromPath || fromQuery).replace(/\s+/g, " ").trim();
  // Координаты без названия ничего человеку не говорят — и модели тоже.
  return /^[-\d.,\s]+$/.test(s) ? "" : s.slice(0, 200);
}

// Заголовок и описание страницы. Ошибка сети — не беда: вернём null и будем
// работать как раньше.
export async function peekLink(rawUrl: string): Promise<Peek | null> {
  const url = (rawUrl || "").trim();
  if (!url || !isSafeExternalUrl(url)) return null;
  // Место видно прямо в адресе — ходить никуда не нужно.
  const direct = placeFromUrl(url);
  if (direct) return { url, title: direct, description: "" };
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctl.signal,
      headers: {
        // Тем же представлением, что и мессенджеры: сайты отдают им опрятную
        // карточку вместо приложения-заглушки.
        "user-agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "accept-language": "ru,en;q=0.9",
      },
    });
    clearTimeout(t);
    const html = (await res.text()).slice(0, 200_000);

    const title =
      pick(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      pick(html, /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ||
      pick(html, /<title[^>]*>([^<]+)<\/title>/i);
    const description =
      pick(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);

    const final = res.url || url;
    // Короткая ссылка распрямилась — место снова могло проявиться в адресе.
    const place = placeFromUrl(final);
    let t1 = place || decode(title).slice(0, 200);
    const d1 = decode(description).slice(0, 400);
    // «Google Карты» вместо названия места — это не ответ, а название приложения.
    // Лучше промолчать, чем подсунуть модели пустышку как факт.
    if (!place && GENERIC.test(t1)) t1 = "";
    if (!t1 && !d1) return null;
    return { url: final, title: t1, description: d1 };
  } catch {
    return null;
  }
}

// Строка для разбора и ответа. Пусто — значит по ссылке ничего не поняли.
export async function linkContext(text: string): Promise<string> {
  const u = firstUrl(text);
  if (!u) return "";
  const p = await peekLink(u);
  if (!p) return "";
  const parts = [p.title, p.description].filter(Boolean).join(" — ");
  return parts ? `\n\n[по ссылке: ${parts}]` : "";
}
