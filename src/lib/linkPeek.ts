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

// Заголовок и описание страницы. Ошибка сети — не беда: вернём null и будем
// работать как раньше.
export async function peekLink(rawUrl: string): Promise<Peek | null> {
  const url = (rawUrl || "").trim();
  if (!url || !isSafeExternalUrl(url)) return null;
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

    const t1 = decode(title).slice(0, 200);
    const d1 = decode(description).slice(0, 400);
    if (!t1 && !d1) return null;
    return { url: res.url || url, title: t1, description: d1 };
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
