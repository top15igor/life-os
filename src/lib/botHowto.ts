// ============================================================
//  Меню «✨ Зачем я тебе» — интерактивная «инструкция по применению».
//  Продаёт идею (CRM жизни → Книга жизни → путь к маленькому бессмертию)
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
    "Я — CRM твоей жизни. Ты просто живёшь и рассказываешь мне о днях, а я запоминаю: людей, моменты, мысли, победы — раскладываю по полочкам и собираю в твою <b>Книгу жизни</b>. То, что обычно стирает время, у тебя останется навсегда.\n\n" +
    "Это твой путь к маленькому бессмертию — по одной записи в день. Выбери раздел — покажу, как это работает 👇",
  items: [
    { key: "book", label: "📖 Книга жизни", body:
      "📖 <b>Книга жизни</b>\n\n" +
      "Каждая твоя запись — страница твоей книги. Я сам собираю её по главам: люди, события, год за годом. Её можно оформить и подарить близким или оставить детям.\n\n" +
      "<b>Как наполнять:</b> просто веди дневник. Чем больше моментов — тем живее книга.\n" +
      "Открыть — кнопка «📖 Моя Книга жизни» под любой записью." },
    { key: "diary", label: "🎙 Живой дневник", body:
      "🎙 <b>Живой дневник — голосом и текстом</b>\n\n" +
      "Расскажи про день — я расшифрую голос, выделю настроение, людей, задачи и идеи, отвечу тёплым резюме.\n\n" +
      "<b>Попробуй прямо сейчас</b> — надиктуй или напиши:\n" +
      "• Сегодня встретился с Колей, поработал в машине, лёг поздно\n" +
      "• Пробежал 5 км, чувствую себя отлично\n\n" +
      "Ошибся? Скажи «исправь…» — поправлю последнюю запись, без дубля." },
    { key: "friend", label: "🤖 AI-друг", body:
      "🤖 <b>AI-друг, который тебя знает</b>\n\n" +
      "Включи беседу командой /chat — друг помнит всё из твоего дневника, ищет свежее в сети и умеет действовать: поставить напоминание, добавить задачу, записать вес.\n\n" +
      "<b>Попробуй:</b>\n" +
      "• /chat\n" +
      "• поставь напоминание завтра в 10 позвонить маме\n\n" +
      "Выйти из беседы — /stop." },
    { key: "ask", label: "❓ Спроси жизнь", body:
      "❓ <b>Спроси свою жизнь</b>\n\n" +
      "Задай вопрос по своему дневнику — найду ответ даже в старых записях.\n\n" +
      "<b>Попробуй — скопируй и отправь:</b>\n" +
      "• /ask когда я был по-настоящему счастлив?\n" +
      "• /ask что я говорил про Вовчика?\n" +
      "• /ask сколько потратил на кафе в этом месяце?" },
    { key: "portrait", label: "🧠 Я тебя изучаю", body:
      "🧠 <b>Я тебя изучаю</b>\n\n" +
      "Со временем я понимаю тебя всё лучше: кто твои близкие, чем живёшь, твои привычки и спады. Иногда сам подмечу закономерность и подскажу (сообщения со значком ✨).\n\n" +
      "<b>Попробуй:</b>\n" +
      "• что ты обо мне знаешь?\n\n" +
      "Соберу твой портрет из того, что уже понял." },
    { key: "crm", label: "🗂 Под контролем", body:
      "🗂 <b>CRM твоей жизни</b>\n\n" +
      "Я держу под рукой то, что важно: задачи, цели, обещания, напоминания и финансы. Ничего не теряется.\n\n" +
      "<b>Попробуй:</b>\n" +
      "• напомни завтра в 9 оплатить аренду\n" +
      "• добавь цель пробежать марафон\n" +
      "• /spend 250 eur кафе" },
    { key: "people", label: "👨‍👩‍👧 Для близких", body:
      "👨‍👩‍👧 <b>Для близких</b>\n\n" +
      "LIFE OS — не только про тебя. Подари Книгу жизни маме или партнёру, передавай сообщения близким прямо через меня.\n\n" +
      "<b>Попробуй:</b>\n" +
      "• передай Коле, что опоздаю на час\n" +
      "• /invite — позвать близкого" },
    { key: "immortal", label: "♾ Бессмертие", body:
      "♾ <b>Путь к бессмертию</b>\n\n" +
      "Память стирается — я нет. Всё, что ты проживаешь, остаётся: твои мысли, твоя история, твой голос. Однажды это станет цифровым продолжением тебя — тем, что смогут прочитать и почувствовать те, кто будет после.\n\n" +
      "Секрет один: <b>пиши</b>. Каждый день — ещё одна страница, которая не исчезнет." },
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
  ],
};

