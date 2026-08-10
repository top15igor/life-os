import type { Locale } from "./i18n";

// Кейсы для правой колонки: не «что это за раздел» (это уже говорит hints),
// а зачем он в жизни — одна живая сцена, в которой человек узнаёт себя.
//
// Правило: сцена из обычной жизни + чем именно помогает. Без маркетинга и
// обещаний, только то, что продукт реально делает.

export type LifeCase = { emoji: string; text: string };

const C: Record<string, Record<Locale, LifeCase>> = {
  today: {
    ru: { emoji: "☕️", text: "Вечером не помнишь, куда делся день. Одна запись — и через год ты точно знаешь, чем он был занят." },
    en: { emoji: "☕️", text: "By evening the day is a blur. One entry — and a year from now you'll know exactly what it held." },
    uk: { emoji: "☕️", text: "Увечері не пам'ятаєш, куди подівся день. Один запис — і через рік ти точно знаєш, чим він був." },
    fr: { emoji: "☕️", text: "Le soir, la journée s'efface. Une note — et dans un an tu sauras exactement ce qu'elle contenait." },
    es: { emoji: "☕️", text: "Al anochecer el día se desdibuja. Una entrada — y en un año sabrás exactamente qué hubo en él." },
  },
  diary: {
    ru: { emoji: "🔎", text: "«Когда мы были в Порту?» — раньше искал в галерее полчаса. Теперь просто спрашиваешь." },
    en: { emoji: "🔎", text: "“When were we in Porto?” — you used to dig through photos for half an hour. Now you just ask." },
    uk: { emoji: "🔎", text: "«Коли ми були в Порту?» — раніше шукав у галереї півгодини. Тепер просто питаєш." },
    fr: { emoji: "🔎", text: "« C'était quand, Porto ? » — avant, trente minutes dans la galerie. Maintenant, tu demandes." },
    es: { emoji: "🔎", text: "«¿Cuándo estuvimos en Oporto?» — antes media hora en la galería. Ahora simplemente preguntas." },
  },
  health: {
    ru: { emoji: "😴", text: "Кажется, что после плохого сна день не задаётся. Здесь видно, правда это или только кажется." },
    en: { emoji: "😴", text: "It feels like bad sleep ruins the day. Here you can see whether that's true or just a feeling." },
    uk: { emoji: "😴", text: "Здається, після поганого сну день не вдається. Тут видно, чи це правда, чи лише здається." },
    fr: { emoji: "😴", text: "On croit qu'une mauvaise nuit gâche la journée. Ici tu vois si c'est vrai ou juste une impression." },
    es: { emoji: "😴", text: "Parece que dormir mal arruina el día. Aquí ves si es verdad o solo una sensación." },
  },
  goals: {
    ru: { emoji: "🎯", text: "Цель на год, о которой вспоминаешь в декабре. Ползунок раз в неделю — и она перестаёт быть тостом под ёлкой." },
    en: { emoji: "🎯", text: "The yearly goal you remember in December. A slider once a week, and it stops being a New Year's toast." },
    uk: { emoji: "🎯", text: "Ціль на рік, про яку згадуєш у грудні. Повзунок раз на тиждень — і це вже не тост під ялинкою." },
    fr: { emoji: "🎯", text: "L'objectif de l'année dont tu te souviens en décembre. Un curseur par semaine, et ce n'est plus un vœu." },
    es: { emoji: "🎯", text: "La meta del año que recuerdas en diciembre. Un deslizador por semana y deja de ser un brindis." },
  },
  reminders: {
    ru: { emoji: "💊", text: "«Дать ребёнку лекарство в 9» — сказал на ходу, пришло вовремя. Не надо помнить, надо просто сказать." },
    en: { emoji: "💊", text: "“Give the kid the medicine at 9” — said on the go, arrived on time. No need to remember, just to say it." },
    uk: { emoji: "💊", text: "«Дати дитині ліки о 9» — сказав на ходу, прийшло вчасно. Не треба пам'ятати, треба просто сказати." },
    fr: { emoji: "💊", text: "« Donner le médicament à 9h » — dit en marchant, arrivé à l'heure. Pas besoin de retenir, juste de le dire." },
    es: { emoji: "💊", text: "«Dar la medicina a las 9» — dicho de paso, llegó puntual. No hay que recordarlo, solo decirlo." },
  },
  finance: {
    ru: { emoji: "💸", text: "В конце месяца непонятно, куда ушли деньги. Здесь видно: не на крупное, а на сорок мелочей." },
    en: { emoji: "💸", text: "At month's end the money is just gone. Here you see it went not on one big thing, but on forty small ones." },
    uk: { emoji: "💸", text: "Наприкінці місяця незрозуміло, куди пішли гроші. Тут видно: не на велике, а на сорок дрібниць." },
    fr: { emoji: "💸", text: "En fin de mois, l'argent a disparu. Ici tu vois : pas un gros achat, mais quarante petits." },
    es: { emoji: "💸", text: "A fin de mes el dinero se esfumó. Aquí ves que no fue una compra grande, sino cuarenta pequeñas." },
  },
  family: {
    ru: { emoji: "👶", text: "Первое слово, первый шаг, смешная фраза за ужином. Через десять лет это будет дороже всех фотографий." },
    en: { emoji: "👶", text: "First word, first step, a funny line at dinner. In ten years that will be worth more than any photo." },
    uk: { emoji: "👶", text: "Перше слово, перший крок, смішна фраза за вечерею. Через десять років це дорожче за всі фото." },
    fr: { emoji: "👶", text: "Premier mot, premier pas, une phrase drôle à table. Dans dix ans, ça vaudra plus que les photos." },
    es: { emoji: "👶", text: "Primera palabra, primer paso, una frase graciosa en la cena. En diez años valdrá más que las fotos." },
  },
  people: {
    ru: { emoji: "🤝", text: "Друг пропал из жизни не по ссоре, а потому что «как-то не до того». Здесь видно, кого давно не слышал." },
    en: { emoji: "🤝", text: "A friend drifts away not after a fight, but because life got busy. Here you see who you haven't heard from." },
    uk: { emoji: "🤝", text: "Друг зник не через сварку, а бо «якось не до того». Тут видно, кого давно не чув." },
    fr: { emoji: "🤝", text: "Un ami s'éloigne non par dispute, mais par manque de temps. Ici tu vois qui tu n'as pas entendu depuis longtemps." },
    es: { emoji: "🤝", text: "Un amigo se aleja no por una pelea, sino porque la vida se llena. Aquí ves a quién hace mucho no escuchas." },
  },
  places: {
    ru: { emoji: "✈️", text: "Через пять лет откроешь Порту-2023 и вспомнишь не только море, но и что ел на набережной." },
    en: { emoji: "✈️", text: "Five years on you'll open Porto 2023 and recall not just the sea, but what you ate on the promenade." },
    uk: { emoji: "✈️", text: "Через п'ять років відкриєш Порту-2023 і згадаєш не лише море, а й що їв на набережній." },
    fr: { emoji: "✈️", text: "Dans cinq ans tu ouvriras Porto 2023 et tu te rappelleras aussi ce que tu as mangé sur le quai." },
    es: { emoji: "✈️", text: "En cinco años abrirás Oporto 2023 y recordarás no solo el mar, sino qué comiste en el paseo." },
  },
  projects: {
    ru: { emoji: "🧩", text: "Проект тянется полгода, и кажется, что топчешься на месте. Лента показывает, сколько уже сделано." },
    en: { emoji: "🧩", text: "A project drags for months and feels stuck. The feed shows how much is already behind you." },
    uk: { emoji: "🧩", text: "Проєкт тягнеться пів року, і здається, що тупцюєш на місці. Стрічка показує, скільки вже зроблено." },
    fr: { emoji: "🧩", text: "Un projet traîne et semble bloqué. Le fil montre tout ce qui est déjà fait." },
    es: { emoji: "🧩", text: "Un proyecto se alarga y parece atascado. El feed muestra cuánto ya llevas hecho." },
  },
  trace: {
    ru: { emoji: "🌱", text: "В плохой день кажется, что ничего хорошего не делаешь. Здесь список — и оказывается, что делаешь." },
    en: { emoji: "🌱", text: "On a bad day it feels like you do nothing good. Here's the list — turns out you do." },
    uk: { emoji: "🌱", text: "У поганий день здається, що нічого доброго не робиш. Тут список — і виявляється, робиш." },
    fr: { emoji: "🌱", text: "Un mauvais jour, on croit ne rien faire de bien. Voici la liste — en fait si." },
    es: { emoji: "🌱", text: "En un mal día parece que no haces nada bueno. Aquí está la lista — resulta que sí." },
  },
  lifebook: {
    ru: { emoji: "📖", text: "Дети однажды спросят, каким ты был в их возрасте. Фотографии этого не расскажут — а книга расскажет." },
    en: { emoji: "📖", text: "One day your kids will ask what you were like at their age. Photos won't tell them — this book will." },
    uk: { emoji: "📖", text: "Діти колись спитають, яким ти був у їхньому віці. Фото не розкажуть — а книга розкаже." },
    fr: { emoji: "📖", text: "Un jour tes enfants demanderont qui tu étais à leur âge. Les photos ne diront rien — ce livre, si." },
    es: { emoji: "📖", text: "Un día tus hijos preguntarán cómo eras a su edad. Las fotos no lo dirán — este libro sí." },
  },
  notes: {
    ru: { emoji: "🔑", text: "Код от домофона, размер фильтра, номер полиса. Всё то, что ищешь именно тогда, когда некогда искать." },
    en: { emoji: "🔑", text: "Door code, filter size, policy number. Exactly the things you need when there's no time to look." },
    uk: { emoji: "🔑", text: "Код від домофона, розмір фільтра, номер поліса. Усе те, що шукаєш саме тоді, коли ніколи шукати." },
    fr: { emoji: "🔑", text: "Code de la porte, taille du filtre, numéro de police. Ce qu'on cherche quand on n'a pas le temps." },
    es: { emoji: "🔑", text: "Código del portal, medida del filtro, número de póliza. Justo lo que buscas cuando no hay tiempo." },
  },
  knowledge: {
    ru: { emoji: "🔖", text: "Сохранил рецепт в Инстаграме — и больше не нашёл. Здесь он находится по смыслу, а не по памяти." },
    en: { emoji: "🔖", text: "You saved a recipe on Instagram and never found it again. Here it's found by meaning, not memory." },
    uk: { emoji: "🔖", text: "Зберіг рецепт в Інстаграмі — і більше не знайшов. Тут він знаходиться за змістом, а не за пам'яттю." },
    fr: { emoji: "🔖", text: "Une recette enregistrée sur Instagram, jamais retrouvée. Ici, on la retrouve par le sens." },
    es: { emoji: "🔖", text: "Guardaste una receta en Instagram y no la volviste a encontrar. Aquí se encuentra por su sentido." },
  },
  memory: {
    ru: { emoji: "🧾", text: "Сломался холодильник — а гарантия где-то в ящике. Сфотографировал один раз, нашёл за секунду." },
    en: { emoji: "🧾", text: "The fridge breaks and the warranty is in some drawer. Photograph it once, find it in a second." },
    uk: { emoji: "🧾", text: "Зламався холодильник — а гарантія десь у шухляді. Сфотографував один раз, знайшов за секунду." },
    fr: { emoji: "🧾", text: "Le frigo tombe en panne, la garantie est dans un tiroir. Photographie-la une fois, retrouve-la en une seconde." },
    es: { emoji: "🧾", text: "Se rompe la nevera y la garantía está en algún cajón. Fotografíala una vez y la encuentras al instante." },
  },
  books: {
    ru: { emoji: "📚", text: "«Читал что-то про это, но где?» — цитата, которую сохранил год назад, находится за пару секунд." },
    en: { emoji: "📚", text: "“I read something about this — but where?” A quote you saved a year ago turns up in seconds." },
    uk: { emoji: "📚", text: "«Читав щось про це, але де?» — цитата, збережена рік тому, знаходиться за пару секунд." },
    fr: { emoji: "📚", text: "« J'ai lu ça quelque part… » Une citation gardée l'an dernier ressort en deux secondes." },
    es: { emoji: "📚", text: "«Leí algo sobre esto, ¿pero dónde?» La cita que guardaste hace un año aparece en segundos." },
  },
  wishlist: {
    ru: { emoji: "🎁", text: "На день рождения снова спрашивают, что подарить. Даёшь ссылку — и никто не дарит третью кофеварку." },
    en: { emoji: "🎁", text: "Your birthday, and everyone asks what to get you. Send the link — nobody buys a third coffee maker." },
    uk: { emoji: "🎁", text: "На день народження знову питають, що подарувати. Даєш посилання — і ніхто не дарує третю кавоварку." },
    fr: { emoji: "🎁", text: "À ton anniversaire, tout le monde demande quoi t'offrir. Donne le lien — pas de troisième cafetière." },
    es: { emoji: "🎁", text: "En tu cumpleaños todos preguntan qué regalarte. Das el enlace — y nadie compra la tercera cafetera." },
  },
  analytics: {
    ru: { emoji: "✨", text: "Сам себя со стороны не видишь. AI замечает: после вечерних прогулок ты неделю пишешь совсем другим тоном." },
    en: { emoji: "✨", text: "You can't see yourself from outside. AI notices: after evening walks your entries change tone for a week." },
    uk: { emoji: "✨", text: "Сам себе збоку не бачиш. AI помічає: після вечірніх прогулянок ти тиждень пишеш іншим тоном." },
    fr: { emoji: "✨", text: "On ne se voit pas de l'extérieur. L'IA remarque : après tes marches du soir, ton ton change une semaine." },
    es: { emoji: "✨", text: "Uno no se ve desde fuera. La IA nota: tras los paseos nocturnos escribes con otro tono una semana." },
  },
  biographer: {
    ru: { emoji: "💬", text: "«Когда я был по-настоящему счастлив?» — на такое не ответит ни один поиск. А по твоим записям — ответ есть." },
    en: { emoji: "💬", text: "“When was I truly happy?” No search engine can answer that. Your own entries can." },
    uk: { emoji: "💬", text: "«Коли я був по-справжньому щасливий?» — на таке не відповість жоден пошук. А твої записи — відповідять." },
    fr: { emoji: "💬", text: "« Quand ai-je été vraiment heureux ? » Aucun moteur ne répond à ça. Tes notes, si." },
    es: { emoji: "💬", text: "«¿Cuándo fui de verdad feliz?» Ningún buscador responde eso. Tus propias entradas sí." },
  },
  mood: {
    ru: { emoji: "🌤", text: "Кажется, что месяц был тяжёлым. Календарь показывает: тяжёлыми были четыре дня, остальные — обычными." },
    en: { emoji: "🌤", text: "The month felt heavy. The calendar shows: four days were hard, the rest were ordinary." },
    uk: { emoji: "🌤", text: "Здається, місяць був важким. Календар показує: важкими були чотири дні, решта — звичайні." },
    fr: { emoji: "🌤", text: "Le mois a semblé dur. Le calendrier montre : quatre jours difficiles, le reste ordinaire." },
    es: { emoji: "🌤", text: "El mes pareció duro. El calendario muestra: cuatro días difíciles, el resto normales." },
  },
};

export function lifeCase(section: string | undefined, locale: Locale): LifeCase | null {
  if (!section) return null;
  const byLocale = C[section];
  return byLocale ? byLocale[locale] || byLocale.ru : null;
}
