import Anthropic from "@anthropic-ai/sdk";
import { logClaude } from "./usage";
import { supabaseAdmin } from "./supabaseAdmin";

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Разрешённые категории (slug совпадают со схемой БД).
export const CATEGORY_SLUGS = [
  "health", "sport", "food", "family", "relationship", "business",
  "finance", "ideas", "insight", "task", "gratitude", "travel",
  "emotions", "problem", "decision", "event",
];

// Типы добрых дел (НЕ включают долги/обязательства — это не добро).
export const DEED_KINDS = ["help", "support", "care", "gift", "knowledge", "volunteer", "family", "community", "other"];

// Сферы мечты для «Карты желаний».
export const DREAM_SPHERES = ["home", "transport", "body", "travel", "family", "business", "money", "growth", "other"];

// Финансы: категории расходов и доходов (ключи совпадают с FinanceTracker) + валюты.
export const EXPENSE_CAT_KEYS = ["food", "cafe", "transport", "housing", "bills", "shopping", "health", "fun", "education", "travel", "gifts", "other"];
export const INCOME_CAT_KEYS = ["salary", "freelance", "business", "gift", "investment", "other"];
export const FINANCE_CATS = [...new Set([...EXPENSE_CAT_KEYS, ...INCOME_CAT_KEYS])];
export const FINANCE_CURRENCIES = ["USD", "EUR", "UAH", "RUB", "GBP", "PLN", "KZT", "GEL", "TRY", "AED", "ISK", "CZK", "SEK", "NOK", "DKK", "CHF", "CAD", "JPY", "CNY", "ILS", "HUF", "RON", "BGN", "MDL"];

export type Analysis = {
  summary: string;
  focus?: string | null;
  mood?: number | null;
  energy?: number | null;
  health?: number | null;
  importance?: number | null;
  sleep_hours?: number | null;
  weight?: number | null;
  categories: string[];
  tags: string[];
  people: string[];
  places: string[];
  projects: string[];
  tasks: string[];
  insights: string[];
  gratitude: string[];
  good_deeds: { text: string; kind?: string; person?: string }[];
  promises: { text: string; person?: string }[];
  dreams: { text: string; sphere?: string; emoji?: string }[];
  finance?: { kind: "income" | "expense"; amount: number; currency?: string; category?: string; note?: string }[];
};

