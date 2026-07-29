import type { Metadata } from "next";
import type { Locale } from "./i18n";
import { getLocale } from "./locale";

// Заголовки и описания публичных страниц.
//
// Раньше у всех страниц был один <title>LIFE OS</title> и одно описание: в выдаче
// поисковика и во вкладках браузера страницы было не отличить, а при пересылке
// ссылки в мессенджер превью выходило пустым. Здесь — один источник и для <title>,
// и для Open Graph (Telegram, WhatsApp, Facebook), и для карточки в X.

export const SITE_URL = "https://life-os.today";
const OG_IMAGE = `${SITE_URL}/opengraph-image`;

type Page = { title: string; description: string };
type PageKey = "about" | "features" | "onePlace" | "pricing" | "privacy" | "policy" | "terms" | "reviews";

const M: Record<Locale, Record<PageKey, Page>> = {
  ru: {
    about: {
      title: "LIFE OS — дневник, который ведёт себя сам",
      description: "Просто расскажи голосом, как прошёл день, — AI расшифрует, разложит по полочкам и соберёт из этого твою книгу жизни. Бесплатно, в Telegram и в вебе.",
    },
    features: {
      title: "Возможности LIFE OS — 50+ функций дневника",
      description: "Полный каталог: AI-разбор записей, книга жизни, цели и задачи, деньги, здоровье, люди и места, капсула времени. Всё в одном месте.",
    },
    onePlace: {
      title: "Все заметки и напоминания — в одном месте",
      description: "Заметки айфона, сохранёнки Инстаграма, файлы, стикеры и будильники — в одной базе. Скажи словами — LIFE OS запишет, разложит и напомнит вовремя.",
    },
    pricing: {
      title: "Тарифы LIFE OS — от 0 до 19.99 в месяц",
      description: "Старт бесплатно, Pro — весь дневник без ограничений, Премиум — с печатной книгой жизни. Честная оплата за ценность, а не подписка на всякий случай.",
    },
    privacy: {
      title: "Приватность LIFE OS — дневник видишь только ты",
      description: "Как мы обращаемся с твоими записями: кто их видит, зачем нужен AI, где хранятся данные и как забрать или удалить всё одной кнопкой.",
    },
    policy: {
      title: "Политика конфиденциальности LIFE OS",
      description: "Полный юридический документ: какие данные обрабатываются, на каком основании, кому передаются и какие у тебя права.",
    },
    reviews: {
      title: "Отзывы о LIFE OS — что говорят люди",
      description: "Живые отзывы тех, кто ведёт дневник в LIFE OS. Каждый оставил человек сам и разрешил опубликовать. Здесь же можно написать свой.",
    },
    terms: {
      title: "Условия использования LIFE OS",
      description: "Соглашение между тобой и владельцем LIFE OS: как устроен сервис, что можно и чего нельзя, как работают тарифы и кто за что отвечает.",
    },
  },
  en: {
    about: {
      title: "LIFE OS — the diary that keeps itself",
      description: "Just say how your day went — AI transcribes it, sorts it out and builds your book of life. Free, in Telegram and on the web.",
    },
    features: {
      title: "LIFE OS features — 50+ ways to keep your life",
      description: "The full catalog: AI entry analysis, book of life, goals and tasks, money, health, people and places, time capsule. All in one place.",
    },
    onePlace: {
      title: "All your notes and reminders — in one place",
      description: "iPhone notes, Instagram saves, files, sticky notes and alarms — in one base. Say it in plain words: LIFE OS files it and reminds you on time.",
    },
    pricing: {
      title: "LIFE OS pricing — from free to $19.99 a month",
      description: "Start free, Pro for the whole diary without limits, Premium with a printed book of life. You pay for value, not a just-in-case subscription.",
    },
    privacy: {
      title: "Privacy at LIFE OS — only you see your diary",
      description: "How we handle your entries: who can see them, why AI is involved, where data lives, and how to export or delete everything in one click.",
    },
    policy: {
      title: "LIFE OS Privacy Policy",
      description: "The full legal document: what data is processed, on what grounds, who it is shared with and what rights you have.",
    },
    reviews: {
      title: "LIFE OS reviews — what people say",
      description: "Real reviews from people who keep a diary in LIFE OS. Each one was written by a person who allowed us to publish it. You can add yours here.",
    },
    terms: {
      title: "LIFE OS Terms of Service",
      description: "The agreement between you and the owner of LIFE OS: how the service works, what is allowed, how plans work and who is responsible for what.",
    },
  },
  uk: {
    about: {
      title: "LIFE OS — щоденник, який веде себе сам",
      description: "Просто розкажи голосом, як минув день, — AI розшифрує, розкладе по поличках і збере з цього твою книгу життя. Безкоштовно, у Telegram і вебі.",
    },
    features: {
      title: "Можливості LIFE OS — 50+ функцій щоденника",
      description: "Повний каталог: AI-розбір записів, книга життя, цілі та задачі, гроші, здоров'я, люди й місця, капсула часу. Усе в одному місці.",
    },
    onePlace: {
      title: "Усі нотатки й нагадування — в одному місці",
      description: "Нотатки айфона, збережене з Інстаграму, файли, наліпки й будильники — в одній базі. Скажи словами — LIFE OS запише, розкладе й нагадає вчасно.",
    },
    pricing: {
      title: "Тарифи LIFE OS — від 0 до 19.99 на місяць",
      description: "Старт безкоштовно, Pro — весь щоденник без обмежень, Преміум — із друкованою книгою життя. Чесна оплата за цінність.",
    },
    privacy: {
      title: "Приватність LIFE OS — щоденник бачиш лише ти",
      description: "Як ми поводимося з твоїми записами: хто їх бачить, навіщо AI, де зберігаються дані та як забрати чи видалити все однією кнопкою.",
    },
    policy: {
      title: "Політика конфіденційності LIFE OS",
      description: "Повний юридичний документ: які дані обробляються, на якій підставі, кому передаються та які в тебе права.",
    },
    reviews: {
      title: "Відгуки про LIFE OS — що кажуть люди",
      description: "Живі відгуки тих, хто веде щоденник у LIFE OS. Кожен залишила людина сама й дозволила опублікувати. Тут же можна написати свій.",
    },
    terms: {
      title: "Умови використання LIFE OS",
      description: "Угода між тобою і власником LIFE OS: як влаштований сервіс, що можна й чого не можна, як працюють тарифи та хто за що відповідає.",
    },
  },
  fr: {
    about: {
      title: "LIFE OS — le journal qui se tient tout seul",
      description: "Raconte simplement ta journée à la voix — l'IA transcrit, range et compose ton livre de vie. Gratuit, sur Telegram et sur le web.",
    },
    features: {
      title: "Fonctionnalités LIFE OS — plus de 50 possibilités",
      description: "Le catalogue complet : analyse IA des entrées, livre de vie, objectifs, argent, santé, personnes et lieux, capsule temporelle.",
    },
    onePlace: {
      title: "Toutes tes notes et rappels — au même endroit",
      description: "Notes iPhone, enregistrements Instagram, fichiers et alarmes dans une seule base. Dis-le simplement : LIFE OS range et te rappelle à temps.",
    },
    pricing: {
      title: "Tarifs LIFE OS — de 0 à 19,99 par mois",
      description: "Start gratuit, Pro pour tout le journal sans limites, Premium avec le livre de vie imprimé. Tu paies la valeur, pas un abonnement au cas où.",
    },
    privacy: {
      title: "Confidentialité LIFE OS — toi seul vois ton journal",
      description: "Ce que nous faisons de tes entrées : qui les voit, pourquoi l'IA, où vivent les données et comment tout exporter ou supprimer en un clic.",
    },
    policy: {
      title: "Politique de confidentialité LIFE OS",
      description: "Le document juridique complet : quelles données sont traitées, sur quelle base, avec qui elles sont partagées et quels sont tes droits.",
    },
    reviews: {
      title: "Avis sur LIFE OS — ce que disent les gens",
      description: "De vrais avis de ceux qui tiennent un journal dans LIFE OS. Chacun a été écrit par une personne qui a autorisé sa publication.",
    },
    terms: {
      title: "Conditions d'utilisation LIFE OS",
      description: "L'accord entre toi et le propriétaire de LIFE OS : comment fonctionne le service, ce qui est permis, les forfaits et les responsabilités.",
    },
  },
  es: {
    about: {
      title: "LIFE OS — el diario que se lleva solo",
      description: "Solo cuenta con la voz cómo fue tu día: la IA lo transcribe, lo ordena y compone tu libro de vida. Gratis, en Telegram y en la web.",
    },
    features: {
      title: "Funciones de LIFE OS — más de 50 posibilidades",
      description: "El catálogo completo: análisis con IA, libro de vida, metas y tareas, dinero, salud, personas y lugares, cápsula del tiempo.",
    },
    onePlace: {
      title: "Todas tus notas y recordatorios — en un solo lugar",
      description: "Notas del iPhone, guardados de Instagram, archivos y alarmas en una sola base. Dilo con palabras normales: LIFE OS lo ordena y te recuerda a tiempo.",
    },
    pricing: {
      title: "Precios de LIFE OS — de 0 a 19,99 al mes",
      description: "Inicio gratis, Pro con el diario sin límites, Premium con el libro de vida impreso. Pagas por el valor, no por una suscripción por si acaso.",
    },
    privacy: {
      title: "Privacidad en LIFE OS — solo tú ves tu diario",
      description: "Qué hacemos con tus entradas: quién las ve, para qué la IA, dónde viven los datos y cómo exportarlo o borrarlo todo en un clic.",
    },
    policy: {
      title: "Política de privacidad de LIFE OS",
      description: "El documento legal completo: qué datos se procesan, con qué base, con quién se comparten y qué derechos tienes.",
    },
    reviews: {
      title: "Opiniones sobre LIFE OS — lo que dice la gente",
      description: "Opiniones reales de quienes llevan un diario en LIFE OS. Cada una la escribió una persona que autorizó publicarla.",
    },
    terms: {
      title: "Términos de uso de LIFE OS",
      description: "El acuerdo entre tú y el propietario de LIFE OS: cómo funciona el servicio, qué se puede hacer, cómo funcionan los planes y quién responde de qué.",
    },
  },
};

/**
 * Метаданные публичной страницы: <title>, описание, канонический адрес
 * и карточка для мессенджеров. Язык берём из куки — тот же, что видит человек.
 */
export async function pageMetadata(key: PageKey, path: string): Promise<Metadata> {
  const locale = await getLocale();
  const p = (M[locale] || M.ru)[key];
  const url = `${SITE_URL}${path}`;
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: url },
    openGraph: {
      title: p.title,
      description: p.description,
      url,
      siteName: "LIFE OS",
      locale,
      type: "website",
      // Указываем картинку явно: наследование файловой opengraph-image работает
      // не на всех вложенных маршрутах, а превью нужно на каждой странице.
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "LIFE OS" }],
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.description,
      images: [OG_IMAGE],
    },
  };
}
