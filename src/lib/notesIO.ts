// Перенос заметок: выгрузка в текстовый файл и разбор вставленного/присланного
// текста обратно в заметки. Формат намеренно простой (обычный текст с пустой
// строкой между заметками) — открывается в Заметках iPhone, Obsidian, где угодно,
// и так же легко возвращается назад.

export type NoteRow = { text: string; pinned?: boolean; created_at?: string };

const HEAD_RX = /^#\s*LIFE OS/i;
const PIN_RX = /^📌\s*/;

// Заметки → текст файла (.md). Закреплённые помечаются 📌 и идут первыми.
export function notesToText(notes: NoteRow[], date: string): string {
  const head = `# LIFE OS — заметки (${date})\n`;
  const body = notes
    .map((n) => `${n.pinned ? "📌 " : ""}${String(n.text || "").trim()}`)
    .filter((t) => t.replace(PIN_RX, "").trim())
    .join("\n\n");
  return `${head}\n${body}\n`;
}

// Текст → список заметок.
//  blocks — заметки разделены пустой строкой (наш формат, многострочные целиком);
//  lines  — каждая строка отдельная заметка (список, скопированный откуда угодно).
export function parseNotesText(raw: string, mode: "blocks" | "lines" = "blocks"): string[] {
  const clean = String(raw || "").replace(/\r\n?/g, "\n").trim();
  if (!clean) return [];
  const chunks = mode === "lines" ? clean.split("\n") : clean.split(/\n\s*\n+/);
  return chunks
    .map((c) => c.trim())
    .filter((c) => c && !HEAD_RX.test(c))
    .map((c) =>
      c
        .replace(PIN_RX, "")
        .replace(/^[-*•]\s+/, "")   // маркеры списков из других приложений
        .replace(/^\d+[.)]\s+/, "") // нумерация
        .trim()
    )
    .filter(Boolean)
    .map((c) => c.slice(0, 2000))
    .slice(0, 500);
}
