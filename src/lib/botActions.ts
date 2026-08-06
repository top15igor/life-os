import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { DREAM_SPHERES } from "./ai";
import { createReminder, localToISO, deleteReminder } from "./reminders";
import type { Recurrence } from "./googleCalendar";
import { addMediaByTitle } from "./books";
import { normalizeMorningPrefs } from "./morningPrefs";
import { askKnowledge } from "./knowledge";
import { notesToText } from "./notesIO";
import { sendRelay } from "./relay";
import { birthdayISO, BDAY_UNKNOWN_YEAR } from "./birthday";
import { ACTION_TAG } from "./botTags";
import { logError } from "./errorLog";

// ===== Агентный слой бота: понять ЯВНУЮ команду и выполнить её вместо пользователя. =====
// routeMessage решает за ОДИН вызов: это действие, вопрос или дневниковая запись.

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export type Lang = "ru" | "en" | "uk" | "fr" | "es";

export type Route =
  | { kind: "action"; name: string; input: any; more?: { name: string; input: any }[] }
  | { kind: "question" }
  | { kind: "note" };

export const ACTION_TOOLS: any[] = [
  { name: "add_goal", description: "Добавить цель на год. Только при явной команде вроде «добавь цель…», «поставь цель…».", input_schema: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } },
  { name: "add_task", description: "Добавить задачу/дело БЕЗ конкретного времени. Команда «добавь задачу…», «надо не забыть…», «запиши в дела…». Если названо КОНКРЕТНОЕ время/дата напоминания — это set_reminder, не add_task.", input_schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
  {
    name: "set_reminder",
    description:
      "Поставить НАПОМИНАНИЕ на конкретное время/дату (уйдёт в календарь с уведомлением). Команды: «напомни …», «напоминай …», «напомни мне …», «через час …», «завтра в 9 …», «каждый день в 8 …». Разбери: что напомнить (text, без слова «напомни»), дату и время по МЕСТНОМУ времени пользователя.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "что напомнить, без слова «напомни»" },
        date: { type: "string", description: "дата YYYY-MM-DD по местному времени пользователя" },
        time: { type: "string", description: "время HH:MM 24ч по местному; не указывай, если на весь день" },
        all_day: { type: "boolean", description: "true, если без конкретного времени (день рождения и т.п.)" },
        recurrence: { type: "string", enum: ["none", "hourly", "daily", "weekly", "monthly", "yearly"], description: "повтор: «каждый день/неделю/месяц/год»; hourly — «каждый час» (тогда задай from_hour/to_hour)" },
        from_hour: { type: "number", description: "для hourly: с какого часа (0–23), напр. «с 9 утра» → 9; по умолчанию 9" },
        to_hour: { type: "number", description: "для hourly: до какого часа (0–23), напр. «до 9 вечера» → 21; по умолчанию 21" },
        remind_min: { type: "number", description: "за сколько минут предупредить, если названо (10/30/60/1440); иначе не указывай" },
      },
      required: ["text", "date"],
    },
  },
  { name: "complete_task", description: "Отметить существующую задачу выполненной. Команда «отметь задачу … выполненной», «заверши задачу …», «выполнил …». query — слова для поиска задачи.", input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "log_weight", description: "Записать вес в трекер веса. Команда «запиши вес 78», «мой вес 80 кг». kg — число в килограммах.", input_schema: { type: "object", properties: { kg: { type: "number" } }, required: ["kg"] } },
  { name: "add_dream", description: "Добавить мечту в Карту желаний. Команда «добавь мечту …», «хочу чтобы это было моей мечтой …».", input_schema: { type: "object", properties: { text: { type: "string" }, sphere: { type: "string", enum: [...DREAM_SPHERES] } }, required: ["text"] } },
  { name: "complete_dream", description: "Отметить мечту сбывшейся. Команда «мечта … сбылась», «отметь мечту … исполненной». query — слова для поиска мечты.", input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "add_deed", description: "Добавить доброе дело в «Мой след». Команда «отметь доброе дело …», «запиши что я помог …». person — кому помог, если назван.", input_schema: { type: "object", properties: { text: { type: "string" }, person: { type: "string" } }, required: ["text"] } },
  {
    name: "add_media",
    description:
      "Добавить фильм, сериал или книгу в Медиатеку. Команды: «хочу посмотреть …», «добавь фильм …», «посмотрел сериал …», «хочу прочитать книгу …», «добавь в медиатеку …». title — название (без слов «фильм/сериал/хочу»); kind — film (фильм), series (сериал) или book (книга); status — want (хочу), doing (смотрю/читаю), done (посмотрел/прочитал), по умолчанию want.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "название фильма/сериала/книги" },
        kind: { type: "string", enum: ["film", "series", "book"] },
        status: { type: "string", enum: ["want", "doing", "done"], description: "want по умолчанию" },
      },
      required: ["title", "kind"],
    },
  },
  {
    name: "add_list_item",
    description:
      "Добавить пункт(ы) в СПИСОК (чек-лист): «добавь молоко в список покупок», «в список подарков — духи», «добавь в покупки хлеб, сыр и яйца». items — массив пунктов (несколько через запятую/«и» — все в один вызов). list — название списка своими словами («покупки», «подарки»); не указывай, если это обычный список покупок.",
    input_schema: {
      type: "object",
      properties: { items: { type: "array", items: { type: "string" } }, list: { type: "string" } },
      required: ["items"],
    },
  },
  {
    name: "show_list",
    description: "Показать список (чек-лист): «что в списке покупок?», «покажи список подарков», «что купить?». list — название, если не покупки.",
    input_schema: { type: "object", properties: { list: { type: "string" } }, required: [] },
  },
  {
    name: "check_list_item",
    description: "Вычеркнуть пункт из списка: «вычеркни молоко», «молоко купил, убери из списка», «убери духи из списка подарков». query — пункт; list — название списка, если не покупки.",
    input_schema: { type: "object", properties: { query: { type: "string" }, list: { type: "string" } }, required: ["query"] },
  },
  {
    name: "clear_list",
    description: "Очистить список целиком: «очисти список покупок», «удали весь список подарков». list — название, если не покупки.",
    input_schema: { type: "object", properties: { list: { type: "string" } }, required: [] },
  },
  {
    name: "save_note",
    description:
      "Сохранить ЗАМЕТКУ — справочную информацию, которую надо потом НАЙТИ: код (домофон, шкафчик), номер (счёта, размера, документа), адрес, wifi, марку/модель, список. Команды: «запиши код от домофона 4582», «сохрани заметку: …», «запомни: размер фильтра 60×40». НЕ для рассказов о дне/чувствах/событиях (это save_entry). text — сама заметка, без слов «запиши/запомни/заметка».",
    input_schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
  },
  {
    name: "send_message",
    description:
      "Передать сообщение ДРУГОМУ человеку через бота: «передай Коле, что опоздаю», «напиши Ане, что буду через час», «скажи маме спасибо». Вызывай ТОЛЬКО когда явно названы И получатель, И что ему передать. Разговоры ПРО саму функцию — «попробуй отправку сообщения», «затестить передачу», «а ты умеешь передавать?» — это НЕ команда: ничего не отправляй. Получатель — другой человек, а НЕ сам пользователь (его собственное имя сюда не подставляй). to — имя/прозвище/@имя получателя, text — что передать (без слов «передай/скажи»).",
    input_schema: { type: "object", properties: { to: { type: "string" }, text: { type: "string" } }, required: ["to", "text"] },
  },
  {
    name: "export_notes",
    description:
      "Выгрузить ЗАМЕТКИ файлом: «выгрузи заметки», «пришли мои заметки файлом», «экспорт заметок», «скинь заметки, перенесу на айфон». Отправляет текстовый файл со всеми заметками.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "find_note",
    description:
      "Найти сохранённую ЗАМЕТКУ или показать их обзор. Поиск: «какой код от домофона?», «найди заметку про фильтр» — query о чём заметка. ОБЗОР: «что у меня по заметкам?», «покажи мои заметки», «какие у меня заметки» — БЕЗ query. Это про раздел «Заметки» (справка), НЕ про записи дневника (их статистика — ask_question) и НЕ про сохранёнки из Instagram (ask_knowledge).",
    input_schema: { type: "object", properties: { query: { type: "string" } }, required: [] },
  },
  {
    name: "list_reminders",
    description:
      "Показать план: напоминания и задачи с датой. Команды: «что у меня сегодня?», «какие планы на завтра?», «что на этой неделе?», «покажи напоминания». period — today (сегодня), tomorrow (завтра), week (неделя), all (все ближайшие).",
    input_schema: {
      type: "object",
      properties: { period: { type: "string", enum: ["today", "tomorrow", "week", "all"] } },
      required: ["period"],
    },
  },
  {
    name: "cancel_reminder",
    description:
      "Отменить/удалить НАПОМИНАНИЕ: «отмени напоминание про стоматолога», «убери напоминание о звонке», «не напоминай про…». query — слова для поиска напоминания. Если бот только что показал несколько похожих и пользователь ответил «все»/«все удаляй» — повтори тот же query и поставь all=true.",
    input_schema: { type: "object", properties: { query: { type: "string" }, all: { type: "boolean", description: "true — удалить ВСЕ подходящие напоминания, а не одно" } }, required: ["query"] },
  },
  {
    name: "move_reminder",
    description:
      "ПЕРЕНЕСТИ существующее напоминание на другое время или дату: «перенеси напоминание на завтра», «измени дату на 7.08», «не в 9, а в 11», «сдвинь на час позже», «поставь его на сегодня». Выбирай это, когда речь о ранее созданном напоминании, а НЕ о новом. query — слова для поиска напоминания; если человек говорит про только что созданное («перенеси его», «измени дату»), оставь query пустым — возьмётся последнее. date/time — новые, по МЕСТНОМУ времени пользователя.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "слова для поиска напоминания; пусто = последнее созданное" },
        date: { type: "string", description: "новая дата YYYY-MM-DD по местному времени" },
        time: { type: "string", description: "новое время HH:MM 24ч по местному" },
      },
    },
  },
  {
    name: "rename_person",
    description:
      "Пользователь исправляет ИМЯ человека: «её зовут X (а не Y)», «настоящее имя — X», «переименуй Y в X», «исправь имя», «это не Y, это X», «запиши, что её зовут X». Переименовывает человека в базе людей и исправляет его имя во всех сохранённых инсайтах — выбирай это, а НЕ save_entry, когда суть сообщения = поправить имя. from — имя, как записано сейчас (неправильное), to — правильное; оба в именительном падеже.",
    input_schema: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, required: ["from", "to"] },
  },
  {
    name: "ask_knowledge",
    description:
      "Просьба ДАТЬ или НАЙТИ что-то из СОХРАНЁННЫХ материалов пользователя (База знаний: рилсы, посты, ссылки — рецепты, тренировки, советы): «дай рецепт…», «найди рецепт…», «что я сохранял про…», «найди тот рилс/видео про…», «покажи из сохранёнок…». Это ЗАПРОС ответа, а не рассказ о дне — НЕ save_entry. query — сам вопрос своими словами.",
    input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "set_birthday",
    description:
      "Пользователь сообщает СВОЙ день рождения или просит его запомнить: «мой день рождения 15 марта», «я родился 07.03.1990», «запомни, у меня др 1 января». ТОЛЬКО про самого пользователя — дни рождения ДРУГИХ людей (мамы, друга) сюда не относятся (для «напомни про др мамы» — set_reminder). year указывай только если год прямо назван.",
    input_schema: { type: "object", properties: { day: { type: "number", description: "день месяца 1–31" }, month: { type: "number", description: "месяц 1–12" }, year: { type: "number", description: "год рождения, только если назван" } }, required: ["day", "month"] },
  },
  {
    name: "account_info",
    description:
      "Вопросы про СВОЙ АККАУНТ и вход в LIFE OS: «на какую почту зарегистрирован аккаунт», «какая у меня почта», «как я вошёл», «куда привязан аккаунт», «какой у меня логин/юзернейм». Это НЕ вопрос о содержимом дневника.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "set_style",
    description:
      "Пользователь просит ИЗМЕНИТЬ МАНЕРУ ОБЩЕНИЯ бота или содержание его сообщений: «пиши короче», «меньше эмодзи», «без пафоса», «обращайся на вы», «не называй меня…», «не пиши мне про…», «хватит спрашивать про…», «пиши по-украински». Пожелание СОХРАНЯЕТСЯ и реально влияет на будущие сообщения (утренние и чат). wish — суть пожелания одной короткой фразой-инструкцией.",
    input_schema: { type: "object", properties: { wish: { type: "string", description: "пожелание кратко, напр. «писать короче, без эмодзи»" } }, required: ["wish"] },
  },
  { name: "delete_last_entry", description: "Удалить ПОСЛЕДНЮЮ запись дневника. ТОЛЬКО при явной команде удаления, где прямо сказано «удали/убери/сотри» + «(последнюю) запись»: «удали последнюю запись», «убери предыдущую запись», «сотри последнее». НЕ выбирай на фразы-поправки и недовольство («не то записал», «не надо было это добавлять», «надо было иначе», «неправильно», «зачем ты…») — это НЕ команда удаления, для них save_entry.", input_schema: { type: "object", properties: {} } },
  { name: "ask_question", description: "Пользователь СПРАШИВАЕТ ассистента о своей жизни / просит найти, вспомнить, проанализировать — ИЛИ возмущается/уточняет по поводу уже записанного («почему трату не учёл?», «где сегодняшний расход?», «чего не показал?»). Сюда же: вопросы про СВОИ ЦИФРЫ И СТАТИСТИКУ («сколько у меня записей/голосовых сообщений», «сколько слов я написал за всё время», «когда я зарегистрировался») и вопросы ПРО ПРИЛОЖЕНИЕ («как зайти в приложение», «как работает…», «где найти…», «что ты умеешь») — у ассистента есть эти данные и инструкция. Это НЕ новая запись, повторно данные (в т.ч. траты) записывать не нужно.", input_schema: { type: "object", properties: {} } },
  { name: "save_entry", description: "Обычная дневниковая запись: рассказ о дне, мысли, чувства, событие, идея. ПО УМОЛЧАНИЮ выбирай это.", input_schema: { type: "object", properties: {} } },
];

