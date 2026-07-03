"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guessCatKey } from "@/lib/moneyok";

type Tx = { id: string; day: string; kind: "income" | "expense"; amount: number; currency: string; category: string | null; subcategory: string | null; note: string | null };
type CatSlice = { category: string; amount: number; pct: number; limit: number | null; budgetPct: number | null; over: boolean; subs: { name: string; amount: number; limit: number | null; over: boolean; budgetPct: number | null }[] };
type DaySlice = { day: string; count: number; income: number; expense: number; net: number };
type Data = {
  month: string; currency: string; rates: Record<string, number>; currenciesUsed: string[]; needsRates: boolean;
  income: number; expense: number; balance: number; byCategory: CatSlice[]; byDay: DaySlice[];
  budgetTotal: { limit: number; spent: number; pct: number; over: boolean } | null;
  txs: Tx[]; monthsWithData: string[]; hasAny: boolean;
};

const STR: Record<string, any> = {
  ru: { balance: "Баланс за месяц", income: "Доходы", expense: "Расходы", add: "Добавить", addIncome: "Доход", addExpense: "Расход", amount: "Сумма", category: "Категория", date: "Дата", note: "Заметка (необязательно)", save: "Сохранить", cancel: "Отмена", byCategory: "Расходы по категориям", operations: "Операции", empty: "За этот месяц операций нет. Нажми «Добавить», чтобы записать доход или расход.", emptyAll: "Здесь будут твои доходы и расходы. Добавь первую операцию — и появится понятная картина денег.", delConfirm: "Удалить эту операцию?", noCat: "Без категории", today: "Сегодня", yesterday: "Вчера", currency: "Валюта", pickPeriod: "Выбрать месяц и год", earliest: "К самым ранним", thisMonth: "Текущий месяц", calendar: "Календарь месяца", weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], ops: "операц.", dayBalance: "Сальдо дня", allDays: "Показать все дни", selectedDayLabel: "Операции за день", opsMore: (n: number) => `Показать ещё ${n}`, opsCollapse: "Свернуть", subcategoryPh: "Подкатегория (напр. Спорт) — необязательно", subSuggest: ["Спорт", "Обучение", "Одежда", "Здоровье", "Еда", "Развлечения", "Подарки", "Транспорт"], exportCsv: "Экспорт в CSV", trendTitle: "Динамика по месяцам", trendShow: "Показать график", trendLoading: "Загружаю…", trendEmpty: "Пока недостаточно данных для графика.", adviceTitle: "AI-советник по финансам", adviceGet: "Получить разбор и советы", adviceThinking: "Анализирую твои финансы…", adviceAgain: "Обновить", adviceErr: "Не получилось собрать разбор. Попробуй чуть позже.", recurTitle: "Регулярные платежи", recurHint: "Аренда, подписки, кредиты. Бот напомнит в день платежа — записывать ли, решаешь ты.", recurAdd: "Добавить платёж", recurEmpty: "Пока нет регулярных платежей.", recurDay: "Число месяца", recurEvery: (d: number) => `${d}-го числа каждого месяца`, recurDelConfirm: "Удалить этот регулярный платёж?", monoTitle: "Банк Monobank", monoHint: "Подключи карту — новые покупки и поступления будут автоматически попадать в «Деньги».", monoTokenPh: "Вставь токен Monobank", monoGetToken: "Получить токен на api.monobank.ua", monoConnect: "Подключить", monoConnected: (n: string | null) => `✅ Подключено${n ? `: ${n}` : ""}. Новые операции появятся автоматически.`, monoDisconnect: "Отключить", monoDisconnectConfirm: "Отключить Monobank? Уже добавленные операции останутся.", monoErr: "Не получилось подключить. Проверь токен и попробуй ещё раз.", monoBadToken: "Токен неверный. Скопируй его заново с api.monobank.ua.", monoRate: "Monobank просит подождать минуту — попробуй чуть позже.", monoWebhookWarn: "Токен сохранён, но вебхук пока не встал. Операции подтянутся позже — попробуй переподключить через минуту.", monoImportBtn: "Импорт за 30 дней", monoImported: (n: number) => `Импортировано операций: ${n}.`, monoImportPartial: "Если счетов несколько — подожди минуту и нажми «Импорт» ещё раз, чтобы догрузить остальные.", monoFixed: (n: number) => `Исправлено валют: ${n}.`, goalsTitle: "Цели по накоплениям", goalsHint: "Копи на цель — следи за прогрессом. Пополняй вручную или после поступлений.", goalAdd: "Новая цель", goalsEmpty: "Пока нет целей. Добавь первую — например «Отпуск, 2000 €».", goalTitlePh: "Название (напр. Новая машина)", goalTargetPh: "Цель, сумма", goalLeft: (rest: string) => `осталось ${rest}`, goalDone: "Цель достигнута! 🎉", goalContribute: "Пополнить", goalContributePrompt: (cur: string) => `На сколько пополнить (${cur})? Можно отрицательное, чтобы убрать:`, goalDelConfirm: "Удалить эту цель?",
    budgets: "Бюджеты по категориям", limit: "Лимит", setLimit: "Задать лимит", editLimit: "Изменить лимит", removeLimit: "Убрать лимит", ofLimit: "из", over: "превышен на", leftWord: "осталось", addBudget: "Добавить лимит", budgetTotalT: "Бюджет на месяц", spent: "потрачено",
    settings: "Настройки и валюты", baseCurrency: "Основная валюта", ratesT: "Курсы к основной валюте", rateLine: (c: string, b: string) => `1 ${c} =`, needsRatesWarn: "Итоги примерные: укажи курсы валют в настройках, чтобы считать всё в одной валюте.", ratesHint: "Эти курсы — запасные: применяются, только если курс НБУ на месяц операции недоступен.", histNote: "Суммы в разных валютах сводятся к основной по официальному курсу НБУ на месяц каждой операции — операции 2020 и 2023 годов считаются по своим курсам, а не по сегодняшнему.",
    importTitle: "Перенос из MoneyOK", importBtn: "Выбрать файл MoneyOK.csv", importing: "Переносим операции…", importHint: "В MoneyOK: Меню → «Экспорт в CSV» → пришли себе файл и загрузи его здесь. Перенесутся все доходы и расходы. Повторная загрузка того же файла не создаёт дублей.", importDone: (n: number, dup: number, skip: number) => `Перенесено операций: ${n}${dup ? `, дублей пропущено: ${dup}` : ""}${skip ? `, переводов/остатков пропущено: ${skip}` : ""}.`, importEmpty: "Не удалось распознать операции в файле. Это точно экспорт MoneyOK в CSV?", importErr: "Не получилось загрузить файл. Попробуй ещё раз.", importUntagged: " Внимание: пометить операции не удалось (старая база), откат в один клик будет недоступен — обнови схему supabase/finance.sql.", undoBtn: "Откатить импорт MoneyOK", undoConfirm: "Удалить все операции, перенесённые из MoneyOK? Добавленные вручную останутся.", undoDone: (n: number) => `Откат выполнен: удалено операций — ${n}.`, undoNone: "Импортированных операций не найдено — удалять нечего.", undoErr: "Не удалось откатить. Попробуй ещё раз." },
  en: { balance: "Monthly balance", income: "Income", expense: "Expenses", add: "Add", addIncome: "Income", addExpense: "Expense", amount: "Amount", category: "Category", date: "Date", note: "Note (optional)", save: "Save", cancel: "Cancel", byCategory: "Spending by category", operations: "Transactions", empty: "No transactions this month. Tap “Add” to log income or an expense.", emptyAll: "Your income and expenses will live here. Add your first transaction to see a clear money picture.", delConfirm: "Delete this transaction?", noCat: "No category", today: "Today", yesterday: "Yesterday", currency: "Currency", pickPeriod: "Pick month and year", earliest: "To earliest", thisMonth: "Current month", calendar: "Month calendar", weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], ops: "ops", dayBalance: "Day balance", allDays: "Show all days", selectedDayLabel: "Transactions for the day", opsMore: (n: number) => `Show ${n} more`, opsCollapse: "Collapse", subcategoryPh: "Subcategory (e.g. Sport) — optional", subSuggest: ["Sport", "Education", "Clothing", "Health", "Food", "Fun", "Gifts", "Transport"], exportCsv: "Export to CSV", trendTitle: "Monthly trend", trendShow: "Show chart", trendLoading: "Loading…", trendEmpty: "Not enough data for a chart yet.", adviceTitle: "AI money advisor", adviceGet: "Get review & tips", adviceThinking: "Analysing your finances…", adviceAgain: "Refresh", adviceErr: "Couldn't build the review. Try again later.", recurTitle: "Recurring payments", recurHint: "Rent, subscriptions, loans. The bot reminds you on the due day — you decide whether to log it.", recurAdd: "Add payment", recurEmpty: "No recurring payments yet.", recurDay: "Day of month", recurEvery: (d: number) => `every month on the ${d}${d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"}`, recurDelConfirm: "Delete this recurring payment?", monoTitle: "Monobank", monoHint: "Connect your card — new purchases and income flow into Money automatically.", monoTokenPh: "Paste your Monobank token", monoGetToken: "Get a token at api.monobank.ua", monoConnect: "Connect", monoConnected: (n: string | null) => `✅ Connected${n ? `: ${n}` : ""}. New transactions will appear automatically.`, monoDisconnect: "Disconnect", monoDisconnectConfirm: "Disconnect Monobank? Already-added transactions stay.", monoErr: "Couldn't connect. Check the token and try again.", monoBadToken: "Invalid token. Copy it again from api.monobank.ua.", monoRate: "Monobank asks to wait a minute — try again shortly.", monoWebhookWarn: "Token saved, but the webhook didn't register yet. Transactions will sync later — try reconnecting in a minute.", monoImportBtn: "Import last 30 days", monoImported: (n: number) => `Imported ${n} transactions.`, monoImportPartial: "If you have several accounts — wait a minute and tap Import again to load the rest.", monoFixed: (n: number) => `Fixed currency on ${n}.`, goalsTitle: "Savings goals", goalsHint: "Save toward a goal and track progress. Top up manually or after income.", goalAdd: "New goal", goalsEmpty: "No goals yet. Add one — e.g. “Vacation, 2000 €”.", goalTitlePh: "Title (e.g. New car)", goalTargetPh: "Target amount", goalLeft: (rest: string) => `${rest} to go`, goalDone: "Goal reached! 🎉", goalContribute: "Top up", goalContributePrompt: (cur: string) => `How much to add (${cur})? Negative to remove:`, goalDelConfirm: "Delete this goal?",
    budgets: "Category budgets", limit: "Limit", setLimit: "Set a limit", editLimit: "Edit limit", removeLimit: "Remove limit", ofLimit: "of", over: "over by", leftWord: "left", addBudget: "Add a limit", budgetTotalT: "Monthly budget", spent: "spent",
    settings: "Settings & currencies", baseCurrency: "Base currency", ratesT: "Rates to base currency", rateLine: (c: string, b: string) => `1 ${c} =`, needsRatesWarn: "Totals are approximate: set currency rates in settings to count everything in one currency.", ratesHint: "These rates are a fallback — used only when the NBU rate for an operation's month is unavailable.", histNote: "Amounts in different currencies are converted to the base one using the official NBU rate for each operation's month — 2020 and 2023 operations are counted at their own rates, not today's.",
    importTitle: "Migrate from MoneyOK", importBtn: "Choose MoneyOK.csv file", importing: "Importing transactions…", importHint: "In MoneyOK: Menu → “Export to CSV” → send the file to yourself and upload it here. All income and expenses will be migrated. Re-uploading the same file won't create duplicates.", importDone: (n: number, dup: number, skip: number) => `Imported ${n} transactions${dup ? `, ${dup} duplicates skipped` : ""}${skip ? `, ${skip} transfers/balances skipped` : ""}.`, importEmpty: "Couldn't recognise any transactions. Is this a MoneyOK CSV export?", importErr: "Upload failed. Please try again.", importUntagged: " Note: couldn't tag the transactions (old database), one-click undo won't be available — update the schema supabase/finance.sql.", undoBtn: "Undo MoneyOK import", undoConfirm: "Delete all transactions migrated from MoneyOK? Manually added ones stay.", undoDone: (n: number) => `Undone: ${n} transactions removed.`, undoNone: "No imported transactions found — nothing to remove.", undoErr: "Undo failed. Please try again." },
  uk: { balance: "Баланс за місяць", income: "Доходи", expense: "Витрати", add: "Додати", addIncome: "Дохід", addExpense: "Витрата", amount: "Сума", category: "Категорія", date: "Дата", note: "Нотатка (необов'язково)", save: "Зберегти", cancel: "Скасувати", byCategory: "Витрати за категоріями", operations: "Операції", empty: "За цей місяць операцій немає. Натисни «Додати», щоб записати дохід або витрату.", emptyAll: "Тут будуть твої доходи й витрати. Додай першу операцію — і з'явиться зрозуміла картина грошей.", delConfirm: "Видалити цю операцію?", noCat: "Без категорії", today: "Сьогодні", yesterday: "Вчора", currency: "Валюта", pickPeriod: "Обрати місяць і рік", earliest: "До найраніших", thisMonth: "Поточний місяць", calendar: "Календар місяця", weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"], ops: "операц.", dayBalance: "Сальдо дня", allDays: "Показати всі дні", selectedDayLabel: "Операції за день", opsMore: (n: number) => `Показати ще ${n}`, opsCollapse: "Згорнути", subcategoryPh: "Підкатегорія (напр. Спорт) — необов'язково", subSuggest: ["Спорт", "Навчання", "Одяг", "Здоров'я", "Їжа", "Розваги", "Подарунки", "Транспорт"], exportCsv: "Експорт у CSV", trendTitle: "Динаміка по місяцях", trendShow: "Показати графік", trendLoading: "Завантажую…", trendEmpty: "Поки недостатньо даних для графіка.", adviceTitle: "AI-радник з фінансів", adviceGet: "Отримати розбір і поради", adviceThinking: "Аналізую твої фінанси…", adviceAgain: "Оновити", adviceErr: "Не вдалося зібрати розбір. Спробуй пізніше.", recurTitle: "Регулярні платежі", recurHint: "Оренда, підписки, кредити. Бот нагадає в день платежу — записувати чи ні, вирішуєш ти.", recurAdd: "Додати платіж", recurEmpty: "Поки немає регулярних платежів.", recurDay: "Число місяця", recurEvery: (d: number) => `${d}-го числа щомісяця`, recurDelConfirm: "Видалити цей регулярний платіж?", monoTitle: "Банк Monobank", monoHint: "Підключи картку — нові покупки й надходження автоматично потраплятимуть у «Гроші».", monoTokenPh: "Встав токен Monobank", monoGetToken: "Отримати токен на api.monobank.ua", monoConnect: "Підключити", monoConnected: (n: string | null) => `✅ Підключено${n ? `: ${n}` : ""}. Нові операції з'являться автоматично.`, monoDisconnect: "Відключити", monoDisconnectConfirm: "Відключити Monobank? Вже додані операції залишаться.", monoErr: "Не вдалося підключити. Перевір токен і спробуй ще раз.", monoBadToken: "Токен невірний. Скопіюй його заново з api.monobank.ua.", monoRate: "Monobank просить зачекати хвилину — спробуй трохи пізніше.", monoWebhookWarn: "Токен збережено, але вебхук поки не став. Операції підтягнуться згодом — спробуй перепідключити за хвилину.", monoImportBtn: "Імпорт за 30 днів", monoImported: (n: number) => `Імпортовано операцій: ${n}.`, monoImportPartial: "Якщо рахунків кілька — зачекай хвилину і натисни «Імпорт» ще раз, щоб догрузити решту.", monoFixed: (n: number) => `Виправлено валют: ${n}.`, goalsTitle: "Цілі накопичень", goalsHint: "Накопичуй на ціль — стеж за прогресом. Поповнюй вручну або після надходжень.", goalAdd: "Нова ціль", goalsEmpty: "Поки немає цілей. Додай першу — напр. «Відпустка, 2000 €».", goalTitlePh: "Назва (напр. Нова машина)", goalTargetPh: "Ціль, сума", goalLeft: (rest: string) => `залишилось ${rest}`, goalDone: "Ціль досягнута! 🎉", goalContribute: "Поповнити", goalContributePrompt: (cur: string) => `На скільки поповнити (${cur})? Можна від'ємне, щоб прибрати:`, goalDelConfirm: "Видалити цю ціль?",
    budgets: "Бюджети за категоріями", limit: "Ліміт", setLimit: "Задати ліміт", editLimit: "Змінити ліміт", removeLimit: "Прибрати ліміт", ofLimit: "з", over: "перевищено на", leftWord: "залишилось", addBudget: "Додати ліміт", budgetTotalT: "Бюджет на місяць", spent: "витрачено",
    settings: "Налаштування та валюти", baseCurrency: "Основна валюта", ratesT: "Курси до основної валюти", rateLine: (c: string, b: string) => `1 ${c} =`, needsRatesWarn: "Підсумки приблизні: вкажи курси валют у налаштуваннях, щоб рахувати все в одній валюті.", ratesHint: "Ці курси — запасні: застосовуються, лише якщо курс НБУ на місяць операції недоступний.", histNote: "Суми в різних валютах зводяться до основної за офіційним курсом НБУ на місяць кожної операції — операції 2020 і 2023 років рахуються за своїми курсами, а не за сьогоднішнім.",
    importTitle: "Перенесення з MoneyOK", importBtn: "Обрати файл MoneyOK.csv", importing: "Переносимо операції…", importHint: "У MoneyOK: Меню → «Експорт у CSV» → надішли собі файл і завантаж його тут. Перенесуться всі доходи й витрати. Повторне завантаження того ж файлу не створює дублів.", importDone: (n: number, dup: number, skip: number) => `Перенесено операцій: ${n}${dup ? `, дублів пропущено: ${dup}` : ""}${skip ? `, переказів/залишків пропущено: ${skip}` : ""}.`, importEmpty: "Не вдалося розпізнати операції у файлі. Це точно експорт MoneyOK у CSV?", importErr: "Не вдалося завантажити файл. Спробуй ще раз.", importUntagged: " Увага: позначити операції не вдалося (стара база), відкат в один клік буде недоступний — онови схему supabase/finance.sql.", undoBtn: "Відкотити імпорт MoneyOK", undoConfirm: "Видалити всі операції, перенесені з MoneyOK? Додані вручну залишаться.", undoDone: (n: number) => `Відкат виконано: видалено операцій — ${n}.`, undoNone: "Імпортованих операцій не знайдено — видаляти нічого.", undoErr: "Не вдалося відкотити. Спробуй ще раз." },
  fr: { balance: "Solde du mois", income: "Revenus", expense: "Dépenses", add: "Ajouter", addIncome: "Revenu", addExpense: "Dépense", amount: "Montant", category: "Catégorie", date: "Date", note: "Note (facultatif)", save: "Enregistrer", cancel: "Annuler", byCategory: "Dépenses par catégorie", operations: "Opérations", empty: "Aucune opération ce mois-ci. Touchez « Ajouter » pour noter un revenu ou une dépense.", emptyAll: "Tes revenus et dépenses apparaîtront ici. Ajoute ta première opération pour une vision claire de ton argent.", delConfirm: "Supprimer cette opération ?", noCat: "Sans catégorie", today: "Aujourd'hui", yesterday: "Hier", currency: "Devise", pickPeriod: "Choisir mois et année", earliest: "Au plus tôt", thisMonth: "Mois courant", calendar: "Calendrier du mois", weekdays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], ops: "op.", dayBalance: "Solde du jour", allDays: "Voir tous les jours", selectedDayLabel: "Opérations du jour", opsMore: (n: number) => `Voir ${n} de plus`, opsCollapse: "Réduire", subcategoryPh: "Sous-catégorie (ex. Sport) — facultatif", subSuggest: ["Sport", "Éducation", "Vêtements", "Santé", "Nourriture", "Loisirs", "Cadeaux", "Transport"], exportCsv: "Export CSV", trendTitle: "Évolution mensuelle", trendShow: "Voir le graphique", trendLoading: "Chargement…", trendEmpty: "Pas encore assez de données pour un graphique.", adviceTitle: "Conseiller financier IA", adviceGet: "Obtenir l'analyse et des conseils", adviceThinking: "J'analyse tes finances…", adviceAgain: "Actualiser", adviceErr: "Impossible de générer l'analyse. Réessaie plus tard.", recurTitle: "Paiements récurrents", recurHint: "Loyer, abonnements, crédits. Le bot te rappelle le jour J — à toi de décider de l'enregistrer.", recurAdd: "Ajouter un paiement", recurEmpty: "Aucun paiement récurrent pour l'instant.", recurDay: "Jour du mois", recurEvery: (d: number) => `le ${d} de chaque mois`, recurDelConfirm: "Supprimer ce paiement récurrent ?", monoTitle: "Monobank", monoHint: "Connecte ta carte — les nouveaux achats et revenus arrivent automatiquement dans Argent.", monoTokenPh: "Colle ton token Monobank", monoGetToken: "Obtenir un token sur api.monobank.ua", monoConnect: "Connecter", monoConnected: (n: string | null) => `✅ Connecté${n ? ` : ${n}` : ""}. Les nouvelles opérations apparaîtront automatiquement.`, monoDisconnect: "Déconnecter", monoDisconnectConfirm: "Déconnecter Monobank ? Les opérations déjà ajoutées restent.", monoErr: "Échec de la connexion. Vérifie le token et réessaie.", monoBadToken: "Token invalide. Copie-le à nouveau depuis api.monobank.ua.", monoRate: "Monobank demande d'attendre une minute — réessaie bientôt.", monoWebhookWarn: "Token enregistré, mais le webhook n'est pas encore actif. Les opérations se synchroniseront plus tard — reconnecte dans une minute.", monoImportBtn: "Importer 30 derniers jours", monoImported: (n: number) => `${n} opérations importées.`, monoImportPartial: "Si tu as plusieurs comptes — attends une minute et relance l'import pour charger le reste.", monoFixed: (n: number) => `Devise corrigée sur ${n}.`, goalsTitle: "Objectifs d'épargne", goalAdd: "Nouvel objectif", goalsHint: "Épargne pour un objectif et suis la progression. Ajoute manuellement ou après un revenu.", goalsEmpty: "Aucun objectif. Ajoute le premier — ex. « Vacances, 2000 € ».", goalTitlePh: "Titre (ex. Nouvelle voiture)", goalTargetPh: "Montant cible", goalLeft: (rest: string) => `reste ${rest}`, goalDone: "Objectif atteint ! 🎉", goalContribute: "Ajouter", goalContributePrompt: (cur: string) => `Combien ajouter (${cur}) ? Négatif pour retirer :`, goalDelConfirm: "Supprimer cet objectif ?",
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

