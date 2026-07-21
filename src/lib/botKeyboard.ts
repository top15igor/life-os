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

// Лестница близости: подпись кнопки знакомства эволюционирует по мере роста
// прогресса — каждые 10% (≈10 ответов) новая «ступень отношений». 0% — базовая
// подпись (совпадает с KB.*.acquaint, чтобы не ломать остальные ссылки).
// Вайб «микс»: тепло + искорка юмора ближе к вершине.
const ACQ_LADDER: Record<string, { min: number; label: string }[]> = {
  ru: [
    { min: 0, label: KB.ru.acquaint }, { min: 10, label: "🤫 Пошушукаемся" }, { min: 20, label: "🤝 Притираемся" },
    { min: 30, label: "😌 Уже доверяю" }, { min: 40, label: "🫂 Больше, чем друзья" }, { min: 50, label: "👊 Братья" },
    { min: 60, label: "🎭 Уже можно и матом" }, { min: 70, label: "🏡 Семья" }, { min: 80, label: "🔥 Куда ещё ближе?" },
    { min: 90, label: "😎 Я в тебе не сомневался" },
  ],
  en: [
    { min: 0, label: KB.en.acquaint }, { min: 10, label: "🤫 Let's whisper" }, { min: 20, label: "🤝 Breaking the ice" },
    { min: 30, label: "😌 Starting to trust you" }, { min: 40, label: "🫂 More than friends" }, { min: 50, label: "👊 Brothers" },
    { min: 60, label: "🎭 We can swear now" }, { min: 70, label: "🏡 Family" }, { min: 80, label: "🔥 Can we get closer?" },
    { min: 90, label: "😎 Never doubted you" },
  ],
  uk: [
    { min: 0, label: KB.uk.acquaint }, { min: 10, label: "🤫 Пошепочемось" }, { min: 20, label: "🤝 Притираємось" },
    { min: 30, label: "😌 Уже довіряю" }, { min: 40, label: "🫂 Більше, ніж друзі" }, { min: 50, label: "👊 Брати" },
    { min: 60, label: "🎭 Уже можна й матом" }, { min: 70, label: "🏡 Сім'я" }, { min: 80, label: "🔥 Куди ще ближче?" },
    { min: 90, label: "😎 Я в тобі не сумнівався" },
  ],
  fr: [
    { min: 0, label: KB.fr.acquaint }, { min: 10, label: "🤫 Chuchotons" }, { min: 20, label: "🤝 On s'apprivoise" },
    { min: 30, label: "😌 Je te fais confiance" }, { min: 40, label: "🫂 Plus que des amis" }, { min: 50, label: "👊 Frères" },
    { min: 60, label: "🎭 On peut jurer" }, { min: 70, label: "🏡 Famille" }, { min: 80, label: "🔥 Encore plus proches ?" },
    { min: 90, label: "😎 Je n'ai jamais douté de toi" },
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

// Распознать нажатие кнопки знакомства при ЛЮБОЙ ступени/проценте (для buttonAction).
export function isAcquaintLabel(text?: string): boolean {
  if (!text) return false;
  const base = text.split(" · ")[0];
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
      [{ text: k.motiv }, { text: k.invite }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}
