"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guessCatKey } from "@/lib/moneyok";

type Tx = { id: string; day: string; kind: "income" | "expense"; amount: number; currency: string; category: string | null; subcategory: string | null; note: string | null };
type CatSlice = { category: string; amount: number; pct: number; limit: number | null; budgetPct: number | null; over: boolean; subs: { name: string; amount: number }[] };
type DaySlice = { day: string; count: number; income: number; expense: number; net: number };
type Data = {
  month: string; currency: string; rates: Record<string, number>; currenciesUsed: string[]; needsRates: boolean;
  income: number; expense: number; balance: number; byCategory: CatSlice[]; byDay: DaySlice[];
  budgetTotal: { limit: number; spent: number; pct: number; over: boolean } | null;
  txs: Tx[]; monthsWithData: string[]; hasAny: boolean;
};

const STR: Record<string, any> = {
  ru: { balance: "Баланс за месяц", income: "Доходы", expense: "Расходы", add: "Добавить", addIncome: "Доход", addExpense: "Расход", amount: "Сумма", category: "Категория", date: "Дата", note: "Заметка (необязательно)", save: "Сохранить", cancel: "Отмена", byCategory: "Расходы по категориям", operations: "Операции", empty: "За этот месяц операций нет. Нажми «Добавить», чтобы записать доход или расход.", emptyAll: "Здесь будут твои доходы и расходы. Добавь первую операцию — и появится понятная картина денег.", delConfirm: "Удалить эту операцию?", noCat: "Без категории", today: "Сегодня", yesterday: "Вчера", currency: "Валюта", pickPeriod: "Выбрать месяц и год", earliest: "К самым ранним", thisMonth: "Текущий месяц", calendar: "Календарь месяца", weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], ops: "операц.", dayBalance: "Сальдо дня", allDays: "Показать все дни", selectedDayLabel: "Операции за день", subcategoryPh: "Подкатегория (напр. Спорт) — необязательно", subSuggest: ["Спорт", "Обучение", "Одежда", "Здоровье", "Еда", "Развлечения", "Подарки", "Транспорт"], exportCsv: "Экспорт в CSV", trendTitle: "Динамика по месяцам", trendShow: "Показать график", trendLoading: "Загружаю…", trendEmpty: "Пока недостаточно данных для графика.", adviceTitle: "AI-советник по финансам", adviceGet: "Получить разбор и советы", adviceThinking: "Анализирую твои финансы…", adviceAgain: "Обновить", adviceErr: "Не получилось собрать разбор. Попробуй чуть позже.",
    budgets: "Бюджеты по категориям", limit: "Лимит", setLimit: "Задать лимит", editLimit: "Изменить лимит", removeLimit: "Убрать лимит", ofLimit: "из", over: "превышен на", leftWord: "осталось", addBudget: "Добавить лимит", budgetTotalT: "Бюджет на месяц", spent: "потрачено",
    settings: "Настройки и валюты", baseCurrency: "Основная валюта", ratesT: "Курсы к основной валюте", rateLine: (c: string, b: string) => `1 ${c} =`, needsRatesWarn: "Итоги примерные: укажи курсы валют в настройках, чтобы считать всё в одной валюте.", ratesHint: "Эти курсы — запасные: применяются, только если курс НБУ на месяц операции недоступен.", histNote: "Суммы в разных валютах сводятся к основной по официальному курсу НБУ на месяц каждой операции — операции 2020 и 2023 годов считаются по своим курсам, а не по сегодняшнему.",
    importTitle: "Перенос из MoneyOK", importBtn: "Выбрать файл MoneyOK.csv", importing: "Переносим операции…", importHint: "В MoneyOK: Меню → «Экспорт в CSV» → пришли себе файл и загрузи его здесь. Перенесутся все доходы и расходы. Повторная загрузка того же файла не создаёт дублей.", importDone: (n: number, dup: number, skip: number) => `Перенесено операций: ${n}${dup ? `, дублей пропущено: ${dup}` : ""}${skip ? `, переводов/остатков пропущено: ${skip}` : ""}.`, importEmpty: "Не удалось распознать операции в файле. Это точно экспорт MoneyOK в CSV?", importErr: "Не получилось загрузить файл. Попробуй ещё раз.", importUntagged: " Внимание: пометить операции не удалось (старая база), откат в один клик будет недоступен — обнови схему supabase/finance.sql.", undoBtn: "Откатить импорт MoneyOK", undoConfirm: "Удалить все операции, перенесённые из MoneyOK? Добавленные вручную останутся.", undoDone: (n: number) => `Откат выполнен: удалено операций — ${n}.`, undoNone: "Импортированных операций не найдено — удалять нечего.", undoErr: "Не удалось откатить. Попробуй ещё раз." },
  en: { balance: "Monthly balance", income: "Income", expense: "Expenses", add: "Add", addIncome: "Income", addExpense: "Expense", amount: "Amount", category: "Category", date: "Date", note: "Note (optional)", save: "Save", cancel: "Cancel", byCategory: "Spending by category", operations: "Transactions", empty: "No transactions this month. Tap “Add” to log income or an expense.", emptyAll: "Your income and expenses will live here. Add your first transaction to see a clear money picture.", delConfirm: "Delete this transaction?", noCat: "No category", today: "Today", yesterday: "Yesterday", currency: "Currency", pickPeriod: "Pick month and year", earliest: "To earliest", thisMonth: "Current month", calendar: "Month calendar", weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], ops: "ops", dayBalance: "Day balance", allDays: "Show all days", selectedDayLabel: "Transactions for the day", subcategoryPh: "Subcategory (e.g. Sport) — optional", subSuggest: ["Sport", "Education", "Clothing", "Health", "Food", "Fun", "Gifts", "Transport"], exportCsv: "Export to CSV", trendTitle: "Monthly trend", trendShow: "Show chart", trendLoading: "Loading…", trendEmpty: "Not enough data for a chart yet.", adviceTitle: "AI money advisor", adviceGet: "Get review & tips", adviceThinking: "Analysing your finances…", adviceAgain: "Refresh", adviceErr: "Couldn't build the review. Try again later.",
    budgets: "Category budgets", limit: "Limit", setLimit: "Set a limit", editLimit: "Edit limit", removeLimit: "Remove limit", ofLimit: "of", over: "over by", leftWord: "left", addBudget: "Add a limit", budgetTotalT: "Monthly budget", spent: "spent",
    settings: "Settings & currencies", baseCurrency: "Base currency", ratesT: "Rates to base currency", rateLine: (c: string, b: string) => `1 ${c} =`, needsRatesWarn: "Totals are approximate: set currency rates in settings to count everything in one currency.", ratesHint: "These rates are a fallback — used only when the NBU rate for an operation's month is unavailable.", histNote: "Amounts in different currencies are converted to the base one using the official NBU rate for each operation's month — 2020 and 2023 operations are counted at their own rates, not today's.",
    importTitle: "Migrate from MoneyOK", importBtn: "Choose MoneyOK.csv file", importing: "Importing transactions…", importHint: "In MoneyOK: Menu → “Export to CSV” → send the file to yourself and upload it here. All income and expenses will be migrated. Re-uploading the same file won't create duplicates.", importDone: (n: number, dup: number, skip: number) => `Imported ${n} transactions${dup ? `, ${dup} duplicates skipped` : ""}${skip ? `, ${skip} transfers/balances skipped` : ""}.`, importEmpty: "Couldn't recognise any transactions. Is this a MoneyOK CSV export?", importErr: "Upload failed. Please try again.", importUntagged: " Note: couldn't tag the transactions (old database), one-click undo won't be available — update the schema supabase/finance.sql.", undoBtn: "Undo MoneyOK import", undoConfirm: "Delete all transactions migrated from MoneyOK? Manually added ones stay.", undoDone: (n: number) => `Undone: ${n} transactions removed.`, undoNone: "No imported transactions found — nothing to remove.", undoErr: "Undo failed. Please try again." },
  uk: { balance: "Баланс за місяць", income: "Доходи", expense: "Витрати", add: "Додати", addIncome: "Дохід", addExpense: "Витрата", amount: "Сума", category: "Категорія", date: "Дата", note: "Нотатка (необов'язково)", save: "Зберегти", cancel: "Скасувати", byCategory: "Витрати за категоріями", operations: "Операції", empty: "За цей місяць операцій немає. Натисни «Додати», щоб записати дохід або витрату.", emptyAll: "Тут будуть твої доходи й витрати. Додай першу операцію — і з'явиться зрозуміла картина грошей.", delConfirm: "Видалити цю операцію?", noCat: "Без категорії", today: "Сьогодні", yesterday: "Вчора", currency: "Валюта", pickPeriod: "Обрати місяць і рік", earliest: "До найраніших", thisMonth: "Поточний місяць", calendar: "Календар місяця", weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"], ops: "операц.", dayBalance: "Сальдо дня", allDays: "Показати всі дні", selectedDayLabel: "Операції за день", subcategoryPh: "Підкатегорія (напр. Спорт) — необов'язково", subSuggest: ["Спорт", "Навчання", "Одяг", "Здоров'я", "Їжа", "Розваги", "Подарунки", "Транспорт"], exportCsv: "Експорт у CSV", trendTitle: "Динаміка по місяцях", trendShow: "Показати графік", trendLoading: "Завантажую…", trendEmpty: "Поки недостатньо даних для графіка.", adviceTitle: "AI-радник з фінансів", adviceGet: "Отримати розбір і поради", adviceThinking: "Аналізую твої фінанси…", adviceAgain: "Оновити", adviceErr: "Не вдалося зібрати розбір. Спробуй пізніше.",
    budgets: "Бюджети за категоріями", limit: "Ліміт", setLimit: "Задати ліміт", editLimit: "Змінити ліміт", removeLimit: "Прибрати ліміт", ofLimit: "з", over: "перевищено на", leftWord: "залишилось", addBudget: "Додати ліміт", budgetTotalT: "Бюджет на місяць", spent: "витрачено",
    settings: "Налаштування та валюти", baseCurrency: "Основна валюта", ratesT: "Курси до основної валюти", rateLine: (c: string, b: string) => `1 ${c} =`, needsRatesWarn: "Підсумки приблизні: вкажи курси валют у налаштуваннях, щоб рахувати все в одній валюті.", ratesHint: "Ці курси — запасні: застосовуються, лише якщо курс НБУ на місяць операції недоступний.", histNote: "Суми в різних валютах зводяться до основної за офіційним курсом НБУ на місяць кожної операції — операції 2020 і 2023 років рахуються за своїми курсами, а не за сьогоднішнім.",
    importTitle: "Перенесення з MoneyOK", importBtn: "Обрати файл MoneyOK.csv", importing: "Переносимо операції…", importHint: "У MoneyOK: Меню → «Експорт у CSV» → надішли собі файл і завантаж його тут. Перенесуться всі доходи й витрати. Повторне завантаження того ж файлу не створює дублів.", importDone: (n: number, dup: number, skip: number) => `Перенесено операцій: ${n}${dup ? `, дублів пропущено: ${dup}` : ""}${skip ? `, переказів/залишків пропущено: ${skip}` : ""}.`, importEmpty: "Не вдалося розпізнати операції у файлі. Це точно експорт MoneyOK у CSV?", importErr: "Не вдалося завантажити файл. Спробуй ще раз.", importUntagged: " Увага: позначити операції не вдалося (стара база), відкат в один клік буде недоступний — онови схему supabase/finance.sql.", undoBtn: "Відкотити імпорт MoneyOK", undoConfirm: "Видалити всі операції, перенесені з MoneyOK? Додані вручну залишаться.", undoDone: (n: number) => `Відкат виконано: видалено операцій — ${n}.`, undoNone: "Імпортованих операцій не знайдено — видаляти нічого.", undoErr: "Не вдалося відкотити. Спробуй ще раз." },
  fr: { balance: "Solde du mois", income: "Revenus", expense: "Dépenses", add: "Ajouter", addIncome: "Revenu", addExpense: "Dépense", amount: "Montant", category: "Catégorie", date: "Date", note: "Note (facultatif)", save: "Enregistrer", cancel: "Annuler", byCategory: "Dépenses par catégorie", operations: "Opérations", empty: "Aucune opération ce mois-ci. Touchez « Ajouter » pour noter un revenu ou une dépense.", emptyAll: "Tes revenus et dépenses apparaîtront ici. Ajoute ta première opération pour une vision claire de ton argent.", delConfirm: "Supprimer cette opération ?", noCat: "Sans catégorie", today: "Aujourd'hui", yesterday: "Hier", currency: "Devise", pickPeriod: "Choisir mois et année", earliest: "Au plus tôt", thisMonth: "Mois courant", calendar: "Calendrier du mois", weekdays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], ops: "op.", dayBalance: "Solde du jour", allDays: "Voir tous les jours", selectedDayLabel: "Opérations du jour", subcategoryPh: "Sous-catégorie (ex. Sport) — facultatif", subSuggest: ["Sport", "Éducation", "Vêtements", "Santé", "Nourriture", "Loisirs", "Cadeaux", "Transport"], exportCsv: "Export CSV", trendTitle: "Évolution mensuelle", trendShow: "Voir le graphique", trendLoading: "Chargement…", trendEmpty: "Pas encore assez de données pour un graphique.", adviceTitle: "Conseiller financier IA", adviceGet: "Obtenir l'analyse et des conseils", adviceThinking: "J'analyse tes finances…", adviceAgain: "Actualiser", adviceErr: "Impossible de générer l'analyse. Réessaie plus tard.",
    budgets: "Budgets par catégorie", limit: "Limite", setLimit: "Définir une limite", editLimit: "Modifier la limite", removeLimit: "Retirer la limite", ofLimit: "sur", over: "dépassé de", leftWord: "restant", addBudget: "Ajouter une limite", budgetTotalT: "Budget du mois", spent: "dépensé",
    settings: "Réglages & devises", baseCurrency: "Devise principale", ratesT: "Taux vers la devise principale", rateLine: (c: string, b: string) => `1 ${c} =`, needsRatesWarn: "Totaux approximatifs : indique les taux de change dans les réglages pour tout compter dans une seule devise.", ratesHint: "Ces taux sont un secours — utilisés uniquement si le taux NBU du mois de l'opération est indisponible.", histNote: "Les montants en différentes devises sont convertis dans la devise principale au taux officiel NBU du mois de chaque opération — les opérations de 2020 et 2023 sont comptées à leurs propres taux, pas celui d'aujourd'hui.",
    importTitle: "Migrer depuis MoneyOK", importBtn: "Choisir le fichier MoneyOK.csv", importing: "Import des opérations…", importHint: "Dans MoneyOK : Menu → « Export CSV » → envoie-toi le fichier et charge-le ici. Tous les revenus et dépenses seront migrés. Recharger le même fichier ne crée pas de doublons.", importDone: (n: number, dup: number, skip: number) => `${n} opérations importées${dup ? `, ${dup} doublons ignorés` : ""}${skip ? `, ${skip} transferts/soldes ignorés` : ""}.`, importEmpty: "Aucune opération reconnue. S'agit-il bien d'un export CSV de MoneyOK ?", importErr: "Échec du chargement. Réessaie.", importUntagged: " Note : impossible de marquer les opérations (ancienne base), l'annulation en un clic sera indisponible — mets à jour le schéma supabase/finance.sql.", undoBtn: "Annuler l'import MoneyOK", undoConfirm: "Supprimer toutes les opérations importées de MoneyOK ? Celles ajoutées à la main restent.", undoDone: (n: number) => `Annulé : ${n} opérations supprimées.`, undoNone: "Aucune opération importée trouvée — rien à supprimer.", undoErr: "Échec de l'annulation. Réessaie." },
};