const TOOL: Anthropic.Tool = {
  name: "save_analysis",
  description: "Сохранить структурированный разбор дневниковой записи.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "1–2 тёплых живых предложения ОТ ПЕРВОГО ЛИЦА (от «я»), как будто автор пишет это сам в свой дневник. Без канцелярита, НЕ упоминай «человек»/«автор» в третьем лице." },
      focus: { type: "string", description: "Главный фокус дня, если ясен." },
      mood: { type: "integer", description: "Настроение 1–10." },
      energy: { type: "integer", description: "Энергия 1–10." },
      health: { type: "integer", description: "Здоровье 1–10." },
      importance: { type: "integer", description: "Важность записи 1–5." },
      sleep_hours: { type: "number", description: "Часы сна, если названы." },
      weight: { type: "number", description: "Вес в кг, если назван." },
      categories: { type: "array", items: { type: "string", enum: CATEGORY_SLUGS } },
      tags: { type: "array", items: { type: "string" }, description: "3–7 коротких тегов без #." },
      people: { type: "array", items: { type: "string" } },
      places: { type: "array", items: { type: "string" }, description: "Только реальные места, где человек был/живёт/побывал. НЕ места-мечты (желаемые направления идут в dreams)." },
      projects: { type: "array", items: { type: "string" } },
      tasks: { type: "array", items: { type: "string" } },
      insights: { type: "array", items: { type: "string" } },
      gratitude: { type: "array", items: { type: "string" } },
      good_deeds: {
        type: "array",
        description: "ТОЛЬКО настоящие добрые дела для других (помощь, поддержка, забота, подарок, знания, волонтёрство). ВАЖНО: возврат долга, оплата, выполнение рабочего обязательства — это НЕ добро, сюда НЕ включай.",
        items: {
          type: "object",
          properties: {
            text: { type: "string", description: "Что доброго сделал, коротко от первого лица." },
            kind: { type: "string", enum: DEED_KINDS, description: "Тип: help/support/care/gift/knowledge/volunteer/family/community/other." },
            person: { type: "string", description: "Кому помог, если назван." },
          },
          required: ["text"],
        },
      },
      promises: {
        type: "array",
        description: "Явные обещания людям, которые человек дал и собирается выполнить (позвонить, помочь, отправить, вернуть). Только явные обещания.",
        items: {
          type: "object",
          properties: {
            text: { type: "string", description: "Что обещано, коротко." },
            person: { type: "string", description: "Кому обещано, если назван." },
          },
          required: ["text"],
        },
      },
      dreams: {
        type: "array",
        description: "Мечты и желания на будущее («мечтаю…», «хочу когда-нибудь…», «когда-нибудь хочу…»). НЕ задачи на сегодня и НЕ рабочие цели. Для каждой укажи sphere и один подходящий emoji.",
        items: {
          type: "object",
          properties: {
            text: { type: "string", description: "Мечта коротко." },
            sphere: { type: "string", enum: DREAM_SPHERES, description: "home/transport/body/travel/family/business/money/growth/other." },
            emoji: { type: "string", description: "Один подходящий эмодзи." },
          },
          required: ["text"],
        },
      },
      finance: {
        type: "array",
        description: "Реальные денежные операции, которые пользователь ТОЛЬКО ЧТО совершил и называет как факт: траты («потратил/купил/заплатил 500…») и доходы («получил/заработал/зарплата 50000…»), с конкретной суммой. НЕ добавляй операцию, если сумма звучит в рассказе/размышлении, а не как совершённая сейчас трата/доход. НЕ создавай операцию для: итогов за период («за 7 лет вложили 200 тысяч», «всего потратил…»), планов и намерений («хочу купить», «надо заплатить», «собираюсь вложить»), гипотетических/оценочных сумм, стоимости бизнеса или имущества, долгов, крупных инвестиций, о которых говорят как об истории. Сомневаешься, реальная ли это операция прямо сейчас — НЕ добавляй. Не выдумывай суммы.",
        items: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["income", "expense"], description: "expense — трата, income — доход." },
            amount: { type: "number", description: "Сумма, положительное число." },
            currency: { type: "string", enum: FINANCE_CURRENCIES, description: "Код валюты, если ясен из текста или символа (₴/грн → UAH, $ → USD, € → EUR, ₽/руб → RUB, злотый → PLN, крон/исландские кроны → ISK, шведские кроны → SEK, датские кроны → DKK, норвежские кроны → NOK, чешские кроны → CZK, франк → CHF, иена → JPY, юань → CNY, шекель → ILS, форинт → HUF, лей → RON/MDL, лев → BGN). Если валюта не ясна — НЕ указывай (тогда возьмётся базовая валюта пользователя, не доллар)." },
            category: { type: "string", enum: FINANCE_CATS, description: "Категория. Расходы: food (продукты), cafe (кафе/рестораны), transport, housing (жильё/аренда), bills (счета/связь), shopping (покупки), health (здоровье/аптека), fun (развлечения), education, travel, gifts, other. Доходы: salary, freelance (подработка), business, gift, investment, other." },
            note: { type: "string", description: "Короткое пояснение — на что/откуда, если есть." },
          },
          required: ["kind", "amount"],
        },
      },
    },
    required: ["summary", "categories", "tags", "people", "places", "projects", "tasks", "insights", "gratitude"],
  },
};

