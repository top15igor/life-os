// Утренний пуш: короткая тёплая мотивация + мягкое напоминание про зарядку.
// Не навязчиво: одна короткая фраза, ротация по дню года — каждый день свежо,
// без чувства вины и без «ты должен».

const MORNING: Record<string, string[]> = {
  ru: [
    "☀️ Доброе утро! Сегодня — чистая страница, и она твоя. Потянись, сделай пару наклонов — пусть тело проснётся вместе с тобой.",
    "☀️ С добрым утром! Маленькое начало решает весь день. 5 минут зарядки — и ты уже выиграл утро.",
    "☀️ Утро доброе! Не нужно успеть всё — нужно просто начать. Разомни плечи и спину, вдохни поглубже. Поехали.",
    "☀️ Доброе утро! Тело по утрам любит движение даже больше кофе. Пара минут разминки — и энергии хватит на день.",
    "☀️ С добрым утром! День будет таким, каким ты его сделаешь. Лёгкая зарядка — и вперёд, спокойно и уверенно.",
    "☀️ Доброе утро! Ты сильнее, чем кажется спросонья. Встряхнись, потянись, улыбнись — день уже на твоей стороне.",
    "☀️ Утро! Один маленький шаг с утра — и весь день идёт легче. Начни с зарядки, остальное подтянется.",
    "☀️ Доброе утро! Заботиться о себе — это привычка, а не роскошь. Удели пару минут телу: разомнись, подвигайся. Хорошего дня 🙌",
  ],
  en: [
    "☀️ Good morning! Today is a blank page, and it's yours. Stretch, bend a little — let your body wake up with you.",
    "☀️ Morning! A small start sets the whole day. Five minutes of movement and you've already won the morning.",
    "☀️ Good morning! You don't need to do it all — just begin. Loosen your shoulders and back, breathe deep. Let's go.",
    "☀️ Morning! Your body loves movement more than coffee. A couple of minutes of exercise and you'll have energy for the day.",
    "☀️ Good morning! The day will be what you make it. A light warm-up, then forward — calm and steady.",
    "☀️ Morning! You're stronger than you feel half-awake. Shake it off, stretch, smile — the day's on your side.",
    "☀️ Good morning! One small step in the morning makes the whole day easier. Start with a stretch, the rest follows.",
    "☀️ Morning! Caring for yourself is a habit, not a luxury. Give your body a couple of minutes — move, stretch. Have a good day 🙌",
  ],
  uk: [
    "☀️ Доброго ранку! Сьогодні — чиста сторінка, і вона твоя. Потягнися, зроби кілька нахилів — нехай тіло прокинеться разом із тобою.",
    "☀️ З добрим ранком! Маленький початок вирішує весь день. 5 хвилин зарядки — і ти вже виграв ранок.",
    "☀️ Ранок добрий! Не треба встигнути все — треба просто почати. Розімни плечі та спину, вдихни глибше. Поїхали.",
    "☀️ Доброго ранку! Тіло зранку любить рух навіть більше за каву. Пара хвилин розминки — і енергії вистачить на день.",
    "☀️ З добрим ранком! День буде таким, яким ти його зробиш. Легка зарядка — і вперед, спокійно та впевнено.",
    "☀️ Доброго ранку! Ти сильніший, ніж здається спросоння. Струсись, потягнися, усміхнися — день уже на твоєму боці.",
    "☀️ Ранок! Один маленький крок зранку — і весь день іде легше. Почни із зарядки, решта підтягнеться.",
    "☀️ Доброго ранку! Дбати про себе — це звичка, а не розкіш. Удели пару хвилин тілу: розімнися, поворушися. Гарного дня 🙌",
  ],
  fr: [
    "☀️ Bonjour ! Aujourd'hui est une page blanche, et elle est à toi. Étire-toi, penche-toi un peu — laisse ton corps se réveiller avec toi.",
    "☀️ Bon matin ! Un petit début donne le ton de la journée. Cinq minutes de mouvement et tu as déjà gagné ta matinée.",
    "☀️ Bonjour ! Pas besoin de tout faire — juste de commencer. Détends tes épaules et ton dos, respire profondément. C'est parti.",
    "☀️ Bonjour ! Le corps aime le mouvement plus que le café. Quelques minutes d'exercice et tu auras de l'énergie pour la journée.",
    "☀️ Bon matin ! La journée sera ce que tu en fais. Un léger échauffement, puis en avant — calme et sûr.",
    "☀️ Bonjour ! Tu es plus fort que tu ne le sens au réveil. Secoue-toi, étire-toi, souris — la journée est de ton côté.",
    "☀️ Bonjour ! Un petit pas le matin rend toute la journée plus légère. Commence par un étirement, le reste suit.",
    "☀️ Bonjour ! Prendre soin de soi est une habitude, pas un luxe. Accorde deux minutes à ton corps : bouge, étire-toi. Bonne journée 🙌",
  ],
};

export function morningMessage(locale: string, seed: number): string {
  const pool = MORNING[locale] || MORNING.ru;
  return pool[Math.abs(seed) % pool.length];
}
