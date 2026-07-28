// ============================================================
//  Меню «✨ Зачем я тебе» — интерактивная «инструкция по применению».
//  Продаёт идею («Сохранись» → Книга жизни → то, что останется близким)
//  и показывает главные способы применения: у каждого раздела — короткая
//  польза + готовые к отправке фразы. Плюс «🎲 Лайфхак» (случайный совет).
//  Рендер чистый (без БД); данные локализованы (ru+en, uk→ru, fr/es→en).
// ============================================================

export type HowtoItem = { key: string; label: string; body: string };
export type HowtoDoc = {
  intro: string;
  items: HowtoItem[];
  tipBtn: string;
  tipMore: string;
  back: string;
  fullGuide: string;
  tips: string[];
};

const RU: HowtoDoc = {
  intro:
    "✨ <b>Зачем я тебе</b>\n\n" +
    "Я помогаю тебе сохраниться. Ты просто живёшь и рассказываешь мне о днях, а я запоминаю: людей, моменты, мысли, победы — раскладываю по полочкам и собираю в твою <b>Книгу жизни</b>. То, что обычно стирает время, у тебя останется навсегда.\n\n" +
    "Сохранись — по одной записи в день, чтобы было куда вернуться. Выбери раздел — покажу, как это работает 👇",
  items: [
    { key: "diary", label: "🎙 Просто расскажи день", body:
      "🎙 <b>Просто расскажи день</b>\n\n" +
      "Голосом или текстом — как другу. Я расшифрую, пойму настроение, выделю людей, задачи и идеи и отвечу тёплым резюме. Заполнять и сортировать ничего не нужно.\n\n" +
      "<b>Попробуй прямо сейчас</b> — надиктуй или напиши:\n" +
      "• Сегодня встретился с Колей, поработал в машине, лёг поздно\n" +
      "• Пробежал 5 км, чувствую себя отлично\n\n" +
      "Ошибся? Скажи «исправь…» — поправлю последнюю запись, без дубля." },
    { key: "remind", label: "⏰ Ничего не забудешь", body:
      "⏰ <b>Ничего не забудешь</b>\n\n" +
      "Напоминания, заметки и списки — в одном чате, обычными словами.\n\n" +
      "<b>Напомню сам</b> — напишу точно в срок, с кнопками «Готово» и «Через час»:\n" +
      "• напомни завтра в 9 оплатить аренду\n" +
      "• напоминай каждый понедельник в 8 планировать неделю\n\n" +
      "<b>Запомню справку</b> — код, размер, адрес; потом просто спроси:\n" +
      "• запиши код от домофона 4582\n" +
      "• какой код от домофона?\n\n" +
      "<b>Соберу список</b> — вычёркивай кнопкой прямо в чате:\n" +
      "• добавь молоко и хлеб в список покупок\n" +
      "• что купить?\n\n" +
      "А «что у меня сегодня?» — покажу весь день одним списком." },
    { key: "friend", label: "🤖 Друг, который тебя знает", body:
      "🤖 <b>Друг, который тебя знает</b>\n\n" +
      "Включи беседу командой /chat — друг помнит всё из твоего дневника, ищет свежее в сети и умеет действовать: поставить напоминание, добавить задачу, записать вес. Выйти — /stop.\n\n" +
      "<b>А ещё он отвечает по твоей жизни</b> — даже по самым старым записям:\n" +
      "• /ask когда я был по-настоящему счастлив?\n" +
      "• /ask что я говорил про Вовчика?\n" +
      "• /ask сколько потратил на кафе в этом месяце?" },
    { key: "book", label: "📖 Книга жизни", body:
      "📖 <b>Книга жизни</b>\n\n" +
      "Каждая твоя запись — страница книги. Я сам собираю её по главам: люди, события, год за годом. Её можно оформить и подарить близким или оставить детям.\n\n" +
      "<b>Как наполнять:</b> просто рассказывай про дни. Чем больше моментов — тем живее книга.\n" +
      "Открыть — кнопка «📖 Моя Книга жизни» под любой записью.\n\n" +
      "Память стирается — книга нет. Однажды её прочитают те, кто будет после, и узнают тебя настоящего." },
    { key: "portrait", label: "🧠 Что я о тебе понял", body:
      "🧠 <b>Что я о тебе понял</b>\n\n" +
      "Со временем я понимаю тебя всё лучше: кто твои близкие, чем живёшь, что даёт энергию, а что забирает. Иногда сам подмечу закономерность и подскажу (сообщения со значком ✨).\n\n" +
      "<b>Попробуй:</b>\n" +
      "• что ты обо мне знаешь?\n" +
      "• /memories — покажу, что было в этот день год назад" },
    { key: "people", label: "🎁 Для близких", body:
      "🎁 <b>Для близких</b>\n\n" +
      "LIFE OS — не только про тебя. Подари Книгу жизни маме или партнёру, передавай сообщения через меня, пиши письма в будущее.\n\n" +
      "<b>Попробуй:</b>\n" +
      "• передай Коле, что опоздаю на час\n" +
      "• /capsule через 1 год Дорогой я из будущего…\n" +
      "• /invite — позвать близкого" },
  ],
  tipBtn: "🎲 Случайный лайфхак",
  tipMore: "🎲 Ещё лайфхак",
  back: "← Назад",
  fullGuide: "📚 Полная инструкция",
  tips: [
    "Скажи «исправь…» или «на самом деле…» — поправлю последнюю запись, без дубля.",
    "Пришли фото чека или документа — распознаю и сохраню в «Память». Потом спроси «найди техпаспорт».",
    "Длинное голосовое? Говори сколько нужно — сохраню целиком, мысль не потеряется.",
    "Скажи «передай Ане, что опоздаю» — доставлю сообщение прямо ей.",
    "Фото обложки книги с подписью «книга» — добавлю её в твой читательский дневник.",
    "Спроси /money — разберу твои траты и дам пару советов.",
    "Напоминания понимают повтор: «напоминай каждый понедельник в 8 планировать неделю».",
    "Упомяни цену в записи — «потратил 500 на продукты» — и я сам заведу расход.",
    "📸 /memories — покажу, что было в этот день год назад.",
    "⏳ Напиши письмо в будущее: /capsule через 5 лет … — доставлю точно в срок.",
  ],
};