const CAT_MGR: Record<string, { title: string; hint: string; ph: string; expense: string; income: string; add: string }> = {
  ru: { title: "Мои категории", hint: "Добавь свою статью расходов/доходов — бот и AI начнут в неё раскладывать.", ph: "Название (напр. Штрафы)", expense: "Расход", income: "Доход", add: "Добавить" },
  en: { title: "My categories", hint: "Add your own expense/income category — the bot and AI will sort into it.", ph: "Name (e.g. Fines)", expense: "Expense", income: "Income", add: "Add" },
  uk: { title: "Мої категорії", hint: "Додай свою статтю витрат/доходів — бот і AI почнуть у неї розкладати.", ph: "Назва (напр. Штрафи)", expense: "Витрата", income: "Дохід", add: "Додати" },
  fr: { title: "Mes catégories", hint: "Ajoute ta propre catégorie — le bot et l'IA la rempliront.", ph: "Nom (ex. Amendes)", expense: "Dépense", income: "Revenu", add: "Ajouter" },
};

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
// Пользовательские категории (вариант А): реестр заполняет компонент из /api/finance/categories.
// Ключ — `${kind}:${slug}`. catView сначала смотрит сюда, чтобы показать label/emoji, а не сырой slug.
type CustomCat = { id: string; slug: string; label: string; emoji: string | null; kind: string };
let CUSTOM_CAT_VIEW: Record<string, { label: string; emoji: string | null }> = {};

