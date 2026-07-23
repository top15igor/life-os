// ============================================================
//  Единый список команд бота + синхронизация меню Telegram.
//  Используется и эндпоинтом /api/setup-commands, и вебхуком
//  (авто-синк при холодном старте), чтобы меню всегда совпадало с кодом.
// ============================================================

const COMMANDS_RU = [
  { command: "start", description: "Начать и получить ссылку на дневник" },
  { command: "chat", description: "Поговорить с AI-другом (режим беседы)" },
  { command: "ask", description: "Спросить ассистента о своей жизни" },
  { command: "memories", description: "📸 В этот день — воспоминания из прошлого" },
  { command: "capsule", description: "⏳ Капсула времени — письмо в будущее" },
  { command: "help", description: "Помощь — что умеет бот" },
  { command: "money", description: "Финансовый разбор и советы" },
  { command: "spend", description: "Записать расход: /spend 250 eur сёрф" },
  { command: "income", description: "Записать доход: /income 1000 зарплата" },
  { command: "save", description: "Сохранить запись принудительно" },
  { command: "link", description: "Ссылка на веб-дневник" },
  { command: "lang", description: "Сменить язык бота" },
  { command: "invite", description: "Пригласить друга" },
  { command: "demo", description: "Показать приветствие заново" },
];

const COMMANDS_EN = [
  { command: "start", description: "Start and get your diary link" },
  { command: "chat", description: "Talk to your AI friend (chat mode)" },
  { command: "ask", description: "Ask the assistant about your life" },
  { command: "memories", description: "📸 On this day — memories from the past" },
  { command: "capsule", description: "⏳ Time capsule — a letter to the future" },
  { command: "help", description: "Help — what the bot can do" },
  { command: "money", description: "Financial review and tips" },
  { command: "spend", description: "Log an expense: /spend 250 eur surf" },
  { command: "income", description: "Log income: /income 1000 salary" },
  { command: "save", description: "Force-save an entry" },
  { command: "link", description: "Web diary link" },
  { command: "lang", description: "Change the bot language" },
  { command: "invite", description: "Invite a friend" },
  { command: "demo", description: "Replay the welcome" },
];

const COMMANDS_UK = [
  { command: "start", description: "Почати й отримати посилання на щоденник" },
  { command: "chat", description: "Поговорити з AI-другом (режим бесіди)" },
  { command: "ask", description: "Запитати асистента про своє життя" },
  { command: "memories", description: "📸 У цей день — спогади з минулого" },
  { command: "capsule", description: "⏳ Капсула часу — лист у майбутнє" },
  { command: "help", description: "Допомога — що вміє бот" },
  { command: "money", description: "Фінансовий розбір і поради" },
  { command: "spend", description: "Записати витрату: /spend 250 eur сёрф" },
  { command: "income", description: "Записати дохід: /income 1000 зарплата" },
  { command: "save", description: "Зберегти запис примусово" },
  { command: "link", description: "Посилання на веб-щоденник" },
  { command: "lang", description: "Змінити мову бота" },
  { command: "invite", description: "Запросити друга" },
  { command: "demo", description: "Показати привітання знову" },
];

async function call(token: string, method: string, body: any) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json()).catch(() => null);
}

// Синхронизировать меню команд бота с актуальным списком. Безопасно вызывать часто.
export async function syncBotCommands(): Promise<{ ru?: boolean; en?: boolean; uk?: boolean; menu?: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return {};
  const [r1, r2, r3, r4] = await Promise.all([
    call(token, "setMyCommands", { commands: COMMANDS_RU }),
    call(token, "setMyCommands", { commands: COMMANDS_EN, language_code: "en" }),
    call(token, "setMyCommands", { commands: COMMANDS_UK, language_code: "uk" }),
    call(token, "setChatMenuButton", { menu_button: { type: "commands" } }),
  ]);
  return { ru: r1?.ok, en: r2?.ok, uk: r3?.ok, menu: r4?.ok };
}