const EN: HowtoDoc = {
  intro:
    "✨ <b>Why I'm here</b>\n\n" +
    "I help you save yourself. You just live and tell me about your days, and I remember: people, moments, thoughts, wins — sort them out and gather them into your <b>Book of Life</b>. What time usually erases, you get to keep forever.\n\n" +
    "Save yourself — one entry a day, so you have somewhere to return. Pick a section — I'll show you how it works 👇",
  items: [
    { key: "diary", label: "🎙 Just tell me your day", body:
      "🎙 <b>Just tell me your day</b>\n\n" +
      "By voice or text — like to a friend. I transcribe it, catch the mood, pull out people, tasks and ideas, and reply with a warm summary. Nothing to fill in or sort.\n\n" +
      "<b>Try it right now</b> — speak or type:\n" +
      "• Met Nick today, worked from the car, went to bed late\n" +
      "• Ran 5 km, feeling great\n\n" +
      "Got it wrong? Say “fix…” — I'll correct the last entry, no duplicates." },
    { key: "remind", label: "⏰ You won't forget a thing", body:
      "⏰ <b>You won't forget a thing</b>\n\n" +
      "Reminders, notes and lists — in one chat, in plain words.\n\n" +
      "<b>I'll remind you myself</b> — right on time, with “Done” and “In an hour” buttons:\n" +
      "• remind me tomorrow at 9 to pay the rent\n" +
      "• remind me every Monday at 8 to plan the week\n\n" +
      "<b>I'll keep the facts</b> — a code, a size, an address; just ask later:\n" +
      "• save a note: door code 4582\n" +
      "• what's the door code?\n\n" +
      "<b>I'll hold your list</b> — check items off with a tap in the chat:\n" +
      "• add milk and bread to the shopping list\n" +
      "• what should I buy?\n\n" +
      "And “what's on today?” shows your whole day in one list." },
    { key: "friend", label: "🤖 A friend who knows you", body:
      "🤖 <b>A friend who knows you</b>\n\n" +
      "Start a conversation with /chat — the friend remembers everything from your diary, searches the web for fresh info and can act: set a reminder, add a task, log your weight. Exit with /stop.\n\n" +
      "<b>It also answers from your own life</b> — even from the oldest entries:\n" +
      "• /ask when was I truly happy?\n" +
      "• /ask what did I say about Nick?\n" +
      "• /ask how much did I spend on cafes this month?" },
    { key: "book", label: "📖 Book of Life", body:
      "📖 <b>Book of Life</b>\n\n" +
      "Every entry is a page of your book. I assemble it into chapters myself: people, events, year by year. You can print it as a gift for your loved ones or leave it to your children.\n\n" +
      "<b>How to fill it:</b> just tell me about your days. The more moments, the more alive the book.\n" +
      "Open it — the “📖 My Book of Life” button under any entry.\n\n" +
      "Memory fades — the book doesn't. One day those who come after will read it and meet the real you." },
    { key: "portrait", label: "🧠 What I've learned about you", body:
      "🧠 <b>What I've learned about you</b>\n\n" +
      "Over time I understand you better: who your close ones are, what you live for, what gives you energy and what drains it. Sometimes I'll spot a pattern and tell you (messages marked ✨).\n\n" +
      "<b>Try:</b>\n" +
      "• what do you know about me?\n" +
      "• /memories — I'll show what happened on this day a year ago" },
    { key: "people", label: "🎁 For your loved ones", body:
      "🎁 <b>For your loved ones</b>\n\n" +
      "LIFE OS isn't only about you. Gift a Book of Life to your mom or partner, pass messages through me, write letters to the future.\n\n" +
      "<b>Try:</b>\n" +
      "• tell Nick I'll be an hour late\n" +
      "• /capsule in 1 year Dear future me…\n" +
      "• /invite — invite someone close" },
  ],
  tipBtn: "🎲 Random tip",
  tipMore: "🎲 Another tip",
  back: "← Back",
  fullGuide: "📚 Full guide",
  tips: [
    "Say “correct…” or “actually…” — I'll fix the last entry, no duplicate.",
    "Send a photo of a receipt or document — I'll read it and save it to “Memory”. Later ask “find the car registration”.",
    "Long voice note? Talk as long as you need — I'll save it in full, nothing lost.",
    "Say “tell Anna I'll be late” — I'll deliver the message to her.",
    "A photo of a book cover captioned “book” — I'll add it to your reading log.",
    "Ask /money — I'll break down your spending and give a couple of tips.",
    "Reminders understand repeats: “remind me every Monday at 8 to plan the week”.",
    "Mention an amount in an entry — “spent 500 on groceries” — and I'll log the expense myself.",
    "📸 /memories — I'll show what happened on this day a year ago.",
    "⏳ Write a letter to the future: /capsule in 5 years … — I'll deliver it right on time.",
  ],
};