const SYS =
  "Ты — маршрутизатор сообщений в личном дневнике-боте. Большинство сообщений — это ДНЕВНИКОВЫЕ ЗАПИСИ " +
  "(человек рассказывает о дне, мыслях, чувствах, событиях) → save_entry. " +
  "Инструменты-ДЕЙСТВИЯ (add_goal, add_task, set_reminder, complete_task, log_weight, add_dream, complete_dream, add_deed, delete_last_entry) " +
  "выбирай ТОЛЬКО при ЯВНОЙ ПОВЕЛИТЕЛЬНОЙ команде боту («добавь…», «напомни…», «отметь…», «удали…», «запиши вес…», «заверши задачу…»). " +
  "«Напомни …» с датой/временем → set_reminder (разбери дату и время по местному времени). «Добавь задачу» без времени → add_task. " +
  "«Напоминай КАЖДЫЙ ЧАС с 9 до 21 …» (интервал в течение дня) → ОДИН set_reminder с recurrence=hourly, from_hour=9, to_hour=21. НИКОГДА не создавай для этого десяток отдельных напоминаний на каждый час. " +
  "Если человек просто описывает, что сделал («сегодня пробежал 5 км», «поговорил с мамой») — это save_entry, НЕ действие. " +
  "ВАЖНО: фразы-поправки, недовольство и уточнения («не так записал», «не надо было это добавлять», «надо было иначе», «зачем ты…», «неправильно понял») — это НЕ команда действия и тем более НЕ удаление; по умолчанию save_entry. " +
  "ИСКЛЮЧЕНИЕ: если поправка — про ИМЯ человека («её зовут X», «настоящее имя — X», «переименуй Y в X», «исправь имя», «запиши у себя и измени: её зовут X») → rename_person, чтобы имя исправилось во всей базе, а не легло новой записью. " +
  "delete_last_entry выбирай ТОЛЬКО когда прямо сказано «удали/убери/сотри (последнюю) ЗАПИСЬ (дневника)»; при любом сомнении — НЕ удаляй. " +
  "КОРОТКИЙ ОТВЕТ НА ВОПРОС БОТА: если в контексте последнее сообщение бота — про напоминания, заметки или списки (например, «уточни, какое отменить»), то «все», «все удаляй», «первое», «да» относятся ИМЕННО К НИМ: повтори то же действие (cancel_reminder с all=true и тем же query). НИКОГДА не превращай такой ответ в delete_last_entry — иначе сотрёшь запись дневника, которую никто не просил трогать. " +
  "Просьбы к БОТУ изменить манеру или содержание его сообщений («пиши короче», «меньше эмодзи», «не пиши мне про…», «обращайся иначе», «не называй меня…») → set_style, а НЕ save_entry: пожелание должно сохраниться и влиять. " +
  "Вопросы про свой АККАУНТ и вход («на какую почту зарегистрирован», «какая у меня почта», «как я вошёл») → account_info, а НЕ save_entry и НЕ ask_question. " +
  "Вопросы про свои ЦИФРЫ/СТАТИСТИКУ («сколько у меня записей/голосовых», «сколько слов/букв за всё время», «когда я зарегистрировался») и про ПРИЛОЖЕНИЕ («как зайти в приложение», «как работает…», «где найти…», «что ты умеешь») → ask_question: у ассистента есть точные данные и инструкция. ЛЮБОЙ вопрос боту — это ask_question, а НЕ save_entry, даже если ты не уверен, что ассистент знает ответ: лучше честное «не умею», чем молчаливая запись в дневник. " +
  "Если человек сообщает СВОЙ день рождения («мой др 15 марта», «я родился 07.03.1990», «запомни мой день рождения») → set_birthday; дни рождения ДРУГИХ людей — set_reminder (если просит напомнить) или save_entry. " +
  "Просьбы дать/найти рецепт, совет, тренировку или материал из сохранённого («дай рецепт…», «найди тот рилс про…», «что я сохранял о…») → ask_knowledge, а НЕ save_entry: человек ждёт ОТВЕТ, а не запись в дневник. " +
  "Вопросы про ПЛАНЫ и НАПОМИНАНИЯ («что у меня сегодня/завтра?», «какие планы на неделю?», «покажи напоминания», «что я должен сделать сегодня?») → list_reminders, а НЕ ask_question. "
  "Просьба ИЗМЕНИТЬ уже созданное напоминание («перенеси», «измени дату», «не в 9, а в 11», «сдвинь на час») → move_reminder, а НЕ set_reminder и НЕ правка записи дневника. " +
  "«Запиши/запомни» + СПРАВОЧНЫЙ факт без повествования (код, номер, адрес, размер, wifi) → save_note, а НЕ save_entry: это справка, её будут искать, а не перечитывать как дневник. Рассказ о дне со словом «запиши» — по-прежнему save_entry. " +
  "СПИСКИ (чек-листы): «добавь … в список (покупок/подарков)» → add_list_item (несколько пунктов — массивом items в ОДИН вызов), «что в списке / что купить» → show_list, «вычеркни … / купил, убери» → check_list_item, «очисти список» → clear_list. Это НЕ add_task и НЕ save_note. " +
  "«Передай/скажи/напиши <кому> …» (сообщение ДРУГОМУ человеку) → send_message. Ты УМЕЕШЬ это: бот доставит сообщение получателю в его чат. Никогда не отвечай «я не могу написать другому человеку». " +
  "«Выгрузи/пришли заметки файлом», «экспорт заметок», «перенесу на айфон» → export_notes. " +
  "«Какой код от…?», «найди заметку…», «что я записывал про…» (справка, которую сам просил запомнить) → find_note. «Что у меня по заметкам», «покажи (мои) заметки» → find_note БЕЗ query (обзор). " +
  "РАЗЛИЧАЙ СЛОВА: «записи», «дневник» — это ДНЕВНИК (статистика → ask_question); «заметки» — это раздел справки (find_note); «списки» — чек-листы (show_list). Не подменяй одно другим. " +
  "«Отмени/убери напоминание про…», «не напоминай про…» → cancel_reminder, а НЕ save_entry и НЕ delete_last_entry. " +
  "Вопросы о своей жизни → ask_question. " +
  "ВАЖНО: если человек СПРАШИВАЕТ или ВОЗМУЩАЕТСЯ по поводу уже записанного (особенно трат/денег) — " +
  "«а почему трату не учёл?», «где сегодняшний расход?», «чего не показал?», «ты не записал…?» — это ask_question, " +
  "а НЕ save_entry, даже если в фразе названа сумма. Такую операцию НЕ нужно записывать заново — она уже есть. " +
  "Выбирай ОДИН вид инструмента на сообщение. НО если в сообщении перечислено НЕСКОЛЬКО объектов одного действия " +
  "(два фильма: «Река Медисон, Ранчо Даттонов — надо посмотреть»; несколько задач; несколько напоминаний) — " +
  "вызови этот инструмент НЕСКОЛЬКО РАЗ, отдельно на каждый объект, чтобы ни один не потерялся. " +
  "КОНТЕКСТ ДИАЛОГА: если ниже дано последнее сообщение бота, а сообщение пользователя — короткая отсылка к нему " +
  "(«а скинь мне рецепт» после того как бот сам упомянул рецепт гречневого хлеба; «да, добавь», «скинь его», «покажи этот») — " +
  "РАСКРОЙ отсылку конкретикой из контекста: в query/параметры инструмента пиши полное название («рецепт гречневого хлеба»), а не общее слово («рецепт»).";