function prompt(text: string, projectNames?: string[]): string {
  const projectsHint = projectNames?.length
    ? `\n\nУже существующие проекты пользователя: ${projectNames.map((n) => `«${n}»`).join(", ")}.
ВАЖНО про projects: если запись относится к одному из этих проектов — верни его ТОЧНОЕ название из списка (тот же регистр и написание), НЕ придумывай новый вариант («LIFE OS», «Life OS», «LifeOS», «суперапп» — это один проект, не создавай синонимы). Новый проект добавляй только если это действительно другой, новый проект.`
    : "";
  return `Ты — аналитик личного дневника LIFE OS. Тебе дают одну дневниковую запись на русском (расшифровка голоса или текст). Разбери её и вызови инструмент save_analysis.${projectsHint}

Правила:
- Пиши на ТОМ ЖЕ языке, что и сама запись (русский / украинский / английский / французский). Не выдумывай того, чего нет в тексте.
- summary: 1–2 тёплых живых предложения ОТ ПЕРВОГО ЛИЦА (от «я»), как будто это пишешь ты сам в свой дневник. НЕ пиши «человек», «автор» или в третьем лице. По-человечески, без канцелярита.
- mood/energy/health: 1–10, если упомянуто или ясно из тона; иначе не указывай.
- categories: только из разрешённого списка (slug).
- tags: 3–7 коротких тегов своими словами, без символа #.
- people/projects: имена людей и проекты, явно упомянутые.
- places: ТОЛЬКО реальные места, где человек был / живёт / находился / побывал / ездил (физическое присутствие). НЕ включай желаемые направления и мечты («хочу/мечтаю съездить в…», «когда-нибудь в…») — они идут в dreams со sphere=travel, а НЕ в places.
- tasks: конкретные дела, которые человек собирается сделать.
- insights: мысли-осознания. gratitude: за что благодарен.
- good_deeds: ТОЛЬКО настоящая помощь/забота/поддержка/подарок/знания другим. Для каждого укажи kind и person (если ясно). ВАЖНО: возврат долга, оплата, выполнение обязательства или рабочей задачи — это НЕ доброе дело, НЕ включай их в good_deeds. Не морализируй и не выдумывай.
- promises: явные обещания людям (позвонить, помочь, отправить, вернуть). Указывай person, если назван. НЕ ДУБЛИРУЙ: если поступок уже совершён (это доброе дело) — не добавляй его ещё и в promises.
- dreams: мечты/желания на будущее («мечтаю…», «хочу когда-нибудь…», «когда-нибудь…»). Для каждой укажи sphere (из списка) и emoji. НЕ путай с задачами на сегодня и рабочими целями.
- finance: ТОЛЬКО реальная трата/доход, совершённые сейчас/сегодня и названные как факт: «потратил 500 на продукты», «кофе за 80», «заплатил за аренду 12000» → expense; «получил зарплату 50000», «заработал 3000» → income. Укажи amount, category, currency (если ясна). ВАЖНО: не превращай в операцию суммы из рассказа — итоги за годы («вложили 200 тысяч за 7 лет»), планы («хочу вложить»), стоимость бизнеса, долги, крупные инвестиции-воспоминания. Нет реальной операции прямо сейчас или сомневаешься — НЕ добавляй.
- sleep_hours/weight: только если названы числом.

Запись:
"""
${text}
"""`;
}

// Быстрый маршрутизатор: это вопрос к ассистенту или запись в дневник?
export async function classifyIntent(text: string, userId?: string): Promise<"question" | "note"> {
  try {
    const msg = await client().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 5,
      messages: [{ role: "user", content: `Сообщение пользователя в его личном дневнике. Определи намерение и ответь СТРОГО одним словом.

"question" — пользователь СПРАШИВАЕТ ассистента, просит найти / вспомнить / проанализировать что-то из дневника, либо задаёт вопрос. Примеры: «какие у меня цели?», «что я писал про здоровье», «когда я последний раз бегал», «сколько раз я болел», «расскажи историю проекта», «тебе можно задавать вопросы?».

"note" — пользователь ЗАПИСЫВАЕТ мысль, событие, состояние, идею или факт о своём дне. Примеры: «сегодня тренировался, устал», «классная идея для проекта», «поговорил с мамой», «спал 5 часов, болит голова».

Если сомневаешься — отвечай note.

Сообщение:
"""${text}"""

Одним словом (question или note):` }],
    });
    logClaude(userId, "intent", "haiku", (msg as any).usage);
    const out = msg.content.filter((b) => b.type === "text").map((b: any) => b.text).join("").toLowerCase();
    return out.includes("question") ? "question" : "note";
  } catch {
    return "note"; // при ошибке безопаснее сохранить
  }
}