const UK: HowtoDoc = {
  intro:
    "✨ <b>Навіщо я тобі</b>\n\n" +
    "Я допомагаю тобі зберегтися. Ти просто живеш і розповідаєш мені про дні, а я запам'ятовую: людей, моменти, думки, перемоги — розкладаю по поличках і збираю у твою <b>Книгу життя</b>. Те, що зазвичай стирає час, у тебе залишиться назавжди.\n\n" +
    "Збережися — по одному запису на день, щоб було куди повернутися. Обери розділ — покажу, як це працює 👇",
  items: [
    { key: "diary", label: "🎙 Просто розкажи день", body:
      "🎙 <b>Просто розкажи день</b>\n\n" +
      "Голосом або текстом — як другові. Я розшифрую, зрозумію настрій, виділю людей, задачі та ідеї й відповім теплим резюме. Заповнювати й сортувати нічого не треба.\n\n" +
      "<b>Спробуй просто зараз</b> — надиктуй або напиши:\n" +
      "• Сьогодні зустрівся з Колею, попрацював у машині, ліг пізно\n" +
      "• Пробіг 5 км, почуваюся чудово\n\n" +
      "Помилився? Скажи «виправ…» — поправлю останній запис, без дубля." },
    { key: "remind", label: "⏰ Нічого не забудеш", body:
      "⏰ <b>Нічого не забудеш</b>\n\n" +
      "Нагадування, нотатки та списки — в одному чаті, звичайними словами.\n\n" +
      "<b>Нагадаю сам</b> — напишу точно в строк, із кнопками «Готово» та «За годину»:\n" +
      "• нагадай завтра о 9 оплатити оренду\n" +
      "• нагадуй щопонеділка о 8 планувати тиждень\n\n" +
      "<b>Запам'ятаю довідку</b> — код, розмір, адресу; потім просто спитай:\n" +
      "• запиши код від домофона 4582\n" +
      "• який код від домофона?\n\n" +
      "<b>Зберу список</b> — викреслюй кнопкою прямо в чаті:\n" +
      "• додай молоко і хліб у список покупок\n" +
      "• що купити?\n\n" +
      "А «що в мене сьогодні?» — покажу весь день одним списком." },
    { key: "friend", label: "🤖 Друг, який тебе знає", body:
      "🤖 <b>Друг, який тебе знає</b>\n\n" +
      "Увімкни бесіду командою /chat — друг пам'ятає все з твого щоденника, шукає свіже в мережі й уміє діяти: поставити нагадування, додати задачу, записати вагу. Вийти — /stop.\n\n" +
      "<b>А ще він відповідає за твоїм життям</b> — навіть за найдавнішими записами:\n" +
      "• /ask коли я був по-справжньому щасливий?\n" +
      "• /ask що я казав про Вовчика?\n" +
      "• /ask скільки витратив на кафе цього місяця?" },
    { key: "book", label: "📖 Книга життя", body:
      "📖 <b>Книга життя</b>\n\n" +
      "Кожен твій запис — сторінка книги. Я сам збираю її за розділами: люди, події, рік за роком. Її можна оформити й подарувати близьким або залишити дітям.\n\n" +
      "<b>Як наповнювати:</b> просто розповідай про дні. Що більше моментів — то живіша книга.\n" +
      "Відкрити — кнопка «📖 Моя Книга життя» під будь-яким записом.\n\n" +
      "Пам'ять стирається — книга ні. Колись її прочитають ті, хто буде після, і впізнають тебе справжнього." },
    { key: "portrait", label: "🧠 Що я про тебе зрозумів", body:
      "🧠 <b>Що я про тебе зрозумів</b>\n\n" +
      "З часом я розумію тебе все краще: хто твої близькі, чим живеш, що дає енергію, а що забирає. Іноді сам помічу закономірність і підкажу (повідомлення зі значком ✨).\n\n" +
      "<b>Спробуй:</b>\n" +
      "• що ти про мене знаєш?\n" +
      "• /memories — покажу, що було цього дня рік тому" },
    { key: "people", label: "🎁 Для рідних", body:
      "🎁 <b>Для рідних</b>\n\n" +
      "LIFE OS — не лише про тебе. Подаруй Книгу життя мамі чи партнеру, передавай повідомлення через мене, пиши листи в майбутнє.\n\n" +
      "<b>Спробуй:</b>\n" +
      "• передай Колі, що запізнюся на годину\n" +
      "• /capsule через 1 рік Дорогий я з майбутнього…\n" +
      "• /invite — покликати близького" },
  ],
  tipBtn: "🎲 Випадковий лайфхак",
  tipMore: "🎲 Ще лайфхак",
  back: "← Назад",
  fullGuide: "📚 Повна інструкція",
  tips: [
    "Скажи «виправ…» або «насправді…» — поправлю останній запис, без дубля.",
    "Надішли фото чека чи документа — розпізнаю і збережу в «Пам'ять». Потім запитай «знайди техпаспорт».",
    "Довге голосове? Говори скільки потрібно — збережу цілком, думка не загубиться.",
    "Скажи «передай Ані, що спізнюся» — доставлю повідомлення прямо їй.",
    "Фото обкладинки книги з підписом «книга» — додам її до твого читацького щоденника.",
    "Запитай /money — розберу твої витрати і дам пару порад.",
    "Нагадування розуміють повтор: «нагадуй щопонеділка о 8 планувати тиждень».",
    "Згадай ціну в записі — «витратив 500 на продукти» — і я сам заведу витрату.",
    "📸 /memories — покажу, що було цього дня рік тому.",
    "⏳ Напиши листа в майбутнє: /capsule через 5 років … — доставлю точно у строк.",
  ],
};