// Категории расходов и доходов: ключ, эмодзи, цвет, названия на 4 языках.
const EXPENSE_CATS = [
  { key: "food", icon: "🛒", color: "#22c55e", l: { ru: "Продукты", en: "Groceries", uk: "Продукти", fr: "Courses" } },
  { key: "cafe", icon: "☕", color: "#f97316", l: { ru: "Кафе", en: "Eating out", uk: "Кафе", fr: "Restos" } },
  { key: "transport", icon: "🚗", color: "#3b82f6", l: { ru: "Транспорт", en: "Transport", uk: "Транспорт", fr: "Transport" } },
  { key: "housing", icon: "🏠", color: "#8b5cf6", l: { ru: "Жильё", en: "Housing", uk: "Житло", fr: "Logement" } },
  { key: "bills", icon: "🧾", color: "#0ea5e9", l: { ru: "Счета и связь", en: "Bills", uk: "Рахунки", fr: "Factures" } },
  { key: "shopping", icon: "🛍️", color: "#ec4899", l: { ru: "Покупки", en: "Shopping", uk: "Покупки", fr: "Achats" } },
  { key: "health", icon: "💊", color: "#ef4444", l: { ru: "Здоровье", en: "Health", uk: "Здоров'я", fr: "Santé" } },
  { key: "fun", icon: "🎬", color: "#a855f7", l: { ru: "Развлечения", en: "Fun", uk: "Розваги", fr: "Loisirs" } },
  { key: "education", icon: "📚", color: "#14b8a6", l: { ru: "Образование", en: "Education", uk: "Освіта", fr: "Éducation" } },
  { key: "travel", icon: "✈️", color: "#06b6d4", l: { ru: "Путешествия", en: "Travel", uk: "Подорожі", fr: "Voyages" } },
  { key: "gifts", icon: "🎁", color: "#f43f5e", l: { ru: "Подарки", en: "Gifts", uk: "Подарунки", fr: "Cadeaux" } },
  { key: "other", icon: "💸", color: "#64748b", l: { ru: "Другое", en: "Other", uk: "Інше", fr: "Autre" } },
];
const INCOME_CATS = [
  { key: "salary", icon: "💼", color: "#16a34a", l: { ru: "Зарплата", en: "Salary", uk: "Зарплата", fr: "Salaire" } },
  { key: "freelance", icon: "💻", color: "#0ea5e9", l: { ru: "Подработка", en: "Freelance", uk: "Підробіток", fr: "Freelance" } },
  { key: "business", icon: "📈", color: "#8b5cf6", l: { ru: "Бизнес", en: "Business", uk: "Бізнес", fr: "Business" } },
  { key: "gift", icon: "🎁", color: "#f43f5e", l: { ru: "Подарок", en: "Gift", uk: "Подарунок", fr: "Cadeau" } },
  { key: "investment", icon: "💰", color: "#eab308", l: { ru: "Инвестиции", en: "Investments", uk: "Інвестиції", fr: "Investissements" } },
  { key: "other", icon: "➕", color: "#64748b", l: { ru: "Другое", en: "Other", uk: "Інше", fr: "Autre" } },
];

