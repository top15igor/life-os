// ============================================================
//  Постоянная клавиатура бота (кнопки под полем ввода).
//  Вынесена в общий модуль, чтобы переиспользовать в вебхуке,
//  кронах и разовой рассылке (обновление кнопок у всех юзеров).
// ============================================================

export const KB: Record<string, { acquaint: string; diary: string; tasks: string; guide: string; invite: string }> = {
  ru: { acquaint: "🌱 Давай познакомимся", diary: "💾 Сохранённое", tasks: "🎯 Задачи", guide: "✨ Зачем я тебе", invite: "🤝 Пригласить друга" },
  en: { acquaint: "🌱 Let's get acquainted", diary: "💾 Saved", tasks: "🎯 Tasks", guide: "✨ Why I'm here", invite: "🤝 Invite a friend" },
  uk: { acquaint: "🌱 Давай познайомимось", diary: "💾 Збережене", tasks: "🎯 Завдання", guide: "✨ Навіщо я тобі", invite: "🤝 Запросити друга" },
  fr: { acquaint: "🌱 Faisons connaissance", diary: "💾 Sauvegardé", tasks: "🎯 Tâches", guide: "✨ Pourquoi moi", invite: "🤝 Inviter un ami" },
  es: { acquaint: "🌱 Conozcámonos", diary: "💾 Guardado", tasks: "🎯 Tareas", guide: "✨ Para qué te sirvo", invite: "🤝 Invitar a un amigo" },
};

// Прежняя подпись кнопки задач («✅ Мои задачи» и др.) — чтобы распознавать
// нажатие у пользователей со старой (закэшированной) клавиатурой.
export const TASKS_LABEL_LEGACY: Record<string, string> = {
  ru: "✅ Мои задачи", en: "✅ My tasks", uk: "✅ Мої завдання", fr: "✅ Mes tâches", es: "✅ Mis tareas",
};

// Прежняя подпись кнопки «Дневник» — распознаём у старых клавиатур,
// чтобы нажатие вело на портал (а не сохранялось как запись).
export const DIARY_LABEL_LEGACY: Record<string, string[]> = {
  ru: ["📖 Дневник", "🗂 CRM жизни", "🪷 CRM твоей жизни"], en: ["📖 Diary", "🗂 Life CRM", "🪷 Your Life CRM"], uk: ["📖 Щоденник", "🗂 CRM життя", "🪷 CRM твого життя"],
  fr: ["📖 Journal", "🗂 CRM de vie", "🪷 Ton CRM de vie"], es: ["📖 Diario", "🗂 CRM de vida", "🪷 Tu CRM de vida"],
};

// Прежняя подпись кнопки «Моя мотивация» — распознаём у старых клавиатур,
// чтобы нажатие вело в новое меню «Зачем я тебе».
export const GUIDE_LABEL_LEGACY: Record<string, string[]> = {
  ru: ["🔥 Моя мотивация", "🧭 Зачем я тебе"], en: ["🔥 My motivation", "🧭 Why I'm here"], uk: ["🔥 Моя мотивація", "🧭 Навіщо я тобі"],
  fr: ["🔥 Ma motivation", "🧭 Pourquoi moi"], es: ["🔥 Mi motivación", "🧭 Para qué te sirvo"],
};