// Local "now" string for resolving relative dates (today/tomorrow/in an hour).
function nowLocalLine(off?: number | null): string {
  const ms = Date.now() + (typeof off === "number" ? off : 0) * 60000;
  const d = new Date(ms);
  const iso = d.toISOString().slice(0, 16).replace("T", " ");
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  return `Сейчас у пользователя (местное время): ${iso} (${dow}). Используй это для дат «сегодня», «завтра», «через час», «в 9».`;
}

// Последнее сообщение бота пользователю (пуш или ответ) не старше 6 часов —
// контекст для роутера, чтобы понимать отсылки «а скинь его», «да, добавь».
export async function recentBotContext(userId: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin()
      .from("biographer_chats")
      .select("answer, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data?.answer) return null;
    if (Date.now() - Date.parse((data as any).created_at) > 6 * 3600 * 1000) return null;
    return String((data as any).answer).slice(0, 600);
  } catch {
    return null;
  }
}

// Был ли прошлый ход бота ВЫПОЛНЕННЫМ ДЕЙСТВИЕМ (поставил напоминание, добавил
// задачу), а не обычной репликой. Нужно, чтобы «измени дату на 7.08» после
// созданного напоминания правило напоминание, а не последнюю запись дневника.
// Метка лежит в поле question (recentBotContext читает только answer, поэтому
// нужен отдельный запрос — иначе проверка молча всегда ложна).
export async function lastReplyWasAction(userId: string, withinMs = 30 * 60 * 1000): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin()
      .from("biographer_chats")
      .select("question, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return false;
    if (Date.now() - Date.parse((data as any).created_at) > withinMs) return false;
    return String((data as any).question || "").includes(ACTION_TAG);
  } catch {
    return false;
  }
}

// Один haiku-проход: действие / вопрос / запись. lastBot — последнее сообщение
// бота пользователю (если недавнее): без него короткая отсылка «а скинь мне рецепт»
// после утреннего пуша про гречневый хлеб превращалась в поиск «рецепт» вообще.
export async function routeMessage(text: string, userId?: string, tzOffset?: number | null, lastBot?: string | null): Promise<Route> {
  try {
    const resp = await client().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      // SYS статичен → кэшируем (одна кэш-точка покрывает и tools). Время меняется
      // каждую минуту — держим его отдельным НЕкэшируемым блоком после SYS.
      system: [
        { type: "text", text: SYS, cache_control: { type: "ephemeral" } },
        { type: "text", text: nowLocalLine(tzOffset) },
        ...(lastBot ? [{ type: "text" as const, text: `Последнее сообщение бота пользователю (контекст для коротких отсылок «его», «этот», «а скинь…»):\n«${lastBot}»` }] : []),
      ],
      messages: [{ role: "user", content: text }],
      tools: ACTION_TOOLS,
      tool_choice: { type: "any" },
    });
    logClaude(userId, "bot_route", "haiku", (resp as any).usage);
    const blocks: any[] = resp.content.filter((c: any) => c.type === "tool_use");
    const block: any = blocks[0];
    const name = block?.name;
    if (!name || name === "save_entry") return { kind: "note" };
    if (name === "ask_question") return { kind: "question" };
    // Несколько действий в одном сообщении («добавь два фильма: X и Y») — модель
    // вызывает инструмент несколько раз; раньше выполнялся только первый вызов.
    // Дубли отсекаем: модель иногда разбивает одно дело на несколько одинаковых
    // вызовов («напоминай каждый час» → два напоминания с тем же текстом).
    const sig = (b: any) => `${b.name}|${String(b.input?.text || b.input?.query || JSON.stringify(b.input || {})).toLowerCase().trim()}`;
    const seen = new Set([sig(block)]);
    const more = blocks.slice(1, 5)
      .filter((b: any) => b.name && b.name !== "save_entry" && b.name !== "ask_question")
      .filter((b: any) => { const k = sig(b); if (seen.has(k)) return false; seen.add(k); return true; })
      .map((b: any) => ({ name: b.name, input: b.input || {} }));
    return { kind: "action", name, input: block.input || {}, ...(more.length ? { more } : {}) };
  } catch {
    return { kind: "note" }; // при ошибке безопаснее сохранить как запись
  }
}

// Нормализация имени для сравнения (регистр, ё→е, пробелы).
const normName = (x: string) => (x || "").toLowerCase().replace(/ё/g, "е").trim();

const escRx = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Заменить имя в тексте с учётом падежных окончаний: если оба имени кончаются
// на -а/-я, меняем основу и сохраняем окончание («Стельку» → «Эстельку»).
function renameInText(text: string, from: string, to: string): string {
  const lf = from.slice(-1).toLowerCase(), lt = to.slice(-1).toLowerCase();
  const flex = "ая".includes(lf) && lf === lt;
  const fromCore = flex ? from.slice(0, -1) : from;
  const toCore = flex ? to.slice(0, -1) : to;
  const rx = new RegExp(`(?<![а-яёa-z])${escRx(fromCore)}${flex ? "([а-яё]{1,3})" : "(?![а-яёa-z])"}`, "gi");
  return text.replace(rx, (_m, tail?: string) => toCore + (typeof tail === "string" ? tail : ""));
}

// Локальная дата YYYY-MM-DD пользователя (по tz_offset, как в saveEntry).
function localDay(off?: number | null): string {
  const ms = Date.now() + (typeof off === "number" ? off : 0) * 60000;
  return new Date(ms).toISOString().slice(0, 10);
}