const CUR = [
  { code: "USD", sym: "$" }, { code: "EUR", sym: "€" }, { code: "UAH", sym: "₴" }, { code: "RUB", sym: "₽" },
  { code: "GBP", sym: "£" }, { code: "PLN", sym: "zł" }, { code: "KZT", sym: "₸" }, { code: "GEL", sym: "₾" },
  { code: "TRY", sym: "₺" }, { code: "AED", sym: "AED" },
];
const symOf = (c: string) => CUR.find((x) => x.code === c)?.sym || c;

const todayISO = () => new Date().toISOString().slice(0, 10);

function intlOf(l: string) { return l === "en" ? "en-GB" : l === "fr" ? "fr-FR" : l === "uk" ? "uk-UA" : "ru-RU"; }

// «1 250 ₴» — без копеек, если число целое.
function fmtMoney(amount: number, currency: string, locale: string) {
  const frac = Number.isInteger(amount) ? 0 : 2;
  let n: string;
  try { n = new Intl.NumberFormat(intlOf(locale), { minimumFractionDigits: frac, maximumFractionDigits: 2 }).format(amount); }
  catch { n = String(amount); }
  return `${n} ${symOf(currency)}`;
}

// Компактная сумма для ячеек календаря: «1.2k₴», «340₴».
function compactMoney(n: number, currency: string) {
  const a = Math.abs(n);
  const s = a >= 100000 ? Math.round(a / 1000) + "k" : a >= 1000 ? (a / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(Math.round(a));
  return s + symOf(currency);
}

// Сетка месяца: дни недели Пн..Вс, ведущие пустые ячейки, затем числа месяца.
function monthCells(month: string): (string | null)[] {
  const [y, mo] = month.split("-").map(Number);
  if (!y || !mo) return [];
  const firstDow = (new Date(Date.UTC(y, mo - 1, 1)).getUTCDay() + 6) % 7; // Пн=0
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  return cells;
}

// Палитра для произвольных (импортированных) категорий — стабильный цвет по имени.
const HASH_COLORS = ["#22c55e", "#f97316", "#3b82f6", "#8b5cf6", "#0ea5e9", "#ec4899", "#ef4444", "#a855f7", "#14b8a6", "#06b6d4", "#f43f5e", "#eab308", "#10b981", "#6366f1"];
function hashColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return HASH_COLORS[h % HASH_COLORS.length];
}

// Отображение категории: пресет по ключу, иначе исходное название (импорт из MoneyOK)
// с угаданной иконкой и стабильным цветом. Возвращает { icon, color, label }.
function catView(kind: "income" | "expense", key: string | null, locale: string): { icon: string; color: string; label: string } {
  const list = kind === "income" ? INCOME_CATS : EXPENSE_CATS;
  const preset = key ? list.find((c) => c.key === key) : null;
  if (preset) return { icon: preset.icon, color: preset.color, label: (preset.l as any)[locale] || preset.l.ru };
  if (!key) { const o = list[list.length - 1]; return { icon: o.icon, color: o.color, label: (o.l as any)[locale] || o.l.ru }; }
  // Произвольное название: иконка по ключевым словам, цвет — по имени.
  const guess = guessCatKey(key, kind);
  const hint = guess ? list.find((c) => c.key === guess) : null;
  return { icon: hint?.icon || (kind === "income" ? "💰" : "🏷️"), color: hint?.color || hashColor(key), label: key };
}

function monthLabel(m: string, locale: string) {
  try { return new Date(m + "-01T00:00:00").toLocaleDateString(intlOf(locale), { month: "long", year: "numeric" }); }
  catch { return m; }
}

