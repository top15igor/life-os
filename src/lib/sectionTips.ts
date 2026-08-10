import type { Locale } from "./i18n";
import type { Tip } from "./tips";
import type { DoneKey } from "./tipState";

// Подсказки ДЛЯ КОНКРЕТНОГО раздела: что сказать боту или нажать именно здесь.
//
// Раньше колонка брала советы из одного общего списка, и на большинстве страниц
// показывала одно и то же. Здесь у каждого раздела свои три штуки.
// Раздела нет в списке — колонка возьмёт общий набор из tips.ts.

type Pack = Record<Locale, Tip[]>;

const S: Record<string, Pack> = {
  today: {
    ru: [
      { icon: "ti-microphone", title: "Скажи голосом", text: "Нажми микрофон и расскажи про день — AI сам разложит на категории и настроение." },
      { icon: "ti-pencil-plus", title: "Одна строка тоже запись", text: "Не обязательно писать много: «был на море, устал, доволен» — уже достаточно." },
      { icon: "ti-message-chatbot", title: "Спроси AI-друга", text: "Он помнит весь дневник: «что я делал в прошлые выходные?»" },
    ],
    en: [
      { icon: "ti-microphone", title: "Say it out loud", text: "Tap the mic and talk about your day — AI sorts it into categories and mood." },
      { icon: "ti-pencil-plus", title: "One line is an entry too", text: "No need to write much: “beach, tired, happy” is already enough." },
      { icon: "ti-message-chatbot", title: "Ask your AI friend", text: "It remembers the whole diary: “what did I do last weekend?”" },
    ],
    uk: [
      { icon: "ti-microphone", title: "Скажи голосом", text: "Натисни мікрофон і розкажи про день — AI сам розкладе на категорії й настрій." },
      { icon: "ti-pencil-plus", title: "Один рядок теж запис", text: "Не обов'язково писати багато: «був на морі, втомився, задоволений» — уже досить." },
      { icon: "ti-message-chatbot", title: "Спитай AI-друга", text: "Він пам'ятає весь щоденник: «що я робив минулими вихідними?»" },
    ],
    fr: [
      { icon: "ti-microphone", title: "Dis-le à voix haute", text: "Appuie sur le micro et raconte ta journée — l'IA range tout par catégories et humeur." },
      { icon: "ti-pencil-plus", title: "Une ligne suffit", text: "Pas besoin d'écrire beaucoup : « plage, fatigué, content » suffit déjà." },
      { icon: "ti-message-chatbot", title: "Demande à ton ami IA", text: "Il se souvient de tout : « qu'ai-je fait le week-end dernier ? »" },
    ],
    es: [
      { icon: "ti-microphone", title: "Dilo en voz alta", text: "Toca el micro y cuenta tu día — la IA lo ordena por categorías y ánimo." },
      { icon: "ti-pencil-plus", title: "Una línea ya es entrada", text: "No hace falta escribir mucho: «playa, cansado, contento» ya basta." },
      { icon: "ti-message-chatbot", title: "Pregunta a tu amigo IA", text: "Recuerda todo el diario: «¿qué hice el fin de semana pasado?»" },
    ],
  },
  diary: {
    ru: [
      { icon: "ti-calendar", title: "Календарь как поиск", text: "Точки под числами — дни с записями. Нажми на день и попадёшь прямо в него." },
      { icon: "ti-filter", title: "Фильтры сверху", text: "«Люди» и «Теги» покажут все записи про конкретного человека или тему." },
      { icon: "ti-edit", title: "«Исправь…»", text: "Бот не так расслышал? Скажи «исправь» — поправит последнюю запись без дублей." },
    ],
    en: [
      { icon: "ti-calendar", title: "Calendar as search", text: "Dots under dates mean entries. Tap a day to jump straight into it." },
      { icon: "ti-filter", title: "Filters on top", text: "“People” and “Tags” show every entry about a person or a topic." },
      { icon: "ti-edit", title: "“Fix that…”", text: "Misheard you? Say “fix” — it corrects the last entry without duplicates." },
    ],
    uk: [
      { icon: "ti-calendar", title: "Календар як пошук", text: "Крапки під числами — дні із записами. Натисни на день і потрапиш прямо в нього." },
      { icon: "ti-filter", title: "Фільтри вгорі", text: "«Люди» і «Теги» покажуть усі записи про конкретну людину або тему." },
      { icon: "ti-edit", title: "«Виправ…»", text: "Бот не так почув? Скажи «виправ» — поправить останній запис без дублів." },
    ],
    fr: [
      { icon: "ti-calendar", title: "Le calendrier comme recherche", text: "Les points sous les dates = des notes. Clique sur un jour pour y aller." },
      { icon: "ti-filter", title: "Filtres en haut", text: "« Personnes » et « Tags » montrent toutes les notes sur quelqu'un ou un sujet." },
      { icon: "ti-edit", title: "« Corrige… »", text: "Mal compris ? Dis « corrige » — la dernière note est reprise, sans doublon." },
    ],
    es: [
      { icon: "ti-calendar", title: "El calendario como buscador", text: "Los puntos bajo las fechas son días con entradas. Toca un día y entras." },
      { icon: "ti-filter", title: "Filtros arriba", text: "«Personas» y «Etiquetas» muestran todo lo escrito sobre alguien o un tema." },
      { icon: "ti-edit", title: "«Corrige…»", text: "¿Te entendió mal? Di «corrige» — arregla la última entrada sin duplicados." },
    ],
  },
  health: {
    ru: [
      { icon: "ti-scale", title: "Вес голосом", text: "Скажи боту «вешу 78» — попадёт в график, без таблиц и приложений." },
      { icon: "ti-device-watch", title: "Часы и Fitbit", text: "Во вкладке «Настройки» подключи Apple «Здоровье» или Fitbit — шаги и сон придут сами." },
      { icon: "ti-mood-smile", title: "Сон и настроение рядом", text: "Через пару недель станет видно, правда ли плохой сон портит день." },
    ],
    en: [
      { icon: "ti-scale", title: "Weight by voice", text: "Tell the bot “I weigh 78” — it lands on the chart, no spreadsheets needed." },
      { icon: "ti-device-watch", title: "Watch and Fitbit", text: "In “Settings” connect Apple Health or Fitbit — steps and sleep arrive on their own." },
      { icon: "ti-mood-smile", title: "Sleep next to mood", text: "In a couple of weeks you'll see whether bad sleep really ruins your day." },
    ],
    uk: [
      { icon: "ti-scale", title: "Вага голосом", text: "Скажи боту «важу 78» — потрапить у графік, без таблиць і застосунків." },
      { icon: "ti-device-watch", title: "Годинник і Fitbit", text: "У вкладці «Налаштування» під'єднай Apple «Здоров'я» або Fitbit — кроки й сон прийдуть самі." },
      { icon: "ti-mood-smile", title: "Сон поруч із настроєм", text: "За пару тижнів стане видно, чи справді поганий сон псує день." },
    ],
    fr: [
      { icon: "ti-scale", title: "Le poids à la voix", text: "Dis au bot « je pèse 78 » — ça arrive sur le graphique, sans tableur." },
      { icon: "ti-device-watch", title: "Montre et Fitbit", text: "Dans « Réglages », connecte Apple Santé ou Fitbit — pas et sommeil arrivent seuls." },
      { icon: "ti-mood-smile", title: "Sommeil et humeur côte à côte", text: "En deux semaines tu verras si une mauvaise nuit gâche vraiment la journée." },
    ],
    es: [
      { icon: "ti-scale", title: "El peso con la voz", text: "Dile al bot «peso 78» — va directo a la gráfica, sin hojas de cálculo." },
      { icon: "ti-device-watch", title: "Reloj y Fitbit", text: "En «Ajustes» conecta Apple Salud o Fitbit — pasos y sueño llegan solos." },
      { icon: "ti-mood-smile", title: "Sueño junto al ánimo", text: "En un par de semanas verás si dormir mal de verdad te estropea el día." },
    ],
  },
  goals: {
    ru: [
      { icon: "ti-target", title: "Цель одной строкой", text: "«Прочитать 12 книг», «200 отжиманий» — добавь и двигай ползунок раз в неделю." },
      { icon: "ti-checklist", title: "Задачи из записей", text: "AI сам достаёт задачи из твоих рассказов — вкладка «Задачи» рядом." },
      { icon: "ti-map-2", title: "Карта желаний", text: "Мечты, о которых говорил боту, собираются в отдельную вкладку." },
    ],
    en: [
      { icon: "ti-target", title: "A goal in one line", text: "“Read 12 books”, “200 push-ups” — add it and move the slider once a week." },
      { icon: "ti-checklist", title: "Tasks from your entries", text: "AI pulls tasks out of what you tell it — the “Tasks” tab is right here." },
      { icon: "ti-map-2", title: "Dream map", text: "Dreams you mentioned to the bot gather in their own tab." },
    ],
    uk: [
      { icon: "ti-target", title: "Ціль одним рядком", text: "«Прочитати 12 книг», «200 віджимань» — додай і рухай повзунок раз на тиждень." },
      { icon: "ti-checklist", title: "Задачі із записів", text: "AI сам дістає задачі з твоїх розповідей — вкладка «Задачі» поруч." },
      { icon: "ti-map-2", title: "Карта бажань", text: "Мрії, про які говорив боту, збираються в окрему вкладку." },
    ],
    fr: [
      { icon: "ti-target", title: "Un objectif en une ligne", text: "« Lire 12 livres », « 200 pompes » — ajoute-le et bouge le curseur chaque semaine." },
      { icon: "ti-checklist", title: "Des tâches depuis tes notes", text: "L'IA en extrait les tâches — l'onglet « Tâches » est juste à côté." },
      { icon: "ti-map-2", title: "Carte des rêves", text: "Les rêves confiés au bot se rassemblent dans leur propre onglet." },
    ],
    es: [
      { icon: "ti-target", title: "Una meta en una línea", text: "«Leer 12 libros», «200 flexiones» — añádela y mueve el deslizador cada semana." },
      { icon: "ti-checklist", title: "Tareas desde tus entradas", text: "La IA saca las tareas de lo que cuentas — la pestaña «Tareas» está al lado." },
      { icon: "ti-map-2", title: "Mapa de sueños", text: "Los sueños que le contaste al bot se reúnen en su propia pestaña." },
    ],
  },
  reminders: {
    ru: [
      { icon: "ti-alarm", title: "Обычными словами", text: "«Напомни в пятницу оплатить садик» — бот сам поймёт дату и время." },
      { icon: "ti-repeat", title: "Повторы", text: "«Каждый день в 8», «каждый час с 9 до 21» — понимает как есть." },
      { icon: "ti-calendar-plus", title: "В Google Календарь", text: "Напоминание можно отправить событием в календарь — если так привычнее." },
    ],
    en: [
      { icon: "ti-alarm", title: "In plain words", text: "“Remind me Friday to pay for daycare” — the bot works out date and time." },
      { icon: "ti-repeat", title: "Repeats", text: "“Every day at 8”, “every hour from 9 to 21” — understood as-is." },
      { icon: "ti-calendar-plus", title: "Into Google Calendar", text: "A reminder can go to your calendar as an event, if that suits you better." },
    ],
    uk: [
      { icon: "ti-alarm", title: "Звичайними словами", text: "«Нагадай у п'ятницю оплатити садок» — бот сам зрозуміє дату й час." },
      { icon: "ti-repeat", title: "Повтори", text: "«Щодня о 8», «щогодини з 9 до 21» — розуміє як є." },
      { icon: "ti-calendar-plus", title: "У Google Календар", text: "Нагадування можна відправити подією в календар — якщо так звичніше." },
    ],
    fr: [
      { icon: "ti-alarm", title: "En langage normal", text: "« Rappelle-moi vendredi de payer la crèche » — le bot devine date et heure." },
      { icon: "ti-repeat", title: "Répétitions", text: "« Tous les jours à 8h », « toutes les heures de 9h à 21h » — compris tel quel." },
      { icon: "ti-calendar-plus", title: "Vers Google Agenda", text: "Un rappel peut partir dans ton agenda comme événement, si tu préfères." },
    ],
    es: [
      { icon: "ti-alarm", title: "Con palabras normales", text: "«Recuérdame el viernes pagar la guardería» — el bot deduce fecha y hora." },
      { icon: "ti-repeat", title: "Repeticiones", text: "«Cada día a las 8», «cada hora de 9 a 21» — lo entiende tal cual." },
      { icon: "ti-calendar-plus", title: "A Google Calendar", text: "El recordatorio puede ir a tu calendario como evento, si te resulta más cómodo." },
    ],
  },
  finance: {
    ru: [
      { icon: "ti-coin", title: "Трата в одну фразу", text: "«Потратил 40 евро на продукты» — бот сам подберёт категорию." },
      { icon: "ti-building-bank", title: "Монобанк сам", text: "Подключи импорт — операции придут без ручного ввода, в валюте покупки." },
      { icon: "ti-chart-pie", title: "Свои статьи расходов", text: "Не нравятся стандартные категории — заведи свои, AI будет раскладывать в них." },
    ],
    en: [
      { icon: "ti-coin", title: "An expense in one phrase", text: "“Spent 40 euros on groceries” — the bot picks the category itself." },
      { icon: "ti-building-bank", title: "Bank import", text: "Connect Monobank — transactions arrive on their own, in the purchase currency." },
      { icon: "ti-chart-pie", title: "Your own categories", text: "Don't like the defaults? Create your own and AI will sort into them." },
    ],
    uk: [
      { icon: "ti-coin", title: "Витрата однією фразою", text: "«Витратив 40 євро на продукти» — бот сам добере категорію." },
      { icon: "ti-building-bank", title: "Монобанк сам", text: "Під'єднай імпорт — операції прийдуть без ручного вводу, у валюті покупки." },
      { icon: "ti-chart-pie", title: "Свої статті витрат", text: "Не подобаються стандартні категорії — заведи свої, AI розкладатиме в них." },
    ],
    fr: [
      { icon: "ti-coin", title: "Une dépense en une phrase", text: "« 40 euros de courses » — le bot choisit la catégorie tout seul." },
      { icon: "ti-building-bank", title: "Import bancaire", text: "Connecte Monobank — les opérations arrivent seules, dans la devise d'achat." },
      { icon: "ti-chart-pie", title: "Tes propres postes", text: "Les catégories par défaut ne te vont pas ? Crée les tiennes, l'IA s'y adapte." },
    ],
    es: [
      { icon: "ti-coin", title: "Un gasto en una frase", text: "«Gasté 40 euros en la compra» — el bot elige la categoría solo." },
      { icon: "ti-building-bank", title: "Importar del banco", text: "Conecta Monobank — las operaciones llegan solas, en la moneda de la compra." },
      { icon: "ti-chart-pie", title: "Tus propias categorías", text: "¿No te gustan las de serie? Crea las tuyas y la IA clasificará en ellas." },
    ],
  },
  family: {
    ru: [
      { icon: "ti-baby-carriage", title: "Фразы детей", text: "Смешное за ужином забывается за неделю. Скажи боту — останется навсегда." },
      { icon: "ti-cake", title: "Дни рождения", text: "Скажи дату один раз — бот напомнит заранее и подскажет, что дарить." },
      { icon: "ti-photo", title: "Фото момента", text: "Пришли фото с подписью — попадёт в Память и в Книгу жизни." },
    ],
    en: [
      { icon: "ti-baby-carriage", title: "Things kids say", text: "A funny line at dinner fades in a week. Tell the bot — it stays forever." },
      { icon: "ti-cake", title: "Birthdays", text: "Say the date once — the bot reminds you ahead and suggests a gift." },
      { icon: "ti-photo", title: "A photo of the moment", text: "Send a photo with a caption — it lands in Memory and in the Book of Life." },
    ],
    uk: [
      { icon: "ti-baby-carriage", title: "Фрази дітей", text: "Смішне за вечерею забувається за тиждень. Скажи боту — залишиться назавжди." },
      { icon: "ti-cake", title: "Дні народження", text: "Скажи дату один раз — бот нагадає заздалегідь і підкаже, що дарувати." },
      { icon: "ti-photo", title: "Фото моменту", text: "Надішли фото з підписом — потрапить у Пам'ять і в Книгу життя." },
    ],
    fr: [
      { icon: "ti-baby-carriage", title: "Les mots des enfants", text: "Une phrase drôle s'oublie en une semaine. Dis-la au bot — elle reste." },
      { icon: "ti-cake", title: "Anniversaires", text: "Donne la date une fois — le bot te prévient à l'avance et suggère un cadeau." },
      { icon: "ti-photo", title: "Une photo du moment", text: "Envoie une photo légendée — elle va dans Mémoire et dans le Livre de vie." },
    ],
    es: [
      { icon: "ti-baby-carriage", title: "Frases de los niños", text: "Lo gracioso de la cena se olvida en una semana. Díselo al bot y se queda." },
      { icon: "ti-cake", title: "Cumpleaños", text: "Di la fecha una vez — el bot avisa con tiempo y sugiere qué regalar." },
      { icon: "ti-photo", title: "Una foto del momento", text: "Manda una foto con pie — irá a Memoria y al Libro de vida." },
    ],
  },
  people: {
    ru: [
      { icon: "ti-user-plus", title: "Люди появляются сами", text: "Упомянул человека в записи — карточка создалась. Вручную заводить не надо." },
      { icon: "ti-heart-handshake", title: "Повод написать", text: "Раз в неделю бот подскажет, кто из близких давно не появлялся в записях." },
      { icon: "ti-message", title: "Передать сообщение", text: "«Передай Ане, что опоздаю» — бот доставит ей прямо в Telegram." },
    ],
    en: [
      { icon: "ti-user-plus", title: "People appear on their own", text: "Mention someone in an entry and a card is created. No manual adding." },
      { icon: "ti-heart-handshake", title: "A reason to write", text: "Once a week the bot points out who hasn't shown up in your entries lately." },
      { icon: "ti-message", title: "Pass a message on", text: "“Tell Anna I'll be late” — the bot delivers it to her in Telegram." },
    ],
    uk: [
      { icon: "ti-user-plus", title: "Люди з'являються самі", text: "Згадав людину в записі — картка створилася. Вручну заводити не треба." },
      { icon: "ti-heart-handshake", title: "Привід написати", text: "Раз на тиждень бот підкаже, хто з близьких давно не з'являвся в записах." },
      { icon: "ti-message", title: "Передати повідомлення", text: "«Передай Ані, що запізнюся» — бот доставить їй прямо в Telegram." },
    ],
    fr: [
      { icon: "ti-user-plus", title: "Les gens apparaissent seuls", text: "Mentionne quelqu'un dans une note : sa fiche se crée toute seule." },
      { icon: "ti-heart-handshake", title: "Une raison d'écrire", text: "Chaque semaine, le bot signale qui n'apparaît plus dans tes notes." },
      { icon: "ti-message", title: "Faire passer un mot", text: "« Dis à Anna que je serai en retard » — le bot lui transmet sur Telegram." },
    ],
    es: [
      { icon: "ti-user-plus", title: "Las personas aparecen solas", text: "Menciona a alguien en una entrada y su ficha se crea sola." },
      { icon: "ti-heart-handshake", title: "Un motivo para escribir", text: "Una vez por semana el bot señala quién lleva tiempo sin aparecer." },
      { icon: "ti-message", title: "Pasar un mensaje", text: "«Dile a Ana que llego tarde» — el bot se lo entrega en Telegram." },
    ],
  },
  places: {
    ru: [
      { icon: "ti-wand", title: "Поездки находятся сами", text: "AI видит их в дневнике и предлагает добавить — записи и фото подтянутся." },
      { icon: "ti-map-pin", title: "Куда хочется вернуться", text: "Скажи боту «хочу в Исландию» — попадёт в мечты, а не потеряется в переписке." },
      { icon: "ti-photo", title: "Фото из поездки", text: "Пришли снимок с подписью — ляжет в ту поездку, к которой относится по дате." },
    ],
    en: [
      { icon: "ti-wand", title: "Trips find themselves", text: "AI spots them in your diary and offers to add — entries and photos follow." },
      { icon: "ti-map-pin", title: "Places to return to", text: "Tell the bot “I want to see Iceland” — it becomes a dream, not a lost message." },
      { icon: "ti-photo", title: "A photo from the trip", text: "Send a shot with a caption — it joins the trip its date belongs to." },
    ],
    uk: [
      { icon: "ti-wand", title: "Поїздки знаходяться самі", text: "AI бачить їх у щоденнику й пропонує додати — записи й фото підтягнуться." },
      { icon: "ti-map-pin", title: "Куди хочеться повернутися", text: "Скажи боту «хочу в Ісландію» — потрапить у мрії, а не загубиться в листуванні." },
      { icon: "ti-photo", title: "Фото з поїздки", text: "Надішли знімок із підписом — ляже в ту поїздку, до якої належить за датою." },
    ],
    fr: [
      { icon: "ti-wand", title: "Les voyages se retrouvent seuls", text: "L'IA les repère dans ton journal et propose de les ajouter, photos comprises." },
      { icon: "ti-map-pin", title: "Où revenir", text: "Dis « j'aimerais voir l'Islande » — ça devient un rêve, pas un message perdu." },
      { icon: "ti-photo", title: "Une photo du voyage", text: "Envoie un cliché légendé — il rejoint le voyage correspondant à sa date." },
    ],
    es: [
      { icon: "ti-wand", title: "Los viajes se encuentran solos", text: "La IA los ve en tu diario y propone añadirlos — entradas y fotos incluidas." },
      { icon: "ti-map-pin", title: "Adónde volver", text: "Dile «quiero ir a Islandia» — se guarda como sueño, no se pierde en el chat." },
      { icon: "ti-photo", title: "Una foto del viaje", text: "Manda una foto con pie — se une al viaje al que pertenece por fecha." },
    ],
  },
  projects: {
    ru: [
      { icon: "ti-briefcase", title: "Проект из разговора", text: "Просто упоминай его в записях — LIFE OS сам соберёт всё в одну карточку." },
      { icon: "ti-list-check", title: "Что уже сделано", text: "Лента проекта показывает путь целиком — полезно в момент «топчусь на месте»." },
      { icon: "ti-arrows-join", title: "Один проект, а не три", text: "Называл по-разному? Раздел «Разобрать» предложит склеить дубли." },
    ],
    en: [
      { icon: "ti-briefcase", title: "A project from conversation", text: "Just mention it in entries — LIFE OS gathers everything into one card." },
      { icon: "ti-list-check", title: "What's already done", text: "The project feed shows the whole path — useful when you feel stuck." },
      { icon: "ti-arrows-join", title: "One project, not three", text: "Called it differently? The “Sort out” section offers to merge duplicates." },
    ],
    uk: [
      { icon: "ti-briefcase", title: "Проєкт із розмови", text: "Просто згадуй його в записах — LIFE OS сам збере все в одну картку." },
      { icon: "ti-list-check", title: "Що вже зроблено", text: "Стрічка проєкту показує шлях цілком — корисно в мить «тупцюю на місці»." },
      { icon: "ti-arrows-join", title: "Один проєкт, а не три", text: "Називав по-різному? Розділ «Розібрати» запропонує склеїти дублі." },
    ],
    fr: [
      { icon: "ti-briefcase", title: "Un projet né d'une phrase", text: "Mentionne-le dans tes notes — LIFE OS rassemble tout sur une fiche." },
      { icon: "ti-list-check", title: "Ce qui est déjà fait", text: "Le fil du projet montre tout le chemin — utile quand on se croit bloqué." },
      { icon: "ti-arrows-join", title: "Un projet, pas trois", text: "Nommé autrement ? La section « Trier » propose de fusionner les doublons." },
    ],
    es: [
      { icon: "ti-briefcase", title: "Un proyecto desde una charla", text: "Solo menciónalo en las entradas — LIFE OS lo reúne todo en una ficha." },
      { icon: "ti-list-check", title: "Lo que ya está hecho", text: "El feed del proyecto muestra el camino entero — útil cuando parece que no avanzas." },
      { icon: "ti-arrows-join", title: "Un proyecto, no tres", text: "¿Lo llamaste distinto? La sección «Ordenar» propone unir duplicados." },
    ],
  },
  trace: {
    ru: [
      { icon: "ti-hand-love-you", title: "Доброе дело словами", text: "«Помог соседке донести продукты» — попадёт сюда само, отдельно записывать не надо." },
      { icon: "ti-hand-stop", title: "Обещания на виду", text: "«Обещал Диме позвонить» — бот запомнит и не даст забыть." },
      { icon: "ti-pray", title: "Благодарности", text: "За что ты сегодня благодарен — копится тихо и однажды удивит количеством." },
    ],
    en: [
      { icon: "ti-hand-love-you", title: "A good deed in words", text: "“Helped a neighbour with groceries” — it lands here by itself." },
      { icon: "ti-hand-stop", title: "Promises in plain sight", text: "“Promised to call Dima” — the bot remembers and won't let it slip." },
      { icon: "ti-pray", title: "Gratitude", text: "What you're grateful for piles up quietly and one day surprises you." },
    ],
    uk: [
      { icon: "ti-hand-love-you", title: "Добра справа словами", text: "«Допоміг сусідці донести продукти» — потрапить сюди саме, окремо не треба." },
      { icon: "ti-hand-stop", title: "Обіцянки на видноті", text: "«Обіцяв Дімі подзвонити» — бот запам'ятає й не дасть забути." },
      { icon: "ti-pray", title: "Подяки", text: "За що ти сьогодні вдячний — накопичується тихо й одного дня здивує." },
    ],
    fr: [
      { icon: "ti-hand-love-you", title: "Une bonne action en mots", text: "« Aidé la voisine avec ses courses » — ça atterrit ici tout seul." },
      { icon: "ti-hand-stop", title: "Promesses en vue", text: "« Promis d'appeler Dima » — le bot s'en souvient et te le rappelle." },
      { icon: "ti-pray", title: "Gratitudes", text: "Ce dont tu es reconnaissant s'accumule sans bruit et finit par étonner." },
    ],
    es: [
      { icon: "ti-hand-love-you", title: "Una buena acción en palabras", text: "«Ayudé a la vecina con la compra» — llega aquí por sí solo." },
      { icon: "ti-hand-stop", title: "Promesas a la vista", text: "«Prometí llamar a Dima» — el bot lo recuerda y no deja que se te pase." },
      { icon: "ti-pray", title: "Gratitudes", text: "Aquello que agradeces se acumula en silencio y un día te sorprende." },
    ],
  },
  lifebook: {
    ru: [
      { icon: "ti-book", title: "Главы собираются сами", text: "Каждый месяц AI превращает записи в главу — тебе не надо ничего писать." },
      { icon: "ti-printer", title: "Напечатать и подарить", text: "В конце года книгу можно заказать в типографии — самый личный подарок." },
      { icon: "ti-users", title: "Кому откроется", text: "В «Наследниках» решаешь, кто однажды сможет прочитать твою книгу." },
    ],
    en: [
      { icon: "ti-book", title: "Chapters assemble themselves", text: "Each month AI turns entries into a chapter — you write nothing extra." },
      { icon: "ti-printer", title: "Print it and gift it", text: "At year's end order it from a press — the most personal present there is." },
      { icon: "ti-users", title: "Who gets to read it", text: "In “Heirs” you decide who will one day be able to open your book." },
    ],
    uk: [
      { icon: "ti-book", title: "Розділи збираються самі", text: "Щомісяця AI перетворює записи на розділ — тобі не треба нічого писати." },
      { icon: "ti-printer", title: "Надрукувати й подарувати", text: "Наприкінці року книгу можна замовити в друкарні — найособистіший подарунок." },
      { icon: "ti-users", title: "Кому відкриється", text: "У «Спадкоємцях» вирішуєш, хто колись зможе прочитати твою книгу." },
    ],
    fr: [
      { icon: "ti-book", title: "Les chapitres se forment seuls", text: "Chaque mois, l'IA transforme tes notes en chapitre — rien à rédiger." },
      { icon: "ti-printer", title: "L'imprimer et l'offrir", text: "En fin d'année, commande-le en imprimerie — le cadeau le plus personnel." },
      { icon: "ti-users", title: "Qui pourra le lire", text: "Dans « Héritiers », tu décides qui pourra un jour ouvrir ton livre." },
    ],
    es: [
      { icon: "ti-book", title: "Los capítulos se arman solos", text: "Cada mes la IA convierte tus entradas en un capítulo — tú no escribes nada." },
      { icon: "ti-printer", title: "Imprímelo y regálalo", text: "A fin de año puedes pedirlo en imprenta — el regalo más personal." },
      { icon: "ti-users", title: "Quién podrá leerlo", text: "En «Herederos» decides quién podrá abrir tu libro algún día." },
    ],
  },
  notes: {
    ru: [
      { icon: "ti-key", title: "Запиши голосом", text: "«Запиши код от домофона 4582» — и потом просто спроси, бот ответит." },
      { icon: "ti-pin", title: "Важное — наверх", text: "Закрепи паспортные данные и адреса: будут всегда первыми в списке." },
      { icon: "ti-list-check", title: "Списки покупок", text: "«Добавь молоко в список» — пункты вычёркиваются кнопкой прямо в чате." },
    ],
    en: [
      { icon: "ti-key", title: "Save it by voice", text: "“Save the door code 4582” — then just ask and the bot answers." },
      { icon: "ti-pin", title: "Pin what matters", text: "Pin passport details and addresses — they stay at the top of the list." },
      { icon: "ti-list-check", title: "Shopping lists", text: "“Add milk to the list” — items are ticked off right in the chat." },
    ],
    uk: [
      { icon: "ti-key", title: "Запиши голосом", text: "«Запиши код від домофона 4582» — і потім просто спитай, бот відповість." },
      { icon: "ti-pin", title: "Важливе — вгору", text: "Закріпи паспортні дані й адреси: будуть завжди першими в списку." },
      { icon: "ti-list-check", title: "Списки покупок", text: "«Додай молоко в список» — пункти викреслюються кнопкою прямо в чаті." },
    ],
    fr: [
      { icon: "ti-key", title: "Note-le à la voix", text: "« Note le code 4582 » — ensuite demande, et le bot répond." },
      { icon: "ti-pin", title: "L'important en haut", text: "Épingle papiers et adresses : ils restent en tête de liste." },
      { icon: "ti-list-check", title: "Listes de courses", text: "« Ajoute du lait » — on coche les articles directement dans le chat." },
    ],
    es: [
      { icon: "ti-key", title: "Guárdalo con la voz", text: "«Apunta el código 4582» — luego solo pregunta y el bot responde." },
      { icon: "ti-pin", title: "Lo importante arriba", text: "Fija documentos y direcciones: se quedan primeros en la lista." },
      { icon: "ti-list-check", title: "Listas de la compra", text: "«Añade leche a la lista» — se tachan con un toque en el chat." },
    ],
  },
  knowledge: {
    ru: [
      { icon: "ti-link", title: "Просто кинь ссылку", text: "Instagram, YouTube, TikTok или Facebook — AI вытащит суть и сохранит." },
      { icon: "ti-search", title: "Поиск по смыслу", text: "«Что там было про закваску?» — найдёт, даже если этих слов в тексте нет." },
      { icon: "ti-folders", title: "Навести порядок", text: "Кнопка сверху разложит накопленное по папкам за один проход." },
    ],
    en: [
      { icon: "ti-link", title: "Just send a link", text: "Instagram, YouTube, TikTok or Facebook — AI extracts the gist and saves it." },
      { icon: "ti-search", title: "Search by meaning", text: "“What was that about sourdough?” — found even if those words aren't there." },
      { icon: "ti-folders", title: "Tidy it up", text: "The button on top sorts everything you've saved into folders in one pass." },
    ],
    uk: [
      { icon: "ti-link", title: "Просто кинь посилання", text: "Instagram, YouTube, TikTok чи Facebook — AI витягне суть і збереже." },
      { icon: "ti-search", title: "Пошук за змістом", text: "«Що там було про закваску?» — знайде, навіть якщо цих слів у тексті немає." },
      { icon: "ti-folders", title: "Навести лад", text: "Кнопка вгорі розкладе накопичене по теках за один прохід." },
    ],
    fr: [
      { icon: "ti-link", title: "Envoie juste un lien", text: "Instagram, YouTube, TikTok ou Facebook — l'IA en extrait l'essentiel." },
      { icon: "ti-search", title: "Chercher par le sens", text: "« C'était quoi, l'histoire du levain ? » — trouvé même sans ces mots." },
      { icon: "ti-folders", title: "Mettre de l'ordre", text: "Le bouton du haut range tout ce que tu as gardé, en une passe." },
    ],
    es: [
      { icon: "ti-link", title: "Solo manda un enlace", text: "Instagram, YouTube, TikTok o Facebook — la IA saca lo esencial y lo guarda." },
      { icon: "ti-search", title: "Buscar por sentido", text: "«¿Qué era aquello de la masa madre?» — lo encuentra aunque no estén esas palabras." },
      { icon: "ti-folders", title: "Poner orden", text: "El botón de arriba ordena en carpetas todo lo guardado de una pasada." },
    ],
  },
  memory: {
    ru: [
      { icon: "ti-receipt", title: "Сфотографируй чек", text: "Пришли боту — AI прочитает сумму, магазин и дату, искать потом не придётся." },
      { icon: "ti-file-description", title: "Документы тоже", text: "Договор, страховка, техпаспорт — AI вытащит данные и разложит по категориям." },
      { icon: "ti-microphone", title: "Подпись голосом", text: "К фото можно наговорить заметку — потом найдётся и по ней." },
    ],
    en: [
      { icon: "ti-receipt", title: "Photograph the receipt", text: "Send it to the bot — AI reads amount, shop and date, no digging later." },
      { icon: "ti-file-description", title: "Documents too", text: "Contract, insurance, registration — AI pulls the details and files them." },
      { icon: "ti-microphone", title: "A voice caption", text: "You can dictate a note for a photo — later it's searchable by that too." },
    ],
    uk: [
      { icon: "ti-receipt", title: "Сфотографуй чек", text: "Надішли боту — AI прочитає суму, магазин і дату, шукати потім не доведеться." },
      { icon: "ti-file-description", title: "Документи теж", text: "Договір, страховка, техпаспорт — AI витягне дані й розкладе за категоріями." },
      { icon: "ti-microphone", title: "Підпис голосом", text: "До фото можна наговорити нотатку — потім знайдеться й за нею." },
    ],
    fr: [
      { icon: "ti-receipt", title: "Photographie le reçu", text: "Envoie-le au bot — l'IA lit montant, magasin et date, plus besoin de fouiller." },
      { icon: "ti-file-description", title: "Les documents aussi", text: "Contrat, assurance, carte grise — l'IA en extrait les données et les range." },
      { icon: "ti-microphone", title: "Une légende vocale", text: "Tu peux dicter une note pour une photo — la recherche la trouvera aussi." },
    ],
    es: [
      { icon: "ti-receipt", title: "Fotografía el recibo", text: "Mándalo al bot — la IA lee importe, tienda y fecha; luego no hay que buscar." },
      { icon: "ti-file-description", title: "Documentos también", text: "Contrato, seguro, ficha técnica — la IA extrae los datos y los clasifica." },
      { icon: "ti-microphone", title: "Pie de foto con la voz", text: "Puedes dictar una nota para la foto — después también se busca por ella." },
    ],
  },
  books: {
    ru: [
      { icon: "ti-camera", title: "Книга по обложке", text: "Сфотографируй обложку — бот сам найдёт название, автора и добавит на полку." },
      { icon: "ti-quote", title: "Цитаты", text: "Зацепила фраза — скажи боту. Через год найдётся, даже если забыл, из какой книги." },
      { icon: "ti-target-arrow", title: "Цель года", text: "Поставь, сколько книг хочешь прочитать — прогресс будет виден сам." },
    ],
    en: [
      { icon: "ti-camera", title: "A book by its cover", text: "Photograph the cover — the bot finds title and author and adds it to a shelf." },
      { icon: "ti-quote", title: "Quotes", text: "A line struck you? Tell the bot. A year later it's findable, even if you forgot the book." },
      { icon: "ti-target-arrow", title: "Yearly goal", text: "Set how many books you want to read — the progress shows itself." },
    ],
    uk: [
      { icon: "ti-camera", title: "Книга за обкладинкою", text: "Сфотографуй обкладинку — бот сам знайде назву, автора й додасть на полицю." },
      { icon: "ti-quote", title: "Цитати", text: "Зачепила фраза — скажи боту. Через рік знайдеться, навіть якщо забув книгу." },
      { icon: "ti-target-arrow", title: "Ціль року", text: "Постав, скільки книг хочеш прочитати — прогрес буде видно сам." },
    ],
    fr: [
      { icon: "ti-camera", title: "Un livre par sa couverture", text: "Photographie la couverture — le bot trouve titre et auteur et le range." },
      { icon: "ti-quote", title: "Citations", text: "Une phrase t'a marqué ? Dis-la au bot. Un an après, elle se retrouve." },
      { icon: "ti-target-arrow", title: "Objectif de l'année", text: "Fixe combien de livres tu veux lire — la progression s'affiche seule." },
    ],
    es: [
      { icon: "ti-camera", title: "Un libro por su portada", text: "Fotografía la portada — el bot encuentra título y autor y lo pone en el estante." },
      { icon: "ti-quote", title: "Citas", text: "¿Te marcó una frase? Dísela al bot. Un año después se encuentra igual." },
      { icon: "ti-target-arrow", title: "Meta del año", text: "Marca cuántos libros quieres leer — el progreso se ve solo." },
    ],
  },
  wishlist: {
    ru: [
      { icon: "ti-link", title: "Просто ссылка на товар", text: "Пришли боту — подтянутся фото, название и цена, заполнять ничего не надо." },
      { icon: "ti-share", title: "Ссылка для друзей", text: "Одна ссылка — и близкие видят список, не спрашивая «что подарить?»." },
      { icon: "ti-eye-off", title: "Тайная бронь", text: "Друг отмечает подарок как выбранный — ты этого не видишь, сюрприз цел." },
    ],
    en: [
      { icon: "ti-link", title: "Just a product link", text: "Send it to the bot — photo, title and price arrive on their own." },
      { icon: "ti-share", title: "A link for friends", text: "One link and your people see the list, without asking what to get you." },
      { icon: "ti-eye-off", title: "Secret reservation", text: "A friend marks a gift as taken — you don't see it, the surprise survives." },
    ],
    uk: [
      { icon: "ti-link", title: "Просто посилання на товар", text: "Надішли боту — підтягнуться фото, назва й ціна, заповнювати нічого не треба." },
      { icon: "ti-share", title: "Посилання для друзів", text: "Одне посилання — і близькі бачать список, не питаючи «що подарувати?»." },
      { icon: "ti-eye-off", title: "Таємна бронь", text: "Друг позначає подарунок як обраний — ти цього не бачиш, сюрприз цілий." },
    ],
    fr: [
      { icon: "ti-link", title: "Juste un lien produit", text: "Envoie-le au bot — photo, titre et prix arrivent tout seuls." },
      { icon: "ti-share", title: "Un lien pour les proches", text: "Un lien et ils voient la liste, sans demander quoi t'offrir." },
      { icon: "ti-eye-off", title: "Réservation secrète", text: "Un ami coche un cadeau — tu ne le vois pas, la surprise reste entière." },
    ],
    es: [
      { icon: "ti-link", title: "Solo el enlace del producto", text: "Mándalo al bot — foto, nombre y precio llegan solos." },
      { icon: "ti-share", title: "Un enlace para tus amigos", text: "Un enlace y ven la lista, sin preguntarte qué regalarte." },
      { icon: "ti-eye-off", title: "Reserva secreta", text: "Un amigo marca un regalo como elegido — tú no lo ves, la sorpresa se salva." },
    ],
  },
  analytics: {
    ru: [
      { icon: "ti-sparkles", title: "Взгляд со стороны", text: "AI перечитывает весь дневник и показывает, чего сам в себе не замечаешь." },
      { icon: "ti-battery-charging", title: "Что даёт энергию", text: "Со временем видно, после чего дни выходят хорошими, а после чего — нет." },
      { icon: "ti-calendar-stats", title: "Чем больше записей", text: "Первые выводы появляются недели через две — раньше данных просто мало." },
    ],
    en: [
      { icon: "ti-sparkles", title: "A view from outside", text: "AI re-reads the whole diary and shows what you don't notice in yourself." },
      { icon: "ti-battery-charging", title: "What gives you energy", text: "Over time it shows what your good days follow — and what the bad ones do." },
      { icon: "ti-calendar-stats", title: "The more entries", text: "First conclusions appear after a couple of weeks — earlier there's too little data." },
    ],
    uk: [
      { icon: "ti-sparkles", title: "Погляд збоку", text: "AI перечитує весь щоденник і показує, чого сам у собі не помічаєш." },
      { icon: "ti-battery-charging", title: "Що дає енергію", text: "З часом видно, після чого дні виходять добрими, а після чого — ні." },
      { icon: "ti-calendar-stats", title: "Що більше записів", text: "Перші висновки з'являються тижнів через два — раніше даних просто мало." },
    ],
    fr: [
      { icon: "ti-sparkles", title: "Un regard extérieur", text: "L'IA relit tout ton journal et montre ce que tu ne vois pas chez toi." },
      { icon: "ti-battery-charging", title: "Ce qui te donne de l'énergie", text: "Avec le temps, on voit après quoi les bonnes journées arrivent." },
      { icon: "ti-calendar-stats", title: "Plus il y a de notes", text: "Les premiers constats arrivent après deux semaines — avant, trop peu de données." },
    ],
    es: [
      { icon: "ti-sparkles", title: "Una mirada desde fuera", text: "La IA relee todo el diario y muestra lo que tú no ves en ti mismo." },
      { icon: "ti-battery-charging", title: "Qué te da energía", text: "Con el tiempo se ve tras qué llegan los días buenos y tras qué los malos." },
      { icon: "ti-calendar-stats", title: "Cuantas más entradas", text: "Las primeras conclusiones llegan a las dos semanas — antes hay pocos datos." },
    ],
  },
  biographer: {
    ru: [
      { icon: "ti-quote", title: "Спрашивай как человека", text: "«Как менялось моё здоровье?», «что я обещал и не сделал?» — ответит по записям." },
      { icon: "ti-history", title: "Ответ — это история", text: "Не список фактов, а связный рассказ со ссылками на твои дни." },
      { icon: "ti-bulb", title: "Готовые вопросы", text: "Не знаешь, с чего начать — нажми любую подсказку под полем ввода." },
    ],
    en: [
      { icon: "ti-quote", title: "Ask it like a person", text: "“How did my health change?”, “what did I promise and not do?” — answered from entries." },
      { icon: "ti-history", title: "The answer is a story", text: "Not a list of facts but a connected narrative, pointing back to your days." },
      { icon: "ti-bulb", title: "Ready-made questions", text: "Not sure where to start — tap any suggestion under the input field." },
    ],
    uk: [
      { icon: "ti-quote", title: "Питай як людину", text: "«Як змінювалося моє здоров'я?», «що я обіцяв і не зробив?» — відповість за записами." },
      { icon: "ti-history", title: "Відповідь — це історія", text: "Не список фактів, а зв'язна розповідь із посиланнями на твої дні." },
      { icon: "ti-bulb", title: "Готові питання", text: "Не знаєш, з чого почати — натисни будь-яку підказку під полем вводу." },
    ],
    fr: [
      { icon: "ti-quote", title: "Demande comme à quelqu'un", text: "« Comment ma santé a changé ? », « qu'ai-je promis sans le faire ? »" },
      { icon: "ti-history", title: "La réponse est un récit", text: "Pas une liste de faits, mais une histoire liée à tes journées." },
      { icon: "ti-bulb", title: "Questions toutes prêtes", text: "Tu ne sais pas par où commencer — clique une suggestion sous le champ." },
    ],
    es: [
      { icon: "ti-quote", title: "Pregúntale como a una persona", text: "«¿Cómo cambió mi salud?», «¿qué prometí y no hice?» — responde desde tus entradas." },
      { icon: "ti-history", title: "La respuesta es un relato", text: "No una lista de datos, sino una historia ligada a tus días." },
      { icon: "ti-bulb", title: "Preguntas ya hechas", text: "¿No sabes por dónde empezar? Toca cualquier sugerencia bajo el campo." },
    ],
  },
  lab: {
    ru: [
      { icon: "ti-flask", title: "Проверь гипотезу на себе", text: "«Сплю хуже, когда работаю за полночь» — две недели, и будет ответ." },
      { icon: "ti-bulb", title: "AI предлагает сам", text: "Он видит закономерности в записях и подсказывает, что стоит проверить." },
      { icon: "ti-alert-triangle", title: "Это не медицина", text: "Наблюдения по твоему дневнику, а не диагноз. Врача не заменяет." },
    ],
    en: [
      { icon: "ti-flask", title: "Test a hypothesis on yourself", text: "“I sleep worse when I work past midnight” — two weeks and you'll know." },
      { icon: "ti-bulb", title: "AI suggests them", text: "It spots patterns in your entries and proposes what's worth testing." },
      { icon: "ti-alert-triangle", title: "This isn't medicine", text: "Observations from your own diary, not a diagnosis. No substitute for a doctor." },
    ],
    uk: [
      { icon: "ti-flask", title: "Перевір гіпотезу на собі", text: "«Сплю гірше, коли працюю за північ» — два тижні, і буде відповідь." },
      { icon: "ti-bulb", title: "AI пропонує сам", text: "Він бачить закономірності в записах і підказує, що варто перевірити." },
      { icon: "ti-alert-triangle", title: "Це не медицина", text: "Спостереження за твоїм щоденником, а не діагноз. Лікаря не замінює." },
    ],
    fr: [
      { icon: "ti-flask", title: "Teste une hypothèse sur toi", text: "« Je dors mal quand je travaille après minuit » — deux semaines et tu sauras." },
      { icon: "ti-bulb", title: "L'IA en propose", text: "Elle repère des régularités dans tes notes et suggère quoi vérifier." },
      { icon: "ti-alert-triangle", title: "Ce n'est pas de la médecine", text: "Des observations tirées de ton journal, pas un diagnostic." },
    ],
    es: [
      { icon: "ti-flask", title: "Prueba una hipótesis contigo", text: "«Duermo peor si trabajo pasada la medianoche» — dos semanas y lo sabrás." },
      { icon: "ti-bulb", title: "La IA las propone", text: "Detecta patrones en tus entradas y sugiere qué merece la pena comprobar." },
      { icon: "ti-alert-triangle", title: "Esto no es medicina", text: "Observaciones de tu diario, no un diagnóstico. No sustituye al médico." },
    ],
  },
  mood: {
    ru: [
      { icon: "ti-calendar-heart", title: "Месяц одним взглядом", text: "Каждый день — квадратик. Видно сразу, каким был месяц на самом деле." },
      { icon: "ti-wand", title: "Заполняется само", text: "Настроение AI берёт из записей — отмечать вручную не обязательно." },
      { icon: "ti-hand-click", title: "Можно поправить", text: "Нажми на день и поставь своё — твоя оценка важнее любой автоматики." },
    ],
    en: [
      { icon: "ti-calendar-heart", title: "A month at a glance", text: "Every day is a square. You see straight away what the month was really like." },
      { icon: "ti-wand", title: "It fills itself in", text: "AI takes mood from your entries — marking by hand is optional." },
      { icon: "ti-hand-click", title: "You can correct it", text: "Tap a day and set your own — your judgement beats any automation." },
    ],
    uk: [
      { icon: "ti-calendar-heart", title: "Місяць одним поглядом", text: "Кожен день — квадратик. Видно одразу, яким був місяць насправді." },
      { icon: "ti-wand", title: "Заповнюється саме", text: "Настрій AI бере із записів — позначати вручну не обов'язково." },
      { icon: "ti-hand-click", title: "Можна поправити", text: "Натисни на день і постав своє — твоя оцінка важливіша за будь-яку автоматику." },
    ],
    fr: [
      { icon: "ti-calendar-heart", title: "Un mois d'un coup d'œil", text: "Chaque jour est un carré. On voit tout de suite comment le mois s'est passé." },
      { icon: "ti-wand", title: "Ça se remplit tout seul", text: "L'IA tire l'humeur de tes notes — cocher à la main est facultatif." },
      { icon: "ti-hand-click", title: "Tu peux corriger", text: "Clique un jour et mets le tien — ton avis prime sur l'automatique." },
    ],
    es: [
      { icon: "ti-calendar-heart", title: "Un mes de un vistazo", text: "Cada día es un cuadrito. Se ve enseguida cómo fue el mes de verdad." },
      { icon: "ti-wand", title: "Se rellena solo", text: "La IA saca el ánimo de tus entradas — marcarlo a mano es opcional." },
      { icon: "ti-hand-click", title: "Puedes corregirlo", text: "Toca un día y pon el tuyo — tu criterio manda sobre cualquier automatismo." },
    ],
  },
  sort: {
    ru: [
      { icon: "ti-arrows-join", title: "Склеить дубли", text: "«Серёжа» и «Серёга» — один человек. Нажми «Объединить», записи сойдутся вместе." },
      { icon: "ti-x", title: "Если это разные люди", text: "Жми «Разные» — бот запомнит и больше не будет их путать." },
      { icon: "ti-checks", title: "Список должен пустеть", text: "Каждая твоя поправка становится правилом, поэтому со временем работы всё меньше." },
    ],
    en: [
      { icon: "ti-arrows-join", title: "Merge duplicates", text: "“Mike” and “Michael” are one person. Hit “Merge” and the entries come together." },
      { icon: "ti-x", title: "If they're different people", text: "Hit “Different” — the bot remembers and stops confusing them." },
      { icon: "ti-checks", title: "The list should shrink", text: "Every correction becomes a rule, so there's less to fix over time." },
    ],
    uk: [
      { icon: "ti-arrows-join", title: "Склеїти дублі", text: "«Сергій» і «Серьога» — одна людина. Натисни «Об'єднати», записи зійдуться." },
      { icon: "ti-x", title: "Якщо це різні люди", text: "Тисни «Різні» — бот запам'ятає й більше не плутатиме." },
      { icon: "ti-checks", title: "Список має порожніти", text: "Кожна твоя поправка стає правилом, тому з часом роботи все менше." },
    ],
    fr: [
      { icon: "ti-arrows-join", title: "Fusionner les doublons", text: "« Mika » et « Michel » sont la même personne. Clique « Fusionner »." },
      { icon: "ti-x", title: "Si ce sont deux personnes", text: "Clique « Différents » — le bot retient et ne les confondra plus." },
      { icon: "ti-checks", title: "La liste doit se vider", text: "Chaque correction devient une règle : il y a de moins en moins à trier." },
    ],
    es: [
      { icon: "ti-arrows-join", title: "Unir duplicados", text: "«Pepe» y «José» son la misma persona. Pulsa «Unir» y las entradas se juntan." },
      { icon: "ti-x", title: "Si son personas distintas", text: "Pulsa «Distintos» — el bot lo recuerda y deja de confundirlas." },
      { icon: "ti-checks", title: "La lista debe vaciarse", text: "Cada corrección se vuelve regla, así que con el tiempo hay menos que ordenar." },
    ],
  },
  profile: {
    ru: [
      { icon: "ti-message-2", title: "Тон общения", text: "Девять вариантов — от тёплого друга до делового. Меняется в один тап." },
      { icon: "ti-download", title: "Забрать всё", text: "«Твои данные» — полный экспорт и выгрузка в Obsidian в один клик." },
      { icon: "ti-device-watch", title: "Часы и брелок", text: "«Мои устройства»: нажал на циферблате, наговорил — запись уже в дневнике." },
    ],
    en: [
      { icon: "ti-message-2", title: "Tone of voice", text: "Nine options — from warm friend to businesslike. Switches in one tap." },
      { icon: "ti-download", title: "Take it all with you", text: "“Your data” — full export and an Obsidian archive in one click." },
      { icon: "ti-device-watch", title: "Watch and key fob", text: "“My devices”: press on the watch face, speak — the entry is already in the diary." },
    ],
    uk: [
      { icon: "ti-message-2", title: "Тон спілкування", text: "Дев'ять варіантів — від теплого друга до ділового. Змінюється в один тап." },
      { icon: "ti-download", title: "Забрати все", text: "«Твої дані» — повний експорт і вивантаження в Obsidian в один клік." },
      { icon: "ti-device-watch", title: "Годинник і брелок", text: "«Мої пристрої»: натиснув на циферблаті, наговорив — запис уже в щоденнику." },
    ],
    fr: [
      { icon: "ti-message-2", title: "Le ton du bot", text: "Neuf styles — de l'ami chaleureux au ton pro. Ça change en un clic." },
      { icon: "ti-download", title: "Tout emporter", text: "« Tes données » — export complet et archive Obsidian en un clic." },
      { icon: "ti-device-watch", title: "Montre et porte-clés", text: "« Mes appareils » : un appui sur la montre, tu parles — c'est déjà noté." },
    ],
    es: [
      { icon: "ti-message-2", title: "Tono de conversación", text: "Nueve estilos — de amigo cercano a formal. Se cambia con un toque." },
      { icon: "ti-download", title: "Llévatelo todo", text: "«Tus datos» — exportación completa y archivo para Obsidian en un clic." },
      { icon: "ti-device-watch", title: "Reloj y llavero", text: "«Mis dispositivos»: pulsas en la esfera, hablas — ya está en el diario." },
    ],
  },
  paths: {
    ru: [
      { icon: "ti-route", title: "Длинная дорога по шагам", text: "Год без сахара, ремонт, марафон — путь показывает движение, а не только финиш." },
      { icon: "ti-share", title: "Можно поделиться", text: "У пути есть публичная ссылка — близкие увидят прогресс, если сам захочешь." },
      { icon: "ti-flag", title: "Отмечай этапы", text: "Каждая страница пути — веха. Через полгода приятно листать назад." },
    ],
    en: [
      { icon: "ti-route", title: "A long road, step by step", text: "A year without sugar, a renovation, a marathon — the path shows movement, not just the finish." },
      { icon: "ti-share", title: "Shareable", text: "A path has a public link — your people see the progress, if you want them to." },
      { icon: "ti-flag", title: "Mark the milestones", text: "Every page of a path is a marker. Six months in it's a joy to scroll back." },
    ],
    uk: [
      { icon: "ti-route", title: "Довга дорога по кроках", text: "Рік без цукру, ремонт, марафон — шлях показує рух, а не лише фініш." },
      { icon: "ti-share", title: "Можна поділитися", text: "У шляху є публічне посилання — близькі побачать прогрес, якщо сам захочеш." },
      { icon: "ti-flag", title: "Позначай етапи", text: "Кожна сторінка шляху — віха. Через пів року приємно гортати назад." },
    ],
    fr: [
      { icon: "ti-route", title: "Un long chemin, pas à pas", text: "Un an sans sucre, des travaux, un marathon — le chemin montre le mouvement." },
      { icon: "ti-share", title: "Partageable", text: "Un chemin a un lien public — tes proches voient les progrès, si tu le veux." },
      { icon: "ti-flag", title: "Marque les étapes", text: "Chaque page est un jalon. Six mois après, c'est un plaisir de remonter." },
    ],
    es: [
      { icon: "ti-route", title: "Un camino largo, por pasos", text: "Un año sin azúcar, una reforma, un maratón — el camino muestra el avance." },
      { icon: "ti-share", title: "Se puede compartir", text: "Un camino tiene enlace público — los tuyos ven el progreso, si tú quieres." },
      { icon: "ti-flag", title: "Marca las etapas", text: "Cada página es un hito. A los seis meses da gusto mirar atrás." },
    ],
  },
  ideas: {
    ru: [
      { icon: "ti-bulb", title: "Скажи боту «идея»", text: "Он обсудит её с тобой, доведёт до понятной формулировки и передаст." },
      { icon: "ti-status-change", title: "Видно, что стало", text: "У каждой идеи есть статус — не пропадает в переписке." },
      { icon: "ti-bell", title: "Ответ придёт сам", text: "Когда решение принято, бот напишет тебе — спрашивать не надо." },
    ],
    en: [
      { icon: "ti-bulb", title: "Tell the bot “an idea”", text: "It talks it through with you, shapes it up and passes it on." },
      { icon: "ti-status-change", title: "You see what happened", text: "Every idea has a status — nothing drowns in the chat." },
      { icon: "ti-bell", title: "The answer comes to you", text: "When a decision is made, the bot writes — no need to ask." },
    ],
    uk: [
      { icon: "ti-bulb", title: "Скажи боту «ідея»", text: "Він обговорить її з тобою, доведе до зрозумілого формулювання й передасть." },
      { icon: "ti-status-change", title: "Видно, що стало", text: "У кожної ідеї є статус — не зникає в листуванні." },
      { icon: "ti-bell", title: "Відповідь прийде сама", text: "Коли рішення ухвалене, бот напише тобі — питати не треба." },
    ],
    fr: [
      { icon: "ti-bulb", title: "Dis au bot « une idée »", text: "Il en discute avec toi, la met en forme et la transmet." },
      { icon: "ti-status-change", title: "Tu vois ce qu'elle devient", text: "Chaque idée a un statut — rien ne se perd dans la conversation." },
      { icon: "ti-bell", title: "La réponse vient à toi", text: "Quand la décision est prise, le bot t'écrit — inutile de relancer." },
    ],
    es: [
      { icon: "ti-bulb", title: "Dile al bot «una idea»", text: "La comenta contigo, le da forma clara y la transmite." },
      { icon: "ti-status-change", title: "Ves en qué quedó", text: "Cada idea tiene estado — no se pierde en el chat." },
      { icon: "ti-bell", title: "La respuesta llega sola", text: "Cuando hay decisión, el bot te escribe — no hace falta preguntar." },
    ],
  },
  heirs: {
    ru: [
      { icon: "ti-user-check", title: "Кому и когда", text: "Назначаешь человека и условие — книга откроется только по нему." },
      { icon: "ti-lock", title: "До этого никто не увидит", text: "Пока условие не наступило, дневник остаётся только твоим." },
      { icon: "ti-refresh", title: "Решение не навсегда", text: "Список наследников можно поменять в любой момент." },
    ],
    en: [
      { icon: "ti-user-check", title: "Who and when", text: "You name a person and a condition — the book opens only under it." },
      { icon: "ti-lock", title: "Until then, nobody sees it", text: "Until the condition is met, the diary stays yours alone." },
      { icon: "ti-refresh", title: "Not set in stone", text: "The list of heirs can be changed at any time." },
    ],
    uk: [
      { icon: "ti-user-check", title: "Кому і коли", text: "Призначаєш людину та умову — книга відкриється лише за нею." },
      { icon: "ti-lock", title: "До того ніхто не побачить", text: "Поки умова не настала, щоденник лишається тільки твоїм." },
      { icon: "ti-refresh", title: "Рішення не назавжди", text: "Список спадкоємців можна змінити будь-якої миті." },
    ],
    fr: [
      { icon: "ti-user-check", title: "À qui et quand", text: "Tu désignes une personne et une condition — le livre ne s'ouvre qu'ainsi." },
      { icon: "ti-lock", title: "Avant, personne ne voit", text: "Tant que la condition n'est pas remplie, le journal reste le tien." },
      { icon: "ti-refresh", title: "Rien n'est définitif", text: "La liste des héritiers se modifie à tout moment." },
    ],
    es: [
      { icon: "ti-user-check", title: "A quién y cuándo", text: "Eliges persona y condición — el libro se abre solo con ella." },
      { icon: "ti-lock", title: "Hasta entonces, nadie lo ve", text: "Mientras no se cumpla la condición, el diario es solo tuyo." },
      { icon: "ti-refresh", title: "No es para siempre", text: "La lista de herederos se puede cambiar en cualquier momento." },
    ],
  },
  referrals: {
    ru: [
      { icon: "ti-gift", title: "Книга в подарок", text: "За приглашённых друзей печатная Книга жизни достаётся бесплатно." },
      { icon: "ti-affiliate", title: "Дерево вглубь", text: "Видно не только тех, кого позвал ты, но и кого позвали они." },
      { icon: "ti-link", title: "Одна ссылка на всё", text: "У тебя личная ссылка вида /i/имя — её и отправляй." },
    ],
    en: [
      { icon: "ti-gift", title: "A book as a gift", text: "Invite friends and the printed Book of Life comes to you free." },
      { icon: "ti-affiliate", title: "The tree goes deeper", text: "You see not only who you invited, but who they invited too." },
      { icon: "ti-link", title: "One link for everything", text: "You have a personal link like /i/name — that's the one to send." },
    ],
    uk: [
      { icon: "ti-gift", title: "Книга в подарунок", text: "За запрошених друзів друкована Книга життя дістається безкоштовно." },
      { icon: "ti-affiliate", title: "Дерево вглиб", text: "Видно не лише тих, кого покликав ти, а й кого покликали вони." },
      { icon: "ti-link", title: "Одне посилання на все", text: "У тебе особисте посилання виду /i/ім'я — його й надсилай." },
    ],
    fr: [
      { icon: "ti-gift", title: "Un livre offert", text: "Invite des amis et le Livre de vie imprimé te revient gratuitement." },
      { icon: "ti-affiliate", title: "L'arbre en profondeur", text: "Tu vois qui tu as invité, mais aussi qui eux ont invité." },
      { icon: "ti-link", title: "Un seul lien", text: "Tu as un lien personnel du type /i/nom — c'est celui à envoyer." },
    ],
    es: [
      { icon: "ti-gift", title: "Un libro de regalo", text: "Por los amigos que invites, el Libro de vida impreso te sale gratis." },
      { icon: "ti-affiliate", title: "El árbol en profundidad", text: "Ves no solo a quién invitaste tú, sino a quién invitaron ellos." },
      { icon: "ti-link", title: "Un enlace para todo", text: "Tienes un enlace personal tipo /i/nombre — ese es el que mandas." },
    ],
  },
  guide: {
    ru: [
      { icon: "ti-list-search", title: "Всё по полочкам", text: "Полсотни возможностей, разложенных по темам — с примерами фраз." },
      { icon: "ti-news", title: "Что нового", text: "Журнал изменений: что появилось на этой неделе и что в работе." },
      { icon: "ti-hand-click", title: "Карточки открываются", text: "Нажми на любую — внутри инструкция, примеры и подсказки." },
    ],
    en: [
      { icon: "ti-list-search", title: "Everything in order", text: "Fifty-plus features grouped by topic — with example phrases." },
      { icon: "ti-news", title: "What's new", text: "A changelog: what appeared this week and what's in the works." },
      { icon: "ti-hand-click", title: "Cards open up", text: "Tap any of them — inside there are steps, examples and tips." },
    ],
    uk: [
      { icon: "ti-list-search", title: "Усе по поличках", text: "Півсотні можливостей, розкладених за темами — з прикладами фраз." },
      { icon: "ti-news", title: "Що нового", text: "Журнал змін: що з'явилося цього тижня і що в роботі." },
      { icon: "ti-hand-click", title: "Картки відкриваються", text: "Натисни на будь-яку — усередині інструкція, приклади й підказки." },
    ],
    fr: [
      { icon: "ti-list-search", title: "Tout est classé", text: "Une cinquantaine de fonctions par thème — avec des exemples de phrases." },
      { icon: "ti-news", title: "Quoi de neuf", text: "Le journal des changements : cette semaine et ce qui arrive." },
      { icon: "ti-hand-click", title: "Les cartes s'ouvrent", text: "Clique sur l'une d'elles — mode d'emploi, exemples et astuces dedans." },
    ],
    es: [
      { icon: "ti-list-search", title: "Todo ordenado", text: "Más de cincuenta funciones por temas — con frases de ejemplo." },
      { icon: "ti-news", title: "Qué hay de nuevo", text: "Registro de cambios: qué salió esta semana y qué está en marcha." },
      { icon: "ti-hand-click", title: "Las tarjetas se abren", text: "Toca cualquiera — dentro hay instrucciones, ejemplos y consejos." },
    ],
  },
};