export async function analyze(text: string, userId?: string): Promise<Analysis> {
  // Подтягиваем существующие проекты пользователя, чтобы модель переиспользовала их
  // и не плодила дубли-синонимы (авто-дедуп на уровне разбора).
  let projectNames: string[] = [];
  let customCats: { slug: string; label: string }[] = [];
  if (userId) {
    try {
      const { data } = await supabaseAdmin().from("projects").select("name").eq("user_id", userId).limit(80);
      projectNames = ((data as any[]) ?? []).map((r) => r.name).filter(Boolean);
    } catch {
      // нет таблицы/колонки — просто без подсказки
    }
    try {
      const { data } = await supabaseAdmin().from("finance_categories").select("slug, label").eq("user_id", userId).eq("kind", "expense").limit(50);
      customCats = ((data as any[]) ?? []).filter((c) => c?.slug && c?.label);
    } catch {
      // нет таблицы — без пользовательских категорий
    }
  }
  // Кастомные категории пользователя подмешиваем в enum + описание, чтобы модель
  // раскладывала траты в них (напр. «штраф» → пользовательская «Штрафы»).
  let tool: any = TOOL;
  if (customCats.length) {
    tool = JSON.parse(JSON.stringify(TOOL));
    const catProp = tool.input_schema.properties.finance.items.properties.category;
    catProp.enum = [...FINANCE_CATS, ...customCats.map((c) => c.slug)];
    catProp.description += " Пользовательские категории расходов (используй их slug, если трата по смыслу к ним относится): " + customCats.map((c) => `${c.slug} (${c.label})`).join(", ") + ".";
  }
  const msg = await client().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    tools: [tool],
    tool_choice: { type: "tool", name: "save_analysis" },
    messages: [{ role: "user", content: prompt(text, projectNames) }],
  });
  logClaude(userId, "analyze", "sonnet", (msg as any).usage);
  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("AI не вернул разбор");
  return block.input as Analysis;
}

// === База знаний: разбор сохранённого контента (Instagram-пост/reels) ===
export type SavedAnalysis = {
  title: string;       // короткий понятный заголовок
  topic: string;       // папка из фиксированного списка KNOWLEDGE_FOLDERS
  summary: string;     // 2–4 предложения: что полезного внутри
  key_points: string[];// практические тезисы/шаги
  tags: string[];      // 3–8 тегов без #
};

// Фиксированный набор «папок» Базы знаний на языке интерфейса. Параллельные
// массивы (один порядок), чтобы переводить папку по индексу между языками.
export const KNOWLEDGE_FOLDERS_BY_LOCALE: Record<string, string[]> = {
  ru: ["Здоровье", "Спорт и тело", "Питание и рецепты", "Психология и саморазвитие", "Деньги и финансы", "Бизнес и маркетинг", "Технологии и AI", "Путешествия", "Дом и быт", "Отношения и семья", "Образование", "Другое"],
  en: ["Health", "Fitness & Body", "Food & Recipes", "Psychology & Growth", "Money & Finance", "Business & Marketing", "Tech & AI", "Travel", "Home & Living", "Relationships & Family", "Education", "Other"],
  uk: ["Здоров'я", "Спорт і тіло", "Їжа та рецепти", "Психологія та саморозвиток", "Гроші та фінанси", "Бізнес і маркетинг", "Технології та AI", "Подорожі", "Дім і побут", "Стосунки та сім'я", "Освіта", "Інше"],
  fr: ["Santé", "Sport & Corps", "Cuisine & Recettes", "Psychologie & Développement", "Argent & Finance", "Business & Marketing", "Tech & IA", "Voyages", "Maison & Quotidien", "Relations & Famille", "Éducation", "Autre"],
};

