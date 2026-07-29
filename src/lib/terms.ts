// Условия использования (Terms of Service). Формальный документ, парный к
// Политике конфиденциальности (src/lib/privacyPolicy.ts). Отдаём в App Store Connect.
// Правило: меняются тарифы, правила книги или реферальной программы — правим здесь и двигаем TERMS_UPDATED_ISO.

import type { PolicySection } from "./privacyPolicy";
import { POLICY_EMAIL } from "./privacyPolicy";

export type TermsContent = {
  title: string;
  updated: string;
  intro: string;
  privacyLink: string; // подпись ссылки на Политику конфиденциальности
  sections: PolicySection[];
  back: string;
};

export const TERMS_UPDATED_ISO = "2026-07-29";

const T: Record<string, TermsContent> = {
  ru: {
    title: "Условия использования",
    updated: "Действуют с 29 июля 2026 года",
    privacyLink: "Политика конфиденциальности",
    intro:
      "Это соглашение между тобой и владельцем LIFE OS. Оно описывает, как устроен сервис, что можно и чего нельзя, как работают тарифы и кто за что отвечает.",
    sections: [
      {
        h: "1. О чём эти условия",
        blocks: [
          { p: "Пользуясь сайтом life-os.today, ботом LIFE OS в Telegram или мобильным приложением, ты соглашаешься с этими условиями. Если ты с ними не согласен — пожалуйста, не пользуйся сервисом." },
          { p: "Как мы обращаемся с твоими данными, описано отдельно — в Политике конфиденциальности. Она является неотъемлемой частью этих условий." },
        ],
      },
      {
        h: "2. Кто предоставляет сервис",
        blocks: [
          { p: `LIFE OS предоставляет Игорь Холодинский — частный разработчик (физическое лицо). Связь: ${POLICY_EMAIL} или бот LIFE OS в Telegram.` },
        ],
      },
      {
        h: "3. Что такое LIFE OS",
        blocks: [
          { p: "LIFE OS — личный дневник и «второй мозг»: ты записываешь голосом или текстом, а сервис сохраняет, структурирует и помогает найти нужное. В него входят дневник, задачи и напоминания, заметки, финансы, здоровье, книги, путешествия, люди и другие разделы, а также AI-помощники." },
          { p: "Сервис находится в стадии активного развития. Разделы и функции могут меняться, появляться и исчезать." },
        ],
      },
      {
        h: "4. Аккаунт",
        blocks: [
          {
            ul: [
              "Аккаунт создаётся через Telegram, по электронной почте или через Google. Один человек — один аккаунт.",
              "Пользоваться сервисом можно с 16 лет.",
              "Личная ссылка входа, PIN-код и пароль — твоя ответственность: не передавай их посторонним. Ссылку из команды /link пересылать нельзя: тот, кто по ней перейдёт, попадёт в твой дневник.",
              "Если ты потерял доступ, напиши нам — восстановим через подтверждённый Telegram или почту.",
            ],
          },
        ],
      },
      {
        h: "5. Твой контент остаётся твоим",
        blocks: [
          { p: "Все записи, фотографии, файлы и любые данные, которые ты вносишь, принадлежат тебе. Мы не претендуем на права на них и не используем их для обучения AI-моделей." },
          { p: "Чтобы сервис работал, ты даёшь нам ограниченное разрешение хранить твой контент, делать резервные копии, показывать его тебе и обрабатывать — включая передачу подрядчикам, перечисленным в Политике конфиденциальности. Это разрешение действует только ради предоставления сервиса тебе и прекращается вместе с удалением контента или аккаунта." },
          { p: "Забрать всё своё одним файлом можно в любой момент: «Профиль → Твои данные»." },
        ],
      },
      {
        h: "6. Правила пользования",
        blocks: [
          { p: "Пользуясь сервисом, ты соглашаешься не делать следующего:" },
          {
            ul: [
              "нарушать закон, права других людей или размещать через сервис незаконный контент;",
              "использовать передачу сообщений другим пользователям для спама, угроз, оскорблений или рассылок;",
              "вносить чужие персональные данные, если у тебя нет на это законного основания;",
              "пытаться получить доступ к чужим аккаунтам, обходить ограничения, нагружать сервис автоматическими запросами или выкачивать данные роботами;",
              "перепродавать доступ к сервису или выдавать его за свой;",
              "накручивать реферальную программу — фиктивные приглашения, несколько аккаунтов на одного человека.",
            ],
          },
          { p: "При серьёзном или повторном нарушении мы можем ограничить либо закрыть доступ — по возможности предупредив заранее." },
        ],
      },
      {
        h: "7. Тарифы и оплата",
        blocks: [
          {
            ul: [
              "«Старт» — бесплатный, с лимитом записей. Платные тарифы: Pro — $9.99 в месяц, Премиум — $19.99 в месяц. Актуальные цены и состав — на странице «Тарифы».",
              "Автоматической оплаты в сервисе пока нет: ты оставляешь заявку, а подключение и оплату мы согласуем вручную. Когда оплата появится, её условия будут описаны отдельно.",
              "Лимиты записей на платных тарифах мягкие: это защита от перегруза, а не жёсткая отсечка.",
              "Цены могут меняться. О повышении для уже оплативших предупредим не менее чем за 30 дней; изменение вступает в силу со следующего оплачиваемого периода.",
              "Оплаченный период не возвращается автоматически при удалении аккаунта по твоей инициативе — напиши нам, решим по справедливости.",
            ],
          },
        ],
      },
      {
        h: "8. Печатная «Книга жизни»",
        blocks: [
          { p: "Печатная книга — отдельный разовый заказ, не входящий в подписку, кроме случаев, прямо указанных в тарифе «Премиум» или в действующей акции. Стоимость, сроки печати и доставки согласуются индивидуально до оплаты. Книга изготавливается по твоему макету, поэтому возврат возможен при производственном браке, повреждении при доставке или ошибке с нашей стороны." },
          { p: "Бесплатная книга по программе «Пригласи друга» выдаётся за реальных приглашённых, которые сами начали пользоваться сервисом. Фиктивные приглашения аннулируют право на неё." },
        ],
      },
      {
        h: "9. Тестировщики",
        blocks: [
          { p: "Если ты участвуешь в оплачиваемом тестировании, вознаграждение за найденные ошибки и отчёты определяется владельцем сервиса по каждому случаю и подтверждается до выплаты. Отправка отчёта сама по себе не создаёт обязательства по оплате." },
        ],
      },
      {
        h: "10. AI и его границы",
        blocks: [
          { p: "AI-помощники разбирают записи, отвечают на вопросы и дают наблюдения. Это информация, а не консультация: LIFE OS не является медицинской, психологической, юридической или финансовой службой, и ответы AI нельзя использовать как основание для решений в этих областях." },
          { p: "AI может ошибаться, неверно расслышать голосовое сообщение или неправильно понять смысл. Проверяй важное — особенно суммы, даты и всё, что касается здоровья." },
          { p: "Если тебе плохо или ты в опасности, обратись в экстренные службы или к специалисту: сервис не предназначен для кризисной помощи." },
        ],
      },
      {
        h: "11. Публикация и доступ других людей",
        blocks: [
          { p: "По умолчанию всё видно только тебе. Публичные страницы, приглашения, назначение наследника и передача сообщений другому пользователю включаются тобой — и ты отвечаешь за то, что открываешь и кому. Публикуя чужие имена, фотографии или переписку, убедись, что имеешь на это право." },
        ],
      },
      {
        h: "12. Доступность сервиса",
        blocks: [
          { p: "Мы стараемся, чтобы сервис работал постоянно, но не гарантируем непрерывность: возможны сбои, плановые работы и перебои у подрядчиков — Telegram, хостинга, AI-провайдеров. Мы делаем резервные копии, но советуем держать и свою: экспорт доступен в любой момент, а еженедельную копию в Telegram можно включить в настройках." },
        ],
      },
      {
        h: "13. Изменения сервиса и условий",
        blocks: [
          { p: "Мы можем менять и развивать сервис, а также эти условия. О существенных изменениях сообщим в боте или на сайте до вступления в силу. Продолжая пользоваться сервисом после этого, ты принимаешь новую редакцию. Если не согласен — можешь удалить аккаунт." },
        ],
      },
      {
        h: "14. Прекращение",
        blocks: [
          {
            ul: [
              "Ты можешь уйти в любой момент: «Профиль → Твои данные → Право уйти» стирает аккаунт целиком и безвозвратно.",
              "Мы можем приостановить или закрыть доступ при нарушении этих условий, при угрозе безопасности или если сервис прекращает работу.",
              "Если сервис будет закрываться, мы предупредим заранее и дадим время забрать данные.",
            ],
          },
        ],
      },
      {
        h: "15. Ответственность",
        blocks: [
          { p: "Сервис предоставляется «как есть». В пределах, разрешённых законом, мы не отвечаем за упущенную выгоду, за потерю данных из-за сбоев подрядчиков или обстоятельств вне нашего контроля, а также за решения, которые ты принял на основании подсказок AI." },
          { p: "Наша совокупная ответственность в любом случае ограничена суммой, которую ты фактически заплатил за сервис за последние 12 месяцев. Это ограничение не затрагивает права, которые нельзя ограничить по закону, включая права потребителей." },
        ],
      },
      {
        h: "16. Право и споры",
        blocks: [
          { p: `К этим условиям применяется законодательство Украины. Сначала мы пробуем решить спор перепиской: напиши на ${POLICY_EMAIL}, мы отвечаем в течение 30 дней. Если ты потребитель из ЕС/ЕЭЗ или Великобритании, за тобой сохраняются права и защита, предусмотренные законом страны твоего проживания.` },
        ],
      },
      {
        h: "17. Контакты",
        blocks: [
          { p: `${POLICY_EMAIL} или бот LIFE OS в Telegram.` },
        ],
      },
    ],
    back: "На главную",
  },

  en: {
    title: "Terms of Service",
    updated: "Effective from 29 July 2026",
    privacyLink: "Privacy Policy",
    intro:
      "This is an agreement between you and the owner of LIFE OS. It describes how the service works, what is and isn't allowed, how plans work and who is responsible for what.",
    sections: [
      {
        h: "1. What these terms cover",
        blocks: [
          { p: "By using the life-os.today website, the LIFE OS bot in Telegram or the mobile app, you agree to these terms. If you do not agree with them, please do not use the service." },
          { p: "How we handle your data is described separately, in the Privacy Policy. It forms an integral part of these terms." },
        ],
      },
      {
        h: "2. Who provides the service",
        blocks: [
          { p: `LIFE OS is provided by Igor Kholodinsky, an individual independent developer. Contact: ${POLICY_EMAIL} or the LIFE OS bot in Telegram.` },
        ],
      },
      {
        h: "3. What LIFE OS is",
        blocks: [
          { p: "LIFE OS is a personal diary and “second brain”: you record by voice or text, and the service stores, structures and helps you find what you need. It includes the diary, tasks and reminders, notes, finance, health, books, trips, people and other sections, plus AI assistants." },
          { p: "The service is under active development. Sections and features may change, appear and disappear." },
        ],
      },
      {
        h: "4. Your account",
        blocks: [
          {
            ul: [
              "An account is created via Telegram, by e-mail or with Google. One person — one account.",
              "You must be at least 16 years old to use the service.",
              "Your personal sign-in link, PIN and password are your responsibility: do not share them. The link from the /link command must not be forwarded — whoever opens it lands in your diary.",
              "If you lose access, write to us and we will restore it via your confirmed Telegram or e-mail.",
            ],
          },
        ],
      },
      {
        h: "5. Your content stays yours",
        blocks: [
          { p: "All entries, photos, files and any data you add belong to you. We claim no rights over them and do not use them to train AI models." },
          { p: "So the service can work, you grant us a limited permission to store your content, keep backups, display it to you and process it — including sharing it with the processors listed in the Privacy Policy. This permission exists solely to provide the service to you and ends when the content or the account is deleted." },
          { p: "You can take everything in a single file at any time: “Profile → Your data”." },
        ],
      },
      {
        h: "6. Rules of use",
        blocks: [
          { p: "By using the service you agree not to:" },
          {
            ul: [
              "break the law, infringe other people's rights or post illegal content through the service;",
              "use message relay to other users for spam, threats, abuse or bulk mailings;",
              "add other people's personal data without a lawful basis;",
              "attempt to access other accounts, circumvent limits, overload the service with automated requests or scrape data with bots;",
              "resell access to the service or pass it off as your own;",
              "game the referral programme — fake invitations, several accounts for one person.",
            ],
          },
          { p: "In case of a serious or repeated violation we may limit or close your access, giving notice in advance where possible." },
        ],
      },
      {
        h: "7. Plans and payment",
        blocks: [
          {
            ul: [
              "“Start” is free, with an entry limit. Paid plans: Pro — $9.99 per month, Premium — $19.99 per month. Current prices and contents are on the Pricing page.",
              "There is no automatic payment in the service yet: you leave a request and we arrange activation and payment manually. When payments launch, their terms will be described separately.",
              "Entry limits on paid plans are soft: they protect against overload rather than cutting you off.",
              "Prices may change. Existing paying users will be notified of an increase at least 30 days in advance; it takes effect from the next billing period.",
              "A paid period is not refunded automatically if you delete your account yourself — write to us and we will settle it fairly.",
            ],
          },
        ],
      },
      {
        h: "8. The printed Book of Life",
        blocks: [
          { p: "The printed book is a separate one-time order, not included in the subscription, except where the Premium plan or a current promotion says otherwise. Price, printing and delivery times are agreed individually before payment. The book is produced from your own layout, so refunds apply in case of a manufacturing defect, damage in transit or an error on our side." },
          { p: "The free book under the “Invite a friend” programme is granted for real invitees who actually started using the service. Fake invitations void the entitlement." },
        ],
      },
      {
        h: "9. Testers",
        blocks: [
          { p: "If you take part in paid testing, the reward for reported bugs and reports is set by the service owner case by case and confirmed before payout. Submitting a report does not by itself create a payment obligation." },
        ],
      },
      {
        h: "10. AI and its limits",
        blocks: [
          { p: "AI assistants parse your entries, answer questions and offer observations. That is information, not advice: LIFE OS is not a medical, psychological, legal or financial service, and AI answers must not be used as a basis for decisions in those areas." },
          { p: "AI can be wrong, mishear a voice message or misread the meaning. Double-check what matters — especially amounts, dates and anything health-related." },
          { p: "If you feel unwell or are in danger, contact emergency services or a professional: the service is not built for crisis support." },
        ],
      },
      {
        h: "11. Publishing and access by others",
        blocks: [
          { p: "By default everything is visible only to you. Public pages, invitations, designating an heir and relaying a message to another user are all switched on by you — and you are responsible for what you open and to whom. When publishing other people's names, photos or correspondence, make sure you have the right to do so." },
        ],
      },
      {
        h: "12. Availability",
        blocks: [
          { p: "We do our best to keep the service running, but we do not guarantee uninterrupted operation: outages, maintenance and failures at our providers — Telegram, hosting, AI providers — are possible. We keep backups, but we recommend keeping your own too: an export is available at any moment, and a weekly copy to Telegram can be enabled in settings." },
        ],
      },
      {
        h: "13. Changes to the service and terms",
        blocks: [
          { p: "We may change and develop the service as well as these terms. We will announce material changes in the bot or on the site before they take effect. By continuing to use the service afterwards you accept the new version. If you disagree, you can delete your account." },
        ],
      },
      {
        h: "14. Termination",
        blocks: [
          {
            ul: [
              "You can leave at any time: “Profile → Your data → Right to leave” erases the whole account permanently.",
              "We may suspend or close access if these terms are violated, if there is a security threat, or if the service shuts down.",
              "If the service is being shut down, we will give notice in advance and time to take your data.",
            ],
          },
        ],
      },
      {
        h: "15. Liability",
        blocks: [
          { p: "The service is provided “as is”. To the extent permitted by law, we are not liable for lost profit, for data loss caused by provider failures or circumstances beyond our control, or for decisions you made based on AI suggestions." },
          { p: "Our total liability is in any case limited to the amount you actually paid for the service in the last 12 months. This limitation does not affect rights that cannot be limited by law, including consumer rights." },
        ],
      },
      {
        h: "16. Governing law and disputes",
        blocks: [
          { p: `These terms are governed by the law of Ukraine. We try to resolve any dispute by correspondence first: write to ${POLICY_EMAIL} and we reply within 30 days. If you are a consumer in the EU/EEA or the UK, you keep the rights and protections granted by the law of your country of residence.` },
        ],
      },
      {
        h: "17. Contact",
        blocks: [
          { p: `${POLICY_EMAIL} or the LIFE OS bot in Telegram.` },
        ],
      },
    ],
    back: "Home",
  },

  uk: {
    title: "Умови використання",
    updated: "Діють з 29 липня 2026 року",
    privacyLink: "Політика конфіденційності",
    intro:
      "Це угода між тобою та власником LIFE OS. Вона описує, як влаштований сервіс, що можна й чого не можна, як працюють тарифи та хто за що відповідає.",
    sections: [
      {
        h: "1. Про що ці умови",
        blocks: [
          { p: "Користуючись сайтом life-os.today, ботом LIFE OS у Telegram або мобільним застосунком, ти погоджуєшся з цими умовами. Якщо ти з ними не згоден — будь ласка, не користуйся сервісом." },
          { p: "Як ми поводимося з твоїми даними, описано окремо — у Політиці конфіденційності. Вона є невід'ємною частиною цих умов." },
        ],
      },
      {
        h: "2. Хто надає сервіс",
        blocks: [
          { p: `LIFE OS надає Ігор Холодинський — приватний розробник (фізична особа). Зв'язок: ${POLICY_EMAIL} або бот LIFE OS у Telegram.` },
        ],
      },
      {
        h: "3. Що таке LIFE OS",
        blocks: [
          { p: "LIFE OS — особистий щоденник і «другий мозок»: ти записуєш голосом або текстом, а сервіс зберігає, структурує та допомагає знайти потрібне. До нього входять щоденник, задачі й нагадування, нотатки, фінанси, здоров'я, книжки, подорожі, люди та інші розділи, а також AI-помічники." },
          { p: "Сервіс перебуває у стадії активного розвитку. Розділи й функції можуть змінюватися, з'являтися та зникати." },
        ],
      },
      {
        h: "4. Акаунт",
        blocks: [
          {
            ul: [
              "Акаунт створюється через Telegram, електронною поштою або через Google. Одна людина — один акаунт.",
              "Користуватися сервісом можна з 16 років.",
              "Особисте посилання для входу, PIN-код і пароль — твоя відповідальність: не передавай їх стороннім. Посилання з команди /link пересилати не можна: той, хто ним скористається, потрапить у твій щоденник.",
              "Якщо ти втратив доступ, напиши нам — відновимо через підтверджений Telegram чи пошту.",
            ],
          },
        ],
      },
      {
        h: "5. Твій контент залишається твоїм",
        blocks: [
          { p: "Усі записи, фотографії, файли та будь-які дані, які ти вносиш, належать тобі. Ми не претендуємо на права на них і не використовуємо їх для навчання AI-моделей." },
          { p: "Щоб сервіс працював, ти надаєш нам обмежений дозвіл зберігати твій контент, робити резервні копії, показувати його тобі та обробляти — зокрема передавати підрядникам, переліченим у Політиці конфіденційності. Цей дозвіл діє лише задля надання сервісу тобі й припиняється разом із видаленням контенту або акаунта." },
          { p: "Забрати все своє одним файлом можна будь-коли: «Профіль → Твої дані»." },
        ],
      },
      {
        h: "6. Правила користування",
        blocks: [
          { p: "Користуючись сервісом, ти погоджуєшся не робити такого:" },
          {
            ul: [
              "порушувати закон, права інших людей або розміщувати через сервіс незаконний контент;",
              "використовувати передачу повідомлень іншим користувачам для спаму, погроз, образ чи розсилок;",
              "вносити чужі персональні дані, якщо ти не маєш на це законної підстави;",
              "намагатися отримати доступ до чужих акаунтів, обходити обмеження, навантажувати сервіс автоматичними запитами чи викачувати дані роботами;",
              "перепродавати доступ до сервісу або видавати його за свій;",
              "накручувати реферальну програму — фіктивні запрошення, кілька акаунтів на одну людину.",
            ],
          },
          { p: "У разі серйозного або повторного порушення ми можемо обмежити чи закрити доступ — за можливості попередивши заздалегідь." },
        ],
      },
      {
        h: "7. Тарифи та оплата",
        blocks: [
          {
            ul: [
              "«Старт» — безкоштовний, з лімітом записів. Платні тарифи: Pro — $9.99 на місяць, Преміум — $19.99 на місяць. Актуальні ціни та склад — на сторінці «Тарифи».",
              "Автоматичної оплати в сервісі поки немає: ти залишаєш заявку, а підключення й оплату ми узгоджуємо вручну. Коли оплата з'явиться, її умови будуть описані окремо.",
              "Ліміти записів на платних тарифах м'які: це захист від перевантаження, а не жорстка відсічка.",
              "Ціни можуть змінюватися. Про підвищення для тих, хто вже платить, попередимо щонайменше за 30 днів; зміна діє з наступного оплачуваного періоду.",
              "Оплачений період не повертається автоматично, якщо ти видаляєш акаунт із власної ініціативи — напиши нам, вирішимо по справедливості.",
            ],
          },
        ],
      },
      {
        h: "8. Друкована «Книга життя»",
        blocks: [
          { p: "Друкована книга — окреме разове замовлення, що не входить до підписки, крім випадків, прямо зазначених у тарифі «Преміум» чи в чинній акції. Вартість, терміни друку та доставки узгоджуються індивідуально до оплати. Книга виготовляється за твоїм макетом, тому повернення можливе в разі виробничого браку, пошкодження під час доставки або помилки з нашого боку." },
          { p: "Безкоштовна книга за програмою «Запроси друга» надається за реальних запрошених, які самі почали користуватися сервісом. Фіктивні запрошення анулюють право на неї." },
        ],
      },
      {
        h: "9. Тестувальники",
        blocks: [
          { p: "Якщо ти береш участь в оплачуваному тестуванні, винагорода за знайдені помилки та звіти визначається власником сервісу в кожному випадку й підтверджується до виплати. Надсилання звіту саме по собі не створює зобов'язання щодо оплати." },
        ],
      },
      {
        h: "10. AI та його межі",
        blocks: [
          { p: "AI-помічники розбирають записи, відповідають на питання й дають спостереження. Це інформація, а не консультація: LIFE OS не є медичною, психологічною, юридичною чи фінансовою службою, і відповіді AI не можна використовувати як підставу для рішень у цих сферах." },
          { p: "AI може помилятися, недочути голосове повідомлення або хибно зрозуміти зміст. Перевіряй важливе — особливо суми, дати й усе, що стосується здоров'я." },
          { p: "Якщо тобі погано або ти в небезпеці, звернися до екстрених служб чи фахівця: сервіс не призначений для кризової допомоги." },
        ],
      },
      {
        h: "11. Публікація та доступ інших людей",
        blocks: [
          { p: "За замовчуванням усе бачиш лише ти. Публічні сторінки, запрошення, призначення спадкоємця й передачу повідомлень іншому користувачеві вмикаєш ти — і ти відповідаєш за те, що відкриваєш і кому. Публікуючи чужі імена, фотографії чи листування, переконайся, що маєш на це право." },
        ],
      },
      {
        h: "12. Доступність сервісу",
        blocks: [
          { p: "Ми намагаємось, щоб сервіс працював постійно, але не гарантуємо безперервності: можливі збої, планові роботи та перебої в підрядників — Telegram, хостингу, AI-провайдерів. Ми робимо резервні копії, але радимо тримати й свою: експорт доступний будь-коли, а щотижневу копію в Telegram можна ввімкнути в налаштуваннях." },
        ],
      },
      {
        h: "13. Зміни сервісу й умов",
        blocks: [
          { p: "Ми можемо змінювати й розвивати сервіс, а також ці умови. Про суттєві зміни повідомимо в боті або на сайті до набуття чинності. Продовжуючи користуватися сервісом після цього, ти приймаєш нову редакцію. Якщо не згоден — можеш видалити акаунт." },
        ],
      },
      {
        h: "14. Припинення",
        blocks: [
          {
            ul: [
              "Ти можеш піти будь-коли: «Профіль → Твої дані → Право піти» стирає акаунт повністю й безповоротно.",
              "Ми можемо призупинити або закрити доступ у разі порушення цих умов, загрози безпеці або якщо сервіс припиняє роботу.",
              "Якщо сервіс закриватиметься, ми попередимо заздалегідь і дамо час забрати дані.",
            ],
          },
        ],
      },
      {
        h: "15. Відповідальність",
        blocks: [
          { p: "Сервіс надається «як є». У межах, дозволених законом, ми не відповідаємо за втрачену вигоду, за втрату даних через збої підрядників чи обставини поза нашим контролем, а також за рішення, які ти ухвалив на підставі підказок AI." },
          { p: "Наша сукупна відповідальність у будь-якому разі обмежена сумою, яку ти фактично сплатив за сервіс за останні 12 місяців. Це обмеження не зачіпає прав, які не можна обмежити за законом, зокрема прав споживачів." },
        ],
      },
      {
        h: "16. Право та спори",
        blocks: [
          { p: `До цих умов застосовується законодавство України. Спершу ми намагаємось вирішити спір листуванням: напиши на ${POLICY_EMAIL}, ми відповідаємо протягом 30 днів. Якщо ти споживач із ЄС/ЄЕЗ або Великої Британії, за тобою зберігаються права та захист, передбачені законом країни твого проживання.` },
        ],
      },
      {
        h: "17. Контакти",
        blocks: [
          { p: `${POLICY_EMAIL} або бот LIFE OS у Telegram.` },
        ],
      },
    ],
    back: "На головну",
  },

  fr: {
    title: "Conditions d'utilisation",
    updated: "En vigueur depuis le 29 juillet 2026",
    privacyLink: "Politique de confidentialité",
    intro:
      "Ceci est un accord entre toi et le propriétaire de LIFE OS. Il décrit le fonctionnement du service, ce qui est permis et ce qui ne l'est pas, comment fonctionnent les formules et qui est responsable de quoi.",
    sections: [
      {
        h: "1. Objet de ces conditions",
        blocks: [
          { p: "En utilisant le site life-os.today, le bot LIFE OS sur Telegram ou l'application mobile, tu acceptes ces conditions. Si tu ne les acceptes pas, merci de ne pas utiliser le service." },
          { p: "La façon dont nous traitons tes données est décrite séparément, dans la Politique de confidentialité, qui fait partie intégrante de ces conditions." },
        ],
      },
      {
        h: "2. Qui fournit le service",
        blocks: [
          { p: `LIFE OS est fourni par Igor Kholodinsky, développeur indépendant (personne physique). Contact : ${POLICY_EMAIL} ou le bot LIFE OS sur Telegram.` },
        ],
      },
      {
        h: "3. Ce qu'est LIFE OS",
        blocks: [
          { p: "LIFE OS est un journal personnel et un « second cerveau » : tu enregistres à la voix ou par écrit, et le service conserve, structure et t'aide à retrouver ce dont tu as besoin. Il comprend le journal, les tâches et rappels, les notes, les finances, la santé, les livres, les voyages, les personnes et d'autres sections, ainsi que des assistants IA." },
          { p: "Le service est en développement actif. Les sections et fonctionnalités peuvent évoluer, apparaître et disparaître." },
        ],
      },
      {
        h: "4. Ton compte",
        blocks: [
          {
            ul: [
              "Le compte se crée via Telegram, par e-mail ou avec Google. Une personne — un compte.",
              "L'utilisation du service est réservée aux personnes d'au moins 16 ans.",
              "Ton lien de connexion personnel, ton code PIN et ton mot de passe relèvent de ta responsabilité : ne les communique pas. Le lien de la commande /link ne doit pas être transféré — celui qui l'ouvre arrive dans ton journal.",
              "Si tu perds l'accès, écris-nous : nous le rétablirons via ton Telegram ou ton e-mail confirmé.",
            ],
          },
        ],
      },
      {
        h: "5. Ton contenu reste le tien",
        blocks: [
          { p: "Toutes les entrées, photos, fichiers et données que tu ajoutes t'appartiennent. Nous ne revendiquons aucun droit dessus et ne les utilisons pas pour entraîner des modèles d'IA." },
          { p: "Pour que le service fonctionne, tu nous accordes une autorisation limitée de conserver ton contenu, d'en faire des sauvegardes, de te l'afficher et de le traiter — y compris de le transmettre aux sous-traitants listés dans la Politique de confidentialité. Cette autorisation n'existe que pour te fournir le service et prend fin avec la suppression du contenu ou du compte." },
          { p: "Tu peux récupérer l'ensemble dans un seul fichier à tout moment : « Profil → Tes données »." },
        ],
      },
      {
        h: "6. Règles d'utilisation",
        blocks: [
          { p: "En utilisant le service, tu t'engages à ne pas :" },
          {
            ul: [
              "enfreindre la loi, porter atteinte aux droits d'autrui ou diffuser du contenu illicite via le service ;",
              "utiliser le relais de messages vers d'autres utilisateurs pour du spam, des menaces, des insultes ou des envois en masse ;",
              "saisir les données personnelles de tiers sans base légale ;",
              "tenter d'accéder à d'autres comptes, contourner les limites, surcharger le service par des requêtes automatisées ou extraire des données avec des robots ;",
              "revendre l'accès au service ou le présenter comme le tien ;",
              "détourner le programme de parrainage — invitations fictives, plusieurs comptes pour une même personne.",
            ],
          },
          { p: "En cas de violation grave ou répétée, nous pouvons restreindre ou fermer l'accès, en prévenant à l'avance dans la mesure du possible." },
        ],
      },
      {
        h: "7. Formules et paiement",
        blocks: [
          {
            ul: [
              "« Start » est gratuit, avec une limite d'entrées. Formules payantes : Pro — 9,99 $ par mois, Premium — 19,99 $ par mois. Les prix et contenus à jour figurent sur la page Tarifs.",
              "Il n'y a pas encore de paiement automatique dans le service : tu laisses une demande et nous convenons de l'activation et du règlement manuellement. Lorsque le paiement sera en place, ses conditions seront décrites séparément.",
              "Les limites d'entrées des formules payantes sont souples : elles protègent contre la surcharge, elles ne coupent pas l'accès.",
              "Les prix peuvent évoluer. Toute hausse sera annoncée aux abonnés au moins 30 jours à l'avance et prendra effet à la période suivante.",
              "Une période déjà payée n'est pas remboursée automatiquement si tu supprimes toi-même ton compte — écris-nous, nous trouverons une solution équitable.",
            ],
          },
        ],
      },
      {
        h: "8. Le Livre de vie imprimé",
        blocks: [
          { p: "Le livre imprimé est une commande unique distincte, non incluse dans l'abonnement, sauf mention expresse dans la formule Premium ou dans une promotion en cours. Le prix ainsi que les délais d'impression et de livraison sont convenus au cas par cas avant paiement. Le livre étant fabriqué à partir de ta propre maquette, le remboursement s'applique en cas de défaut de fabrication, de dommage pendant le transport ou d'erreur de notre part." },
          { p: "Le livre offert dans le cadre du programme « Invite un ami » est accordé pour des filleuls réels qui ont effectivement commencé à utiliser le service. Des invitations fictives annulent ce droit." },
        ],
      },
      {
        h: "9. Testeurs",
        blocks: [
          { p: "Si tu participes à des tests rémunérés, la rémunération des bugs et rapports est fixée par le propriétaire du service au cas par cas et confirmée avant tout versement. L'envoi d'un rapport ne crée pas en soi d'obligation de paiement." },
        ],
      },
      {
        h: "10. L'IA et ses limites",
        blocks: [
          { p: "Les assistants IA analysent tes entrées, répondent à tes questions et proposent des observations. Il s'agit d'informations et non de conseils : LIFE OS n'est pas un service médical, psychologique, juridique ou financier, et les réponses de l'IA ne doivent pas fonder des décisions dans ces domaines." },
          { p: "L'IA peut se tromper, mal entendre un message vocal ou mal interpréter le sens. Vérifie ce qui compte — surtout les montants, les dates et tout ce qui touche à la santé." },
          { p: "Si tu ne vas pas bien ou si tu es en danger, contacte les services d'urgence ou un professionnel : le service n'est pas conçu pour l'aide en situation de crise." },
        ],
      },
      {
        h: "11. Publication et accès par des tiers",
        blocks: [
          { p: "Par défaut, tout n'est visible que par toi. Les pages publiques, les invitations, la désignation d'un héritier et le relais d'un message vers un autre utilisateur sont activés par toi — et tu es responsable de ce que tu ouvres et à qui. En publiant les noms, photos ou échanges d'autres personnes, assure-toi d'en avoir le droit." },
        ],
      },
      {
        h: "12. Disponibilité",
        blocks: [
          { p: "Nous faisons de notre mieux pour que le service fonctionne en continu, sans garantir l'absence d'interruption : pannes, maintenances et incidents chez nos prestataires — Telegram, hébergement, fournisseurs d'IA — restent possibles. Nous effectuons des sauvegardes, mais nous te conseillons d'en garder une aussi : l'export est disponible à tout moment et une copie hebdomadaire sur Telegram s'active dans les réglages." },
        ],
      },
      {
        h: "13. Modifications du service et des conditions",
        blocks: [
          { p: "Nous pouvons faire évoluer le service ainsi que ces conditions. Les changements substantiels seront annoncés dans le bot ou sur le site avant leur entrée en vigueur. En continuant d'utiliser le service ensuite, tu acceptes la nouvelle version. En cas de désaccord, tu peux supprimer ton compte." },
        ],
      },
      {
        h: "14. Résiliation",
        blocks: [
          {
            ul: [
              "Tu peux partir à tout moment : « Profil → Tes données → Le droit de partir » efface le compte entier et définitivement.",
              "Nous pouvons suspendre ou fermer l'accès en cas de violation de ces conditions, de menace pour la sécurité, ou si le service cesse d'exister.",
              "Si le service devait fermer, nous préviendrons à l'avance et laisserons le temps de récupérer les données.",
            ],
          },
        ],
      },
      {
        h: "15. Responsabilité",
        blocks: [
          { p: "Le service est fourni « en l'état ». Dans les limites permises par la loi, nous ne sommes pas responsables du manque à gagner, de la perte de données due à une défaillance d'un prestataire ou à des circonstances hors de notre contrôle, ni des décisions que tu prends sur la base des suggestions de l'IA." },
          { p: "Notre responsabilité totale est en tout état de cause limitée au montant que tu as effectivement payé pour le service au cours des 12 derniers mois. Cette limitation ne porte pas atteinte aux droits qui ne peuvent être limités par la loi, y compris les droits des consommateurs." },
        ],
      },
      {
        h: "16. Droit applicable et litiges",
        blocks: [
          { p: `Ces conditions sont régies par le droit ukrainien. Nous cherchons d'abord à résoudre tout litige par courrier : écris à ${POLICY_EMAIL}, nous répondons sous 30 jours. Si tu es un consommateur de l'UE/EEE ou du Royaume-Uni, tu conserves les droits et protections prévus par la loi de ton pays de résidence.` },
        ],
      },
      {
        h: "17. Contact",
        blocks: [
          { p: `${POLICY_EMAIL} ou le bot LIFE OS sur Telegram.` },
        ],
      },
    ],
    back: "Accueil",
  },

  es: {
    title: "Condiciones de uso",
    updated: "En vigor desde el 29 de julio de 2026",
    privacyLink: "Política de privacidad",
    intro:
      "Este es un acuerdo entre tú y el propietario de LIFE OS. Describe cómo funciona el servicio, qué se puede y qué no, cómo funcionan los planes y quién responde de qué.",
    sections: [
      {
        h: "1. De qué tratan estas condiciones",
        blocks: [
          { p: "Al usar el sitio life-os.today, el bot de LIFE OS en Telegram o la aplicación móvil, aceptas estas condiciones. Si no estás de acuerdo con ellas, por favor no uses el servicio." },
          { p: "Cómo tratamos tus datos se describe aparte, en la Política de privacidad, que forma parte integrante de estas condiciones." },
        ],
      },
      {
        h: "2. Quién presta el servicio",
        blocks: [
          { p: `LIFE OS lo presta Igor Kholodinsky, desarrollador independiente (persona física). Contacto: ${POLICY_EMAIL} o el bot de LIFE OS en Telegram.` },
        ],
      },
      {
        h: "3. Qué es LIFE OS",
        blocks: [
          { p: "LIFE OS es un diario personal y un «segundo cerebro»: tú grabas por voz o escribes, y el servicio guarda, estructura y te ayuda a encontrar lo que necesitas. Incluye el diario, tareas y recordatorios, notas, finanzas, salud, libros, viajes, personas y otras secciones, además de asistentes de IA." },
          { p: "El servicio está en desarrollo activo. Las secciones y funciones pueden cambiar, aparecer y desaparecer." },
        ],
      },
      {
        h: "4. Tu cuenta",
        blocks: [
          {
            ul: [
              "La cuenta se crea con Telegram, por correo electrónico o con Google. Una persona, una cuenta.",
              "Para usar el servicio hay que tener al menos 16 años.",
              "Tu enlace personal de acceso, el PIN y la contraseña son responsabilidad tuya: no los compartas. El enlace del comando /link no debe reenviarse: quien lo abra entrará en tu diario.",
              "Si pierdes el acceso, escríbenos y lo restauraremos mediante tu Telegram o correo confirmado.",
            ],
          },
        ],
      },
      {
        h: "5. Tu contenido sigue siendo tuyo",
        blocks: [
          { p: "Todas las entradas, fotos, archivos y datos que añades te pertenecen. No reclamamos ningún derecho sobre ellos ni los usamos para entrenar modelos de IA." },
          { p: "Para que el servicio funcione, nos concedes un permiso limitado para almacenar tu contenido, hacer copias de seguridad, mostrártelo y procesarlo, incluida su transmisión a los proveedores enumerados en la Política de privacidad. Ese permiso existe solo para prestarte el servicio y termina cuando se elimina el contenido o la cuenta." },
          { p: "Puedes llevarte todo en un único archivo en cualquier momento: «Perfil → Tus datos»." },
        ],
      },
      {
        h: "6. Reglas de uso",
        blocks: [
          { p: "Al usar el servicio te comprometes a no:" },
          {
            ul: [
              "infringir la ley, vulnerar los derechos de otras personas ni difundir contenido ilícito a través del servicio;",
              "usar el reenvío de mensajes a otros usuarios para spam, amenazas, insultos o envíos masivos;",
              "introducir datos personales de terceros sin una base legal;",
              "intentar acceder a otras cuentas, eludir límites, sobrecargar el servicio con peticiones automatizadas o extraer datos con robots;",
              "revender el acceso al servicio o presentarlo como propio;",
              "manipular el programa de referidos con invitaciones ficticias o varias cuentas para una misma persona.",
            ],
          },
          { p: "Ante una infracción grave o reiterada podemos limitar o cerrar el acceso, avisando con antelación siempre que sea posible." },
        ],
      },
      {
        h: "7. Planes y pago",
        blocks: [
          {
            ul: [
              "«Inicio» es gratuito, con un límite de entradas. Planes de pago: Pro — 9,99 $ al mes, Premium — 19,99 $ al mes. Los precios y contenidos vigentes están en la página de Tarifas.",
              "Todavía no hay pago automático en el servicio: dejas una solicitud y acordamos la activación y el cobro manualmente. Cuando se habiliten los pagos, sus condiciones se describirán aparte.",
              "Los límites de entradas de los planes de pago son flexibles: protegen frente a la sobrecarga, no cortan el acceso.",
              "Los precios pueden cambiar. Cualquier subida se avisará a quienes ya pagan con al menos 30 días de antelación y se aplicará desde el siguiente periodo.",
              "Un periodo ya pagado no se devuelve automáticamente si eliminas tú mismo la cuenta — escríbenos y lo resolveremos con justicia.",
            ],
          },
        ],
      },
      {
        h: "8. El «Libro de vida» impreso",
        blocks: [
          { p: "El libro impreso es un pedido único aparte, no incluido en la suscripción, salvo lo que indique expresamente el plan Premium o una promoción vigente. El precio y los plazos de impresión y envío se acuerdan de forma individual antes del pago. El libro se fabrica a partir de tu propia maqueta, por lo que la devolución procede en caso de defecto de fabricación, daño en el transporte o error por nuestra parte." },
          { p: "El libro gratuito del programa «Invita a un amigo» se concede por invitados reales que realmente empezaron a usar el servicio. Las invitaciones ficticias anulan ese derecho." },
        ],
      },
      {
        h: "9. Probadores (testers)",
        blocks: [
          { p: "Si participas en pruebas remuneradas, la compensación por los errores encontrados y los informes la fija el propietario del servicio caso por caso y se confirma antes del pago. Enviar un informe no genera por sí mismo obligación de pago." },
        ],
      },
      {
        h: "10. La IA y sus límites",
        blocks: [
          { p: "Los asistentes de IA analizan tus entradas, responden preguntas y ofrecen observaciones. Eso es información, no asesoramiento: LIFE OS no es un servicio médico, psicológico, jurídico ni financiero, y sus respuestas no deben servir de base para decisiones en esos ámbitos." },
          { p: "La IA puede equivocarse, entender mal un mensaje de voz o interpretar mal el sentido. Comprueba lo importante, sobre todo importes, fechas y todo lo relacionado con la salud." },
          { p: "Si te encuentras mal o estás en peligro, acude a los servicios de emergencia o a un profesional: el servicio no está pensado para ayuda en crisis." },
        ],
      },
      {
        h: "11. Publicación y acceso de otras personas",
        blocks: [
          { p: "Por defecto todo lo ves solo tú. Las páginas públicas, las invitaciones, la designación de un heredero y el reenvío de un mensaje a otro usuario los activas tú, y tú respondes de qué abres y a quién. Al publicar nombres, fotos o conversaciones de otras personas, asegúrate de tener derecho a hacerlo." },
        ],
      },
      {
        h: "12. Disponibilidad",
        blocks: [
          { p: "Hacemos lo posible por que el servicio funcione siempre, pero no garantizamos que no haya interrupciones: puede haber fallos, mantenimientos e incidencias en nuestros proveedores — Telegram, alojamiento, proveedores de IA. Hacemos copias de seguridad, pero te recomendamos guardar también la tuya: la exportación está disponible en todo momento y la copia semanal por Telegram se activa en los ajustes." },
        ],
      },
      {
        h: "13. Cambios en el servicio y en las condiciones",
        blocks: [
          { p: "Podemos modificar y desarrollar el servicio, así como estas condiciones. Anunciaremos los cambios sustanciales en el bot o en el sitio antes de que entren en vigor. Si sigues usando el servicio después, aceptas la nueva versión. Si no estás de acuerdo, puedes eliminar tu cuenta." },
        ],
      },
      {
        h: "14. Finalización",
        blocks: [
          {
            ul: [
              "Puedes irte cuando quieras: «Perfil → Tus datos → El derecho a irte» borra la cuenta entera de forma irreversible.",
              "Podemos suspender o cerrar el acceso si se incumplen estas condiciones, si hay una amenaza de seguridad o si el servicio deja de funcionar.",
              "Si el servicio fuera a cerrar, avisaremos con antelación y daremos tiempo para llevarte tus datos.",
            ],
          },
        ],
      },
      {
        h: "15. Responsabilidad",
        blocks: [
          { p: "El servicio se presta «tal cual». En la medida permitida por la ley, no respondemos del lucro cesante, de la pérdida de datos por fallos de los proveedores o circunstancias fuera de nuestro control, ni de las decisiones que tomes basándote en las sugerencias de la IA." },
          { p: "Nuestra responsabilidad total se limita en todo caso al importe que hayas pagado realmente por el servicio en los últimos 12 meses. Esta limitación no afecta a los derechos que la ley no permite limitar, incluidos los derechos de los consumidores." },
        ],
      },
      {
        h: "16. Ley aplicable y conflictos",
        blocks: [
          { p: `Estas condiciones se rigen por la legislación de Ucrania. Primero intentamos resolver cualquier conflicto por escrito: escribe a ${POLICY_EMAIL} y respondemos en un plazo de 30 días. Si eres consumidor en la UE/EEE o el Reino Unido, conservas los derechos y la protección que te otorga la ley de tu país de residencia.` },
        ],
      },
      {
        h: "17. Contacto",
        blocks: [
          { p: `${POLICY_EMAIL} o el bot de LIFE OS en Telegram.` },
        ],
      },
    ],
    back: "Inicio",
  },
};

export function termsContent(locale: string): TermsContent {
  return T[locale] || T.ru;
}
