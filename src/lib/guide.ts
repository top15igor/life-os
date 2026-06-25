import type { Locale } from "./i18n";

type Guide = {
  title: string;
  pitch: string;
  openBot: string;
  whatTitle: string;
  what: string;
  howTitle: string;
  how: string[];
  assistantTitle: string;
  assistant: string[];
  cmdTitle: string;
  cmds: [string, string][];
  sectionsTitle: string;
  lifehacksTitle: string;
  lifehacks: string[];
  privacyTitle: string;
  privacy: string;
};

const G: Record<Locale, Guide> = {
  ru: {
    title: "Инструкция",
    pitch: "LIFE OS — твоя личная операционная система жизни. Ты говоришь — AI сохраняет, понимает и пишет твою Книгу жизни.",
    openBot: "Открыть бота в Telegram",
    whatTitle: "Что это",
    what: "Это дневник нового поколения. Каждый день ты в пару касаний рассказываешь, что произошло, а AI превращает это в структурированную историю: категории, теги, настроение, инсайты, задачи, люди и проекты — и со временем строит карту твоей жизни.",
    howTitle: "Как пользоваться",
    how: [
      "🎤 Наговори голосовое или напиши текст боту в Telegram — о чём угодно: день, мысли, здоровье, идеи, тренировки, семья.",
      "🧠 AI распознает речь, разложит по полочкам и выделит главное.",
      "🌐 Открой веб-версию (кнопка в боте) — там дневник, аналитика, поиск и AI-Биограф.",
    ],
    assistantTitle: "Бот-ассистент",
    assistant: [
      "Просто задай вопрос — бот сам поймёт, что это вопрос, и ответит по твоему дневнику. Например: «какие у меня цели?», «что я писал про спорт?», «когда я последний раз болел?».",
      "Расскажешь про день — бот сохранит это как запись. Если сомневается — сохраняет, чтобы не потерять мысль.",
      "Хочешь наверняка: /ask … — точно задать вопрос, /save … — точно сохранить запись.",
    ],
    cmdTitle: "Команды бота",
    cmds: [
      ["/start", "приветствие и твоя личная ссылка на сайт"],
      ["/link", "получить ссылку на веб-дневник заново"],
      ["/invite", "пригласить друга"],
      ["/demo", "посмотреть приветственный диалог"],
      ["/ask …", "спросить ассистента (или просто задай вопрос — бот поймёт сам)"],
      ["/save …", "сохранить как запись принудительно"],
    ],
    sectionsTitle: "Разделы",
    lifehacksTitle: "Лайфхаки",
    lifehacks: [
      "Пиши каждый день хотя бы пару строк — привычка и стрик 🔥 важнее объёма.",
      "Голос быстрее текста: 30 секунд на ходу = полноценная запись.",
      "Упоминай имена и проекты — так AI строит связи (Life Intelligence) и карту жизни.",
      "Раз в неделю спроси Биографа: «как прошла моя неделя?» или «расскажи историю проекта».",
      "Плохой день — тоже запись. Именно из них потом видно, что влияет на настроение.",
      "Не идеальничай — наговаривай как есть, AI сам причешет формулировки.",
      "В вебе тоже можно наговаривать голосом — нажми 🎤 рядом с «Добавить» на главной.",
      "Загляни в «Лабораторию»: проверь гипотезу AI экспериментом (напр. ложиться раньше) — и увидишь честный итог «до/после».",
      "В боте можно просто задать вопрос — он сам поймёт, ответить или сохранить (а ещё кнопки и команда /ask).",
    ],
    privacyTitle: "Приватность",
    privacy: "Дневник виден только тебе. Команда не читает твои записи — для аналитики видны лишь обезличенные цифры. AI обрабатывает текст только ради твоих резюме и ответов и не используется для обучения моделей. Данные шифруются, удалить всё можно в любой момент.",
  },
  en: {
    title: "Guide",
    pitch: "LIFE OS is your personal operating system for life. You speak — AI saves it, understands it and writes your Book of Life.",
    openBot: "Open the bot in Telegram",
    whatTitle: "What it is",
    what: "A next-generation diary. Each day you tell it what happened in a couple of taps, and AI turns it into a structured story: categories, tags, mood, insights, tasks, people and projects — and over time builds a map of your life.",
    howTitle: "How to use it",
    how: [
      "🎤 Send a voice note or text to the Telegram bot — anything: your day, thoughts, health, ideas, workouts, family.",
      "🧠 AI transcribes it, sorts it out and extracts what matters.",
      "🌐 Open the web version (button in the bot) — diary, analytics, search and the AI Biographer.",
    ],
    assistantTitle: "Assistant",
    assistant: [
      "Just ask a question — the bot recognizes it's a question and answers from your diary. E.g. “what are my goals?”, “what did I write about sport?”, “when was I last sick?”.",
      "Tell it about your day — it saves that as an entry. When unsure, it saves, so no thought is lost.",
      "Want to be sure: /ask … to ask for certain, /save … to save for certain.",
    ],
    cmdTitle: "Bot commands",
    cmds: [
      ["/start", "welcome and your personal link"],
      ["/link", "get your web diary link again"],
      ["/invite", "invite a friend"],
      ["/demo", "replay the welcome dialog"],
      ["/ask …", "ask the assistant (or just ask — the bot figures it out)"],
      ["/save …", "force-save as an entry"],
    ],
    sectionsTitle: "Sections",
    lifehacksTitle: "Tips & tricks",
    lifehacks: [
      "Write a few lines every day — the habit and the streak 🔥 matter more than length.",
      "Voice is faster than typing: 30 seconds on the go = a full entry.",
      "Mention names and projects — that's how AI builds connections (Life Intelligence) and your life map.",
      "Once a week, ask the Biographer: “how was my week?” or “tell the story of my project”.",
      "A bad day is an entry too. Those reveal what actually affects your mood.",
      "Don't aim for perfect — just talk; AI will polish the wording.",
      "On the web you can record by voice too — tap 🎤 next to “Add” on the home screen.",
      "Try the Lab: test an AI hypothesis with an experiment (e.g. earlier bedtime) and see an honest before/after.",
      "In the bot you can just ask a question — it figures out whether to answer or save (plus buttons and /ask).",
    ],
    privacyTitle: "Privacy",
    privacy: "Only you can see your diary. The team doesn't read your entries — analytics show only anonymous numbers. AI processes the text only for your summaries and answers, and isn't used to train models. Data is encrypted; you can delete everything anytime.",
  },
  uk: {
    title: "Інструкція",
    pitch: "LIFE OS — твоя особиста операційна система життя. Ти говориш — AI зберігає, розуміє й пише твою Книгу життя.",
    openBot: "Відкрити бота в Telegram",
    whatTitle: "Що це",
    what: "Щоденник нового покоління. Щодня ти в кілька дотиків розповідаєш, що сталося, а AI перетворює це на структуровану історію: категорії, теги, настрій, інсайти, завдання, люди й проєкти — і з часом будує карту твого життя.",
    howTitle: "Як користуватися",
    how: [
      "🎤 Надішли голосове або текст боту в Telegram — про що завгодно: день, думки, здоров'я, ідеї, тренування, сім'я.",
      "🧠 AI розпізнає мовлення, розкладе по полицях і виділить головне.",
      "🌐 Відкрий веб-версію (кнопка в боті) — щоденник, аналітика, пошук і AI-Біограф.",
    ],
    assistantTitle: "Бот-асистент",
    assistant: [
      "Просто постав питання — бот сам зрозуміє, що це питання, і відповість за твоїм щоденником. Напр.: «які в мене цілі?», «що я писав про спорт?».",
      "Розкажеш про день — бот збереже це як запис. Якщо сумнівається — зберігає, щоб не втратити думку.",
      "Хочеш напевно: /ask … — точно запитати, /save … — точно зберегти запис.",
    ],
    cmdTitle: "Команди бота",
    cmds: [
      ["/start", "привітання і твоє особисте посилання"],
      ["/link", "отримати посилання на веб-щоденник знову"],
      ["/invite", "запросити друга"],
      ["/demo", "переглянути привітальний діалог"],
      ["/ask …", "запитати асистента (або просто постав питання — бот зрозуміє)"],
      ["/save …", "примусово зберегти як запис"],
    ],
    sectionsTitle: "Розділи",
    lifehacksTitle: "Лайфхаки",
    lifehacks: [
      "Пиши щодня хоча б кілька рядків — звичка і стрик 🔥 важливіші за обсяг.",
      "Голос швидший за текст: 30 секунд на ходу = повноцінний запис.",
      "Згадуй імена та проєкти — так AI будує зв'язки (Life Intelligence) і карту життя.",
      "Раз на тиждень запитай Біографа: «як минув мій тиждень?».",
      "Поганий день — теж запис. Саме з них видно, що впливає на настрій.",
      "Не намагайся ідеально — говори як є, AI причеше формулювання.",
      "У вебі теж можна наговорювати голосом — натисни 🎤 біля «Додати» на головній.",
      "Зазирни в «Лабораторію»: перевір гіпотезу AI експериментом — і побачиш чесний підсумок «до/після».",
      "У боті можна просто поставити питання — він сам зрозуміє, відповісти чи зберегти (а ще кнопки й /ask).",
    ],
    privacyTitle: "Приватність",
    privacy: "Щоденник бачиш лише ти. Команда не читає твої записи — в аналітиці лише знеособлені цифри. AI обробляє текст тільки заради твоїх резюме й відповідей і не використовується для навчання моделей. Дані шифруються, видалити все можна будь-коли.",
  },
  fr: {
    title: "Guide",
    pitch: "LIFE OS est ton système d'exploitation personnel pour la vie. Tu parles — l'IA sauvegarde, comprend et écrit ton Livre de vie.",
    openBot: "Ouvrir le bot dans Telegram",
    whatTitle: "Qu'est-ce que c'est",
    what: "Un journal nouvelle génération. Chaque jour tu racontes ta journée en quelques gestes, et l'IA en fait une histoire structurée : catégories, tags, humeur, insights, tâches, personnes et projets — et au fil du temps, une carte de ta vie.",
    howTitle: "Comment l'utiliser",
    how: [
      "🎤 Envoie une note vocale ou un texte au bot Telegram — tout : ta journée, tes pensées, ta santé, tes idées, le sport, la famille.",
      "🧠 L'IA transcrit, organise et extrait l'essentiel.",
      "🌐 Ouvre la version web (bouton dans le bot) — journal, analytique, recherche et le Biographe IA.",
    ],
    assistantTitle: "Assistant",
    assistant: [
      "Pose simplement une question — le bot comprend que c'est une question et répond à partir de ton journal. Ex. : « quels sont mes objectifs ? », « qu'ai-je écrit sur le sport ? ».",
      "Raconte ta journée — il l'enregistre comme une entrée. En cas de doute, il enregistre, pour ne rien perdre.",
      "Pour être sûr : /ask … pour demander, /save … pour enregistrer.",
    ],
    cmdTitle: "Commandes du bot",
    cmds: [
      ["/start", "accueil et ton lien personnel"],
      ["/link", "récupérer ton lien web"],
      ["/invite", "inviter un ami"],
      ["/demo", "revoir le dialogue d'accueil"],
      ["/ask …", "demander à l'assistant (ou pose ta question — le bot comprend)"],
      ["/save …", "forcer l'enregistrement comme entrée"],
    ],
    sectionsTitle: "Sections",
    lifehacksTitle: "Astuces",
    lifehacks: [
      "Écris quelques lignes chaque jour — l'habitude et la série 🔥 comptent plus que la longueur.",
      "La voix est plus rapide : 30 secondes en chemin = une entrée complète.",
      "Mentionne les noms et les projets — ainsi l'IA crée des liens (Life Intelligence) et ta carte de vie.",
      "Une fois par semaine, demande au Biographe : « comment s'est passée ma semaine ? ».",
      "Une mauvaise journée est aussi une entrée. Elles révèlent ce qui influence ton humeur.",
      "Ne vise pas la perfection — parle simplement, l'IA peaufine.",
      "Sur le web aussi tu peux dicter à la voix — touche 🎤 à côté de « Ajouter » sur l'accueil.",
      "Essaie le Labo : teste une hypothèse de l'IA par une expérience et vois un avant/après honnête.",
      "Dans le bot tu peux juste poser une question — il décide de répondre ou d'enregistrer (boutons et /ask aussi).",
    ],
    privacyTitle: "Confidentialité",
    privacy: "Toi seul vois ton journal. L'équipe ne lit pas tes entrées — les stats ne montrent que des chiffres anonymes. L'IA traite le texte seulement pour tes résumés et réponses, sans servir à entraîner des modèles. Données chiffrées ; tu peux tout supprimer à tout moment.",
  },
};

export function guide(locale: Locale): Guide {
  return G[locale] || G.ru;
}
