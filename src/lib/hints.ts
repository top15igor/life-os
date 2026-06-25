import type { Locale } from "./i18n";

const H: Record<Locale, Record<string, string>> = {
  ru: {
    today: "Главный экран: твои показатели и записи за сегодня. Можно добавить запись прямо здесь или голосом в Telegram.",
    diary: "Все записи по датам. Нажми на запись — увидишь полный AI-разбор.",
    health: "Сон, вес, самочувствие и тренды. Наполняется, когда упоминаешь здоровье в записях.",
    analytics: "Тренды настроения и энергии, главные темы и закономерности твоей жизни.",
    insights: "Все важные мысли и осознания, которые AI выделил из твоих записей.",
    people: "Люди из записей: сколько раз упомянуты и в каких записях.",
    projects: "Твои проекты, собранные из записей, со всеми связанными заметками.",
    biographer: "Спроси свою жизнь — AI соберёт ответ-историю из всех твоих записей. Например: «Расскажи историю проекта» или «Как менялось моё здоровье?».",
    intelligence: "AI находит причины, последствия и связи этой записи с другими — строго по твоим данным, без выдумок.",
    goals: "Цели на год с прогрессом. Добавляй цель и двигай ползунок по мере выполнения.",
    lifebook: "AI собирает каждый месяц твоей жизни в главу — с темами и связным рассказом.",
  },
  en: {
    today: "Your day at a glance: today's metrics and entries. Add an entry here or by voice in Telegram.",
    diary: "All your entries by date. Tap an entry to see the full AI breakdown.",
    health: "Sleep, weight, wellbeing and trends. Fills in as you mention health in entries.",
    analytics: "Mood and energy trends, top themes and patterns of your life.",
    insights: "All the key thoughts and realizations AI extracted from your entries.",
    people: "People from your entries: how often mentioned and in which entries.",
    projects: "Your projects gathered from entries, with all related notes.",
    biographer: "Ask your life — AI weaves an answer from all your entries. E.g. “Tell the story of my project” or “How did my health change?”.",
    intelligence: "AI finds causes, consequences and links of this entry to others — strictly from your data, no invention.",
    goals: "Yearly goals with progress. Add a goal and move the slider as you advance.",
    lifebook: "AI turns each month of your life into a chapter — themes and a flowing story.",
  },
  uk: {
    today: "Головний екран: твої показники та записи за сьогодні. Можна додати запис тут або голосом у Telegram.",
    diary: "Усі записи за датами. Натисни на запис — побачиш повний AI-розбір.",
    health: "Сон, вага, самопочуття та тренди. Наповнюється, коли згадуєш здоров'я в записах.",
    analytics: "Тренди настрою й енергії, головні теми та закономірності твого життя.",
    insights: "Усі важливі думки та усвідомлення, які AI виділив із твоїх записів.",
    people: "Люди з записів: скільки разів згадані та в яких записах.",
    projects: "Твої проєкти, зібрані із записів, з усіма пов'язаними нотатками.",
    biographer: "Запитай своє життя — AI збере відповідь-історію з усіх твоїх записів. Напр.: «Розкажи історію проєкту».",
    intelligence: "AI знаходить причини, наслідки та зв'язки цього запису з іншими — строго за твоїми даними.",
    goals: "Цілі на рік із прогресом. Додавай ціль і рухай повзунок у міру виконання.",
    lifebook: "AI збирає кожен місяць твого життя у главу — з темами та зв'язною розповіддю.",
  },
  fr: {
    today: "Ta journée en un coup d'œil : indicateurs et entrées du jour. Ajoute une entrée ici ou par la voix dans Telegram.",
    diary: "Toutes tes entrées par date. Touche une entrée pour voir l'analyse IA complète.",
    health: "Sommeil, poids, bien-être et tendances. Se remplit quand tu mentionnes la santé.",
    analytics: "Tendances d'humeur et d'énergie, thèmes principaux et schémas de ta vie.",
    insights: "Toutes les pensées clés que l'IA a extraites de tes entrées.",
    people: "Les personnes de tes entrées : fréquence et entrées associées.",
    projects: "Tes projets rassemblés depuis les entrées, avec toutes les notes liées.",
    biographer: "Interroge ta vie — l'IA tisse une réponse à partir de toutes tes entrées. Ex. : « Raconte l'histoire de mon projet ».",
    intelligence: "L'IA trouve causes, conséquences et liens de cette entrée — strictement à partir de tes données.",
    goals: "Objectifs annuels avec progression. Ajoute un objectif et déplace le curseur.",
    lifebook: "L'IA transforme chaque mois de ta vie en chapitre — thèmes et récit fluide.",
  },
};

export function hints(locale: Locale): Record<string, string> {
  return H[locale] || H.ru;
}
