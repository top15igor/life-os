export type PrivacyPoint = { icon: string; title: string; text: string };
export type PrivacyContent = {
  title: string;
  intro: string;
  points: PrivacyPoint[];
  note: string;
  legal: string;
  back: string;
};

const P: Record<string, PrivacyContent> = {
  ru: {
    title: "Приватность",
    intro: "LIFE OS — твоё личное пространство. Вот честно, как мы обращаемся с тем, что ты доверяешь сервису.",
    points: [
      { icon: "ti-lock", title: "Дневник виден только тебе", text: "Твои записи открываются только по твоей личной ссылке. Мы никогда не показываем их другим пользователям." },
      { icon: "ti-eye-off", title: "Команда не читает твои записи", text: "Для аналитики мы видим только обезличенные цифры — сколько записей и какие темы в процентах. Сам текст мы не просматриваем, не продаём и не передаём." },
      { icon: "ti-robot", title: "AI — только ради тебя", text: "Чтобы делать резюме, инсайты и отвечать на твои вопросы, текст обрабатывается AI (Anthropic Claude и OpenAI Whisper). Он используется только для этого, а по условиям их API — не используется для обучения моделей." },
      { icon: "ti-shield-lock", title: "Шифрование и резервные копии", text: "Данные хранятся в зашифрованном виде и передаются по защищённому каналу. Есть резервные копии, чтобы ничего не потерялось." },
      { icon: "ti-trash", title: "Право уйти — одной кнопкой", text: "В «Профиль → Твои данные» есть кнопка, которая стирает аккаунт целиком с наших серверов: записи, финансы, фото, файлы — безвозвратно. Без писем в поддержку и ожидания." },
      { icon: "ti-download", title: "Забери всё своё в любой момент", text: "Один файл со ВСЕМИ данными аккаунта — записи, финансы, книги, здоровье, путешествия, память. Скачай в «Профиль → Твои данные», а можно включить авто-копию: бот будет присылать её тебе в Telegram каждую неделю." },
      { icon: "ti-brand-github", title: "Открытый код — проверь сам", text: "Код LIFE OS открыт. Любой (или твой программист) может посмотреть, что именно происходит с данными. Не верь на слово — проверь." },
    ],
    note: "Полная анонимность «даже мы не сможем прочитать» возможна только с end-to-end шифрованием — но тогда AI не смог бы анализировать записи. Мы выбрали пользу AI и строгие правила доступа. Если важна максимальная приватность — напиши нам.",
    legal: "Полная юридическая версия",
    back: "На главную",
  },
  en: {
    title: "Privacy",
    intro: "LIFE OS is your private space. Here's honestly how we treat what you trust us with.",
    points: [
      { icon: "ti-lock", title: "Your diary is visible only to you", text: "Your entries open only via your personal link. We never show them to other users." },
      { icon: "ti-eye-off", title: "The team doesn't read your entries", text: "For analytics we only see anonymous numbers — how many entries and which topics in percentages. We don't read, sell or share the text itself." },
      { icon: "ti-robot", title: "AI works only for you", text: "To create summaries, insights and answer your questions, the text is processed by AI (Anthropic Claude and OpenAI Whisper). It's used only for that — and under their API terms it's not used to train their models." },
      { icon: "ti-shield-lock", title: "Encryption and backups", text: "Data is stored encrypted and sent over a secure channel. Backups keep anything from being lost." },
      { icon: "ti-trash", title: "The right to leave — one button", text: "In “Profile → Your data” there's a button that erases your whole account from our servers: entries, finance, photos, files — permanently. No support emails, no waiting." },
      { icon: "ti-download", title: "Take everything anytime", text: "One file with ALL your account data — entries, finance, books, health, trips, memories. Download it in “Profile → Your data”, or turn on the auto-copy: the bot will send it to you in Telegram every week." },
      { icon: "ti-brand-github", title: "Open source — check it yourself", text: "The LIFE OS code is open. Anyone (or your developer) can see exactly what happens with the data. Don't take our word — verify." },
    ],
    note: "True \"not even we can read it\" is only possible with end-to-end encryption — but then AI couldn't analyze your entries. We chose AI value plus strict access rules. If maximum privacy matters to you — reach out.",
    legal: "Full legal version",
    back: "Home",
  },
  uk: {
    title: "Приватність",
    intro: "LIFE OS — твій особистий простір. Ось чесно, як ми поводимося з тим, що ти довіряєш сервісу.",
    points: [
      { icon: "ti-lock", title: "Щоденник бачиш лише ти", text: "Твої записи відкриваються тільки за твоїм особистим посиланням. Ми ніколи не показуємо їх іншим користувачам." },
      { icon: "ti-eye-off", title: "Команда не читає твої записи", text: "Для аналітики ми бачимо лише знеособлені цифри — скільки записів і які теми у відсотках. Сам текст ми не переглядаємо, не продаємо й не передаємо." },
      { icon: "ti-robot", title: "AI — лише заради тебе", text: "Щоб робити резюме, інсайти й відповідати на питання, текст обробляє AI (Anthropic Claude та OpenAI Whisper). Він використовується лише для цього, а за умовами їхніх API — не використовується для навчання моделей." },
      { icon: "ti-shield-lock", title: "Шифрування та резервні копії", text: "Дані зберігаються в зашифрованому вигляді й передаються захищеним каналом. Є резервні копії, щоб нічого не загубилося." },
      { icon: "ti-trash", title: "Право піти — однією кнопкою", text: "У «Профіль → Твої дані» є кнопка, що стирає акаунт повністю з наших серверів: записи, фінанси, фото, файли — безповоротно. Без листів у підтримку й очікування." },
      { icon: "ti-download", title: "Забери все своє будь-коли", text: "Один файл з УСІМА даними акаунта — записи, фінанси, книги, здоров'я, подорожі, пам'ять. Завантаж у «Профіль → Твої дані», а можна ввімкнути авто-копію: бот надсилатиме її тобі в Telegram щотижня." },
      { icon: "ti-brand-github", title: "Відкритий код — перевір сам", text: "Код LIFE OS відкритий. Будь-хто (або твій програміст) може подивитися, що саме відбувається з даними. Не вір на слово — перевір." },
    ],
    note: "Повна анонімність «навіть ми не зможемо прочитати» можлива лише з end-to-end шифруванням — але тоді AI не зміг би аналізувати записи. Ми обрали користь AI та суворі правила доступу. Якщо важлива максимальна приватність — напиши нам.",
    legal: "Повна юридична версія",
    back: "На головну",
  },
  fr: {
    title: "Confidentialité",
    intro: "LIFE OS est ton espace privé. Voici, en toute honnêteté, comment nous traitons ce que tu nous confies.",
    points: [
      { icon: "ti-lock", title: "Ton journal n'est visible que par toi", text: "Tes entrées s'ouvrent uniquement via ton lien personnel. Nous ne les montrons jamais à d'autres utilisateurs." },
      { icon: "ti-eye-off", title: "L'équipe ne lit pas tes entrées", text: "Pour les statistiques, nous voyons seulement des chiffres anonymes — combien d'entrées et quels thèmes en pourcentage. Nous ne lisons, ne vendons ni ne partageons le texte." },
      { icon: "ti-robot", title: "L'IA travaille seulement pour toi", text: "Pour créer des résumés, des insights et répondre à tes questions, le texte est traité par l'IA (Anthropic Claude et OpenAI Whisper). Uniquement pour cela — et selon leurs conditions d'API, il ne sert pas à entraîner leurs modèles." },
      { icon: "ti-shield-lock", title: "Chiffrement et sauvegardes", text: "Les données sont stockées chiffrées et transmises par canal sécurisé. Des sauvegardes évitent toute perte." },
      { icon: "ti-trash", title: "Le droit de partir — un seul bouton", text: "Dans « Profil → Tes données », un bouton efface tout ton compte de nos serveurs : entrées, finances, photos, fichiers — définitivement. Sans e-mails au support ni attente." },
      { icon: "ti-download", title: "Récupère tout quand tu veux", text: "Un fichier avec TOUTES les données de ton compte — entrées, finances, livres, santé, voyages, souvenirs. Télécharge-le dans « Profil → Tes données », ou active la copie auto : le bot te l'envoie sur Telegram chaque semaine." },
      { icon: "ti-brand-github", title: "Code ouvert — vérifie toi-même", text: "Le code de LIFE OS est ouvert. N'importe qui (ou ton développeur) peut voir ce qui se passe avec les données. Ne nous crois pas sur parole — vérifie." },
    ],
    note: "Un vrai « même nous ne pouvons pas lire » n'est possible qu'avec un chiffrement de bout en bout — mais l'IA ne pourrait plus analyser tes entrées. Nous avons choisi la valeur de l'IA avec des règles d'accès strictes. Si la confidentialité maximale compte pour toi, contacte-nous.",
    legal: "Version juridique complète",
    back: "Accueil",
  },
  es: {
    title: "Privacidad",
    intro: "LIFE OS es tu espacio privado. Aquí te contamos con honestidad cómo tratamos lo que le confías al servicio.",
    points: [
      { icon: "ti-lock", title: "Tu diario solo lo ves tú", text: "Tus entradas se abren únicamente con tu enlace personal. Nunca se las mostramos a otros usuarios." },
      { icon: "ti-eye-off", title: "El equipo no lee tus entradas", text: "Para las estadísticas solo vemos números anónimos: cuántas entradas hay y qué temas en porcentajes. No leemos, vendemos ni compartimos el texto en sí." },
      { icon: "ti-robot", title: "La IA trabaja solo para ti", text: "Para crear resúmenes, insights y responder tus preguntas, el texto lo procesa una IA (Anthropic Claude y OpenAI Whisper). Se usa solo para eso y, según los términos de sus API, no sirve para entrenar sus modelos." },
      { icon: "ti-shield-lock", title: "Cifrado y copias de seguridad", text: "Los datos se guardan cifrados y se transmiten por un canal seguro. Hay copias de seguridad para que nada se pierda." },
      { icon: "ti-trash", title: "El derecho a irte — con un botón", text: "En «Perfil → Tus datos» hay un botón que borra toda tu cuenta de nuestros servidores: entradas, finanzas, fotos, archivos — para siempre. Sin correos a soporte ni esperas." },
      { icon: "ti-download", title: "Llévate todo cuando quieras", text: "Un solo archivo con TODOS los datos de tu cuenta — entradas, finanzas, libros, salud, viajes, recuerdos. Descárgalo en «Perfil → Tus datos», o activa la copia automática: el bot te la enviará por Telegram cada semana." },
      { icon: "ti-brand-github", title: "Código abierto — compruébalo tú mismo", text: "El código de LIFE OS es abierto. Cualquiera (o tu programador) puede ver exactamente qué pasa con los datos. No te fíes de nuestra palabra — compruébalo." },
    ],
    note: "El verdadero \"ni siquiera nosotros podemos leerlo\" solo es posible con cifrado de extremo a extremo — pero entonces la IA no podría analizar tus entradas. Elegimos el valor de la IA junto con reglas de acceso estrictas. Si la privacidad máxima te importa, escríbenos.",
    legal: "Versión legal completa",
    back: "Inicio",
  },
};

export function privacyContent(locale: string): PrivacyContent {
  return P[locale] || P.ru;
}