function catView(kind: "income" | "expense", key: string | null, locale: string): { icon: string; color: string; label: string } {
  const list = kind === "income" ? INCOME_CATS : EXPENSE_CATS;
  const preset = key ? list.find((c) => c.key === key) : null;
  if (preset) return { icon: preset.icon, color: preset.color, label: (preset.l as any)[locale] || preset.l.ru };
  if (!key) { const o = list[list.length - 1]; return { icon: o.icon, color: o.color, label: (o.l as any)[locale] || o.l.ru }; }
  const custom = CUSTOM_CAT_VIEW[`${kind}:${key}`];
  if (custom) return { icon: custom.emoji || (kind === "income" ? "💰" : "🏷️"), color: hashColor(key), label: custom.label };
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

  // Пользовательские категории (вариант А): грузим список и держим реестр для catView.
  const [custom, setCustom] = useState<CustomCat[]>([]);
  useEffect(() => { fetch("/api/finance/categories").then((r) => r.json()).then((j) => { if (j?.ok) setCustom(j.categories || []); }).catch(() => {}); }, []);
  CUSTOM_CAT_VIEW = Object.fromEntries(custom.map((c) => [`${c.kind}:${c.slug}`, { label: c.label, emoji: c.emoji }]));
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("");
  const [newCatKind, setNewCatKind] = useState<"income" | "expense">("expense");
  async function addCustomCat() {
    const label = newCatLabel.trim();
    if (!label) return;
    const r = await fetch("/api/finance/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label, emoji: newCatEmoji.trim() || null, kind: newCatKind }) }).then((x) => x.json()).catch(() => null);
    if (r?.ok && r.category) { setCustom((cs) => [...cs, r.category]); setNewCatLabel(""); setNewCatEmoji(""); }
  }
  async function delCustomCat(id: string) {
    await fetch(`/api/finance/categories?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    setCustom((cs) => cs.filter((c) => c.id !== id));
  }

  // Календарь-выбор месяца/года.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => Number(month.slice(0, 4)));
  // Календарь по дням: выбранный день месяца (фильтрует список операций).
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // Список операций: свёрнут (только свежие) / развёрнут.
  const [showAllOps, setShowAllOps] = useState(false);

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

  // Регулярные платежи (подписки) — управление.
  type Recur = { id: string; kind: "income" | "expense"; amount: number; currency: string; category: string | null; subcategory: string | null; note: string | null; day_of_month: number; active: boolean };
  const [recur, setRecur] = useState<Recur[] | null>(null);
  const [recAddOpen, setRecAddOpen] = useState(false);
  const [rKind, setRKind] = useState<"income" | "expense">("expense");
  const [rAmount, setRAmount] = useState("");
  const [rCurrency, setRCurrency] = useState(base);
  const [rCategory, setRCategory] = useState("");
  const [rNote, setRNote] = useState("");
  const [rDay, setRDay] = useState("1");
  async function loadRecur() {
    try { const j = await (await fetch("/api/finance/recurring")).json(); setRecur(j?.items || []); }
    catch { setRecur([]); }
  }
  useEffect(() => { loadRecur(); /* eslint-disable-next-line */ }, []);

  // Подключение Monobank.
  type MonoStatus = { connected: boolean; clientName: string | null; webhookSet?: boolean };
  const [mono, setMono] = useState<MonoStatus | null>(null);
  const [monoToken, setMonoToken] = useState("");
  const [monoBusy, setMonoBusy] = useState(false);
  const [monoMsg, setMonoMsg] = useState<string | null>(null);
  async function loadMono() {
    try { const j = await (await fetch("/api/bank/monobank")).json(); setMono(j?.ok ? j : { connected: false, clientName: null }); }
    catch { setMono({ connected: false, clientName: null }); }
  }
  useEffect(() => { loadMono(); /* eslint-disable-next-line */ }, []);
  async function connectMono() {
    const t = monoToken.trim();
    if (t.length < 20) { setMonoMsg(s.monoErr); return; }
    setMonoBusy(true); setMonoMsg(null);
    try {
      const r = await fetch("/api/bank/monobank", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: t }) });
      const j = await r.json();
      if (r.ok && j?.ok) { setMonoToken(""); setMono({ connected: true, clientName: j.clientName, webhookSet: j.webhookSet }); if (!j.webhookSet) setMonoMsg(s.monoWebhookWarn); }
      else setMonoMsg(j?.error === "invalid_token" ? s.monoBadToken : j?.error === "rate_limited" ? s.monoRate : s.monoErr);
    } catch { setMonoMsg(s.monoErr); }
    setMonoBusy(false);
  }
  async function disconnectMono() {
    if (!window.confirm(s.monoDisconnectConfirm)) return;
    setMonoBusy(true);
    await fetch("/api/bank/monobank", { method: "DELETE" });
    setMonoBusy(false); setMono({ connected: false, clientName: null }); setMonoMsg(null);
  }
  async function importMono() {
    setMonoBusy(true); setMonoMsg(null);
    try {
      const j = await (await fetch("/api/bank/monobank/import", { method: "POST" })).json();
      if (j?.ok) { setMonoMsg(s.monoImported(j.inserted || 0) + (j.fixed ? " " + s.monoFixed(j.fixed) : "") + (j.rateLimited ? " " + s.monoImportPartial : "")); router.refresh(); }
      else setMonoMsg(j?.error === "rate_limited" ? s.monoRate : s.monoErr);
    } catch { setMonoMsg(s.monoErr); }
    setMonoBusy(false);
  }

  // Цели по накоплениям.
  type Goal = { id: string; title: string; target_amount: number; current_amount: number; currency: string; deadline: string | null; achieved: boolean };
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [goalAddOpen, setGoalAddOpen] = useState(false);
  const [gTitle, setGTitle] = useState("");
  const [gTarget, setGTarget] = useState("");
  const [gCurrency, setGCurrency] = useState(base);
  const [gDeadline, setGDeadline] = useState("");
  async function loadGoals() {
    try { const j = await (await fetch("/api/finance/goals")).json(); setGoals(j?.items || []); }
    catch { setGoals([]); }
  }
  useEffect(() => { loadGoals(); /* eslint-disable-next-line */ }, []);
  async function addGoal() {
    const t = parseFloat(gTarget.replace(",", "."));
    if (!gTitle.trim() || !isFinite(t) || t <= 0) return;
    setBusy(true);
    const r = await fetch("/api/finance/goals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: gTitle.trim(), target_amount: t, currency: gCurrency, deadline: gDeadline || null }) });
    setBusy(false);
    if (r.ok) { setGoalAddOpen(false); setGTitle(""); setGTarget(""); setGDeadline(""); loadGoals(); }
  }
  async function contributeGoal(g: Goal) {
    const raw = window.prompt(s.goalContributePrompt(g.currency));
    if (raw == null) return;
    const v = parseFloat(raw.replace(",", "."));
    if (!isFinite(v) || v === 0) return;
    setBusy(true);
    await fetch("/api/finance/goals", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: g.id, add: v }) });
    setBusy(false); loadGoals();
  }
  async function delGoal(id: string) {
    if (!window.confirm(s.goalDelConfirm)) return;
    setBusy(true);
    await fetch("/api/finance/goals", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    setBusy(false); loadGoals();
  }
  async function addRecur() {
    const v = parseFloat(rAmount.replace(",", "."));
    const d = parseInt(rDay, 10);
    if (!isFinite(v) || v <= 0 || !(d >= 1 && d <= 31)) return;
    setBusy(true);
    const r = await fetch("/api/finance/recurring", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: rKind, amount: v, currency: rCurrency, category: rCategory.trim() || null, note: rNote.trim() || null, day_of_month: d }) });
    setBusy(false);
    if (r.ok) { setRecAddOpen(false); setRAmount(""); setRCategory(""); setRNote(""); loadRecur(); }
  }
  async function toggleRecur(it: Recur) {
    setBusy(true);
    await fetch("/api/finance/recurring", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: it.id, active: !it.active }) });
    setBusy(false); loadRecur();
  }
  async function delRecur(id: string) {
    if (!window.confirm(s.recurDelConfirm)) return;
    setBusy(true);
    await fetch("/api/finance/recurring", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    setBusy(false); loadRecur();
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
  // Категории для пикера: встроенные + пользовательские (перед «Другое»).
  function pickerCats(k: "income" | "expense") {
    const builtin = (k === "income" ? INCOME_CATS : EXPENSE_CATS).map((c) => ({ key: c.key, icon: c.icon, color: c.color, label: (c.l as any)[locale] || c.l.ru }));
    const cust = custom.filter((c) => c.kind === k).map((c) => ({ key: c.slug, icon: c.emoji || "🏷️", color: hashColor(c.slug), label: c.label }));
    if (!cust.length) return builtin;
    const i = builtin.findIndex((b) => b.key === "other");
    if (i >= 0) builtin.splice(i, 0, ...cust); else builtin.push(...cust);
    return builtin;
  }
  const cats = pickerCats(kind);

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

  // Лимит на подкатегорию: editSubBudget = "категория|подкатегория".
  const [editSubBudget, setEditSubBudget] = useState<string | null>(null);
  const [subBudgetVal, setSubBudgetVal] = useState("");
  async function saveSubBudget(cat: string, sub: string, raw: string) {
    const v = parseFloat(raw.replace(",", "."));
    if (!isFinite(v) || v <= 0) return;
    setBusy(true);
    const r = await fetch("/api/finance-budget", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ category: cat, subcategory: sub, amount: v }) });
    setBusy(false);
    if (r.ok) { setEditSubBudget(null); router.refresh(); }
  }
  async function removeSubBudget(cat: string, sub: string) {
    setBusy(true);
    const r = await fetch("/api/finance-budget", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ category: cat, subcategory: sub }) });
    setBusy(false);
    if (r.ok) { setEditSubBudget(null); router.refresh(); }
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

  const input: any = { fontSize: 14, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" };
  const btnP: any = { fontSize: 13.5, padding: "10px 18px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: 600, boxShadow: "0 1px 2px rgba(0,0,0,.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };
  const btnG: any = { fontSize: 13.5, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer", fontWeight: 500, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };
  // Компактная «пилюля» — для главных действий вместо кнопок во всю ширину.
  const btnPill: any = { ...btnP, padding: "10px 22px", borderRadius: 999 };

  // Календарь по дням месяца.
  const dayMap = new Map(data.byDay.map((d) => [d.day, d]));
  const cells = monthCells(month);
  // Выбранный день актуален только для текущего месяца (сбрасывается при смене месяца).
  const selDay = selectedDay && selectedDay.startsWith(month) && dayMap.has(selectedDay) ? selectedDay : null;

  // Группировка операций по дням (с учётом выбранного в календаре дня).
  const byDay = new Map<string, Tx[]>();
  for (const t of txs) { const list = byDay.get(t.day) ?? []; list.push(t); byDay.set(t.day, list); }
  const days = [...byDay.keys()].sort().reverse().filter((d) => !selDay || d === selDay);

  // По умолчанию показываем только свежие операции; «Показать ещё» разворачивает.
  const OPS_PREVIEW = 6;
  const opsCount = days.reduce((n, d) => n + (byDay.get(d)?.length ?? 0), 0);
  const opsLimit = showAllOps || selDay ? Infinity : OPS_PREVIEW;
  const visDays: { day: string; items: Tx[] }[] = [];
  let opsShown = 0;
  for (const d of days) {
    if (opsShown >= opsLimit) break;
    const items = byDay.get(d)!.slice(0, opsLimit - opsShown);
    visDays.push({ day: d, items });
    opsShown += items.length;
  }
  const opsHidden = opsCount - opsShown;

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
    <div className="fin-wrap" style={{ position: "relative", paddingBottom: 72 }}>
      <style>{`
        .fin-wrap button { transition: transform .08s ease, filter .15s ease, background .15s ease, box-shadow .15s ease, border-color .15s ease; }
        .fin-wrap button:hover:not(:disabled) { filter: brightness(1.04); }
        .fin-wrap button:active:not(:disabled) { transform: scale(.97); }
        .fin-wrap .card { transition: box-shadow .2s ease; }
        .fin-row { border-radius: 10px; padding-left: 6px; padding-right: 6px; margin-left: -6px; margin-right: -6px; transition: background .15s ease; }
        .fin-row:hover { background: var(--surface-2); }
        .fin-fab { position: fixed; right: 24px; bottom: 92px; width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer; background: var(--accent); color: #fff; font-size: 26px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px color-mix(in srgb, var(--accent) 45%, transparent); z-index: 40; transition: transform .12s ease, box-shadow .2s ease; }
        .fin-fab:hover { transform: translateY(-2px) scale(1.04); }
        .fin-fab:active { transform: scale(.95); }
        .fin-top-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 14px; margin-bottom: 14px; align-items: stretch; }
        .fin-top-grid > .card { margin-bottom: 0; }
        @media (max-width: 900px) { .fin-top-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Плавающая кнопка быстрого добавления */}
      <button className="fin-fab" aria-label={s.add} title={s.add}
        onClick={() => { setOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
        <i className="ti ti-plus" />
      </button>

      {/* Шапка: переключатель месяца + настройки */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14, gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => gotoMonth(-1)} aria-label="prev" style={{ ...btnG, padding: "6px 10px" }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 16, verticalAlign: "-3px" }} />
        </button>
        <button onClick={openPicker} title={s.pickPeriod} style={{ ...btnG, flex: "1 1 160px", fontSize: 15, fontWeight: 600, textTransform: "capitalize", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--text)", background: pickerOpen ? "var(--surface-2)" : "var(--surface)" }}>
          {monthLabel(month, locale)}
          <i className="ti ti-calendar-event" style={{ fontSize: 14, color: "var(--accent)" }} />
        </button>
        <button onClick={() => gotoMonth(1)} disabled={isCur} aria-label="next" style={{ ...btnG, padding: "6px 10px", opacity: isCur ? 0.4 : 1, cursor: isCur ? "default" : "pointer" }}>
          <i className="ti ti-chevron-right" style={{ fontSize: 16, verticalAlign: "-3px" }} />
        </button>
        <button onClick={() => { setSetOpenS((o) => !o); setBaseSel(base); setPickerOpen(false); }} title={s.settings}
          style={{ ...btnG, padding: "8px 16px", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7,
            color: setOpenS ? "#fff" : "var(--accent)",
            background: setOpenS ? "var(--accent)" : "color-mix(in srgb, var(--accent) 10%, var(--surface))",
            border: `1px solid ${setOpenS ? "var(--accent)" : "color-mix(in srgb, var(--accent) 35%, transparent)"}` }}>
          <i className="ti ti-settings" style={{ fontSize: 16, verticalAlign: "-2px" }} /> {s.settings}
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

          {/* Подключение Monobank */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-building-bank" style={{ fontSize: 15, color: "var(--accent)" }} />{s.monoTitle}
            </div>
            {mono?.connected ? (
              <div>
                <div style={{ fontSize: 12.5, color: "#065f46", background: "#10b9811a", border: "1px solid #6ee7b7", borderRadius: 9, padding: "8px 11px", marginBottom: 8 }}>{s.monoConnected(mono.clientName)}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button disabled={monoBusy} onClick={importMono} style={btnG}>
                    <i className="ti ti-history" style={{ fontSize: 14 }} /> {s.monoImportBtn}
                  </button>
                  <button disabled={monoBusy} onClick={disconnectMono} style={{ ...btnG, color: "#ef4444" }}>{s.monoDisconnect}</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 8, lineHeight: 1.5 }}>{s.monoHint}</div>
                <input type="password" placeholder={s.monoTokenPh} value={monoToken} onChange={(e) => setMonoToken(e.target.value)} style={{ ...input, width: "100%", marginBottom: 8, boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button disabled={monoBusy} onClick={connectMono} style={{ ...btnP, opacity: monoBusy ? 0.7 : 1 }}>
                    <i className="ti ti-plug" style={{ fontSize: 14, verticalAlign: "-2px" }} /> {s.monoConnect}
                  </button>
                  <a href="https://api.monobank.ua/" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--accent)" }}>{s.monoGetToken}</a>
                </div>
              </div>
            )}
            {monoMsg && <div style={{ fontSize: 12, color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 9, padding: "8px 11px", marginTop: 8 }}>{monoMsg}</div>}
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

          {/* Мои категории (пользовательские статьи расходов/доходов) */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-tags" style={{ fontSize: 15, color: "var(--accent)" }} />{(CAT_MGR[locale] || CAT_MGR.ru).title}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 10, lineHeight: 1.5 }}>{(CAT_MGR[locale] || CAT_MGR.ru).hint}</div>
            {custom.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
                {custom.map((c) => (
                  <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "5px 10px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)" }}>
                    <span>{c.emoji || "🏷️"}</span>{c.label}
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>{c.kind === "income" ? "▲" : "▼"}</span>
                    <button onClick={() => delCustomCat(c.id)} aria-label="delete" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <input value={newCatEmoji} onChange={(e) => setNewCatEmoji(e.target.value)} placeholder="🙂" maxLength={4} style={{ ...input, width: 52, textAlign: "center" }} />
              <input value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} placeholder={(CAT_MGR[locale] || CAT_MGR.ru).ph} maxLength={40} style={{ ...input, width: 190 }} />
              <select value={newCatKind} onChange={(e) => setNewCatKind(e.target.value as any)} style={{ ...input, width: 120 }}>
                <option value="expense">{(CAT_MGR[locale] || CAT_MGR.ru).expense}</option>
                <option value="income">{(CAT_MGR[locale] || CAT_MGR.ru).income}</option>
              </select>
              <button onClick={addCustomCat} disabled={!newCatLabel.trim()} style={{ ...btnG, opacity: newCatLabel.trim() ? 1 : 0.5 }}>{(CAT_MGR[locale] || CAT_MGR.ru).add}</button>
            </div>
          </div>
        </div>
      )}

      {/* Сетка 2×2 (выровнена по высоте): сверху (баланс | советник+цели), снизу (календарь | операции) */}
      <div className="fin-top-grid">
      {/* Баланс + доходы/расходы — верх слева */}
      <div className="card" style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}>
          <i className="ti ti-wallet" style={{ fontSize: 14, color: "var(--accent)" }} />{s.balance}
        </div>
        <div style={{ fontSize: 38, fontWeight: 750, marginTop: 4, lineHeight: 1.05, letterSpacing: "-0.02em", color: balance < 0 ? "#ef4444" : "var(--text)" }}>
          {balance > 0 ? "+" : ""}{fmtMoney(balance, base, locale)}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 120px", background: "#10b9811a", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 11.5, color: "#10b981", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
              <i className="ti ti-arrow-down-left" style={{ fontSize: 14 }} />{s.income}
            </div>
            <div style={{ fontSize: 20, fontWeight: 650, marginTop: 3 }}>{fmtMoney(income, base, locale)}</div>
          </div>
          <div style={{ flex: "1 1 120px", background: "#ef44441a", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 11.5, color: "#ef4444", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
              <i className="ti ti-arrow-up-right" style={{ fontSize: 14 }} />{s.expense}
            </div>
            <div style={{ fontSize: 20, fontWeight: 650, marginTop: 3 }}>{fmtMoney(expense, base, locale)}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button onClick={() => setOpen((o) => !o)} style={{ ...btnPill, fontSize: 14, padding: "11px 28px", background: open ? "var(--surface-2)" : "var(--accent)", color: open ? "var(--text-2)" : "#fff", border: open ? "1px solid var(--border)" : "none", boxShadow: open ? "none" : "0 2px 8px color-mix(in srgb, var(--accent) 35%, transparent)" }}>
            <i className={`ti ${open ? "ti-x" : "ti-plus"}`} style={{ fontSize: 16 }} /> {open ? s.cancel : s.add}
          </button>
        </div>

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
                }}><span>{c.icon}</span>{c.label}</button>
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

      {/* Верх справа: AI-советник + цели по накоплениям (одна ячейка сетки — по высоте баланса, карточки тянутся поровну) */}
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* AI-советник по финансам (по требованию) */}
      {data.hasAny && (
        <div className="card" style={{ flex: "1 1 0", minWidth: 0, background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)" }}>
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
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
              <button onClick={loadAdvice} disabled={adviceLoading} style={{ ...btnPill, opacity: adviceLoading ? 0.7 : 1, boxShadow: "0 2px 8px color-mix(in srgb, var(--accent) 35%, transparent)" }}>
                <i className="ti ti-sparkles" style={{ fontSize: 15 }} /> {adviceLoading ? s.adviceThinking : s.adviceGet}
              </button>
            </div>
          )}
        </div>
      )}
      {/* Цели по накоплениям — под советником */}
      {goals != null && (goals.length > 0 || goalAddOpen) && (
        <div className="card" style={{ flex: "1 1 0", minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <i className="ti ti-target-arrow" style={{ fontSize: 15, color: "var(--accent)" }} />{s.goalsTitle}
            <button onClick={() => { setGoalAddOpen((o) => !o); setGCurrency(base); }} style={{ ...btnG, padding: "4px 12px", fontSize: 12, marginLeft: "auto" }}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} /> {s.goalAdd}
            </button>
          </div>
          {goalAddOpen && (
            <div style={{ paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid var(--border)" }}>
              <input type="text" placeholder={s.goalTitlePh} value={gTitle} onChange={(e) => setGTitle(e.target.value)} maxLength={80} style={{ ...input, width: "100%", marginBottom: 8, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <input type="number" inputMode="decimal" placeholder={s.goalTargetPh} value={gTarget} onChange={(e) => setGTarget(e.target.value)} style={{ ...input, flex: "2 1 110px", fontWeight: 600 }} />
                <select value={gCurrency} onChange={(e) => setGCurrency(e.target.value)} style={{ ...input, flex: "1 1 80px" }}>
                  {CUR.map((c) => <option key={c.code} value={c.code}>{c.code} {c.sym}</option>)}
                </select>
                <input type="date" value={gDeadline} onChange={(e) => setGDeadline(e.target.value)} style={{ ...input, flex: "1 1 140px" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button disabled={busy} onClick={addGoal} style={{ ...btnP, flex: 1 }}>{s.save}</button>
                <button disabled={busy} onClick={() => setGoalAddOpen(false)} style={btnG}>{s.cancel}</button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {goals.map((g) => {
              const pct = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
              const rest = Math.max(0, Math.round((g.target_amount - g.current_amount) * 100) / 100);
              return (
                <div key={g.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {g.achieved && <span>🎉</span>}{g.title}
                      {g.deadline && <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 400 }}>· {g.deadline}</span>}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{fmtMoney(g.current_amount, g.currency, locale)} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>/ {fmtMoney(g.target_amount, g.currency, locale)}</span></span>
                  </div>
                  <div style={{ height: 9, background: "var(--surface-2)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: g.achieved ? "#10b981" : "var(--accent)", borderRadius: 6, transition: "width .3s" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: g.achieved ? "#10b981" : "var(--text-3)" }}>{g.achieved ? s.goalDone : `${pct}% · ${s.goalLeft(fmtMoney(rest, g.currency, locale))}`}</span>
                    <button onClick={() => contributeGoal(g)} style={{ ...btnG, padding: "4px 12px", fontSize: 12, marginLeft: "auto" }}>
                      <i className="ti ti-plus" style={{ fontSize: 13 }} /> {s.goalContribute}
                    </button>
                    <button onClick={() => delGoal(g.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4 }}>
                      <i className="ti ti-trash" style={{ fontSize: 15 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {goals.length === 0 && !goalAddOpen && (
            <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{s.goalsEmpty}</div>
          )}
        </div>
      )}

      {/* Кнопка «добавить первую цель», если целей ещё нет */}
      {goals != null && goals.length === 0 && !goalAddOpen && (
        <div className="card" style={{ flex: "1 1 0", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <i className="ti ti-target-arrow" style={{ fontSize: 18, color: "var(--accent)" }} />
          <span style={{ fontSize: 13, color: "var(--text-2)", flex: 1, minWidth: 140 }}>{s.goalsHint}</span>
          <button onClick={() => { setGoalAddOpen(true); setGCurrency(base); }} style={{ ...btnG, padding: "6px 14px", fontSize: 12.5 }}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} /> {s.goalAdd}
          </button>
        </div>
      )}

      </div>

      {/* Календарь месяца по дням — низ слева (держит свою высоту, операции подстраиваются) */}
      {data.byDay.length > 0 && (
        <div className="card" style={{ minWidth: 0, alignSelf: "start" }}>
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

      {/* Список операций — низ справа (по высоте календаря; свежие + «Показать ещё») */}
      {txs.length === 0 ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 14, textAlign: "center", padding: "26px 16px" }}>
          {data.hasAny ? s.empty : s.emptyAll}
        </div>
      ) : (
        <div className="card">
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-list" style={{ fontSize: 15, color: "var(--accent)" }} />{s.operations}
          </div>
          {visDays.map(({ day: d, items }) => (
            <div key={d} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", textTransform: "capitalize", marginBottom: 6 }}>{dayLabel(d)}</div>
              {items.map((t) => {
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
          {!selDay && opsCount > OPS_PREVIEW && (
            <button onClick={() => setShowAllOps((v) => !v)}
              style={{ ...btnG, width: "100%", justifyContent: "center", marginTop: 4, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6 }}>
              {showAllOps
                ? <><i className="ti ti-chevron-up" style={{ fontSize: 14 }} /> {s.opsCollapse}</>
                : <><i className="ti ti-chevron-down" style={{ fontSize: 14 }} /> {s.opsMore(opsHidden)}</>}
            </button>
          )}
        </div>
      )}
      </div>

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
                    <div style={{ marginTop: 6, marginLeft: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                      {c.subs.map((sub) => {
                        const subKey = `${c.category}|${sub.name}`;
                        const sHas = sub.limit != null;
                        return (
                        <div key={sub.name}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--text-2)", gap: 8 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                              <span style={{ color: m.color }}>›</span>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.name}</span>
                              {sub.over && <span style={{ fontSize: 10, color: "#ef4444", background: "#ef44441a", padding: "0 6px", borderRadius: 8, flexShrink: 0 }}>{s.over}</span>}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              <span>{fmtMoney(sub.amount, base, locale)}</span>
                              {sHas && <span style={{ color: "var(--text-3)", fontSize: 11 }}>{s.ofLimit} {fmtMoney(sub.limit!, base, locale)}</span>}
                              <button onClick={() => { setEditSubBudget(editSubBudget === subKey ? null : subKey); setSubBudgetVal(sub.limit != null ? String(sub.limit) : ""); }} title={sHas ? s.editLimit : s.setLimit} style={{ background: "none", border: "none", cursor: "pointer", color: sHas ? "var(--accent)" : "var(--text-3)", padding: 1 }}>
                                <i className={`ti ${sHas ? "ti-edit" : "ti-target"}`} style={{ fontSize: 12 }} />
                              </button>
                            </span>
                          </div>
                          {sHas && (
                            <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden", marginTop: 3 }}>
                              <div style={{ width: `max(${Math.min(100, sub.budgetPct || 0)}%, 3px)`, height: "100%", background: budgetColor(sub.budgetPct || 0), borderRadius: 3 }} />
                            </div>
                          )}
                          {editSubBudget === subKey && (
                            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 5, flexWrap: "wrap" }}>
                              <input autoFocus type="number" inputMode="decimal" placeholder={`${s.limit}, ${symOf(base)}`} value={subBudgetVal} onChange={(e) => setSubBudgetVal(e.target.value)} style={{ ...input, width: 110, padding: "5px 8px", fontSize: 12.5 }} />
                              <button disabled={busy} onClick={() => saveSubBudget(c.category, sub.name, subBudgetVal)} style={{ ...btnP, padding: "5px 11px", fontSize: 12 }}>{s.save}</button>
                              {sHas && <button disabled={busy} onClick={() => removeSubBudget(c.category, sub.name)} style={{ ...btnG, padding: "5px 11px", fontSize: 12, color: "#ef4444" }}>{s.removeLimit}</button>}
                              <button disabled={busy} onClick={() => setEditSubBudget(null)} style={{ ...btnG, padding: "5px 11px", fontSize: 12 }}>{s.cancel}</button>
                            </div>
                          )}
                        </div>
                        );
                      })}
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

      {/* Регулярные платежи (подписки) */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-repeat" style={{ fontSize: 15, color: "var(--accent)" }} />{s.recurTitle}
          <button onClick={() => { if (recur == null) loadRecur(); setRecAddOpen((o) => !o); setRKind("expense"); setRCurrency(base); }} style={{ ...btnG, padding: "4px 12px", fontSize: 12, marginLeft: "auto" }}>
            <i className="ti ti-plus" style={{ fontSize: 13, verticalAlign: "-2px" }} /> {s.recurAdd}
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6, lineHeight: 1.5 }}>{s.recurHint}</div>

        {recAddOpen && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", padding: 4, borderRadius: 10, marginBottom: 8 }}>
              {(["expense", "income"] as const).map((k) => (
                <button key={k} onClick={() => setRKind(k)} style={{ flex: 1, fontSize: 13, padding: "7px", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 500, background: rKind === k ? (k === "income" ? "#10b981" : "#ef4444") : "transparent", color: rKind === k ? "#fff" : "var(--text-2)" }}>{k === "income" ? s.addIncome : s.addExpense}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <input type="number" inputMode="decimal" placeholder={s.amount} value={rAmount} onChange={(e) => setRAmount(e.target.value)} style={{ ...input, flex: "2 1 100px", fontSize: 16, fontWeight: 600 }} />
              <select value={rCurrency} onChange={(e) => setRCurrency(e.target.value)} style={{ ...input, flex: "1 1 80px" }}>
                {CUR.map((c) => <option key={c.code} value={c.code}>{c.code} {c.sym}</option>)}
              </select>
              <select value={rDay} onChange={(e) => setRDay(e.target.value)} style={{ ...input, flex: "1 1 100px" }} title={s.recurDay}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{s.recurDay}: {d}</option>)}
              </select>
            </div>
            <input type="text" placeholder={s.category} value={rCategory} onChange={(e) => setRCategory(e.target.value)} maxLength={40} style={{ ...input, width: "100%", marginBottom: 8, boxSizing: "border-box" }} />
            <input type="text" placeholder={s.note} value={rNote} onChange={(e) => setRNote(e.target.value)} maxLength={200} style={{ ...input, width: "100%", marginBottom: 10, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={busy} onClick={addRecur} style={{ ...btnP, flex: 1 }}>{s.save}</button>
              <button disabled={busy} onClick={() => setRecAddOpen(false)} style={btnG}>{s.cancel}</button>
            </div>
          </div>
        )}

        {recur != null && recur.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {recur.map((it) => (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, opacity: it.active ? 1 : 0.5 }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: it.kind === "income" ? "#10b9811f" : "#ef44441f", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{it.kind === "income" ? "📈" : "💸"}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {it.note || [it.category, it.subcategory].filter(Boolean).join(" / ") || "—"}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{s.recurEvery(it.day_of_month)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: it.kind === "income" ? "#10b981" : "var(--text)", whiteSpace: "nowrap" }}>
                  {it.kind === "income" ? "+" : "−"}{fmtMoney(it.amount, it.currency, locale)}
                </div>
                <button onClick={() => toggleRecur(it)} title={it.active ? "off" : "on"} style={{ background: "none", border: "none", cursor: "pointer", color: it.active ? "var(--accent)" : "var(--text-3)", padding: 4, flexShrink: 0 }}>
                  <i className={`ti ${it.active ? "ti-bell" : "ti-bell-off"}`} style={{ fontSize: 16 }} />
                </button>
                <button onClick={() => delRecur(it.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, flexShrink: 0 }}>
                  <i className="ti ti-trash" style={{ fontSize: 15 }} />
                </button>
              </div>
            ))}
          </div>
        )}
        {recur != null && recur.length === 0 && !recAddOpen && (
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 10 }}>{s.recurEmpty}</div>
        )}
      </div>

    </div>
  );
}

// Сдвиг даты YYYY-MM-DD на ±N дней.
function shiftDay(d: string, delta: number) {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + delta);
  return dt.toISOString().slice(0, 10);
}