const M: Record<Lang, any> = {
  ru: {
    goal: (t: string) => `🎯 Добавил цель: «${t}».`,
    task: (t: string) => `✅ Добавил задачу: «${t}».`,
    taskDone: (t: string) => `✔️ Отметил задачу выполненной: «${t}».`,
    taskNone: "Не нашёл такой открытой задачи. Можешь сказать точнее?",
    weight: (k: number) => `⚖️ Записал вес: ${k} кг.`,
    dream: (t: string) => `✨ Добавил мечту: «${t}».`,
    dreamDone: (t: string) => `🌟 Отметил мечту сбывшейся: «${t}»!`,
    dreamNone: "Не нашёл такую мечту. Скажи точнее?",
    deed: (t: string) => `💛 Записал доброе дело: «${t}».`,
    style: (t: string) => `🎨 Запомнил: «${t}». Буду учитывать — и в утренних сообщениях, и в чате.`,
    bday: (d: string) => `🎂 Запомнил: твой день рождения — ${d}. Жди в этот день кое-что приятное — я такие даты не пропускаю 😉`,
    account: (email: string | null, tg: string | null, since?: string | null) => `🔐 Твой аккаунт:\n${email ? `📧 Почта: ${email}` : "📧 Почта не привязана — ты входишь через Telegram"}${tg ? `\n✈️ Telegram: @${tg}` : ""}${since ? `\n📅 В LIFE OS с ${since}` : ""}\n\nПривязать или сменить почту можно в Профиле → Аккаунт и вход.`,
    delAsk: (t: string) => `🗑 Удалить последнюю запись${t ? `: «${t}»` : ""}? Это действие нельзя отменить.`,
    delLast: (t: string) => `🗑 Удалил последнюю запись${t ? `: «${t}»` : ""}.`,
    delKept: "Ок, оставил запись.",
    delNone: "Записей для удаления нет.",
    fail: "Не получилось выполнить — попробуй ещё раз чуть позже.",
    rename: (a: string, b: string) => `✏️ Исправил: «${a}» → «${b}» — в людях и в инсайтах.`,
    renameNone: (a: string) => `Не нашёл «${a}» ни в людях, ни в инсайтах. Скажи, как имя записано сейчас?`,
    renameUnclear: "Не понял, какое имя на какое поменять. Скажи прямо, например: «переименуй Эстелика в Эстелька».",
    open: "Открыть",
    mvKind: { film: "🎬 фильм", series: "📺 сериал", book: "📚 книгу" } as Record<string, string>,
    mvStatusWatch: { want: "хочу посмотреть", reading: "смотрю", read: "посмотрел" } as Record<string, string>,
    mvStatusRead: { want: "хочу прочитать", reading: "читаю", read: "прочитал" } as Record<string, string>,
    media: (kindLabel: string, title: string, statusLabel: string) => `Добавил в Медиатеку: ${kindLabel} «${title}» — ${statusLabel}.`,
  },
  en: {
    goal: (t: string) => `🎯 Added a goal: “${t}”.`,
    task: (t: string) => `✅ Added a task: “${t}”.`,
    taskDone: (t: string) => `✔️ Marked task done: “${t}”.`,
    taskNone: "Couldn't find such an open task. Can you be more specific?",
    weight: (k: number) => `⚖️ Logged weight: ${k} kg.`,
    dream: (t: string) => `✨ Added a dream: “${t}”.`,
    dreamDone: (t: string) => `🌟 Marked dream as come true: “${t}”!`,
    dreamNone: "Couldn't find that dream. Be more specific?",
    deed: (t: string) => `💛 Logged a good deed: “${t}”.`,
    style: (t: string) => `🎨 Got it: “${t}”. I'll keep it in mind — in morning messages and in chat.`,
    bday: (d: string) => `🎂 Got it: your birthday is ${d}. Expect something nice that day — I never miss dates like this 😉`,
    account: (email: string | null, tg: string | null, since?: string | null) => `🔐 Your account:\n${email ? `📧 Email: ${email}` : "📧 No email linked — you sign in via Telegram"}${tg ? `\n✈️ Telegram: @${tg}` : ""}${since ? `\n📅 With LIFE OS since ${since}` : ""}\n\nYou can link or change email in Profile → Account.`,
    delAsk: (t: string) => `🗑 Delete the last entry${t ? `: “${t}”` : ""}? This can't be undone.`,
    delLast: (t: string) => `🗑 Deleted the last entry${t ? `: “${t}”` : ""}.`,
    delKept: "Ok, kept the entry.",
    delNone: "No entries to delete.",
    fail: "Couldn't do it — try again a bit later.",
    rename: (a: string, b: string) => `✏️ Fixed: “${a}” → “${b}” — in people and insights.`,
    renameNone: (a: string) => `Couldn't find “${a}” in people or insights. How is the name written now?`,
    renameUnclear: "I couldn't tell which name to change into which. Say it directly, e.g. “rename Estelika to Estelka”.",
    open: "Open",
    mvKind: { film: "🎬 film", series: "📺 series", book: "📚 book" } as Record<string, string>,
    mvStatusWatch: { want: "want to watch", reading: "watching", read: "watched" } as Record<string, string>,
    mvStatusRead: { want: "want to read", reading: "reading", read: "read" } as Record<string, string>,
    media: (kindLabel: string, title: string, statusLabel: string) => `Added to your Media library: ${kindLabel} “${title}” — ${statusLabel}.`,
  },
  uk: {
    goal: (t: string) => `🎯 Додав ціль: «${t}».`,
    task: (t: string) => `✅ Додав завдання: «${t}».`,
    taskDone: (t: string) => `✔️ Позначив завдання виконаним: «${t}».`,
    taskNone: "Не знайшов такого відкритого завдання. Скажи точніше?",
    weight: (k: number) => `⚖️ Записав вагу: ${k} кг.`,
    dream: (t: string) => `✨ Додав мрію: «${t}».`,
    dreamDone: (t: string) => `🌟 Позначив мрію здійсненою: «${t}»!`,
    dreamNone: "Не знайшов таку мрію. Скажи точніше?",
    deed: (t: string) => `💛 Записав добру справу: «${t}».`,
    style: (t: string) => `🎨 Запам'ятав: «${t}». Враховуватиму — і в ранкових повідомленнях, і в чаті.`,
    bday: (d: string) => `🎂 Запам'ятав: твій день народження — ${d}. Чекай того дня дещо приємне — такі дати я не пропускаю 😉`,
    account: (email: string | null, tg: string | null, since?: string | null) => `🔐 Твій акаунт:\n${email ? `📧 Пошта: ${email}` : "📧 Пошта не прив'язана — ти входиш через Telegram"}${tg ? `\n✈️ Telegram: @${tg}` : ""}${since ? `\n📅 У LIFE OS з ${since}` : ""}\n\nПрив'язати або змінити пошту можна в Профілі → Акаунт і вхід.`,
    delAsk: (t: string) => `🗑 Видалити останній запис${t ? `: «${t}»` : ""}? Цю дію не можна скасувати.`,
    delLast: (t: string) => `🗑 Видалив останній запис${t ? `: «${t}»` : ""}.`,
    delKept: "Ок, залишив запис.",
    delNone: "Записів для видалення немає.",
    fail: "Не вдалося виконати — спробуй ще раз трохи пізніше.",
    rename: (a: string, b: string) => `✏️ Виправив: «${a}» → «${b}» — у людях і в інсайтах.`,
    renameNone: (a: string) => `Не знайшов «${a}» ні в людях, ні в інсайтах. Скажи, як ім'я записано зараз?`,
    renameUnclear: "Не зрозумів, яке ім'я на яке змінити. Скажи прямо, наприклад: «перейменуй Естеліка в Естелька».",
    open: "Відкрити",
    mvKind: { film: "🎬 фільм", series: "📺 серіал", book: "📚 книгу" } as Record<string, string>,
    mvStatusWatch: { want: "хочу подивитися", reading: "дивлюся", read: "переглянув" } as Record<string, string>,
    mvStatusRead: { want: "хочу прочитати", reading: "читаю", read: "прочитав" } as Record<string, string>,
    media: (kindLabel: string, title: string, statusLabel: string) => `Додав у Медіатеку: ${kindLabel} «${title}» — ${statusLabel}.`,
  },
  fr: {
    goal: (t: string) => `🎯 Objectif ajouté : « ${t} ».`,
    task: (t: string) => `✅ Tâche ajoutée : « ${t} ».`,
    taskDone: (t: string) => `✔️ Tâche marquée terminée : « ${t} ».`,
    taskNone: "Je n'ai pas trouvé cette tâche ouverte. Peux-tu préciser ?",
    weight: (k: number) => `⚖️ Poids enregistré : ${k} kg.`,
    dream: (t: string) => `✨ Rêve ajouté : « ${t} ».`,
    dreamDone: (t: string) => `🌟 Rêve marqué comme réalisé : « ${t} » !`,
    dreamNone: "Je n'ai pas trouvé ce rêve. Précise ?",
    deed: (t: string) => `💛 Bonne action enregistrée : « ${t} ».`,
    style: (t: string) => `🎨 C'est noté : « ${t} ». J'en tiendrai compte — le matin et dans le chat.`,
    bday: (d: string) => `🎂 C'est noté : ton anniversaire, c'est le ${d}. Attends-toi à une surprise ce jour-là — je ne rate jamais ces dates 😉`,
    account: (email: string | null, tg: string | null, since?: string | null) => `🔐 Ton compte :\n${email ? `📧 E-mail : ${email}` : "📧 Pas d'e-mail lié — tu te connectes via Telegram"}${tg ? `\n✈️ Telegram : @${tg}` : ""}${since ? `\n📅 Sur LIFE OS depuis le ${since}` : ""}\n\nTu peux lier ou changer l'e-mail dans Profil → Compte.`,
    delAsk: (t: string) => `🗑 Supprimer la dernière entrée${t ? ` : « ${t} »` : ""} ? Action irréversible.`,
    delLast: (t: string) => `🗑 Dernière entrée supprimée${t ? ` : « ${t} »` : ""}.`,
    delKept: "Ok, entrée conservée.",
    delNone: "Aucune entrée à supprimer.",
    fail: "Échec — réessaie un peu plus tard.",
    rename: (a: string, b: string) => `✏️ Corrigé : « ${a} » → « ${b} » — dans les personnes et les insights.`,
    renameNone: (a: string) => `Je n'ai pas trouvé « ${a} ». Comment le nom est-il écrit actuellement ?`,
    renameUnclear: "Je n'ai pas compris quel nom remplacer par quel autre. Dis-le directement, par exemple : « renomme Estelika en Estelka ».",
    open: "Ouvrir",
    mvKind: { film: "🎬 film", series: "📺 série", book: "📚 livre" } as Record<string, string>,
    mvStatusWatch: { want: "à voir", reading: "en cours", read: "vu" } as Record<string, string>,
    mvStatusRead: { want: "à lire", reading: "en cours", read: "lu" } as Record<string, string>,
    media: (kindLabel: string, title: string, statusLabel: string) => `Ajouté à ta Médiathèque : ${kindLabel} « ${title} » — ${statusLabel}.`,
  },
  es: {
    goal: (t: string) => `🎯 Agregué una meta: «${t}».`,
    task: (t: string) => `✅ Agregué una tarea: «${t}».`,
    taskDone: (t: string) => `✔️ Marqué la tarea como hecha: «${t}».`,
    taskNone: "No encontré esa tarea abierta. ¿Puedes ser más específico?",
    weight: (k: number) => `⚖️ Registré el peso: ${k} kg.`,
    dream: (t: string) => `✨ Agregué un sueño: «${t}».`,
    dreamDone: (t: string) => `🌟 Marqué el sueño como cumplido: «${t}»!`,
    dreamNone: "No encontré ese sueño. ¿Puedes ser más específico?",
    deed: (t: string) => `💛 Registré una buena acción: «${t}».`,
    style: (t: string) => `🎨 Anotado: «${t}». Lo tendré en cuenta — por la mañana y en el chat.`,
    bday: (d: string) => `🎂 Anotado: tu cumpleaños es el ${d}. Espera algo lindo ese día — nunca me pierdo estas fechas 😉`,
    account: (email: string | null, tg: string | null, since?: string | null) => `🔐 Tu cuenta:\n${email ? `📧 Correo: ${email}` : "📧 Sin correo vinculado — entras por Telegram"}${tg ? `\n✈️ Telegram: @${tg}` : ""}${since ? `\n📅 En LIFE OS desde ${since}` : ""}\n\nPuedes vincular o cambiar el correo en Perfil → Cuenta.`,
    delAsk: (t: string) => `🗑 ¿Eliminar la última entrada${t ? `: «${t}»` : ""}? Esta acción no se puede deshacer.`,
    delLast: (t: string) => `🗑 Eliminé la última entrada${t ? `: «${t}»` : ""}.`,
    delKept: "Ok, dejé la entrada.",
    delNone: "No hay entradas para eliminar.",
    fail: "No se pudo hacer — intenta de nuevo un poco más tarde.",
    open: "Abrir",
    mvKind: { film: "🎬 película", series: "📺 serie", book: "📚 libro" } as Record<string, string>,
    mvStatusWatch: { want: "quiero ver", reading: "viendo", read: "vista" } as Record<string, string>,
    mvStatusRead: { want: "quiero leer", reading: "leyendo", read: "leído" } as Record<string, string>,
    media: (kindLabel: string, title: string, statusLabel: string) => `Agregué a tu Mediateca: ${kindLabel} «${title}» — ${statusLabel}.`,
  },
};