const FR: HowtoDoc = {
  intro:
    "✨ <b>Pourquoi je suis là</b>\n\n" +
    "Je t'aide à te sauvegarder. Tu vis simplement et tu me racontes tes journées, et je me souviens : des gens, des moments, des pensées, des victoires — je trie tout et je les rassemble dans ton <b>Livre de vie</b>. Ce que le temps efface d'habitude, tu le gardes pour toujours.\n\n" +
    "Sauvegarde-toi — une entrée par jour, pour avoir un endroit où revenir. Choisis une rubrique — je te montre comment ça marche 👇",
  items: [
    { key: "diary", label: "🎙 Raconte-moi ta journée", body:
      "🎙 <b>Raconte-moi ta journée</b>\n\n" +
      "À la voix ou par écrit — comme à un ami. Je transcris, je saisis l'humeur, j'extrais les gens, les tâches et les idées, et je réponds par un résumé chaleureux. Rien à remplir ni à trier.\n\n" +
      "<b>Essaie tout de suite</b> — dicte ou écris :\n" +
      "• Vu Nicolas aujourd'hui, bossé depuis la voiture, couché tard\n" +
      "• Couru 5 km, je me sens super bien\n\n" +
      "Je me suis trompé ? Dis « corrige… » — je rectifie la dernière entrée, sans doublon." },
    { key: "remind", label: "⏰ Tu n'oublieras rien", body:
      "⏰ <b>Tu n'oublieras rien</b>\n\n" +
      "Rappels, notes et listes — dans un seul chat, en mots simples.\n\n" +
      "<b>Je te rappelle moi-même</b> — pile à l'heure, avec les boutons « Fait » et « Dans une heure » :\n" +
      "• rappelle-moi demain à 9h de payer le loyer\n" +
      "• rappelle-moi chaque lundi à 8h de planifier la semaine\n\n" +
      "<b>Je garde tes infos</b> — un code, une taille, une adresse ; demande plus tard :\n" +
      "• note : code du portail 4582\n" +
      "• quel est le code du portail ?\n\n" +
      "<b>Je tiens ta liste</b> — raye d'un tap dans le chat :\n" +
      "• ajoute le lait et le pain à la liste de courses\n" +
      "• qu'est-ce que je dois acheter ?\n\n" +
      "Et « qu'est-ce que j'ai aujourd'hui ? » affiche toute ta journée en une liste." },
    { key: "friend", label: "🤖 Un ami qui te connaît", body:
      "🤖 <b>Un ami qui te connaît</b>\n\n" +
      "Lance la conversation avec /chat — l'ami se souvient de tout ton journal, cherche du frais sur le web et sait agir : poser un rappel, ajouter une tâche, noter ton poids. Sortir — /stop.\n\n" +
      "<b>Il répond aussi d'après ta vie</b> — même les entrées les plus anciennes :\n" +
      "• /ask quand ai-je été vraiment heureux ?\n" +
      "• /ask qu'ai-je dit à propos de Nicolas ?\n" +
      "• /ask combien ai-je dépensé en cafés ce mois-ci ?" },
    { key: "book", label: "📖 Livre de vie", body:
      "📖 <b>Livre de vie</b>\n\n" +
      "Chaque entrée est une page de ton livre. Je l'assemble en chapitres : les gens, les événements, année après année. Tu peux l'imprimer pour l'offrir à tes proches ou le laisser à tes enfants.\n\n" +
      "<b>Comment le nourrir :</b> raconte simplement tes journées. Plus il y a de moments, plus le livre est vivant.\n" +
      "Ouvrir — le bouton « 📖 Mon Livre de vie » sous n'importe quelle entrée.\n\n" +
      "La mémoire s'efface — pas le livre. Un jour, ceux qui viendront après le liront et te découvriront vraiment." },
    { key: "portrait", label: "🧠 Ce que j'ai compris de toi", body:
      "🧠 <b>Ce que j'ai compris de toi</b>\n\n" +
      "Avec le temps je te comprends de mieux en mieux : qui sont tes proches, ce qui te fait vivre, ce qui te donne de l'énergie et ce qui t'en prend. Parfois je repère un schéma et je te le dis (messages avec ✨).\n\n" +
      "<b>Essaie :</b>\n" +
      "• que sais-tu de moi ?\n" +
      "• /memories — je montre ce qui s'est passé ce jour-là il y a un an" },
    { key: "people", label: "🎁 Pour tes proches", body:
      "🎁 <b>Pour tes proches</b>\n\n" +
      "LIFE OS n'est pas seulement pour toi. Offre un Livre de vie à ta mère ou ton partenaire, fais passer des messages par moi, écris des lettres au futur.\n\n" +
      "<b>Essaie :</b>\n" +
      "• dis à Nicolas que j'aurai une heure de retard\n" +
      "• /capsule dans 1 an Cher moi du futur…\n" +
      "• /invite — inviter un proche" },
  ],
  tipBtn: "🎲 Astuce aléatoire",
  tipMore: "🎲 Une autre astuce",
  back: "← Retour",
  fullGuide: "📚 Guide complet",
  tips: [
    "Dis « corrige… » ou « en fait… » — je corrige la dernière entrée, sans doublon.",
    "Envoie une photo d'un ticket ou d'un document — je le lis et l'enregistre dans « Mémoire ». Demande ensuite « trouve la carte grise ».",
    "Un long message vocal ? Parle aussi longtemps qu'il le faut — je l'enregistre en entier, rien ne se perd.",
    "Dis « dis à Anna que je serai en retard » — je lui transmets le message.",
    "Une photo de couverture de livre avec la légende « livre » — je l'ajoute à ton journal de lecture.",
    "Demande /money — j'analyse tes dépenses et je te donne quelques conseils.",
    "Les rappels comprennent la répétition : « rappelle-moi tous les lundis à 8h de planifier la semaine ».",
    "Mentionne un montant dans une entrée — « dépensé 500 en courses » — et j'enregistre la dépense moi-même.",
    "📸 /memories — je te montre ce qui s'est passé ce jour-là il y a un an.",
    "⏳ Écris une lettre pour le futur : /capsule dans 5 ans … — je la livre pile à temps.",
  ],
};