// Какая подсказка считается «уже освоенной». Порядок — как в массивах выше:
// первая, вторая, третья. null — проверять нечего, показываем всегда.
//
// Привязываем к номеру, а не к тексту: тексты живут в пяти языках, а условие
// у них общее.
const DONE: Record<string, (DoneKey | null)[]> = {
  today: ["voice", null, null],
  diary: [null, null, "voice"],
  health: ["health", "health", null],
  goals: ["goals", "tasks", null],
  reminders: ["reminders", "reminders", null],
  finance: ["finance", "finance", null],
  people: ["people", null, null],
  places: ["trips", null, null],
  notes: ["notes", "notes", "lists"],
  knowledge: ["knowledge", "knowledge", "knowledge"],
  memory: ["memory", "memory", "memory"],
  books: ["books", "books", "books"],
  wishlist: ["wishlist", "wishlist", null],
};

/** Условия, которые нужны этому разделу, — чтобы не спрашивать базу лишнего. */
export function sectionDoneKeys(section?: string): DoneKey[] {
  if (!section) return [];
  return (DONE[section] || []).filter((k): k is DoneKey => !!k);
}

/** Номер подсказки -> условие, при котором её уже можно не показывать. */
export function tipDoneKey(section: string | undefined, index: number): DoneKey | null {
  if (!section) return null;
  return (DONE[section] || [])[index] || null;
}

export function sectionTips(section: string | undefined, locale: Locale, count: number): Tip[] {
  if (!section) return [];
  const pack = S[section];
  if (!pack) return [];
  return (pack[locale] || pack.ru).slice(0, count);
}

export function hasSectionTips(section?: string): boolean {
  return !!section && !!S[section];
}