// Reminder confirmation strings (kept separate from M for brevity).
const REMIND_MSG: Record<Lang, { label: (t: string, w: string) => string; at: string; allDayNote: string; rep: Record<Recurrence, string>; hourly: (from: number, to: number) => string }> = {
  ru: { label: (t, w) => `⏰ Напомню: «${t}» — ${w}.`, at: "в", allDayNote: "весь день", rep: { daily: " · каждый день", weekly: " · каждую неделю", monthly: " · каждый месяц", yearly: " · каждый год" }, hourly: (f, t) => ` · каждый час с ${f}:00 до ${t}:00` },
  en: { label: (t, w) => `⏰ I'll remind you: “${t}” — ${w}.`, at: "at", allDayNote: "all day", rep: { daily: " · every day", weekly: " · every week", monthly: " · every month", yearly: " · every year" }, hourly: (f, t) => ` · every hour from ${f}:00 to ${t}:00` },
  uk: { label: (t, w) => `⏰ Нагадаю: «${t}» — ${w}.`, at: "о", allDayNote: "весь день", rep: { daily: " · щодня", weekly: " · щотижня", monthly: " · щомісяця", yearly: " · щороку" }, hourly: (f, t) => ` · щогодини з ${f}:00 до ${t}:00` },
  fr: { label: (t, w) => `⏰ Je te rappellerai : « ${t} » — ${w}.`, at: "à", allDayNote: "toute la journée", rep: { daily: " · chaque jour", weekly: " · chaque semaine", monthly: " · chaque mois", yearly: " · chaque année" }, hourly: (f, t) => ` · chaque heure de ${f}h à ${t}h` },
  es: { label: (t, w) => `⏰ Te recordaré: «${t}» — ${w}.`, at: "a las", allDayNote: "todo el día", rep: { daily: " · cada día", weekly: " · cada semana", monthly: " · cada mes", yearly: " · cada año" }, hourly: (f, t) => ` · cada hora de ${f}:00 a ${t}:00` },
};

// Строки для «что у меня сегодня/завтра» и «отмени напоминание».
const AGENDA_MSG: Record<Lang, {
  head: Record<string, string>; empty: Record<string, string>;
  allDay: string; taskTag: string; moved: (t: string, d: string, tm: string) => string; canceled: (t: string) => string; canceledMany: (n: number) => string; cancelNone: string; cancelMany: string;
}> = {
  ru: { head: { today: "📅 Сегодня", tomorrow: "📅 Завтра", week: "📅 Ближайшая неделя", all: "📅 Ближайшие планы" },
    empty: { today: "На сегодня напоминаний и задач с датой нет — день свободен 🙂", tomorrow: "На завтра пока ничего не запланировано.", week: "На этой неделе напоминаний нет.", all: "Ближайших напоминаний нет." },
    allDay: "весь день", taskTag: "задача", moved: (t: string, d: string, tm: string) => `⏰ Перенёс: «${t}» — ${d} в ${tm}.`, canceled: (t) => `Отменил напоминание: «${t}».`, canceledMany: (n) => `Отменил напоминания: ${n}.`, cancelNone: "Не нашёл такого напоминания среди ближайших.", cancelMany: "Нашёл несколько похожих — уточни, какое отменить:" },
  en: { head: { today: "📅 Today", tomorrow: "📅 Tomorrow", week: "📅 This week", all: "📅 Upcoming" },
    empty: { today: "No reminders or dated tasks today — the day is free 🙂", tomorrow: "Nothing planned for tomorrow yet.", week: "No reminders this week.", all: "No upcoming reminders." },
    allDay: "all day", taskTag: "task", moved: (t: string, d: string, tm: string) => `⏰ Moved: “${t}” — ${d} at ${tm}.`, canceled: (t) => `Canceled the reminder: “${t}”.`, canceledMany: (n) => `Canceled ${n} reminders.`, cancelNone: "Couldn't find such a reminder among the upcoming ones.", cancelMany: "Found several similar ones — which should I cancel?" },
  uk: { head: { today: "📅 Сьогодні", tomorrow: "📅 Завтра", week: "📅 Найближчий тиждень", all: "📅 Найближчі плани" },
    empty: { today: "На сьогодні нагадувань і задач із датою немає — день вільний 🙂", tomorrow: "На завтра поки нічого не заплановано.", week: "На цьому тижні нагадувань немає.", all: "Найближчих нагадувань немає." },
    allDay: "весь день", taskTag: "задача", moved: (t: string, d: string, tm: string) => `⏰ Переніс: «${t}» — ${d} о ${tm}.`, canceled: (t) => `Скасував нагадування: «${t}».`, canceledMany: (n) => `Скасував нагадування: ${n}.`, cancelNone: "Не знайшов такого нагадування серед найближчих.", cancelMany: "Знайшов кілька схожих — уточни, яке скасувати:" },
  fr: { head: { today: "📅 Aujourd'hui", tomorrow: "📅 Demain", week: "📅 Cette semaine", all: "📅 À venir" },
    empty: { today: "Aucun rappel ni tâche datée aujourd'hui — journée libre 🙂", tomorrow: "Rien de prévu pour demain.", week: "Aucun rappel cette semaine.", all: "Aucun rappel à venir." },
    allDay: "toute la journée", taskTag: "tâche", moved: (t: string, d: string, tm: string) => `⏰ Déplacé : « ${t} » — ${d} à ${tm}.`, canceled: (t) => `Rappel annulé : « ${t} ».`, canceledMany: (n) => `${n} rappels annulés.`, cancelNone: "Je n'ai pas trouvé ce rappel parmi les prochains.", cancelMany: "J'en ai trouvé plusieurs — lequel annuler ?" },
  es: { head: { today: "📅 Hoy", tomorrow: "📅 Mañana", week: "📅 Esta semana", all: "📅 Próximos" },
    empty: { today: "Hoy no hay recordatorios ni tareas con fecha — día libre 🙂", tomorrow: "Nada planeado para mañana todavía.", week: "No hay recordatorios esta semana.", all: "No hay próximos recordatorios." },
    allDay: "todo el día", taskTag: "tarea", moved: (t: string, d: string, tm: string) => `⏰ Movido: «${t}» — ${d} a las ${tm}.`, canceled: (t) => `Cancelé el recordatorio: «${t}».`, canceledMany: (n) => `Cancelé ${n} recordatorios.`, cancelNone: "No encontré ese recordatorio entre los próximos.", cancelMany: "Encontré varios parecidos — ¿cuál cancelo?" },
};

// Строки для заметок (save_note / find_note).
const NOTE_MSG: Record<Lang, { saved: (t: string) => string; head: string; none: string; ovHead: (n: number) => string; ovEmpty: string; ovMore: string; exported: (n: number) => string }> = {
  ru: { saved: (t) => `📝 Сохранил в Заметки: «${t}».`, head: "📝 Нашёл в Заметках:", none: "В Заметках такого не нашёл. Скажи «запиши …» — и сохраню.", ovHead: (n) => `📝 Твои заметки (всего ${n}):`, ovEmpty: "Заметок пока нет. Скажи «запиши код от домофона 4582» — и справка будет всегда под рукой.", ovMore: "Спроси «найди заметку про …» — или открой раздел «Заметки» в приложении.", exported: (n: number) => `📝 Твои заметки (${n}) — файлом. Открой его в Заметках айфона, Obsidian или где удобно; вернуть обратно можно, прислав файл мне.` },
  en: { saved: (t) => `📝 Saved to Notes: “${t}”.`, head: "📝 Found in your Notes:", none: "Nothing like that in your Notes. Say “save a note …” and I'll keep it.", ovHead: (n) => `📝 Your notes (${n} total):`, ovEmpty: "No notes yet. Say “save a note: locker code 4582” — and the fact stays at hand.", ovMore: "Ask “find the note about …” — or open the “Notes” section in the app.", exported: (n: number) => `📝 Your notes (${n}) as a file. Open it in iPhone Notes, Obsidian or anywhere; send the file back to me to import it again.` },
  uk: { saved: (t) => `📝 Зберіг у Нотатки: «${t}».`, head: "📝 Знайшов у Нотатках:", none: "У Нотатках такого не знайшов. Скажи «запиши …» — і збережу.", ovHead: (n) => `📝 Твої нотатки (всього ${n}):`, ovEmpty: "Нотаток поки немає. Скажи «запиши код від домофона 4582» — і довідка буде під рукою.", ovMore: "Спитай «знайди нотатку про …» — або відкрий розділ «Нотатки» в застосунку.", exported: (n: number) => `📝 Твої нотатки (${n}) — файлом. Відкрий його в Нотатках айфона, Obsidian чи де зручно; повернути назад можна, надіславши файл мені.` },
  fr: { saved: (t) => `📝 Enregistré dans Notes : « ${t} ».`, head: "📝 Trouvé dans tes Notes :", none: "Rien de tel dans tes Notes. Dis « note … » et je le garde.", ovHead: (n) => `📝 Tes notes (${n} au total) :`, ovEmpty: "Pas encore de notes. Dis « note : code du portail 4582 » — et l'info reste à portée.", ovMore: "Demande « trouve la note sur … » — ou ouvre la section « Notes » dans l'app.", exported: (n: number) => `📝 Tes notes (${n}) en fichier. Ouvre-le dans Notes de l'iPhone, Obsidian ou ailleurs ; renvoie-le-moi pour réimporter.` },
  es: { saved: (t) => `📝 Guardado en Notas: «${t}».`, head: "📝 Encontrado en tus Notas:", none: "No encontré nada así en tus Notas. Di «apunta …» y lo guardo.", ovHead: (n) => `📝 Tus notas (${n} en total):`, ovEmpty: "Aún no hay notas. Di «apunta: código del portal 4582» — y el dato queda a mano.", ovMore: "Pregunta «busca la nota sobre …» — o abre la sección «Notas» en la app.", exported: (n: number) => `📝 Tus notas (${n}) en un archivo. Ábrelo en Notas del iPhone, Obsidian o donde quieras; envíamelo de vuelta para reimportarlo.` },
};

// Строки для списков (чек-листов).
const LIST_MSG: Record<Lang, { defName: string; added: (what: string, list: string) => string; head: (list: string) => string; empty: (list: string) => string; checked: (item: string) => string; cleared: (list: string) => string; notFound: string }> = {
  ru: { defName: "Покупки", added: (w, l) => `🛒 Добавил в «${l}»: ${w}.`, head: (l) => `🛒 ${l}:`, empty: (l) => `Список «${l}» пуст.`, checked: (i) => `Вычеркнул: ${i} ✅`, cleared: (l) => `Очистил список «${l}».`, notFound: "Такого пункта в списке не нашёл." },
  en: { defName: "Shopping", added: (w, l) => `🛒 Added to “${l}”: ${w}.`, head: (l) => `🛒 ${l}:`, empty: (l) => `The “${l}” list is empty.`, checked: (i) => `Checked off: ${i} ✅`, cleared: (l) => `Cleared the “${l}” list.`, notFound: "Couldn't find that item in the list." },
  uk: { defName: "Покупки", added: (w, l) => `🛒 Додав у «${l}»: ${w}.`, head: (l) => `🛒 ${l}:`, empty: (l) => `Список «${l}» порожній.`, checked: (i) => `Викреслив: ${i} ✅`, cleared: (l) => `Очистив список «${l}».`, notFound: "Такого пункту в списку не знайшов." },
  fr: { defName: "Courses", added: (w, l) => `🛒 Ajouté à « ${l} » : ${w}.`, head: (l) => `🛒 ${l} :`, empty: (l) => `La liste « ${l} » est vide.`, checked: (i) => `Rayé : ${i} ✅`, cleared: (l) => `Liste « ${l} » vidée.`, notFound: "Je n'ai pas trouvé cet élément dans la liste." },
  es: { defName: "Compras", added: (w, l) => `🛒 Añadido a «${l}»: ${w}.`, head: (l) => `🛒 ${l}:`, empty: (l) => `La lista «${l}» está vacía.`, checked: (i) => `Tachado: ${i} ✅`, cleared: (l) => `Lista «${l}» vaciada.`, notFound: "No encontré ese punto en la lista." },
};