const ES: HowtoDoc = {
  intro:
    "✨ <b>Por qué estoy aquí</b>\n\n" +
    "Te ayudo a guardarte. Tú simplemente vives y me cuentas tus días, y yo recuerdo: personas, momentos, pensamientos, logros — los ordeno y los reúno en tu <b>Libro de la vida</b>. Lo que el tiempo suele borrar, tú lo conservas para siempre.\n\n" +
    "Guárdate — una entrada al día, para tener adónde volver. Elige una sección — te muestro cómo funciona 👇",
  items: [
    { key: "diary", label: "🎙 Cuéntame tu día", body:
      "🎙 <b>Cuéntame tu día</b>\n\n" +
      "Por voz o por texto — como a un amigo. Lo transcribo, capto el ánimo, extraigo personas, tareas e ideas, y respondo con un resumen cercano. No hay nada que rellenar ni ordenar.\n\n" +
      "<b>Pruébalo ahora mismo</b> — dicta o escribe:\n" +
      "• Hoy vi a Nico, trabajé desde el coche, me acosté tarde\n" +
      "• Corrí 5 km, me siento genial\n\n" +
      "¿Me equivoqué? Di «corrige…» — arreglo la última entrada, sin duplicados." },
    { key: "remind", label: "⏰ No olvidarás nada", body:
      "⏰ <b>No olvidarás nada</b>\n\n" +
      "Recordatorios, notas y listas — en un solo chat, con palabras normales.\n\n" +
      "<b>Te aviso yo mismo</b> — justo a tiempo, con botones «Hecho» y «En una hora»:\n" +
      "• recuérdame mañana a las 9 pagar el alquiler\n" +
      "• recuérdame cada lunes a las 8 planear la semana\n\n" +
      "<b>Guardo tus datos</b> — un código, una talla, una dirección; luego pregunta:\n" +
      "• apunta: código del portal 4582\n" +
      "• ¿cuál es el código del portal?\n\n" +
      "<b>Llevo tu lista</b> — tacha con un toque en el chat:\n" +
      "• añade leche y pan a la lista de compras\n" +
      "• ¿qué tengo que comprar?\n\n" +
      "Y «¿qué tengo hoy?» muestra todo tu día en una lista." },
    { key: "friend", label: "🤖 Un amigo que te conoce", body:
      "🤖 <b>Un amigo que te conoce</b>\n\n" +
      "Abre la conversación con /chat — el amigo recuerda todo tu diario, busca lo último en la web y sabe actuar: poner un recordatorio, añadir una tarea, registrar tu peso. Salir — /stop.\n\n" +
      "<b>Y además responde desde tu propia vida</b> — incluso desde las entradas más antiguas:\n" +
      "• /ask ¿cuándo fui de verdad feliz?\n" +
      "• /ask ¿qué dije sobre Nico?\n" +
      "• /ask ¿cuánto gasté en cafeterías este mes?" },
    { key: "book", label: "📖 Libro de la vida", body:
      "📖 <b>Libro de la vida</b>\n\n" +
      "Cada entrada es una página de tu libro. Yo mismo lo armo por capítulos: personas, eventos, año tras año. Puedes imprimirlo para regalarlo a los tuyos o dejárselo a tus hijos.\n\n" +
      "<b>Cómo llenarlo:</b> simplemente cuéntame tus días. Cuantos más momentos, más vivo el libro.\n" +
      "Abrirlo — el botón «📖 Mi Libro de la vida» bajo cualquier entrada.\n\n" +
      "La memoria se borra — el libro no. Algún día lo leerán quienes vengan después y te conocerán de verdad." },
    { key: "portrait", label: "🧠 Lo que he entendido de ti", body:
      "🧠 <b>Lo que he entendido de ti</b>\n\n" +
      "Con el tiempo te entiendo cada vez mejor: quiénes son tus cercanos, de qué vives, qué te da energía y qué te la quita. A veces noto un patrón y te lo digo (mensajes con ✨).\n\n" +
      "<b>Prueba:</b>\n" +
      "• ¿qué sabes de mí?\n" +
      "• /memories — te muestro qué pasó este día hace un año" },
    { key: "people", label: "🎁 Para tus seres queridos", body:
      "🎁 <b>Para tus seres queridos</b>\n\n" +
      "LIFE OS no es solo sobre ti. Regala un Libro de la vida a tu madre o a tu pareja, envía mensajes a través de mí, escribe cartas al futuro.\n\n" +
      "<b>Prueba:</b>\n" +
      "• dile a Nico que llegaré una hora tarde\n" +
      "• /capsule en 1 año Querido yo del futuro…\n" +
      "• /invite — invitar a alguien cercano" },
  ],
  tipBtn: "🎲 Consejo al azar",
  tipMore: "🎲 Otro consejo",
  back: "← Atrás",
  fullGuide: "📚 Guía completa",
  tips: [
    "Di «corrige…» o «en realidad…» — arreglo la última entrada, sin duplicados.",
    "Envía una foto de un recibo o documento — lo leo y lo guardo en «Memoria». Luego pregunta «encuentra la ficha técnica del coche».",
    "¿Nota de voz larga? Habla todo lo que necesites — la guardo entera, no se pierde nada.",
    "Di «dile a Ana que llegaré tarde» — le entrego el mensaje.",
    "Una foto de la portada de un libro con el pie «libro» — la añado a tu registro de lectura.",
    "Pregunta /money — analizo tus gastos y te doy un par de consejos.",
    "Los recordatorios entienden repeticiones: «recuérdame cada lunes a las 8 planear la semana».",
    "Menciona un importe en una entrada — «gasté 500 en el súper» — y registro el gasto yo mismo.",
    "📸 /memories — te muestro qué pasó este día hace un año.",
    "⏳ Escribe una carta para el futuro: /capsule en 5 años … — la entrego justo a tiempo.",
  ],
};

