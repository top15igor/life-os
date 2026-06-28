// ============================================================
//  Финансовый помощник и наставник по финграмотности.
//  Готовит человечный разбор финансов: итоги, закономерности,
//  совет и короткий урок финграмотности на основе РЕАЛЬНЫХ цифр.
//  Используется в ежемесячной рассылке (cron) и команде /money.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { logClaude } from "./usage";
import { getFinanceData, getFinanceSummary, shiftMonth } from "./finance";

type Lang = "ru" | "en" | "uk" | "fr";
const LANG_NAME: Record<Lang, string> = { ru: "русском", en: "English", uk: "українській", fr: "français" };

const HDR: Record<Lang, { month: (m: string) => string; review: string; none: string }> = {
  ru: { month: (m) => `📊 <b>Финансовый отчёт за ${m}</b>`, review: "📊 <b>Финансовый разбор</b>", none: "Пока нет финансовых операций для разбора. Добавь доходы и расходы в разделе «Деньги» — и я подготовлю отчёт и подскажу, как улучшить финансы. 💪" },
  en: { month: (m) => `📊 <b>Financial report — ${m}</b>`, review: "📊 <b>Financial review</b>", none: "No financial transactions yet to review. Add income and expenses in the Money section — and I'll prepare a report and tips to improve your finances. 💪" },
  uk: { month: (m) => `📊 <b>Фінансовий звіт за ${m}</b>`, review: "📊 <b>Фінансовий розбір</b>", none: "Поки немає фінансових операцій для розбору. Додай доходи й витрати в розділі «Гроші» — і я підготую звіт і підкажу, як покращити фінанси. 💪" },
  fr: { month: (m) => `📊 <b>Rapport financier — ${m}</b>`, review: "📊 <b>Bilan financier</b>", none: "Aucune opération financière à analyser pour l'instant. Ajoute des revenus et dépenses dans la section Argent — et je préparerai un rapport et des conseils. 💪" },
};

// Месяц вида «июнь 2024» / «June 2024» на языке пользователя.
function monthName(month: string, lang: Lang): string {
  const intl = lang === "en" ? "en-GB" : lang === "fr" ? "fr-FR" : lang === "uk" ? "uk-UA" : "ru-RU";
  try { return new Date(month + "-01T00:00:00").toLocaleDateString(intl, { month: "long", year: "numeric" }); }
  catch { return month; }
}

// Системная роль «личный бухгалтер + наставник по финграмотности».
function persona(lang: Lang): string {
  return `Ты — дружелюбный личный бухгалтер и наставник по финансовой грамотности в приложении LIFE OS. Говоришь просто и поддерживающе, без осуждения и занудства. Отвечай на ${LANG_NAME[lang]} языке. Опирайся ТОЛЬКО на реальные цифры ниже, не выдумывай. Суммы указывай с валютой. Используй простой формат с короткими абзацами и уместными эмодзи, можно <b>жирный</b> для главного (это Telegram HTML, не используй markdown-звёздочки).`;
}

async function run(userId: string, prompt: string): Promise<string | null> {
  try {
    const r = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(userId, "finance-coach", "sonnet", (r as any).usage);
    return r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim() || null;
  } catch {
    return null;
  }
}

// Ежемесячный отчёт за указанный месяц (для cron). null — если за месяц нет операций.
export async function monthlyFinanceDigest(userId: string, lang: Lang, month: string): Promise<string | null> {
  const cur = await getFinanceData(userId, month);
  if (cur.income === 0 && cur.expense === 0) return null;
  const prev = await getFinanceData(userId, shiftMonth(month, -1));

  const cats = cur.byCategory.slice(0, 6).map((c) => `${c.category} ${Math.round(c.amount)}`).join(", ") || "—";
  const cur1 = cur.currency;
  const savingsRate = cur.income > 0 ? Math.round(((cur.income - cur.expense) / cur.income) * 100) : null;

  const data = `Период: ${month}. Валюта: ${cur1}.
Доход: ${Math.round(cur.income)} ${cur1}. Расход: ${Math.round(cur.expense)} ${cur1}. Баланс: ${Math.round(cur.balance)} ${cur1}.${savingsRate != null ? ` Норма сбережений: ${savingsRate}%.` : ""}
Крупнейшие расходы по статьям: ${cats}.
Предыдущий месяц для сравнения: доход ${Math.round(prev.income)} ${cur1}, расход ${Math.round(prev.expense)} ${cur1}, баланс ${Math.round(prev.balance)} ${cur1}.`;

  const prompt = `${persona(lang)}

Сформируй короткий ежемесячный финансовый отчёт по данным ниже. Структура:
1) Тёплое приветствие в одну строку и общий итог месяца (доход/расход/баланс).
2) Сравнение с прошлым месяцем: стало лучше или хуже и почему (1–2 строки).
3) Куда уходили деньги — назови 2–3 крупнейшие статьи и мягко отметь, где можно сэкономить.
4) Норма сбережений: назови её и объясни простыми словами, что это и какая считается здоровой (ориентир 10–20%).
5) Один конкретный практичный совет на следующий месяц.
6) Один короткий «урок финграмотности» (понятие + как применить в жизни), связанный с этими цифрами.
8–14 строк. Без воды и канцелярита.

ДАННЫЕ:
${data}`;

  const text = await run(userId, prompt);
  if (!text) return null;
  return `${HDR[lang].month(monthName(month, lang))}\n\n${text}`;
}

// Разбор по запросу (команда /money): вся картина — годы, месяцы, советы, урок.
export async function financeReview(userId: string, lang: Lang): Promise<string> {
  const summary = await getFinanceSummary(userId);
  if (!summary) return HDR[lang].none;

  const prompt = `${persona(lang)}

Сделай полезный разбор финансов пользователя по сводке ниже. Структура:
1) Общая картина: доходы, расходы и баланс за всё время и по годам — что видно (рост/спад, тенденции).
2) Куда стабильно уходят деньги — главные статьи расходов; где есть потенциал сэкономить.
3) Норма сбережений (сбережения = доход − расход, в % от дохода): оцени и объясни простыми словами, какой ориентир здоровый.
4) 2 конкретных практичных совета под именно эти данные.
5) Один короткий «урок финансовой грамотности» (понятие + как применить).
Пиши тепло и поддерживающе, 10–16 строк, с подзаголовками и эмодзи. Без воды.

СВОДКА ФИНАНСОВ:
${summary}`;

  const text = await run(userId, prompt);
  return `${HDR[lang].review}\n\n${text || HDR[lang].none}`;
}
