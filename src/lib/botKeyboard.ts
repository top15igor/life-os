// ============================================================
//  Постоянная клавиатура бота (кнопки под полем ввода).
//  Вынесена в общий модуль, чтобы переиспользовать в вебхуке,
//  кронах и разовой рассылке (обновление кнопок у всех юзеров).
// ============================================================

export const KB: Record<string, { acquaint: string; diary: string; tasks: string; motiv: string; invite: string }> = {
  ru: { acquaint: "🌱 Давай познакомимся", diary: "📖 Дневник", tasks: "✅ Мои задачи", motiv: "🔥 Моя мотивация", invite: "🤝 Пригласить друга" },
  en: { acquaint: "🌱 Let's get acquainted", diary: "📖 Diary", tasks: "✅ My tasks", motiv: "🔥 My motivation", invite: "🤝 Invite a friend" },
  uk: { acquaint: "🌱 Давай познайомимось", diary: "📖 Щоденник", tasks: "✅ Мої завдання", motiv: "🔥 Моя мотивація", invite: "🤝 Запросити друга" },
  fr: { acquaint: "🌱 Faisons connaissance", diary: "📖 Journal", tasks: "✅ Mes tâches", motiv: "🔥 Ma motivation", invite: "🤝 Inviter un ami" },
};

export function mainKeyboard(lang: string) {
  const k = KB[lang] || KB.ru;
  return {
    keyboard: [
      [{ text: k.acquaint }],
      [{ text: k.diary }, { text: k.tasks }],
      [{ text: k.motiv }, { text: k.invite }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}