export function knowledgeFolders(locale?: string): string[] {
  return KNOWLEDGE_FOLDERS_BY_LOCALE[locale || "ru"] || KNOWLEDGE_FOLDERS_BY_LOCALE.ru;
}

// Определить индекс канонической папки по ключевым словам (мультиязычно). -1 — не определено.
function folderIndex(raw?: string | null): number {
  const t = (raw || "").toLowerCase();
  const has = (...ws: string[]) => ws.some((w) => t.includes(w));
  if (!t.trim()) return -1;
  if (has("спорт", "sport", "фитнес", "фітнес", "fitness", "трениров", "трену", "workout", "упражн", "вправ", "gym", "мышц", "м'яз", "muscle", "растяж", "yoga", "йог", "бег", "run", "пресс", "тіло", "body")) return 1;
  if (has("здоров", "здоров'я", "health", "santé", "голодан", "медиц", "médic", "витамин", "vitamin", "иммун", "імун", "болезн", "діет", "диет", "diet", "детокс", "detox", "sleep")) return 0;
  if (has("рецеп", "recipe", "recette", "питан", "харчув", "еда", "їж", "food", "блюд", "cook", "готов", "выпеч", "десерт", "dessert", "breakfast", "завтрак", "напит", "drink", "кулинар")) return 2;
  if (has("деньг", "грош", "финанс", "фінанс", "financ", "argent", "invest", "інвест", "инвест", "money", "бюджет", "budget", "накопл", "крипт", "crypto", "доход", "income", "налог", "tax")) return 4;
  if (has("бизнес", "бізнес", "business", "маркетинг", "marketing", "продаж", "sales", "стартап", "startup", "реклам", "бренд", "brand", "smm", "карьер", "карʼєр", "career")) return 5;
  if (has("технолог", "технолог", "tech", "гаджет", "gadget", "нейросет", "neural", "ии", "програм", "program", "code", "приложен", "застосун", "app", "софт", "software")) return 6;
  if (has("путешеств", "подорож", "travel", "voyage", "поездк", "trip", "тур", "tour", "страна", "country", "отдых", "виза", "visa")) return 7;
  if (has("психолог", "psycho", "саморазв", "саморозв", "growth", "мотивац", "motiv", "привыч", "звичк", "habit", "продуктивн", "productiv", "mindset", "осознан", "mindful", "эмоц", "емоц", "emot")) return 3;
  if (has("дом", "дім", "home", "быт", "побут", "living", "уборк", "приберан", "clean", "интерьер", "interior", "ремонт", "repair", "растен", "росл", "plant", "органайз", "organi")) return 8;
  if (has("отношен", "стосунк", "relationship", "семь", "сім", "family", "famille", "дет", "child", "родител", "батьк", "parent", "любов", "love", "пара", "couple")) return 9;
  if (has("образован", "освіт", "educat", "éducat", "учеб", "навчанн", "study", "язык", "мов", "language", "курс", "course", "обучен", "наук", "science")) return 10;
  return -1;
}

// Привести тему к канонической папке на нужном языке (нормализация старых записей
// и страховка для ответа AI). Осмысленную тему вне списка оставляем как есть.
export function canonicalFolder(raw: string | null | undefined, locale?: string): string {
  const folders = knowledgeFolders(locale);
  const idx = folderIndex(raw);
  if (idx >= 0) return folders[idx];
  return (raw || "").trim() || folders[folders.length - 1];
}

const LANG_NAME: Record<string, string> = { ru: "русском", en: "English", uk: "українській", fr: "français" };