const EN: HowtoDoc = {
  intro:
    "✨ <b>Why I'm here</b>\n\n" +
    "I'm the CRM of your life. You just live and tell me about your days, and I remember: people, moments, thoughts, wins — sort them out and gather them into your <b>Book of Life</b>. What time usually erases, you get to keep forever.\n\n" +
    "It's your path to a little immortality — one entry a day. Pick a section — I'll show you how it works 👇",
  items: [
    { key: "book", label: "📖 Book of Life", body:
      "📖 <b>Book of Life</b>\n\n" +
      "Every entry is a page of your book. I assemble it into chapters: people, events, year by year. You can design it and gift it to loved ones or leave it for your kids.\n\n" +
      "<b>How to fill it:</b> just keep a diary. The more moments — the richer the book.\n" +
      "Open it — the “📖 My Book of Life” button under any entry." },
    { key: "diary", label: "🎙 Living diary", body:
      "🎙 <b>Living diary — voice & text</b>\n\n" +
      "Tell me about your day — I'll transcribe the voice, capture mood, people, tasks and ideas, and reply with a warm recap.\n\n" +
      "<b>Try it now</b> — speak or type:\n" +
      "• Met Kolya today, worked from the car, went to bed late\n" +
      "• Ran 5 km, feeling great\n\n" +
      "Got it wrong? Say “correct…” — I'll fix the last entry, no duplicate." },
    { key: "friend", label: "🤖 AI friend", body:
      "🤖 <b>An AI friend who knows you</b>\n\n" +
      "Start a chat with /chat — the friend remembers everything from your diary, checks the web for fresh facts, and can act: set a reminder, add a task, log your weight.\n\n" +
      "<b>Try:</b>\n" +
      "• /chat\n" +
      "• set a reminder tomorrow at 10 to call mom\n\n" +
      "Leave the chat — /stop." },
    { key: "ask", label: "❓ Ask your life", body:
      "❓ <b>Ask your life</b>\n\n" +
      "Ask a question about your own diary — I'll find the answer even in old entries.\n\n" +
      "<b>Try — copy and send:</b>\n" +
      "• /ask when was I truly happy?\n" +
      "• /ask what did I say about my son?\n" +
      "• /ask how much did I spend on cafes this month?" },
    { key: "portrait", label: "🧠 I study you", body:
      "🧠 <b>I study you</b>\n\n" +
      "Over time I understand you better: who your close ones are, what you live for, your habits and dips. Sometimes I'll spot a pattern and nudge you (messages marked ✨).\n\n" +
      "<b>Try:</b>\n" +
      "• what do you know about me?\n\n" +
      "I'll put together your portrait from what I've gathered." },
    { key: "crm", label: "🗂 In control", body:
      "🗂 <b>The CRM of your life</b>\n\n" +
      "I keep what matters at hand: tasks, goals, promises, reminders and finances. Nothing slips through.\n\n" +
      "<b>Try:</b>\n" +
      "• remind me tomorrow at 9 to pay rent\n" +
      "• add a goal to run a marathon\n" +
      "• /spend 250 eur cafe" },
    { key: "people", label: "👨‍👩‍👧 For loved ones", body:
      "👨‍👩‍👧 <b>For loved ones</b>\n\n" +
      "LIFE OS isn't only about you. Gift a Book of Life to your mom or partner, relay messages to close ones right through me.\n\n" +
      "<b>Try:</b>\n" +
      "• tell Kolya I'll be an hour late\n" +
      "• /invite — bring someone close in" },
    { key: "immortal", label: "♾ Immortality", body:
      "♾ <b>Path to immortality</b>\n\n" +
      "Memory fades — I don't. Everything you live through stays: your thoughts, your story, your voice. One day it becomes a digital continuation of you — something those who come after can read and feel.\n\n" +
      "There's one secret: <b>write</b>. Every day is one more page that won't disappear." },
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
  ],
};