// Ключ списка: покупки — общий 'shopping' на всех языках, остальные — по имени.
const SHOPPING_WORDS = ["покупк", "покупо", "продукт", "shopping", "groceries", "courses", "compras", "закуп"];
export function normListKey(raw: any): string {
  const v = String(raw || "").toLowerCase().replace(/ё/g, "е").trim();
  if (!v) return "shopping";
  if (SHOPPING_WORDS.some((w) => v.includes(w))) return "shopping";
  return v.slice(0, 60);
}
const listTitle = (key: string, lang: Lang) =>
  key === "shopping" ? (LIST_MSG[lang] || LIST_MSG.ru).defName : key.charAt(0).toUpperCase() + key.slice(1);

// Текст + кнопки «✓ N» для списка — используется и действиями, и колбэком вычёркивания.
export async function renderListMessage(userId: string, listKey: string, lang: Lang): Promise<{ text: string; markup: any | null }> {
  const L = LIST_MSG[lang] || LIST_MSG.ru;
  const db = supabaseAdmin();
  const { data } = await db.from("list_items").select("id, text, done").eq("user_id", userId).eq("list", listKey).order("created_at", { ascending: true }).limit(50);
  const rows = (data || []) as any[];
  const open = rows.filter((r) => !r.done);
  const doneRows = rows.filter((r) => r.done);
  if (!rows.length) return { text: L.empty(listTitle(listKey, lang)), markup: null };
  const lines = [L.head(listTitle(listKey, lang))];
  open.forEach((r, i) => lines.push(`${i + 1}. ${String(r.text).slice(0, 100)}`));
  doneRows.slice(-10).forEach((r) => lines.push(`✅ ${String(r.text).slice(0, 100)}`));
  const btns = open.slice(0, 10).map((r, i) => ({ text: `✓ ${i + 1}`, callback_data: `lstd:${r.id}` }));
  const kb: any[] = [];
  for (let i = 0; i < btns.length; i += 5) kb.push(btns.slice(i, i + 5));
  return { text: lines.join("\n"), markup: kb.length ? { inline_keyboard: kb } : null };
}

const RELAY_SELF: Record<Lang, string> = {
  ru: "Это же ты сам 🙂 Скажи, кому передать: «передай Коле, что…».",
  en: "That's you 🙂 Tell me who to send it to: “tell Nick that…”.",
  uk: "Це ж ти сам 🙂 Скажи, кому передати: «передай Колі, що…».",
  fr: "C'est toi 🙂 Dis-moi à qui l'envoyer : « dis à Nicolas que… ».",
  es: "Ese eres tú 🙂 Dime a quién enviarlo: «dile a Nico que…».",
};

// Подтверждение передачи сообщения другому пользователю.
const RELAY_OK: Record<Lang, (name: string, msg: string) => string> = {
  ru: (n, m) => `✅ Передал «${n}»:\n«${m}»`,
  en: (n, m) => `✅ Delivered to ${n}:\n“${m}”`,
  uk: (n, m) => `✅ Передав «${n}»:\n«${m}»`,
  fr: (n, m) => `✅ Transmis à ${n} :\n« ${m} »`,
  es: (n, m) => `✅ Entregado a ${n}:\n«${m}»`,
};

// html:true — текст УЖЕ в HTML для Telegram (например, подсказки relay с <code>);
// такой ответ нельзя прогонять через mdToTelegram, иначе теги экранируются и
// пользователь видит «<code>/send …</code>» буквально.
export type ActionResult = { text: string; openNext?: string; confirmDelete?: { entryId: string; preview: string }; markup?: any; file?: { name: string; text: string }; html?: boolean };

