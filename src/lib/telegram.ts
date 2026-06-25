const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API = `https://api.telegram.org/bot${TOKEN}`;

// Получить прямую ссылку на файл (голосовое) по его file_id.
export async function getFileUrl(fileId: string): Promise<string> {
  const r = await fetch(`${API}/getFile?file_id=${fileId}`).then((x) => x.json());
  return `https://api.telegram.org/file/bot${TOKEN}/${r.result.file_path}`;
}

// Показать индикатор «печатает…».
export async function sendChatAction(chatId: number, action = "typing"): Promise<void> {
  await fetch(`${API}/sendChatAction`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action }),
  });
}

// Отправить сообщение пользователю.
export async function sendMessage(chatId: number, text: string): Promise<void> {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
}