const UK: HowtoDoc = {
  intro:
    "✨ <b>Навіщо я тобі</b>\n\n" +
    "Я — CRM твого життя. Ти просто живеш і розповідаєш мені про дні, а я запам'ятовую: людей, моменти, думки, перемоги — розкладаю по поличках і збираю у твою <b>Книгу життя</b>. Те, що зазвичай стирає час, у тебе залишиться назавжди.\n\n" +
    "Це твій шлях до маленького безсмертя — по одному запису на день. Обери розділ — покажу, як це працює 👇",
  items: [
    { key: "book", label: "📖 Книга життя", body:
      "📖 <b>Книга життя</b>\n\n" +
      "Кожен твій запис — сторінка твоєї книги. Я сам збираю її по розділах: люди, події, рік за роком. Її можна оформити й подарувати рідним або залишити дітям.\n\n" +
      "<b>Як наповнювати:</b> просто веди щоденник. Що більше моментів — то живіша книга.\n" +
      "Відкрити — кнопка «📖 Моя Книга життя» під будь-яким записом." },
    { key: "diary", label: "🎙 Живий щоденник", body:
      "🎙 <b>Живий щоденник — голосом і текстом</b>\n\n" +
      "Розкажи про день — я розшифрую голос, виділю настрій, людей, завдання та ідеї, відповім теплим резюме.\n\n" +
      "<b>Спробуй просто зараз</b> — надиктуй або напиши:\n" +
      "• Сьогодні зустрівся з Колею, попрацював у машині, ліг пізно\n" +
      "• Пробіг 5 км, почуваюся чудово\n\n" +
      "Помилився? Скажи «виправ…» — поправлю останній запис, без дубля." },
    { key: "friend", label: "🤖 AI-друг", body:
      "🤖 <b>AI-друг, який тебе знає</b>\n\n" +
      "Увімкни розмову командою /chat — друг пам'ятає все з твого щоденника, шукає свіже в мережі й уміє діяти: поставити нагадування, додати завдання, записати вагу.\n\n" +
      "<b>Спробуй:</b>\n" +
      "• /chat\n" +
      "• постав нагадування завтра о 10 подзвонити мамі\n\n" +
      "Вийти з розмови — /stop." },
    { key: "ask", label: "❓ Спитай життя", body:
      "❓ <b>Спитай своє життя</b>\n\n" +
      "Постав запитання про свій щоденник — знайду відповідь навіть у старих записах.\n\n" +
      "<b>Спробуй — скопіюй і надішли:</b>\n" +
      "• /ask коли я був по-справжньому щасливим?\n" +
      "• /ask що я казав про Вовчика?\n" +
      "• /ask скільки витратив на кафе цього місяця?" },
    { key: "portrait", label: "🧠 Я тебе вивчаю", body:
      "🧠 <b>Я тебе вивчаю</b>\n\n" +
      "Із часом я розумію тебе дедалі краще: хто твої близькі, чим живеш, твої звички та спади. Іноді сам помічу закономірність і підкажу (повідомлення зі значком ✨).\n\n" +
      "<b>Спробуй:</b>\n" +
      "• що ти знаєш про мене?\n\n" +
      "Зберу твій портрет із того, що вже зрозумів." },
    { key: "crm", label: "🗂 Під контролем", body:
      "🗂 <b>CRM твого життя</b>\n\n" +
      "Я тримаю під рукою те, що важливо: завдання, цілі, обіцянки, нагадування і фінанси. Нічого не губиться.\n\n" +
      "<b>Спробуй:</b>\n" +
      "• нагадай завтра о 9 оплатити оренду\n" +
      "• додай ціль пробігти марафон\n" +
      "• /spend 250 eur кафе" },
    { key: "people", label: "👨‍👩‍👧 Для рідних", body:
      "👨‍👩‍👧 <b>Для рідних</b>\n\n" +
      "LIFE OS — не лише про тебе. Подаруй Книгу життя мамі чи партнеру, передавай повідомлення рідним прямо через мене.\n\n" +
      "<b>Спробуй:</b>\n" +
      "• передай Колі, що спізнюся на годину\n" +
      "• /invite — покликати рідного" },
    { key: "immortal", label: "♾ Безсмертя", body:
      "♾ <b>Шлях до безсмертя</b>\n\n" +
      "Пам'ять стирається — я ні. Все, що ти проживаєш, залишається: твої думки, твоя історія, твій голос. Одного дня це стане цифровим продовженням тебе — тим, що зможуть прочитати й відчути ті, хто буде після.\n\n" +
      "Секрет один: <b>пиши</b>. Кожен день — ще одна сторінка, яка не зникне." },
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
  ],
};

