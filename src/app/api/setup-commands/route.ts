import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const COMMANDS_RU = [
  { command: "start", description: "Начать и получить ссылку на дневник" },
  { command: "chat", description: "Поговорить с AI-другом (режим беседы)" },
  { command: "ask", description: "Спросить ассистента о своей жизни" },
  { command: "money", description: "Финансовый разбор и советы" },
  { command: "spend", description: "Записать расход: /spend 250 eur сёрф" },
  { command: "income", description: "Записать доход: /income 1000 зарплата" },
  { command: "save", description: "Сохранить запись принудительно" },
  { command: "link", description: "Ссылка на веб-дневник" },
  { command: "invite", description: "Пригласить друга" },
  { command: "demo", description: "Показать приветствие заново" },
];

const COMMANDS_EN = [
  { command: "start", description: "Start and get your diary link" },
  { command: "chat", description: "Talk to your AI friend (chat mode)" },
  { command: "ask", description: "Ask the assistant about your life" },
  { command: "money", description: "Financial review and tips" },
  { command: "spend", description: "Log an expense: /spend 250 eur surf" },
  { command: "income", description: "Log income: /income 1000 salary" },
  { command: "save", description: "Force-save an entry" },
  { command: "link", description: "Web diary link" },
  { command: "invite", description: "Invite a friend" },
  { command: "demo", description: "Replay the welcome" },
];

async function call(token: string, method: string, body: any) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: false, error: "no token" });
  const r1 = await call(token, "setMyCommands", { commands: COMMANDS_RU });
  const r2 = await call(token, "setMyCommands", { commands: COMMANDS_EN, language_code: "en" });
  const r3 = await call(token, "setChatMenuButton", { menu_button: { type: "commands" } });
  return NextResponse.json({ ok: true, results: { ru: r1?.ok, en: r2?.ok, menu: r3?.ok } });
}