export function howtoDoc(lang: string): HowtoDoc {
  if (lang === "uk") return UK;
  if (lang === "fr") return FR;
  if (lang === "es") return ES;
  if (lang === "en") return EN;
  return RU;
}

type Rendered = { text: string; reply_markup: any };

// Главное меню «Зачем я тебе»: интро + разделы (2 в ряд) + лайфхак + полная инструкция.
export function howtoMenu(lang: string, origin: string, token: string): Rendered {
  const d = howtoDoc(lang);
  const rows: any[] = [];
  for (let i = 0; i < d.items.length; i += 2) {
    rows.push(d.items.slice(i, i + 2).map((it) => ({ text: it.label, callback_data: `howto:i:${it.key}` })));
  }
  rows.push([{ text: d.tipBtn, callback_data: "howto:tip" }]);
  const ALL_FEATURES: Record<string, string> = { ru: "📋 Все возможности", en: "📋 All features", uk: "📋 Усі можливості", fr: "📋 Toutes les fonctions", es: "📋 Todas las funciones" };
  // web_app-кнопка открывает страницу СРАЗУ внутри Telegram, без диалога «Открыть ссылку?».
  rows.push([{ text: ALL_FEATURES[lang] || ALL_FEATURES.ru, web_app: { url: `${origin}/features` } }]);
  rows.push([{ text: d.fullGuide, url: `${origin}/go?next=${encodeURIComponent("/guide")}` }]);
  return { text: d.intro, reply_markup: { inline_keyboard: rows } };
}

