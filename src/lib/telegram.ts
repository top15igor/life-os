const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API = `https://api.telegram.org/bot${TOKEN}`;

// Получить прямую ссылку на файл (голосовое) по его file_id.
export async function getFileUrl(fileId: string): Promise<string> {
  const r = await fetch(`${API}/getFile?file_id=${fileId}`).then((x) => x.json());
  return `https://api.telegram.org/file/bot${TOKEN}/${r.result.file_path}`;
}

// Отправить голосовое сообщение (OGG/Opus буфер) — «Джарвис отвечает голосом».
export async function sendVoice(chatId: number, buf: Buffer, extra?: Record<string, any>): Promise<void> {
  try {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    form.append("voice", new Blob([new Uint8Array(buf)], { type: "audio/ogg" }), "voice.ogg");
    if (extra) for (const [k, v] of Object.entries(extra)) form.append(k, typeof v === "string" ? v : JSON.stringify(v));
    await fetch(`${API}/sendVoice`, { method: "POST", body: form as any });
  } catch (e) {
    console.error("sendVoice", e);
  }
}

// Отправить файл-документ (например, .zip с Obsidian-выгрузкой дневника).
export async function sendDocument(
  chatId: number,
  file: Uint8Array | Buffer,
  filename: string,
  extra?: Record<string, any>,
): Promise<boolean> {
  try {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    form.append(
      "document",
      new Blob([new Uint8Array(file)], { type: "application/zip" }),
      filename,
    );
    if (extra) for (const [k, v] of Object.entries(extra)) form.append(k, typeof v === "string" ? v : JSON.stringify(v));
    const r = await fetch(`${API}/sendDocument`, { method: "POST", body: form as any });
    return r.ok;
  } catch (e) {
    console.error("sendDocument", e);
    return false;
  }
}

// Ответить на нажатие inline-кнопки (убирает «часики» у кнопки, опц. всплывашка).
export async function answerCallback(callbackId: string, text?: string): Promise<void> {
  await fetch(`${API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, ...(text ? { text } : {}) }),
  }).catch(() => {});
}

// Показать индикатор «печатает…».
export async function sendChatAction(chatId: number, action = "typing"): Promise<void> {
  await fetch(`${API}/sendChatAction`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action }),
  });
}

// Преобразовать markdown из ответа AI в безопасный для Telegram HTML:
// убирает ## заголовки, таблицы | a | b |, цитаты >, превращает **жирный** в <b>.
// Применять ТОЛЬКО к свободному тексту модели (askLife/companion), а не к
// сообщениям, где мы сами уже расставляем HTML-теги.
// Убрать markdown-разметку для озвучки (TTS не должен читать «звёздочки» и «решётки»).
export function mdToPlain(s: string): string {
  if (!s) return s;
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function mdToTelegram(s: string): string {
  if (!s) return s;
  // Сначала экранируем спецсимволы HTML, чтобы стрелки/амперсанды не ломали разметку.
  let t = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Строки-разделители таблиц (|---|---|) — убрать.
  t = t.replace(/^\s*\|?[\s:|]*-{2,}[\s:|-]*\|?\s*$/gm, "");
  // Строки таблицы | a | b | → «a — b».
  t = t.replace(/^\s*\|(.+)\|\s*$/gm, (_m, row: string) => row.split("|").map((c) => c.trim()).filter(Boolean).join(" — "));
  // Заголовки ## Текст → жирная строка.
  t = t.replace(/^\s{0,3}#{1,6}\s*(.+?)\s*$/gm, "<b>$1</b>");
  // Цитаты «> » (после экранирования это «&gt; ») — убрать маркер.
  t = t.replace(/^\s*&gt;\s?/gm, "");
  // **жирный** / __жирный__ → <b>.
  t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/__(.+?)__/g, "<b>$1</b>");
  // Маркеры списков -, * в начале строки → •.
  t = t.replace(/^\s*[-*]\s+/gm, "• ");
  // Лишние пустые строки.
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

// Отправить сообщение пользователю (extra — доп. поля, напр. reply_markup с кнопками).
export async function sendMessage(chatId: number, text: string, extra?: Record<string, any>): Promise<void> {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, ...(extra || {}) }),
  });
}
