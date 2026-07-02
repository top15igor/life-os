// Единый чек-лист фич для отчётов тестировщика (совпадает с памяткой /tester.html).
export const TESTER_FEATURES: { key: string; icon: string; label: string; hint: string }[] = [
  { key: "capture", icon: "✍️", label: "Запись", hint: "текст / голос / фото; настроение, категории, задачи, люди" },
  { key: "bot", icon: "🤖", label: "Бот в Telegram", hint: "команды, беседа, действия голосом" },
  { key: "finance", icon: "💰", label: "Деньги", hint: "траты/доходы голосом, валюты, Личное/Бизнес" },
  { key: "health", icon: "❤️", label: "Здоровье", hint: "дашборд, сон, Fitbit/Apple, настроение" },
  { key: "media", icon: "🎬", label: "Медиатека", hint: "«хочу посмотреть …», фильмы/сериалы/книги" },
  { key: "knowledge", icon: "📚", label: "База знаний", hint: "ссылки Instagram/TikTok/YouTube" },
  { key: "reminders", icon: "🔔", label: "Напоминания", hint: "голосом/вручную, Google Календарь" },
  { key: "wishlist", icon: "🎁", label: "Вишлист", hint: "ссылки на товары" },
  { key: "friend", icon: "🎙️", label: "AI-друг", hint: "чат и голос, язык ответа" },
  { key: "book", icon: "📖", label: "Книга жизни · Биограф", hint: "главы, вопросы, «Что заметил AI»" },
  { key: "share", icon: "🔗", label: "Поделиться · Пригласить", hint: "карточки, публичная страница, реф-ссылка" },
  { key: "app", icon: "📱", label: "Приложение", hint: "вкладки, меню, языки, тёмная тема, свайпы" },
];

export const TESTER_FEATURE_KEYS = TESTER_FEATURES.map((f) => f.key);