// Разделы меню объединяли: старые кнопки (в уже отправленных сообщениях)
// ведут в новые разделы, а не в пустоту.
const KEY_ALIAS: Record<string, string> = {
  ask: "friend",        // «Спроси жизнь» → внутри «Друг, который тебя знает»
  crm: "remind",        // «Под контролем» → «Ничего не забудешь»
  immortal: "book",     // «Сохранись» → финал текста «Книги жизни»
  onthisday: "portrait",// «В этот день» → «Что я о тебе понял»
  capsule: "people",    // «Капсула времени» → «Для близких»
};
export const resolveHowtoKey = (key: string): string => KEY_ALIAS[key] || key;

// Экран одного раздела: польза + готовые фразы + «← Назад».
export function howtoItem(lang: string, key: string): Rendered | null {
  const d = howtoDoc(lang);
  const it = d.items.find((x) => x.key === resolveHowtoKey(key));
  if (!it) return null;
  return { text: it.body, reply_markup: { inline_keyboard: [[{ text: d.back, callback_data: "howto:menu" }]] } };
}

// Случайный лайфхак (Node runtime — Math.random доступен).
export function howtoTip(lang: string): Rendered {
  const d = howtoDoc(lang);
  const tip = d.tips[Math.floor(Math.random() * d.tips.length)];
  return { text: `💡 ${tip}`, reply_markup: { inline_keyboard: [[{ text: d.tipMore, callback_data: "howto:tip" }, { text: d.back, callback_data: "howto:menu" }]] } };
}
