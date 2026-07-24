// «Добрая новость дня» (просьба Коли): противовес негативным медиа.
// Раз в день на язык Claude ищет через веб-поиск одну РЕАЛЬНУЮ позитивную
// новость (с источником, чтобы не выдумывал) и кэширует её в good_news.
// Утренний пуш подмешивает её всем, у кого тема включена.
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";

export type NewsLang = "ru" | "en" | "uk" | "fr" | "es";
export type GoodNews = { text: string; url: string | null };

const LANG_LABEL: Record<NewsLang, string> = {
  ru: "русском", en: "английском (English)", uk: "украинском (українською)", fr: "французском (français)", es: "испанском (español)",
};

// Если генерация сегодня уже падала — не молотим API на каждом пользователе
// (память процесса; на холодном инстансе просто попробует ещё раз).
const failedOn = new Map<NewsLang, string>();

export async function getGoodNews(lang: NewsLang, day: string, allowGenerate = true): Promise<GoodNews | null> {
  const db = supabaseAdmin();
  try {
    const { data, error } = await db.from("good_news").select("text, url").eq("day", day).eq("lang", lang).maybeSingle();
    if (error) return null; // таблицы ещё нет (SQL не применён) — тихо без новости
    if ((data as any)?.text) return { text: (data as any).text, url: (data as any).url || null };
  } catch {
    return null;
  }
  if (!allowGenerate || !process.env.ANTHROPIC_API_KEY) return null;
  if (failedOn.get(lang) === day) return null;

  try {
    const resp = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 } as any],
      messages: [{
        role: "user",
        content: `Найди через веб-поиск ОДНУ реальную позитивную новость мира за последние 2-3 дня: наука, медицина, природа, спасение людей или животных, добрые поступки, открытия, культура. НЕ бери политику, войны, катастрофы, спортивные счёты и биржи.

Правила:
- Только то, что реально есть в результатах поиска. Ничего не выдумывай и не приукрашивай цифры.
- Напиши 1-2 коротких предложения на ${LANG_LABEL[lang] || LANG_LABEL.ru} языке — просто и тепло, как человек делится хорошим, без пафоса и канцелярита.
- url — ссылка на источник из результатов поиска.

Верни СТРОГО JSON без пояснений: {"text":"...","url":"https://..."}`,
      }],
    });
    logClaude(undefined, "good_news", "haiku", (resp as any).usage);
    const raw = resp.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("no json");
    const parsed = JSON.parse(m[0]);
    const text = String(parsed?.text || "").trim().slice(0, 400);
    const url = /^https?:\/\//.test(String(parsed?.url || "")) ? String(parsed.url).slice(0, 500) : null;
    if (text.length < 20) throw new Error("too short");

    await db.from("good_news").upsert({ day, lang, text, url }, { onConflict: "day,lang" });
    return { text, url };
  } catch (e) {
    console.error("goodNews", lang, e);
    failedOn.set(lang, day);
    return null;
  }
}

// Готовая HTML-строка для Telegram (parse_mode HTML): текст экранируем, источник ссылкой.
export function goodNewsLine(n: GoodNews): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `🌍 ${esc(n.text)}${n.url ? ` <a href="${n.url}">↗</a>` : ""}`;
}