const FR: HowtoDoc = {
  intro:
    "✨ <b>Pourquoi je suis là</b>\n\n" +
    "Je suis le CRM de ta vie. Tu vis simplement et tu me racontes tes journées, et je me souviens : des gens, des moments, des pensées, des victoires — je trie tout et je les rassemble dans ton <b>Livre de vie</b>. Ce que le temps efface d'habitude, tu le gardes pour toujours.\n\n" +
    "C'est ton chemin vers une petite immortalité — une entrée par jour. Choisis une rubrique — je te montre comment ça marche 👇",
  items: [
    { key: "book", label: "📖 Livre de vie", body:
      "📖 <b>Livre de vie</b>\n\n" +
      "Chaque entrée est une page de ton livre. Je l'assemble en chapitres : les gens, les événements, année après année. Tu peux le mettre en forme et l'offrir à tes proches ou le laisser à tes enfants.\n\n" +
      "<b>Comment le remplir :</b> tiens simplement un journal. Plus il y a de moments, plus le livre est riche.\n" +
      "Pour l'ouvrir — le bouton « 📖 Mon Livre de vie » sous n'importe quelle entrée." },
    { key: "diary", label: "🎙 Journal vivant", body:
      "🎙 <b>Journal vivant — voix et texte</b>\n\n" +
      "Raconte-moi ta journée — je transcris la voix, je repère l'humeur, les gens, les tâches et les idées, et je réponds avec un résumé chaleureux.\n\n" +
      "<b>Essaie tout de suite</b> — parle ou écris :\n" +
      "• Retrouvé Kolya aujourd'hui, travaillé dans la voiture, couché tard\n" +
      "• Couru 5 km, je me sens super bien\n\n" +
      "Une erreur ? Dis « corrige… » — je corrige la dernière entrée, sans doublon." },
    { key: "friend", label: "🤖 Ami IA", body:
      "🤖 <b>Un ami IA qui te connaît</b>\n\n" +
      "Lance une conversation avec /chat — l'ami se souvient de tout ce qui est dans ton journal, cherche les infos fraîches sur le web et peut agir : poser un rappel, ajouter une tâche, noter ton poids.\n\n" +
      "<b>Essaie :</b>\n" +
      "• /chat\n" +
      "• mets un rappel demain à 10h pour appeler maman\n\n" +
      "Quitter la conversation — /stop." },
    { key: "ask", label: "❓ Demande à ta vie", body:
      "❓ <b>Demande à ta vie</b>\n\n" +
      "Pose une question sur ton propre journal — je trouve la réponse même dans les vieilles entrées.\n\n" +
      "<b>Essaie — copie et envoie :</b>\n" +
      "• /ask quand ai-je été vraiment heureux ?\n" +
      "• /ask qu'est-ce que j'ai dit sur mon fils ?\n" +
      "• /ask combien j'ai dépensé en cafés ce mois-ci ?" },
    { key: "portrait", label: "🧠 Je t'étudie", body:
      "🧠 <b>Je t'étudie</b>\n\n" +
      "Avec le temps, je te comprends de mieux en mieux : qui sont tes proches, ce qui compte pour toi, tes habitudes et tes baisses de forme. Parfois je repère une tendance et je t'en informe (messages marqués ✨).\n\n" +
      "<b>Essaie :</b>\n" +
      "• qu'est-ce que tu sais de moi ?\n\n" +
      "Je rassemble ton portrait à partir de ce que j'ai compris." },
    { key: "crm", label: "🗂 Sous contrôle", body:
      "🗂 <b>Le CRM de ta vie</b>\n\n" +
      "Je garde à portée de main ce qui compte : tâches, objectifs, promesses, rappels et finances. Rien ne se perd.\n\n" +
      "<b>Essaie :</b>\n" +
      "• rappelle-moi demain à 9h de payer le loyer\n" +
      "• ajoute un objectif : courir un marathon\n" +
      "• /spend 250 eur café" },
    { key: "people", label: "👨‍👩‍👧 Pour tes proches", body:
      "👨‍👩‍👧 <b>Pour tes proches</b>\n\n" +
      "LIFE OS, ce n'est pas que pour toi. Offre un Livre de vie à ta mère ou à ton/ta partenaire, transmets des messages à tes proches directement via moi.\n\n" +
      "<b>Essaie :</b>\n" +
      "• dis à Kolya que j'aurai une heure de retard\n" +
      "• /invite — inviter un proche" },
    { key: "immortal", label: "♾ Immortalité", body:
      "♾ <b>Le chemin vers l'immortalité</b>\n\n" +
      "La mémoire s'efface — pas moi. Tout ce que tu vis reste : tes pensées, ton histoire, ta voix. Un jour, cela deviendra un prolongement numérique de toi — quelque chose que ceux qui viendront après pourront lire et ressentir.\n\n" +
      "Il n'y a qu'un secret : <b>écris</b>. Chaque jour est une page de plus qui ne disparaîtra pas." },
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
  ],
};