function savedTool(locale: string): Anthropic.Tool {
  return {
    name: "save_knowledge",
    description: "Сохранить структурированный разбор сохранённого контента в личную базу знаний.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Короткий понятный заголовок (до ~70 символов), о чём этот пост/видео." },
        topic: { type: "string", enum: knowledgeFolders(locale), description: "Папка для группировки — выбери ОДНУ наиболее подходящую из списка." },
        summary: { type: "string", description: "2–4 предложения: что полезного внутри, чтобы потом легко вспомнить и применить." },
        key_points: { type: "array", items: { type: "string" }, description: "Практические тезисы, советы или шаги из контента (списком, по делу). До 8 пунктов." },
        tags: { type: "array", items: { type: "string" }, description: "3–8 коротких тегов без символа #." },
      },
      required: ["title", "topic", "summary", "key_points", "tags"],
    },
  };
}

// Разбирает подпись поста + расшифровку видео в карточку базы знаний.
// locale — язык интерфейса: карточка пишется на нём (с переводом, если пост на другом языке).
export async function analyzeSaved(text: string, userId?: string, locale = "ru"): Promise<SavedAnalysis> {
  const lang = LANG_NAME[locale] || LANG_NAME.ru;
  const msg = await client().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    tools: [savedTool(locale)],
    tool_choice: { type: "tool", name: "save_knowledge" },
    messages: [{ role: "user", content: `Ты помогаешь вести личную БАЗУ ЗНАНИЙ. Пользователь сохраняет полезный контент (посты и reels из Instagram), чтобы потом находить по нему ответы. Тебе дают подпись поста и/или расшифровку звука из видео. Разбери это и вызови инструмент save_knowledge.

Правила:
- ВЕСЬ результат (title, summary, key_points, tags, topic) пиши на ${lang} языке, ДАЖЕ ЕСЛИ пост на другом языке — переводи смысл на ${lang}. Это важно: база знаний должна быть на одном языке.
- topic — ПАПКА для группировки: выбери ОДНУ из фиксированного списка (он уже на нужном языке), чтобы похожие посты попадали в одну папку.
- Это НЕ личный дневник — это справочный/обучающий материал. Не от первого лица, пиши по сути.
- summary и key_points должны быть ПОЛЕЗНЫ для применения позже: конкретика, шаги, советы, цифры. Не пересказывай «автор показывает…», а извлекай суть.
- Не выдумывай того, чего нет в тексте. Если дан только заголовок (нет описания/субтитров) — НЕ додумывай детали из общих знаний: сделай короткую честную карточку (summary — о чём ролик в общих словах), а key_points оставь пустым или из 1–2 пунктов строго по заголовку. Не пиши «список не приведён» — просто не выдумывай.

Контент:
"""
${text}
"""` }],
  });
  logClaude(userId, "saved", "sonnet", (msg as any).usage);
  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("AI не вернул разбор");
  const out = block.input as SavedAnalysis;
  out.topic = canonicalFolder(out.topic, locale); // страховка: каноническая папка на языке интерфейса
  return out;
}

// Переписать запись в тёплое резюме ОТ ПЕРВОГО ЛИЦА (для обновления старых записей).
export async function summarize(text: string, userId?: string): Promise<string> {
  const m = await client().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    messages: [{ role: "user", content: `Перепиши эту дневниковую запись в 1–2 тёплых живых предложения ОТ ПЕРВОГО ЛИЦА (от «я»), как будто это пишу я сам в свой дневник. НЕ пиши «человек»/«автор» и не используй третье лицо. Без канцелярита, на языке записи. Верни ТОЛЬКО само резюме, без кавычек и префиксов.

Запись:
"""${text}"""` }],
  });
  logClaude(userId, "summarize", "sonnet", (m as any).usage);
  return m.content.filter((b) => b.type === "text").map((b: any) => b.text).join("").trim();
}