// Лестница близости: подпись кнопки знакомства эволюционирует по мере роста
// прогресса — каждые 10% (≈10 ответов) новая «ступень отношений». 0% — базовая
// подпись (совпадает с KB.*.acquaint, чтобы не ломать остальные ссылки).
// Вайб «микс»: тепло + искорка юмора ближе к вершине.
const ACQ_LADDER: Record<string, { min: number; label: string }[]> = {
  ru: [
    { min: 0, label: KB.ru.acquaint }, { min: 5, label: "🌿 Продолжаем знакомиться" }, { min: 10, label: "🤿 Копнём глубже" }, { min: 20, label: "🤝 Притираемся" },
    { min: 30, label: "😌 Уже доверяю" }, { min: 40, label: "🫂 Больше, чем друзья" }, { min: 50, label: "👊 Братья" },
    { min: 60, label: "🎭 Уже можно и матом" }, { min: 70, label: "🏡 Семья" }, { min: 80, label: "🔥 Куда ещё ближе?" },
    { min: 90, label: "😎 Я в тебе не сомневался" },
  ],
  en: [
    { min: 0, label: KB.en.acquaint }, { min: 5, label: "🌿 Getting to know you" }, { min: 10, label: "🤿 Digging deeper" }, { min: 20, label: "🤝 Breaking the ice" },
    { min: 30, label: "😌 Starting to trust you" }, { min: 40, label: "🫂 More than friends" }, { min: 50, label: "👊 Brothers" },
    { min: 60, label: "🎭 We can swear now" }, { min: 70, label: "🏡 Family" }, { min: 80, label: "🔥 Can we get closer?" },
    { min: 90, label: "😎 Never doubted you" },
  ],
  uk: [
    { min: 0, label: KB.uk.acquaint }, { min: 5, label: "🌿 Продовжуємо знайомитись" }, { min: 10, label: "🤿 Копнемо глибше" }, { min: 20, label: "🤝 Притираємось" },
    { min: 30, label: "😌 Уже довіряю" }, { min: 40, label: "🫂 Більше, ніж друзі" }, { min: 50, label: "👊 Брати" },
    { min: 60, label: "🎭 Уже можна й матом" }, { min: 70, label: "🏡 Сім'я" }, { min: 80, label: "🔥 Куди ще ближче?" },
    { min: 90, label: "😎 Я в тобі не сумнівався" },
  ],
  fr: [
    { min: 0, label: KB.fr.acquaint }, { min: 5, label: "🌿 On fait connaissance" }, { min: 10, label: "🤿 Creusons plus loin" }, { min: 20, label: "🤝 On s'apprivoise" },
    { min: 30, label: "😌 Je te fais confiance" }, { min: 40, label: "🫂 Plus que des amis" }, { min: 50, label: "👊 Frères" },
    { min: 60, label: "🎭 On peut jurer" }, { min: 70, label: "🏡 Famille" }, { min: 80, label: "🔥 Encore plus proches ?" },
    { min: 90, label: "😎 Je n'ai jamais douté de toi" },
  ],
  es: [
    { min: 0, label: KB.es.acquaint }, { min: 5, label: "🌿 Seguimos conociéndonos" }, { min: 10, label: "🤿 Vamos más a fondo" }, { min: 20, label: "🤝 Nos vamos conociendo" },
    { min: 30, label: "😌 Ya confío en ti" }, { min: 40, label: "🫂 Más que amigos" }, { min: 50, label: "👊 Hermanos" },
    { min: 60, label: "🎭 Ya podemos hablar sin filtro" }, { min: 70, label: "🏡 Familia" }, { min: 80, label: "🔥 ¿Aún más cerca?" },
    { min: 90, label: "😎 Nunca dudé de ti" },
  ],
};

// Ступень близости для данного процента (базовая подпись без суффикса).
function ladderLabel(lang: string, pct: number): string {
  const rungs = ACQ_LADDER[lang] || ACQ_LADDER.ru;
  let label = rungs[0].label;
  for (const r of rungs) if (pct >= r.min) label = r.label; else break;
  return label;
}

// Подпись кнопки знакомства: ступень близости + прогресс «· 24%» (в процессе 1..99).
export function acquaintLabel(lang: string, pct?: number) {
  const p = typeof pct === "number" ? Math.max(0, Math.min(100, Math.floor(pct))) : 0;
  const base = ladderLabel(lang, p);
  return p > 0 && p < 100 ? `${base} · ${p}%` : base;
}

// Прежние подписи ступеней: у пользователей в чатах остались старые клавиатуры —
// нажатия по ним должны распознаваться и после переименования.
const ACQ_LEGACY = new Set(["🤫 Пошушукаемся", "🤫 Let's whisper", "🤫 Пошепочемось", "🤫 Chuchotons", "🤫 Cuchicheemos"]);

// Распознать нажатие кнопки знакомства при ЛЮБОЙ ступени/проценте (для buttonAction).
export function isAcquaintLabel(text?: string): boolean {
  if (!text) return false;
  const base = text.split(" · ")[0];
  if (ACQ_LEGACY.has(base)) return true;
  for (const lang of Object.keys(ACQ_LADDER)) {
    if ((ACQ_LADDER[lang] || []).some((r) => r.label === base)) return true;
  }
  return false;
}

export function mainKeyboard(lang: string, acquaintPct?: number) {
  const k = KB[lang] || KB.ru;
  return {
    keyboard: [
      [{ text: acquaintLabel(lang, acquaintPct) }],
      [{ text: k.diary }, { text: k.tasks }],
      [{ text: k.guide }, { text: k.invite }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}