function shift(m: string, d: number) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1 + d, 1)).toISOString().slice(0, 7);
}

// Цвет полосы бюджета по проценту использования.
function budgetColor(pct: number) {
  if (pct > 100) return "#ef4444";
  if (pct >= 80) return "#f59e0b";
  return "#10b981";
}

export default function FinanceTracker({ data, locale }: { data: Data; locale: string }) {
  const s = STR[locale] || STR.ru;
  const router = useRouter();
  const { month, income, expense, balance, byCategory, txs, budgetTotal } = data;
  const base = data.currency;

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(base);
  const [category, setCategory] = useState("food");
  const [subcategory, setSubcategory] = useState("");
  const [day, setDay] = useState(todayISO());
  const [note, setNote] = useState("");

  // Редактирование существующей операции.
  const [editTx, setEditTx] = useState<string | null>(null);
  const [eAmount, setEAmount] = useState("");
  const [eCurrency, setECurrency] = useState(base);
  const [eKind, setEKind] = useState<"income" | "expense">("expense");
  const [eCategory, setECategory] = useState("");
  const [eSubcategory, setESubcategory] = useState("");
  const [eNote, setENote] = useState("");
  const [eDay, setEDay] = useState(todayISO());

  // Календарь-выбор месяца/года.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => Number(month.slice(0, 4)));
  // Календарь по дням: выбранный день месяца (фильтрует список операций).
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // График динамики по месяцам (грузится по требованию).
  type TrendPoint = { month: string; income: number; expense: number; net: number; currency: string };
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  async function loadTrend() {
    if (trend || trendLoading) return;
    setTrendLoading(true);
    try {
      const r = await fetch("/api/finance/trend?n=12");
      const j = await r.json();
      setTrend(j?.trend || []);
    } catch { setTrend([]); }
    setTrendLoading(false);
  }

  // AI-советник по финансам (грузится по требованию).
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  async function loadAdvice() {
    if (adviceLoading) return;
    setAdviceLoading(true);
    try {
      const r = await fetch(`/api/finance/advice?lang=${locale}`);
      const j = await r.json();
      setAdvice(j?.ok ? j.text : s.adviceErr);
    } catch { setAdvice(s.adviceErr); }
    setAdviceLoading(false);
  }

  // Бюджеты.
  const [editBudget, setEditBudget] = useState<string | null>(null);
  const [budgetVal, setBudgetVal] = useState("");
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const [newBudgetCat, setNewBudgetCat] = useState("food");
  const [newBudgetVal, setNewBudgetVal] = useState("");

  // Перенос из MoneyOK.
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Настройки валют.
  const [setOpenS, setSetOpenS] = useState(false);
  const [baseSel, setBaseSel] = useState(base);
  const [rateInputs, setRateInputs] = useState<Record<string, string>>(() => {
    const r: Record<string, string> = {};
    for (const c of data.currenciesUsed) if (c !== base) r[c] = data.rates[c] ? String(data.rates[c]) : "";
    return r;
  });

  const isCur = month === todayISO().slice(0, 7);
  const cats = kind === "income" ? INCOME_CATS : EXPENSE_CATS;

  function gotoMonth(d: number) { router.push(`/finance?m=${shift(month, d)}`); }
  function switchKind(k: "income" | "expense") { setKind(k); setCategory(k === "income" ? "salary" : "food"); }

  // Календарь: данные по месяцам, границы периода, переходы.
  const nowMonth = todayISO().slice(0, 7);
  const dataMonths = new Set(data.monthsWithData);
  const dataYears = [...new Set(data.monthsWithData.map((mm) => Number(mm.slice(0, 4))))];
  const minYear = dataYears.length ? Math.min(...dataYears) : Number(nowMonth.slice(0, 4));
  const maxYear = Number(nowMonth.slice(0, 4));
  const shortMonths = Array.from({ length: 12 }, (_, i) => {
    try { return new Date(Date.UTC(2021, i, 1)).toLocaleDateString(intlOf(locale), { month: "short" }); }
    catch { return String(i + 1); }
  });
  function openPicker() { setPickerYear(Number(month.slice(0, 4))); setPickerOpen((o) => !o); setSetOpenS(false); }
  function pickMonth(moIdx: number) {
    const mm = `${pickerYear}-${String(moIdx + 1).padStart(2, "0")}`;
    if (mm > nowMonth) return; // будущее недоступно
    setPickerOpen(false);
    router.push(`/finance?m=${mm}`);
  }
  function jumpEarliest() {
    const earliest = [...data.monthsWithData].sort()[0];
    if (earliest) { setPickerOpen(false); router.push(`/finance?m=${earliest}`); }
  }

  async function save() {
    const v = parseFloat(amount.replace(",", "."));
    if (!isFinite(v) || v <= 0) return;
    setBusy(true);
    const r = await fetch("/api/finance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ day, kind, amount: v, currency, category, subcategory: subcategory.trim() || null, note: note.trim() || null }) });
    setBusy(false);
    if (r.ok) { setOpen(false); setAmount(""); setNote(""); setSubcategory(""); router.refresh(); }
  }

  function startEdit(t: Tx) {
    setEditTx(t.id);
    setEAmount(String(t.amount));
    setECurrency(t.currency);
    setEKind(t.kind);
    setECategory(t.category || "");
    setESubcategory(t.subcategory || "");
    setENote(t.note || "");
    setEDay(t.day);
  }

  async function saveEdit() {
    if (!editTx) return;
    const v = parseFloat(eAmount.replace(",", "."));
    if (!isFinite(v) || v <= 0) return;
    setBusy(true);
    const r = await fetch("/api/finance", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: editTx, day: eDay, kind: eKind, amount: v, currency: eCurrency, category: eCategory.trim() || null, subcategory: eSubcategory.trim() || null, note: eNote.trim() || null }),
    });
    setBusy(false);
    if (r.ok) { setEditTx(null); router.refresh(); }
  }

  async function del(id: string) {
    if (busy || !window.confirm(s.delConfirm)) return;
    setBusy(true);
    const r = await fetch("/api/finance", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    setBusy(false);
    if (r.ok) router.refresh();
  }

  async function saveBudget(cat: string, raw: string) {
    const v = parseFloat(raw.replace(",", "."));
    if (!isFinite(v) || v <= 0) return;
    setBusy(true);
    const r = await fetch("/api/finance-budget", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ category: cat, amount: v }) });
    setBusy(false);
    if (r.ok) { setEditBudget(null); setAddBudgetOpen(false); setNewBudgetVal(""); router.refresh(); }
  }

  async function removeBudget(cat: string) {
    setBusy(true);
    const r = await fetch("/api/finance-budget", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ category: cat }) });
    setBusy(false);
    if (r.ok) { setEditBudget(null); router.refresh(); }
  }

  async function importMoneyOk(file: File) {
    setImporting(true);
    setImportMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/finance/import", { method: "POST", body: fd });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) {
        const warn = j.tagged === false ? s.importUntagged : "";
        setImportMsg({ ok: true, text: s.importDone(j.inserted || 0, j.duplicates || 0, j.skipped || 0) + warn });
        router.refresh();
      } else if (j?.error === "no_rows") {
        setImportMsg({ ok: false, text: s.importEmpty });
      } else {
        setImportMsg({ ok: false, text: s.importErr });
      }
    } catch {
      setImportMsg({ ok: false, text: s.importErr });
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function undoImport() {
    if (importing || !window.confirm(s.undoConfirm)) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const r = await fetch("/api/finance/import", { method: "DELETE" });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) {
        setImportMsg({ ok: true, text: j.removed ? s.undoDone(j.removed) : s.undoNone });
        router.refresh();
      } else {
        setImportMsg({ ok: false, text: s.undoErr });
      }
    } catch {
      setImportMsg({ ok: false, text: s.undoErr });
    }
    setImporting(false);
  }

  async function saveSettings() {
    const rates: Record<string, number> = {};
    for (const [c, v] of Object.entries(rateInputs)) { const n = parseFloat(String(v).replace(",", ".")); if (isFinite(n) && n > 0) rates[c] = n; }
    setBusy(true);
    const r = await fetch("/api/finance-settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ base_currency: baseSel, rates }) });
    setBusy(false);
    if (r.ok) { setSetOpenS(false); router.refresh(); }
  }

  const input: any = { fontSize: 14, padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" };
  const btnP: any = { fontSize: 13.5, padding: "9px 16px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: 500 };
  const btnG: any = { fontSize: 13.5, padding: "9px 14px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer" };

  // Календарь по дням месяца.
  const dayMap = new Map(data.byDay.map((d) => [d.day, d]));
  const cells = monthCells(month);
  // Выбранный день актуален только для текущего месяца (сбрасывается при смене месяца).
  const selDay = selectedDay && selectedDay.startsWith(month) && dayMap.has(selectedDay) ? selectedDay : null;

  // Группировка операций по дням (с учётом выбранного в календаре дня).
  const byDay = new Map<string, Tx[]>();
  for (const t of txs) { const list = byDay.get(t.day) ?? []; list.push(t); byDay.set(t.day, list); }
  const days = [...byDay.keys()].sort().reverse().filter((d) => !selDay || d === selDay);

  function dayLabel(d: string) {
    const t = todayISO();
    if (d === t) return s.today;
    if (d === shiftDay(t, -1)) return s.yesterday;
    try { return new Date(d + "T00:00:00").toLocaleDateString(intlOf(locale), { day: "numeric", month: "long" }); }
    catch { return d; }
  }

  // Категории, на которые ещё нет лимита — для «Добавить лимит».
  const budgetedCats = new Set(byCategory.filter((c) => c.limit != null).map((c) => c.category));
  const addableCats = EXPENSE_CATS.filter((c) => !budgetedCats.has(c.key));

  return (
    <div>
      {/* Шапка: переключатель месяца + настройки */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
        <button onClick={() => gotoMonth(-1)} aria-label="prev" style={{ ...btnG, padding: "6px 10px" }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 16, verticalAlign: "-3px" }} />
        </button>
        <button onClick={openPicker} title={s.pickPeriod} style={{ ...btnG, flex: 1, fontSize: 15, fontWeight: 600, textTransform: "capitalize", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--text)", background: pickerOpen ? "var(--surface-2)" : "var(--surface)" }}>
          {monthLabel(month, locale)}
          <i className="ti ti-calendar-event" style={{ fontSize: 14, color: "var(--accent)" }} />
        </button>
        <button onClick={() => { setSetOpenS((o) => !o); setBaseSel(base); setPickerOpen(false); }} aria-label="settings" title={s.settings} style={{ ...btnG, padding: "6px 10px" }}>
          <i className="ti ti-settings" style={{ fontSize: 16, verticalAlign: "-3px" }} />
        </button>
        <button onClick={() => gotoMonth(1)} disabled={isCur} aria-label="next" style={{ ...btnG, padding: "6px 10px", opacity: isCur ? 0.4 : 1, cursor: isCur ? "default" : "pointer" }}>
          <i className="ti ti-chevron-right" style={{ fontSize: 16, verticalAlign: "-3px" }} />
        </button>
      </div>

      {/* Календарь: быстрый выбор года и месяца */}
      {pickerOpen && (
        <div className="card" style={{ marginBottom: 14 }}>
          {/* Переключатель года */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
            <button onClick={() => setPickerYear((y) => Math.max(minYear, y - 1))} disabled={pickerYear <= minYear} aria-label="prev-year"
              style={{ ...btnG, padding: "6px 12px", opacity: pickerYear <= minYear ? 0.4 : 1 }}>
              <i className="ti ti-chevron-left" style={{ fontSize: 16, verticalAlign: "-3px" }} />
            </button>
            <div style={{ fontSize: 18, fontWeight: 700, flex: 1, textAlign: "center" }}>{pickerYear}</div>
            <button onClick={() => setPickerYear((y) => Math.min(maxYear, y + 1))} disabled={pickerYear >= maxYear} aria-label="next-year"
              style={{ ...btnG, padding: "6px 12px", opacity: pickerYear >= maxYear ? 0.4 : 1 }}>
              <i className="ti ti-chevron-right" style={{ fontSize: 16, verticalAlign: "-3px" }} />
            </button>
          </div>
          {/* Сетка месяцев */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {shortMonths.map((mn, i) => {
              const mm = `${pickerYear}-${String(i + 1).padStart(2, "0")}`;
              const isSel = mm === month;
              const hasData = dataMonths.has(mm);
              const future = mm > nowMonth;
              return (
                <button key={i} onClick={() => pickMonth(i)} disabled={future} style={{
                  position: "relative", fontSize: 13, padding: "10px 4px", borderRadius: 9, cursor: future ? "default" : "pointer",
                  textTransform: "capitalize", fontWeight: isSel ? 700 : hasData ? 600 : 400,
                  border: `1px solid ${isSel ? "var(--accent)" : "var(--border)"}`,
                  background: isSel ? "var(--accent)" : hasData ? "var(--surface-2)" : "var(--surface)",
                  color: isSel ? "#fff" : future ? "var(--text-3)" : hasData ? "var(--text)" : "var(--text-3)",
                  opacity: future ? 0.45 : 1,
                }}>
                  {mn.replace(".", "")}
                  {hasData && !isSel && <span style={{ position: "absolute", top: 5, right: 6, width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} />}
                </button>
              );
            })}
          </div>
          {/* Быстрые переходы */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {data.monthsWithData.length > 0 && (
              <button onClick={jumpEarliest} style={{ ...btnG, padding: "6px 12px", fontSize: 12.5 }}>
                <i className="ti ti-player-skip-back" style={{ fontSize: 14, verticalAlign: "-2px" }} /> {s.earliest}
              </button>
            )}
            <button onClick={() => { setPickerOpen(false); router.push(`/finance?m=${nowMonth}`); }} style={{ ...btnG, padding: "6px 12px", fontSize: 12.5 }}>
              <i className="ti ti-calendar-due" style={{ fontSize: 14, verticalAlign: "-2px" }} /> {s.thisMonth}
            </button>
          </div>
        </div>
      )}

      {/* Предупреждение про курсы */}
      {data.needsRates && !setOpenS && (
        <div className="card" style={{ marginBottom: 14, fontSize: 12.5, color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 16, flexShrink: 0 }} />
          <span>{s.needsRatesWarn}</span>
          <button onClick={() => { setSetOpenS(true); setBaseSel(base); }} style={{ ...btnG, padding: "4px 10px", fontSize: 12, marginLeft: "auto", flexShrink: 0 }}>{s.settings}</button>
        </div>
      )}

      {/* Настройки валют */}
      {setOpenS && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-settings" style={{ fontSize: 15, color: "var(--accent)" }} />{s.settings}
          </div>
          <label style={{ fontSize: 12.5, color: "var(--text-2)", display: "flex", flexDirection: "column", gap: 4, marginBottom: 12, maxWidth: 220 }}>
            {s.baseCurrency}
            <select value={baseSel} onChange={(e) => setBaseSel(e.target.value)} style={input}>
              {CUR.map((c) => <option key={c.code} value={c.code}>{c.code} {c.sym}</option>)}
            </select>
          </label>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 12, lineHeight: 1.5, display: "flex", gap: 6 }}>
            <i className="ti ti-history" style={{ fontSize: 14, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
            <span>{s.histNote}</span>
          </div>
          {data.currenciesUsed.filter((c) => c !== baseSel).length > 0 && (
            <>
              <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 6 }}>{s.ratesT}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 6 }}>
                {data.currenciesUsed.filter((c) => c !== baseSel).map((c) => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                    <span style={{ minWidth: 72 }}>1 {symOf(c)} =</span>
                    <input type="number" inputMode="decimal" step="0.0001" value={rateInputs[c] ?? ""} onChange={(e) => setRateInputs((r) => ({ ...r, [c]: e.target.value }))} style={{ ...input, width: 120 }} />
                    <span style={{ color: "var(--text-3)" }}>{symOf(baseSel)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 12 }}>{s.ratesHint}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button disabled={busy} onClick={saveSettings} style={btnP}>{s.save}</button>
            <button disabled={busy} onClick={() => setSetOpenS(false)} style={btnG}>{s.cancel}</button>
          </div>

          {/* Экспорт операций в CSV */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <a href="/api/finance/export" style={{ ...btnG, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
              <i className="ti ti-download" style={{ fontSize: 14 }} /> {s.exportCsv}
            </a>
          </div>

          {/* Перенос данных из MoneyOK */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-file-import" style={{ fontSize: 15, color: "var(--accent)" }} />{s.importTitle}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 10, lineHeight: 1.5 }}>{s.importHint}</div>
            <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importMoneyOk(f); }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button disabled={importing} onClick={() => fileRef.current?.click()} style={{ ...btnG, opacity: importing ? 0.6 : 1 }}>
                <i className="ti ti-upload" style={{ fontSize: 14, verticalAlign: "-2px" }} /> {importing ? s.importing : s.importBtn}
              </button>
              <button disabled={importing} onClick={undoImport} title={s.undoBtn} style={{ ...btnG, opacity: importing ? 0.6 : 1, color: "#ef4444" }}>
                <i className="ti ti-arrow-back-up" style={{ fontSize: 14, verticalAlign: "-2px" }} /> {s.undoBtn}
              </button>
            </div>
            {importMsg && (
              <div style={{ marginTop: 10, fontSize: 12.5, padding: "8px 11px", borderRadius: 9,
                color: importMsg.ok ? "#065f46" : "#92400e", background: importMsg.ok ? "#10b9811a" : "#fef3c7",
                border: `1px solid ${importMsg.ok ? "#6ee7b7" : "#fde68a"}` }}>
                {importMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Баланс + доходы/расходы */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}>
          <i className="ti ti-wallet" style={{ fontSize: 14, color: "var(--accent)" }} />{s.balance}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 3, lineHeight: 1.1, color: balance < 0 ? "#ef4444" : "var(--text)" }}>
          {balance > 0 ? "+" : ""}{fmtMoney(balance, base, locale)}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 120px", background: "#10b9811a", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
              <i className="ti ti-arrow-down-left" style={{ fontSize: 14 }} />{s.income}
            </div>
            <div style={{ fontSize: 19, fontWeight: 600, marginTop: 2 }}>{fmtMoney(income, base, locale)}</div>
          </div>
          <div style={{ flex: "1 1 120px", background: "#ef44441a", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
              <i className="ti ti-arrow-up-right" style={{ fontSize: 14 }} />{s.expense}
            </div>
            <div style={{ fontSize: 19, fontWeight: 600, marginTop: 2 }}>{fmtMoney(expense, base, locale)}</div>
          </div>
        </div>
        <button onClick={() => setOpen((o) => !o)} style={{ ...btnP, width: "100%", marginTop: 14 }}>
          <i className="ti ti-plus" style={{ fontSize: 15, verticalAlign: "-2px" }} /> {s.add}
        </button>

        {/* Форма добавления */}
        {open && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", padding: 4, borderRadius: 10, marginBottom: 12 }}>
              {(["expense", "income"] as const).map((k) => (
                <button key={k} onClick={() => switchKind(k)} style={{
                  flex: 1, fontSize: 13.5, padding: "8px", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 500,
                  background: kind === k ? (k === "income" ? "#10b981" : "#ef4444") : "transparent",
                  color: kind === k ? "#fff" : "var(--text-2)",
                }}>{k === "income" ? s.addIncome : s.addExpense}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <input autoFocus type="number" inputMode="decimal" step="0.01" placeholder={s.amount} value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...input, flex: "2 1 120px", fontSize: 18, fontWeight: 600 }} />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...input, flex: "1 1 80px" }}>
                {CUR.map((c) => <option key={c.code} value={c.code}>{c.code} {c.sym}</option>)}
              </select>
              <input type="date" value={day} max={todayISO()} onChange={(e) => setDay(e.target.value)} style={{ ...input, flex: "1 1 140px" }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>{s.category}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {cats.map((c) => (
                <button key={c.key} onClick={() => setCategory(c.key)} style={{
                  fontSize: 12.5, padding: "6px 11px", borderRadius: 20, cursor: "pointer",
                  border: `1px solid ${category === c.key ? c.color : "var(--border)"}`,
                  background: category === c.key ? `${c.color}1f` : "var(--surface)",
                  color: category === c.key ? "var(--text)" : "var(--text-2)",
                  display: "inline-flex", alignItems: "center", gap: 5, fontWeight: category === c.key ? 600 : 400,
                }}><span>{c.icon}</span>{(c.l as any)[locale] || c.l.ru}</button>
              ))}
            </div>
            <input type="text" placeholder={s.subcategoryPh} value={subcategory} onChange={(e) => setSubcategory(e.target.value)} maxLength={40} style={{ ...input, width: "100%", marginBottom: 6, boxSizing: "border-box" }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {(s.subSuggest as string[]).map((sg) => (
                <button key={sg} onClick={() => setSubcategory(sg)} style={{
                  fontSize: 11.5, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                  border: `1px solid ${subcategory === sg ? "var(--accent)" : "var(--border)"}`,
                  background: subcategory === sg ? "var(--accent)" : "var(--surface)",
                  color: subcategory === sg ? "#fff" : "var(--text-2)",
                }}>{sg}</button>
              ))}
            </div>
            <input type="text" placeholder={s.note} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} style={{ ...input, width: "100%", marginBottom: 12, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={busy} onClick={save} style={{ ...btnP, flex: 1 }}>{s.save}</button>
              <button disabled={busy} onClick={() => setOpen(false)} style={btnG}>{s.cancel}</button>
            </div>
          </div>
        )}
      </div>

      {/* AI-советник по финансам (по требованию) */}
      {data.hasAny && (
        <div className="card" style={{ marginBottom: 14, background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)" }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6, marginBottom: advice ? 10 : 0 }}>
            <i className="ti ti-sparkles" style={{ fontSize: 16, color: "var(--accent)" }} />{s.adviceTitle}
            {advice && !adviceLoading && (
              <button onClick={() => { setAdvice(null); loadAdvice(); }} style={{ ...btnG, padding: "3px 10px", fontSize: 11.5, marginLeft: "auto" }}>
                <i className="ti ti-refresh" style={{ fontSize: 13, verticalAlign: "-2px" }} /> {s.adviceAgain}
              </button>
            )}
          </div>
          {advice ? (
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text)", whiteSpace: "pre-wrap" }}>{advice}</div>
          ) : (
            <button onClick={loadAdvice} disabled={adviceLoading} style={{ ...btnP, width: "100%", marginTop: 10, opacity: adviceLoading ? 0.7 : 1 }}>
              <i className="ti ti-sparkles" style={{ fontSize: 15, verticalAlign: "-2px" }} /> {adviceLoading ? s.adviceThinking : s.adviceGet}
            </button>
          )}
        </div>
      )}

      {/* График динамики по месяцам (по требованию) */}
      {data.hasAny && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: trend ? 12 : 0, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-chart-bar" style={{ fontSize: 15, color: "var(--accent)" }} />{s.trendTitle}
            {!trend && (
              <button onClick={loadTrend} disabled={trendLoading} style={{ ...btnG, padding: "4px 12px", fontSize: 12, marginLeft: "auto" }}>
                {trendLoading ? s.trendLoading : s.trendShow}
              </button>
            )}
          </div>
          {trend && (trend.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{s.trendEmpty}</div>
          ) : (() => {
            const maxV = Math.max(1, ...trend.map((p) => Math.max(p.income, p.expense)));
            return (
              <div style={{ display: "flex", alignItems: "flex-end", gap: trend.length > 8 ? 4 : 8, height: 130, overflowX: "auto", paddingBottom: 4 }}>
                {trend.map((p) => (
                  <div key={p.month} style={{ flex: "1 0 auto", minWidth: 26, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 96 }}>
                      <div title={`${s.income}: ${fmtMoney(p.income, base, locale)}`} style={{ width: 8, height: `max(${(p.income / maxV) * 100}%, 2px)`, background: "#10b981", borderRadius: "3px 3px 0 0" }} />
                      <div title={`${s.expense}: ${fmtMoney(p.expense, base, locale)}`} style={{ width: 8, height: `max(${(p.expense / maxV) * 100}%, 2px)`, background: "#ef4444", borderRadius: "3px 3px 0 0" }} />
                    </div>
                    <span style={{ fontSize: 9.5, color: p.net < 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>{p.net >= 0 ? "+" : "−"}{compactMoney(p.net, base)}</span>
                    <span style={{ fontSize: 9, color: "var(--text-3)" }}>{p.month.slice(2).replace("-", "·")}</span>
                  </div>
                ))}
              </div>
            );
          })())}
          {trend && trend.length > 0 && (
            <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#10b981", borderRadius: 2 }} />{s.income}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#ef4444", borderRadius: 2 }} />{s.expense}</span>
            </div>
          )}
        </div>
      )}

      {/* Сводный бюджет на месяц */}
      {budgetTotal && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-target" style={{ fontSize: 15, color: "var(--accent)" }} />{s.budgetTotalT}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: budgetTotal.over ? "#ef4444" : "var(--text)" }}>
              {fmtMoney(budgetTotal.spent, base, locale)} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>{s.ofLimit} {fmtMoney(budgetTotal.limit, base, locale)}</span>
            </span>
          </div>
          <div style={{ height: 9, background: "var(--surface-2)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, budgetTotal.pct)}%`, height: "100%", background: budgetColor(budgetTotal.pct), borderRadius: 6, transition: "width .3s" }} />
          </div>
          <div style={{ fontSize: 12, color: budgetTotal.over ? "#ef4444" : "var(--text-3)", marginTop: 6 }}>
            {budgetTotal.over
              ? `${s.over} ${fmtMoney(budgetTotal.spent - budgetTotal.limit, base, locale)}`
              : `${s.leftWord} ${fmtMoney(budgetTotal.limit - budgetTotal.spent, base, locale)} · ${budgetTotal.pct}%`}
          </div>
        </div>
      )}

      {/* Расходы по категориям + бюджеты */}
      {byCategory.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-chart-donut" style={{ fontSize: 15, color: "var(--accent)" }} />{s.byCategory}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {byCategory.map((c) => {
              const m = catView("expense", c.category, locale);
              const hasBudget = c.limit != null;
              const barPct = hasBudget ? Math.min(100, c.budgetPct || 0) : Math.min(100, c.pct);
              const barColor = hasBudget ? budgetColor(c.budgetPct || 0) : m.color;
              return (
                <div key={c.category}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 4, gap: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <span>{m.icon}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.label}</span>
                      {!hasBudget && <span style={{ color: "var(--text-3)", fontSize: 12, flexShrink: 0 }}>{c.pct}%</span>}
                      {c.over && <span style={{ fontSize: 11, color: "#ef4444", background: "#ef44441a", padding: "1px 7px", borderRadius: 10 }}>{s.over} {fmtMoney(c.amount - (c.limit || 0), base, locale)}</span>}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <b>{fmtMoney(c.amount, base, locale)}</b>
                      {hasBudget && <span style={{ color: "var(--text-3)", fontSize: 12 }}>{s.ofLimit} {fmtMoney(c.limit!, base, locale)}</span>}
                      <button onClick={() => { setEditBudget(editBudget === c.category ? null : c.category); setBudgetVal(c.limit != null ? String(c.limit) : ""); setAddBudgetOpen(false); }} title={hasBudget ? s.editLimit : s.setLimit} style={{ background: "none", border: "none", cursor: "pointer", color: hasBudget ? "var(--accent)" : "var(--text-3)", padding: 2 }}>
                        <i className={`ti ${hasBudget ? "ti-edit" : "ti-target"}`} style={{ fontSize: 14 }} />
                      </button>
                    </span>
                  </div>
                  <div style={{ height: 7, background: "var(--surface-2)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: `max(${barPct}%, 4px)`, height: "100%", background: barColor, borderRadius: 5 }} />
                  </div>
                  {c.subs.length > 0 && (
                    <div style={{ marginTop: 6, marginLeft: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                      {c.subs.map((sub) => (
                        <div key={sub.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--text-2)", gap: 8 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                            <span style={{ color: m.color }}>›</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.name}</span>
                            <span style={{ color: "var(--text-3)", fontSize: 11, flexShrink: 0 }}>{c.amount > 0 ? Math.round((sub.amount / c.amount) * 100) : 0}%</span>
                          </span>
                          <span style={{ flexShrink: 0 }}>{fmtMoney(sub.amount, base, locale)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {editBudget === c.category && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{s.limit}, {symOf(base)}</span>
                      <input autoFocus type="number" inputMode="decimal" value={budgetVal} onChange={(e) => setBudgetVal(e.target.value)} style={{ ...input, width: 120, padding: "6px 9px" }} />
                      <button disabled={busy} onClick={() => saveBudget(c.category, budgetVal)} style={{ ...btnP, padding: "6px 12px" }}>{s.save}</button>
                      {hasBudget && <button disabled={busy} onClick={() => removeBudget(c.category)} style={{ ...btnG, padding: "6px 12px", color: "#ef4444" }}>{s.removeLimit}</button>}
                      <button disabled={busy} onClick={() => setEditBudget(null)} style={{ ...btnG, padding: "6px 12px" }}>{s.cancel}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Добавить лимит на категорию без трат */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            {addBudgetOpen ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <select value={newBudgetCat} onChange={(e) => setNewBudgetCat(e.target.value)} style={{ ...input, padding: "6px 9px" }}>
                  {addableCats.map((c) => <option key={c.key} value={c.key}>{c.icon} {(c.l as any)[locale] || c.l.ru}</option>)}
                </select>
                <input type="number" inputMode="decimal" placeholder={`${s.limit}, ${symOf(base)}`} value={newBudgetVal} onChange={(e) => setNewBudgetVal(e.target.value)} style={{ ...input, width: 140, padding: "6px 9px" }} />
                <button disabled={busy} onClick={() => saveBudget(newBudgetCat, newBudgetVal)} style={{ ...btnP, padding: "6px 12px" }}>{s.save}</button>
                <button disabled={busy} onClick={() => setAddBudgetOpen(false)} style={{ ...btnG, padding: "6px 12px" }}>{s.cancel}</button>
              </div>
            ) : (
              addableCats.length > 0 && (
                <button onClick={() => { setAddBudgetOpen(true); setNewBudgetCat(addableCats[0].key); setEditBudget(null); }} style={{ ...btnG, padding: "6px 12px", fontSize: 12.5 }}>
                  <i className="ti ti-plus" style={{ fontSize: 14, verticalAlign: "-2px" }} /> {s.addBudget}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Календарь месяца по дням: сальдо и число операций на каждом дне */}
      {data.byDay.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-calendar-month" style={{ fontSize: 15, color: "var(--accent)" }} />{s.calendar}
            {selDay && (
              <button onClick={() => setSelectedDay(null)} style={{ ...btnG, padding: "3px 10px", fontSize: 11.5, marginLeft: "auto" }}>
                <i className="ti ti-x" style={{ fontSize: 13, verticalAlign: "-2px" }} /> {s.allDays}
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 5 }}>
            {s.weekdays.map((w: string) => <div key={w} style={{ textAlign: "center", fontSize: 10.5, color: "var(--text-3)" }}>{w}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {cells.map((cell, i) => {
              if (!cell) return <div key={i} />;
              const slice = dayMap.get(cell);
              const has = !!slice;
              const isSel = selDay === cell;
              const isToday = cell === todayISO();
              const net = slice?.net ?? 0;
              return (
                <button key={i} onClick={() => has && setSelectedDay(isSel ? null : cell)} disabled={!has} title={isToday ? s.today : undefined}
                  style={{
                    minHeight: 50, padding: "3px 4px", borderRadius: 8, cursor: has ? "pointer" : "default",
                    border: `1px solid ${isSel || (isToday && !has) ? "var(--accent)" : "var(--border)"}`,
                    background: isSel ? "var(--accent)" : has ? "var(--surface-2)" : "var(--surface)",
                    display: "flex", flexDirection: "column", alignItems: "stretch", gap: 1, textAlign: "left", overflow: "hidden",
                    opacity: has ? 1 : 0.45,
                  }}>
                  <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 500, color: isSel ? "#fff" : isToday ? "var(--accent)" : "var(--text)" }}>{Number(cell.slice(8, 10))}</span>
                  {has && (
                    <>
                      <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: isSel ? "#fff" : net >= 0 ? "#10b981" : "#ef4444" }}>
                        {net > 0 ? "+" : net < 0 ? "−" : ""}{compactMoney(net, base)}
                      </span>
                      <span style={{ fontSize: 9, color: isSel ? "rgba(255,255,255,.85)" : "var(--text-3)" }}>{slice!.count} {s.ops}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Список операций */}
      {txs.length === 0 ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 14, textAlign: "center", padding: "26px 16px" }}>
          {data.hasAny ? s.empty : s.emptyAll}
        </div>
      ) : (
        <div className="card">
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-list" style={{ fontSize: 15, color: "var(--accent)" }} />{s.operations}
          </div>
          {days.map((d) => (
            <div key={d} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", textTransform: "capitalize", marginBottom: 6 }}>{dayLabel(d)}</div>
              {byDay.get(d)!.map((t) => {
                const m = catView(t.kind, t.category, locale);
                const pos = t.kind === "income";
                if (editTx === t.id) {
                  return (
                    <div key={t.id} style={{ padding: "10px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
                      <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", padding: 4, borderRadius: 10, marginBottom: 10 }}>
                        {(["expense", "income"] as const).map((k) => (
                          <button key={k} onClick={() => setEKind(k)} style={{
                            flex: 1, fontSize: 13, padding: "7px", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 500,
                            background: eKind === k ? (k === "income" ? "#10b981" : "#ef4444") : "transparent",
                            color: eKind === k ? "#fff" : "var(--text-2)",
                          }}>{k === "income" ? s.addIncome : s.addExpense}</button>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                        <input autoFocus type="number" inputMode="decimal" step="0.01" placeholder={s.amount} value={eAmount} onChange={(e) => setEAmount(e.target.value)} style={{ ...input, flex: "2 1 110px", fontSize: 16, fontWeight: 600 }} />
                        <select value={eCurrency} onChange={(e) => setECurrency(e.target.value)} style={{ ...input, flex: "1 1 80px" }}>
                          {CUR.map((c) => <option key={c.code} value={c.code}>{c.code} {c.sym}</option>)}
                        </select>
                        <input type="date" value={eDay} max={todayISO()} onChange={(e) => setEDay(e.target.value)} style={{ ...input, flex: "1 1 140px" }} />
                      </div>
                      <input type="text" placeholder={s.category} value={eCategory} onChange={(e) => setECategory(e.target.value)} maxLength={40} style={{ ...input, width: "100%", marginBottom: 8, boxSizing: "border-box" }} />
                      <input type="text" placeholder={s.subcategoryPh} value={eSubcategory} onChange={(e) => setESubcategory(e.target.value)} maxLength={40} style={{ ...input, width: "100%", marginBottom: 8, boxSizing: "border-box" }} />
                      <input type="text" placeholder={s.note} value={eNote} onChange={(e) => setENote(e.target.value)} maxLength={200} style={{ ...input, width: "100%", marginBottom: 10, boxSizing: "border-box" }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button disabled={busy} onClick={saveEdit} style={{ ...btnP, flex: 1 }}>{s.save}</button>
                        <button disabled={busy} onClick={() => setEditTx(null)} style={btnG}>{s.cancel}</button>
                        <button disabled={busy} onClick={() => { setEditTx(null); del(t.id); }} title={s.delConfirm} style={{ ...btnG, color: "#ef4444" }}>
                          <i className="ti ti-trash" style={{ fontSize: 15 }} />
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={t.id} className="fin-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0" }}>
                    <button onClick={() => startEdit(t)} style={{ width: 34, height: 34, borderRadius: 9, background: `${m.color}1f`, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{m.icon}</button>
                    <div onClick={() => startEdit(t)} style={{ minWidth: 0, flex: 1, cursor: "pointer" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.label}
                        {t.subcategory && <span style={{ fontSize: 11.5, fontWeight: 500, color: m.color, background: `${m.color}1f`, padding: "1px 7px", borderRadius: 10, marginLeft: 6 }}>{t.subcategory}</span>}
                      </div>
                      {t.note && <div style={{ fontSize: 12, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.note}</div>}
                    </div>
                    <div onClick={() => startEdit(t)} style={{ fontSize: 14.5, fontWeight: 600, color: pos ? "#10b981" : "var(--text)", whiteSpace: "nowrap", cursor: "pointer" }}>
                      {pos ? "+" : "−"}{fmtMoney(t.amount, t.currency, locale)}
                    </div>
                    <button onClick={() => startEdit(t)} aria-label="edit" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, flexShrink: 0 }}>
                      <i className="ti ti-pencil" style={{ fontSize: 15 }} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Сдвиг даты YYYY-MM-DD на ±N дней.
function shiftDay(d: string, delta: number) {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + delta);
  return dt.toISOString().slice(0, 10);
}