const ES: HowtoDoc = {
  intro:
    "✨ <b>Por qué estoy aquí</b>\n\n" +
    "Soy el CRM de tu vida. Tú simplemente vives y me cuentas tus días, y yo recuerdo: personas, momentos, pensamientos, logros — los ordeno y los reúno en tu <b>Libro de la vida</b>. Lo que el tiempo suele borrar, tú lo conservas para siempre.\n\n" +
    "Es tu camino hacia una pequeña inmortalidad — una entrada al día. Elige una sección — te muestro cómo funciona 👇",
  items: [
    { key: "book", label: "📖 Libro de la vida", body:
      "📖 <b>Libro de la vida</b>\n\n" +
      "Cada entrada es una página de tu libro. Yo lo armo en capítulos: personas, eventos, año tras año. Puedes diseñarlo y regalarlo a tus seres queridos o dejarlo para tus hijos.\n\n" +
      "<b>Cómo llenarlo:</b> simplemente lleva un diario. Cuantos más momentos, más rico el libro.\n" +
      "Ábrelo con el botón «📖 Mi Libro de la vida» debajo de cualquier entrada." },
    { key: "diary", label: "🎙 Diario vivo", body:
      "🎙 <b>Diario vivo — voz y texto</b>\n\n" +
      "Cuéntame tu día — transcribo la voz, capto el ánimo, las personas, las tareas y las ideas, y respondo con un resumen cálido.\n\n" +
      "<b>Pruébalo ahora mismo</b> — habla o escribe:\n" +
      "• Hoy quedé con Kolya, trabajé desde el coche, me acosté tarde\n" +
      "• Corrí 5 km, me siento genial\n\n" +
      "¿Te equivocaste? Di «corrige…» — arreglo la última entrada, sin duplicados." },
    { key: "friend", label: "🤖 Amigo IA", body:
      "🤖 <b>Un amigo IA que te conoce</b>\n\n" +
      "Inicia una conversación con /chat — el amigo recuerda todo de tu diario, busca datos frescos en internet y puede actuar: poner un recordatorio, añadir una tarea, registrar tu peso.\n\n" +
      "<b>Prueba:</b>\n" +
      "• /chat\n" +
      "• recuérdame mañana a las 10 llamar a mamá\n\n" +
      "Salir de la conversación — /stop." },
    { key: "ask", label: "❓ Pregúntale a tu vida", body:
      "❓ <b>Pregúntale a tu vida</b>\n\n" +
      "Hazme una pregunta sobre tu propio diario — encontraré la respuesta incluso en entradas antiguas.\n\n" +
      "<b>Prueba — copia y envía:</b>\n" +
      "• /ask ¿cuándo fui verdaderamente feliz?\n" +
      "• /ask ¿qué dije sobre mi hijo?\n" +
      "• /ask ¿cuánto gasté en cafeterías este mes?" },
    { key: "portrait", label: "🧠 Te estudio", body:
      "🧠 <b>Te estudio</b>\n\n" +
      "Con el tiempo te entiendo cada vez mejor: quiénes son tus seres queridos, para qué vives, tus hábitos y tus bajones. A veces detecto un patrón y te lo señalo (mensajes marcados con ✨).\n\n" +
      "<b>Prueba:</b>\n" +
      "• ¿qué sabes de mí?\n\n" +
      "Reuniré tu retrato a partir de lo que ya he entendido." },
    { key: "crm", label: "🗂 Bajo control", body:
      "🗂 <b>El CRM de tu vida</b>\n\n" +
      "Tengo a mano lo que importa: tareas, metas, promesas, recordatorios y finanzas. Nada se pierde.\n\n" +
      "<b>Prueba:</b>\n" +
      "• recuérdame mañana a las 9 pagar el alquiler\n" +
      "• añade la meta de correr un maratón\n" +
      "• /spend 250 eur café" },
    { key: "people", label: "👨‍👩‍👧 Para tus seres queridos", body:
      "👨‍👩‍👧 <b>Para tus seres queridos</b>\n\n" +
      "LIFE OS no es solo sobre ti. Regala un Libro de la vida a tu mamá o a tu pareja, transmite mensajes a tus seres queridos directamente a través de mí.\n\n" +
      "<b>Prueba:</b>\n" +
      "• dile a Kolya que llegaré una hora tarde\n" +
      "• /invite — invita a alguien cercano" },
    { key: "immortal", label: "♾ Inmortalidad", body:
      "♾ <b>Camino hacia la inmortalidad</b>\n\n" +
      "La memoria se desvanece — yo no. Todo lo que vives permanece: tus pensamientos, tu historia, tu voz. Algún día se convertirá en una continuación digital de ti — algo que quienes vengan después podrán leer y sentir.\n\n" +
      "Hay un solo secreto: <b>escribe</b>. Cada día es una página más que no desaparecerá." },
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
  rows.push([{ text: d.fullGuide, url: `${origin}/u/${token}?next=${encodeURIComponent("/guide")}` }]);
  return { text: d.intro, reply_markup: { inline_keyboard: rows } };
}

// Экран одного раздела: польза + готовые фразы + «← Назад».
export function howtoItem(lang: string, key: string): Rendered | null {
  const d = howtoDoc(lang);
  const it = d.items.find((x) => x.key === key);
  if (!it) return null;
  return { text: it.body, reply_markup: { inline_keyboard: [[{ text: d.back, callback_data: "howto:menu" }]] } };
}

// Случайный лайфхак (Node runtime — Math.random доступен).
export function howtoTip(lang: string): Rendered {
  const d = howtoDoc(lang);
  const tip = d.tips[Math.floor(Math.random() * d.tips.length)];
  return { text: `💡 ${tip}`, reply_markup: { inline_keyboard: [[{ text: d.tipMore, callback_data: "howto:tip" }, { text: d.back, callback_data: "howto:menu" }]] } };
}