// Выполняет распознанное действие. Возвращает текст подтверждения (+ опц. куда открыть на сайте).
export async function runAction(userId: string, name: string, input: any, lang: Lang, tzOffset?: number | null): Promise<ActionResult> {
  const s = M[lang] || M.ru;
  const db = supabaseAdmin();
  try {
    if (name === "add_goal") {
      const title = String(input?.title || "").trim();
      if (!title) return { text: s.fail };
      await db.from("goals").insert({ user_id: userId, title, year: new Date().getFullYear(), progress: 0 });
      return { text: s.goal(title), openNext: "/goals" };
    }
    if (name === "add_task") {
      const t = String(input?.text || "").trim();
      if (!t) return { text: s.fail };
      await db.from("tasks").insert({ user_id: userId, text: t, done: false });
      return { text: s.task(t), openNext: "/goals?tab=tasks" };
    }
    if (name === "set_reminder") {
      const t = String(input?.text || "").trim();
      const date = String(input?.date || "").trim();
      if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { text: s.fail };
      const time = input?.time ? String(input.time).trim() : null;
      const allDay = !!input?.all_day || !time;
      // Повтор: стандартный (день/неделя/месяц/год) или почасовой с окном
      // («каждый час с 9 до 21») — он хранится строкой "hourly:<from>-<to>".
      const hourFrom = Math.min(23, Math.max(0, Math.round(Number(input?.from_hour ?? 9)) || 0));
      const hourTo = Math.min(23, Math.max(0, Math.round(Number(input?.to_hour ?? 21)) || 0));
      const recurrence: string | null = input?.recurrence === "hourly"
        ? `hourly:${Math.min(hourFrom, hourTo)}-${Math.max(hourFrom, hourTo)}`
        : (["daily", "weekly", "monthly", "yearly"] as Recurrence[]).includes(input?.recurrence) ? (input.recurrence as Recurrence) : null;
      const remindMin = typeof input?.remind_min === "number" ? input.remind_min : null;
      let dueISO = localToISO(date, allDay ? null : time, tzOffset);
      if (!dueISO) return { text: s.fail };

      // Почасовой: первое срабатывание — ближайший будущий час внутри окна
      // (иначе «каждый час с 9» в 16:20 сработало бы сразу, задним числом).
      const hFrom = Math.min(hourFrom, hourTo), hTo = Math.max(hourFrom, hourTo);
      let firstLocal: Date | null = null;
      if (input?.recurrence === "hourly") {
        const off = typeof tzOffset === "number" ? tzOffset : 0;
        const loc = new Date(Date.now() + off * 60000);
        loc.setUTCMinutes(0, 0, 0);
        loc.setUTCHours(loc.getUTCHours() + 1); // следующий круглый час
        const h = loc.getUTCHours();
        if (h > hTo) { loc.setUTCDate(loc.getUTCDate() + 1); loc.setUTCHours(hFrom, 0, 0, 0); }
        else if (h < hFrom) loc.setUTCHours(hFrom, 0, 0, 0);
        firstLocal = loc;
        dueISO = new Date(loc.getTime() - off * 60000).toISOString();
      }

      const res = await createReminder(userId, { text: t, dueISO, dateStr: date, allDay: input?.recurrence === "hourly" ? false : allDay, recurrence, remindMin });
      if (!res.ok) return { text: s.fail };
      const rm = REMIND_MSG[lang] || REMIND_MSG.ru;
      const [, mm, dd] = date.split("-");
      const when = firstLocal
        ? `${String(firstLocal.getUTCDate()).padStart(2, "0")}.${String(firstLocal.getUTCMonth() + 1).padStart(2, "0")} ${rm.at} ${String(firstLocal.getUTCHours()).padStart(2, "0")}:00`
        : allDay ? `${dd}.${mm} (${rm.allDayNote})` : `${dd}.${mm} ${rm.at} ${time}`;
      const suffix = recurrence
        ? (input?.recurrence === "hourly" ? rm.hourly(Math.min(hourFrom, hourTo), Math.max(hourFrom, hourTo)) : rm.rep[recurrence as Recurrence])
        : "";
      return { text: rm.label(t, when + suffix), openNext: "/reminders" };
    }
    if (name === "add_list_item") {
      const L = LIST_MSG[lang] || LIST_MSG.ru;
      const items = (Array.isArray(input?.items) ? input.items : [input?.items])
        .map((x: any) => String(x || "").trim().slice(0, 200)).filter(Boolean).slice(0, 20);
      if (!items.length) return { text: s.fail };
      const key = normListKey(input?.list);
      const { error } = await db.from("list_items").insert(items.map((t: string) => ({ user_id: userId, list: key, text: t })));
      if (error) return { text: s.fail }; // таблицы может не быть до миграции lists.sql
      const view = await renderListMessage(userId, key, lang);
      return { text: `${L.added(items.join(", "), listTitle(key, lang))}\n\n${view.text}`, markup: view.markup, openNext: "/notes" };
    }
    if (name === "show_list") {
      const key = normListKey(input?.list);
      const view = await renderListMessage(userId, key, lang).catch(() => null);
      if (!view) return { text: s.fail };
      return { text: view.text, markup: view.markup, openNext: "/notes" };
    }
    if (name === "check_list_item") {
      const L = LIST_MSG[lang] || LIST_MSG.ru;
      const q = String(input?.query || "").trim();
      if (!q) return { text: L.notFound };
      const key = normListKey(input?.list);
      const norm = (x: string) => x.toLowerCase().replace(/ё/g, "е");
      const stems = norm(q).split(/[^a-zа-я0-9]+/i).filter((w) => w.length >= 3).map((w) => w.slice(0, 4));
      const { data, error } = await db.from("list_items").select("id, text").eq("user_id", userId).eq("list", key).eq("done", false).limit(100);
      if (error) return { text: s.fail };
      const hit = ((data || []) as any[])
        .map((r) => ({ r, score: stems.filter((st) => norm(String(r.text)).includes(st)).length }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)[0];
      if (!hit) return { text: L.notFound };
      await db.from("list_items").update({ done: true }).eq("id", hit.r.id);
      const view = await renderListMessage(userId, key, lang);
      return { text: `${L.checked(String(hit.r.text).slice(0, 100))}\n\n${view.text}`, markup: view.markup };
    }
    if (name === "clear_list") {
      const L = LIST_MSG[lang] || LIST_MSG.ru;
      const key = normListKey(input?.list);
      const { error } = await db.from("list_items").delete().eq("user_id", userId).eq("list", key);
      if (error) return { text: s.fail };
      return { text: L.cleared(listTitle(key, lang)) };
    }
    if (name === "send_message") {
      const to = String(input?.to || "").trim();
      const body = String(input?.text || "").trim().slice(0, 2000);
      if (!to || !body) return { text: s.fail };
      const { data: me } = await db.from("users").select("name").eq("id", userId).maybeSingle();
      const myName = String((me as any)?.name || "").toLowerCase().replace(/ё/g, "е").trim();
      // Модель иногда подставляет в получатели самого пользователя («укажи, как меня
      // называть» → to: «Игорь») — молча ничего не отправляем.
      if (myName && to.toLowerCase().replace(/ё/g, "е").trim() === myName) return { text: (RELAY_SELF[lang] || RELAY_SELF.ru) };
      const r = await sendRelay({ id: userId, name: (me as any)?.name || null }, to, body, lang);
      // Не доставили (нет такого контакта / отключил приём) — показываем причину как есть.
      const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return { text: r.ok ? (RELAY_OK[lang] || RELAY_OK.ru)(esc(r.toName || to), esc(body)) : (r.error || s.fail), html: true };
    }
    if (name === "export_notes") {
      const N = NOTE_MSG[lang] || NOTE_MSG.ru;
      const { data, error } = await db.from("notes").select("text, pinned")
        .eq("user_id", userId).order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(500);
      if (error) return { text: s.fail };
      if (!data?.length) return { text: N.ovEmpty };
      const date = new Date().toISOString().slice(0, 10);
      return { text: N.exported(data.length), file: { name: `lifeos-notes-${date}.md`, text: notesToText(data as any[], date) } };
    }
    if (name === "save_note") {
      const t = String(input?.text || "").trim().slice(0, 2000);
      const N = NOTE_MSG[lang] || NOTE_MSG.ru;
      if (!t) return { text: s.fail };
      const { error } = await db.from("notes").insert({ user_id: userId, text: t });
      if (error) return { text: s.fail }; // таблицы может не быть до миграции notes.sql
      return { text: N.saved(t.slice(0, 150)), openNext: "/notes" };
    }
    if (name === "find_note") {
      const q = String(input?.query || "").trim();
      const N = NOTE_MSG[lang] || NOTE_MSG.ru;
      if (!q) {
        // Обзор: «что у меня по заметкам?» — закреплённые и свежие + сколько всего.
        const { data: rows, error, count } = await db.from("notes")
          .select("text, pinned", { count: "exact" })
          .eq("user_id", userId)
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(8);
        if (error) return { text: s.fail };
        if (!rows?.length) return { text: N.ovEmpty };
        const lines = (rows as any[]).map((r) => `• ${r.pinned ? "📌 " : ""}${String(r.text).slice(0, 120)}`);
        const total = count ?? rows.length;
        const tail = total > rows.length ? `\n…\n${N.ovMore}` : `\n\n${N.ovMore}`;
        return { text: `${N.ovHead(total)}\n${lines.join("\n")}${tail}`, openNext: "/notes" };
      }
      const norm = (x: string) => x.toLowerCase().replace(/ё/g, "е");
      const stems = norm(q).split(/[^a-zа-я0-9]+/i).filter((w) => w.length >= 3).map((w) => w.slice(0, 4));
      const { data: rows, error } = await db.from("notes").select("text, created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(300);
      if (error) return { text: N.none };
      const hits = ((rows || []) as any[])
        .map((r) => ({ r, score: stems.filter((st) => norm(String(r.text)).includes(st)).length }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      if (!hits.length) return { text: N.none };
      return { text: `${N.head}\n${hits.map((x) => `• ${String(x.r.text).slice(0, 300)}`).join("\n")}`, openNext: "/notes" };
    }
    if (name === "list_reminders") {
      const period = ["today", "tomorrow", "week", "all"].includes(input?.period) ? input.period : "today";
      const A = AGENDA_MSG[lang] || AGENDA_MSG.ru;
      const off = typeof tzOffset === "number" ? tzOffset : 0;
      // Границы периода в UTC, считая от МЕСТНЫХ суток пользователя.
      const dayStartUTC = (shiftDays: number) => {
        const d = new Date(Date.now() + off * 60000);
        d.setUTCHours(0, 0, 0, 0);
        return d.getTime() + shiftDays * 86400000 - off * 60000;
      };
      const now = Date.now();
      const from = period === "tomorrow" ? dayStartUTC(1) : now;
      const to = period === "today" ? dayStartUTC(1) : period === "tomorrow" ? dayStartUTC(2) : period === "week" ? now + 7 * 86400000 : now + 370 * 86400000;

      const { data: rems } = await db.from("reminders").select("text, due_at, all_day, recurrence")
        .eq("user_id", userId).eq("done", false)
        .gte("due_at", new Date(from - 86400000).toISOString()) // весь-день хранится местной полночью
        .lt("due_at", new Date(to).toISOString())
        .order("due_at", { ascending: true }).limit(20);
      const localFmt = (iso: string, allDay: boolean) => {
        const l = new Date(Date.parse(iso) + off * 60000).toISOString();
        const dd = `${l.slice(8, 10)}.${l.slice(5, 7)}`;
        return allDay ? `${dd} (${A.allDay})` : `${dd} ${l.slice(11, 16)}`;
      };
      const lines: string[] = [];
      for (const r of (rems || []) as any[]) {
        const fireMs = r.all_day ? Date.parse(r.due_at) + 86400000 : Date.parse(r.due_at); // весь-день актуален весь свой день
        if (fireMs < from || Date.parse(r.due_at) >= to) continue;
        lines.push(`• ${localFmt(r.due_at, !!r.all_day)} — ${String(r.text).slice(0, 120)}`);
      }
      // Задачи с датой в периоде (местные календарные дни).
      const dayKey = (ms: number) => new Date(ms + off * 60000).toISOString().slice(0, 10);
      try {
        const { data: tsk } = await db.from("tasks").select("text, due_date").eq("user_id", userId).eq("done", false)
          .gte("due_date", dayKey(from)).lte("due_date", dayKey(to - 1)).order("due_date", { ascending: true }).limit(10);
        for (const t of (tsk || []) as any[]) {
          const [, m2, d2] = String(t.due_date).split("-");
          lines.push(`• ${d2}.${m2} — ${String(t.text).slice(0, 120)} (${A.taskTag})`);
        }
      } catch { /* колонки due_date может не быть */ }
      if (!lines.length) return { text: A.empty[period] };
      return { text: `${A.head[period]}\n${lines.join("\n")}`, openNext: "/reminders" };
    }
    if (name === "cancel_reminder") {
      const q = String(input?.query || "").trim();
      const A = AGENDA_MSG[lang] || AGENDA_MSG.ru;
      if (!q) return { text: A.cancelNone };
      const norm = (x: string) => x.toLowerCase().replace(/ё/g, "е");
      const stems = norm(q).split(/[^a-zа-я0-9]+/i).filter((w) => w.length >= 3).map((w) => w.slice(0, 4));
      const { data: rems } = await db.from("reminders").select("id, text, due_at")
        .eq("user_id", userId).eq("done", false)
        .gte("due_at", new Date(Date.now() - 86400000).toISOString())
        .order("due_at", { ascending: true }).limit(100);
      const scored = ((rems || []) as any[])
        .map((r) => ({ r, score: stems.filter((st) => norm(String(r.text)).includes(st)).length }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      if (!scored.length) return { text: A.cancelNone };
      const top = scored.filter((x) => x.score === scored[0].score);
      // «Все удаляй» после уточнения — сносим все подходящие разом.
      if (input?.all === true) {
        const ids = scored.map((x) => x.r.id);
        for (const id of ids) await deleteReminder(userId, id);
        return { text: A.canceledMany(ids.length), openNext: "/reminders" };
      }
      if (top.length > 1) {
        return { text: `${A.cancelMany}\n${top.slice(0, 3).map((x) => `• ${String(x.r.text).slice(0, 100)}`).join("\n")}` };
      }
      const ok = await deleteReminder(userId, scored[0].r.id);
      return ok ? { text: A.canceled(String(scored[0].r.text).slice(0, 150)), openNext: "/reminders" } : { text: s.fail };
    }
    if (name === "move_reminder") {
      // Перенос уже созданного напоминания. Пустой query = «то, что мы только что
      // поставили»: человек говорит «измени дату», не повторяя, о чём речь.
      const A = AGENDA_MSG[lang] || AGENDA_MSG.ru;
      const q = String(input?.query || "").trim();
      const { data: rems } = await db.from("reminders").select("id, text, due_at, all_day")
        .eq("user_id", userId).eq("done", false)
        .order("created_at", { ascending: false }).limit(100);
      const list = ((rems || []) as any[]);
      if (!list.length) return { text: A.cancelNone };

      let target = list[0]; // последнее созданное
      if (q) {
        const norm = (x: string) => x.toLowerCase().replace(/\u0451/g, "\u0435");
        const stems = norm(q).split(/[^a-z\u0430-\u044f0-9]+/i).filter((w) => w.length >= 3).map((w) => w.slice(0, 4));
        const scored = list
          .map((r) => ({ r, score: stems.filter((st) => norm(String(r.text)).includes(st)).length }))
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score);
        if (!scored.length) return { text: A.cancelNone };
        const top = scored.filter((x) => x.score === scored[0].score);
        if (top.length > 1) {
          return { text: `${A.cancelMany}\n${top.slice(0, 3).map((x) => `\u2022 ${String(x.r.text).slice(0, 100)}`).join("\n")}` };
        }
        target = scored[0].r;
      }

      // Что не назвали — берём из текущего значения: «перенеси на 11» меняет
      // только час, дата остаётся прежней, и наоборот.
      const off = typeof tzOffset === "number" ? tzOffset : 0;
      const cur = new Date(Date.parse(target.due_at) + off * 60000);
      const pad = (n: number) => String(n).padStart(2, "0");
      const curDate = `${cur.getUTCFullYear()}-${pad(cur.getUTCMonth() + 1)}-${pad(cur.getUTCDate())}`;
      const curTime = `${pad(cur.getUTCHours())}:${pad(cur.getUTCMinutes())}`;
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input?.date || "")) ? String(input.date) : curDate;
      const time = /^\d{1,2}:\d{2}$/.test(String(input?.time || "")) ? String(input.time) : curTime;
      const iso = localToISO(date, time, off);
      if (!iso) return { text: s.fail };

      // notified_at сбрасываем: перенесённое напоминание должно прийти заново.
      const { error } = await db.from("reminders").update({ due_at: iso, notified_at: null }).eq("id", target.id).eq("user_id", userId);
      if (error) return { text: s.fail };
      return { text: A.moved(String(target.text).slice(0, 150), `${date.slice(8, 10)}.${date.slice(5, 7)}`, time), openNext: "/reminders" };
    }
    if (name === "complete_task") {
      const q = String(input?.query || "").trim();
      if (!q) return { text: s.taskNone };
      const { data } = await db.from("tasks").select("id, text").eq("user_id", userId).eq("done", false).ilike("text", `%${q}%`).order("created_at", { ascending: false }).limit(1);
      const row = (data || [])[0] as any;
      if (!row) return { text: s.taskNone };
      await db.from("tasks").update({ done: true }).eq("id", row.id).eq("user_id", userId);
      return { text: s.taskDone(row.text), openNext: "/goals?tab=tasks" };
    }
    if (name === "log_weight") {
      const kg = Number(input?.kg);
      if (!isFinite(kg) || kg < 20 || kg > 400) return { text: s.fail };
      const day = localDay(tzOffset);
      await db.from("weight_log").upsert({ user_id: userId, day, kg }, { onConflict: "user_id,day" });
      return { text: s.weight(kg), openNext: "/health" };
    }
    if (name === "add_dream") {
      const t = String(input?.text || "").trim();
      if (!t) return { text: s.fail };
      const sphere = (DREAM_SPHERES as readonly string[]).includes(input?.sphere) ? input.sphere : "other";
      await db.from("dreams").insert({ user_id: userId, text: t, sphere, status: "dream" });
      return { text: s.dream(t), openNext: "/goals?tab=dreams" };
    }
    if (name === "complete_dream") {
      const q = String(input?.query || "").trim();
      if (!q) return { text: s.dreamNone };
      const { data } = await db.from("dreams").select("id, text").eq("user_id", userId).neq("status", "done").ilike("text", `%${q}%`).order("created_at", { ascending: false }).limit(1);
      const row = (data || [])[0] as any;
      if (!row) return { text: s.dreamNone };
      await db.from("dreams").update({ status: "done" }).eq("id", row.id).eq("user_id", userId);
      return { text: s.dreamDone(row.text), openNext: "/goals?tab=dreams" };
    }
    if (name === "add_deed") {
      const t = String(input?.text || "").trim();
      if (!t) return { text: s.fail };
      const person = input?.person ? String(input.person).trim() : null;
      await db.from("good_deeds").insert({ user_id: userId, text: t, kind: "other", person });
      return { text: s.deed(t), openNext: "/trace" };
    }
    if (name === "add_media") {
      const title = String(input?.title || "").trim();
      const kind = (["film", "series", "book"] as const).includes(input?.kind) ? input.kind : "film";
      if (!title) return { text: s.fail };
      // doing/done -> внутренние статусы медиатеки reading/read; иначе want.
      const status = input?.status === "done" ? "read" : input?.status === "doing" ? "reading" : "want";
      const book = await addMediaByTitle(userId, title, kind, status, lang);
      if (!book) return { text: s.fail };
      // Подтверждаем тем, что реально сохранилось: TMDb мог уточнить тип
      // (фильм → сериал) и каноничное название.
      const finalKind = (book as any).kind || kind;
      const finalTitle = (book as any).title || title;
      const kindLabel = s.mvKind[finalKind] || s.mvKind.film;
      const statusLabel = (finalKind === "book" ? s.mvStatusRead : s.mvStatusWatch)[status];
      return { text: s.media(kindLabel, finalTitle, statusLabel), openNext: "/books" };
    }
    if (name === "rename_person") {
      const from = String(input?.from || "").trim();
      const to = String(input?.to || "").trim();
      // Раньше здесь было глухое «не получилось выполнить» — и человек, повторяя
      // просьбу другими словами, четыре раза подряд получал одну и ту же стену.
      // Ничего не сломалось: просто не видно, какое имя на какое менять.
      if (!from || !to || normName(from) === normName(to)) return { text: (s as any).renameUnclear || s.fail };

      // 1) Человек в базе людей: переименовать (или слить со уже существующим правильным).
      let renamed = false;
      try {
        const { data: ppl } = await db.from("people").select("id,name").eq("user_id", userId);
        const nf = normName(from), nt = normName(to);
        const oldP = (ppl || []).find((p: any) => normName(p.name) === nf);
        const newP = (ppl || []).find((p: any) => normName(p.name) === nt);
        if (oldP && newP && oldP.id !== newP.id) {
          // Слияние: перевешиваем связи записей на правильного человека, дубль удаляем.
          const { data: oldLinks } = await db.from("entry_people").select("entry_id").eq("person_id", oldP.id);
          const { data: newLinks } = await db.from("entry_people").select("entry_id").eq("person_id", newP.id);
          const have = new Set((newLinks || []).map((l: any) => l.entry_id));
          const moves = (oldLinks || []).filter((l: any) => !have.has(l.entry_id));
          if (moves.length) await db.from("entry_people").insert(moves.map((l: any) => ({ entry_id: l.entry_id, person_id: newP.id })));
          await db.from("entry_people").delete().eq("person_id", oldP.id);
          await db.from("people").delete().eq("id", oldP.id);
          renamed = true;
        } else if (oldP) {
          await db.from("people").update({ name: to }).eq("id", oldP.id);
          renamed = true;
        }
      } catch (e) { console.error("rename_person people", e); }

      // 2) Инсайты: правим имя в тексте (с учётом падежных окончаний — «Стельку» → «Эстельку»).
      let fixed = 0;
      try {
        const lf = from.slice(-1).toLowerCase();
        const core = "ая".includes(lf) && lf === to.slice(-1).toLowerCase() ? from.slice(0, -1) : from;
        const { data: ins } = await db.from("insights").select("id,text").eq("user_id", userId).ilike("text", `%${core}%`);
        for (const i of (ins || []) as any[]) {
          const t2 = renameInText(i.text || "", from, to);
          if (t2 !== i.text) { await db.from("insights").update({ text: t2 }).eq("id", i.id); fixed++; }
        }
      } catch (e) { console.error("rename_person insights", e); }

      // 3) «Мой след»: поле «кому помог».
      try { await db.from("good_deeds").update({ person: to }).eq("user_id", userId).ilike("person", from); } catch {}

      // Имя показываем с заглавной: модель нередко отдаёт его в нижнем регистре,
      // и «не нашёл „естелика"» выглядит неряшливо там, где речь о живом человеке.
      if (!renamed && !fixed) return { text: s.renameNone(from.charAt(0).toUpperCase() + from.slice(1)) };
      return { text: s.rename(from, to), openNext: "/people" };
    }
    if (name === "ask_knowledge") {
      const q = String(input?.query || "").trim();
      if (!q) return { text: s.fail };
      const ans = await askKnowledge(userId, q, lang);
      return { text: ans, openNext: "/knowledge" };
    }
    if (name === "set_birthday") {
      const iso = birthdayISO(Number(input?.day), Number(input?.month), input?.year ? Number(input.year) : null);
      if (!iso) return { text: s.fail };
      const { error } = await db.from("users").update({ birthday: iso }).eq("id", userId);
      if (error) { console.error("set_birthday (birthday.sql applied?)", error); return { text: s.fail }; }
      const [y, mo, d] = iso.split("-");
      const label = Number(y) > BDAY_UNKNOWN_YEAR ? `${d}.${mo}.${y}` : `${d}.${mo}`;
      return { text: s.bday(label) };
    }
    if (name === "account_info") {
      const { data } = await db.from("users").select("email, tg_username, created_at").eq("id", userId).maybeSingle();
      // Дата регистрации в формате dd.mm.yyyy — Коля спрашивал «когда я зарегистрировался»,
      // а бот отвечал только про почту.
      const created = (data as any)?.created_at ? String((data as any).created_at).slice(0, 10) : null;
      const since = created ? created.split("-").reverse().join(".") : null;
      return { text: s.account((data as any)?.email || null, (data as any)?.tg_username || null, since), openNext: "/profile" };
    }
    if (name === "set_style") {
      const wish = String(input?.wish || "").trim().slice(0, 200);
      if (!wish) return { text: s.fail };
      const { data } = await db.from("users").select("morning_prefs").eq("id", userId).maybeSingle();
      const prefs = normalizeMorningPrefs((data as any)?.morning_prefs);
      // Копим пожелания списком через «; », новые вытесняют самые старые (лимит поля 300).
      const appendWish = (cur: string): string => {
        const parts = cur ? cur.split("; ").filter(Boolean) : [];
        if (!parts.some((x) => x.toLowerCase() === wish.toLowerCase())) parts.push(wish);
        while (parts.join("; ").length > 300 && parts.length > 1) parts.shift();
        return parts.join("; ").slice(0, 300);
      };
      prefs.customStyle = appendWish(prefs.customStyle); // утренние сообщения
      prefs.chatStyle = appendWish(prefs.chatStyle);     // AI-друг в чате
      await db.from("users").update({ morning_prefs: prefs }).eq("id", userId);
      return { text: s.style(wish) };
    }
    if (name === "delete_last_entry") {
      // Не удаляем сразу — спрашиваем подтверждение (защита от случайной потери записи).
      const { data } = await db.from("entries").select("id, summary, raw_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(1);
      const row = (data || [])[0] as any;
      if (!row) return { text: s.delNone };
      const preview = String(row.summary || row.raw_text || "").slice(0, 80);
      return { text: s.delAsk(preview), confirmDelete: { entryId: row.id, preview } };
    }
  } catch (e) {
    // В журнал, а не только в консоль: «не получилось выполнить» — это то, что
    // видит человек, и до сих пор причина такого ответа нигде не оседала.
    await logError(`bot:action:${name}`, e, { userId });
    return { text: s.fail };
  }
  return { text: s.fail };
}
