import JSZip from "jszip";

// Достать читаемый текст из офисного файла — без новых зависимостей.
//
// docx и xlsx устроены одинаково: это zip-архивы с XML внутри. jszip в проекте
// уже есть (на нём собирается выгрузка дневника в Obsidian), поэтому тянуть
// тяжёлые парсеры ради двух форматов незачем — они дают лишний вес сборке и
// лишний способ сломаться.
//
// Задача скромная и намеренно такая: вытащить ТЕКСТ, чтобы файл стал искомым.
// Ни вёрстка, ни формулы, ни картинки нам не нужны — человек ищет смысл.

export type DocKind = "docx" | "xlsx" | "text" | "csv" | null;

export function kindOf(mime: string, fileName?: string): DocKind {
  const m = (mime || "").toLowerCase();
  const n = (fileName || "").toLowerCase();
  if (m.includes("wordprocessingml") || n.endsWith(".docx")) return "docx";
  if (m.includes("spreadsheetml") || n.endsWith(".xlsx")) return "xlsx";
  if (n.endsWith(".csv") || m === "text/csv") return "csv";
  if (m.startsWith("text/") || n.endsWith(".txt") || n.endsWith(".md")) return "text";
  return null;
}

// XML → текст: выкидываем теги, но сохраняем границы абзацев и ячеек, иначе
// слова слипаются в одну строку и поиск по ним промахивается.
function xmlToText(xml: string, breakTags: string[]): string {
  let out = xml;
  for (const t of breakTags) out = out.replace(new RegExp(`</${t}>`, "g"), "\n");
  return out
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fromDocx(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  const parts: string[] = [];
  // Основной текст плюс колонтитулы: в них нередко живут реквизиты и номера.
  for (const name of ["word/document.xml", "word/header1.xml", "word/footer1.xml"]) {
    const f = zip.file(name);
    if (f) parts.push(xmlToText(await f.async("string"), ["w:p", "w:tr"]));
  }
  return parts.filter(Boolean).join("\n\n");
}

async function fromXlsx(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  // Тексты ячеек лежат отдельно от листов — в общей таблице строк.
  let shared: string[] = [];
  const sharedFile = zip.file("xl/sharedStrings.xml");
  if (sharedFile) {
    const xml = await sharedFile.async("string");
    shared = [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => xmlToText(m[1], []));
  }
  const sheets = Object.keys(zip.files).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort();
  const lines: string[] = [];
  for (const name of sheets.slice(0, 5)) {
    const xml = await zip.file(name)!.async("string");
    for (const row of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells: string[] = [];
      for (const c of row[1].matchAll(/<c[^>]*?(?:\st="(\w+)")?[^>]*>([\s\S]*?)<\/c>/g)) {
        const isShared = c[1] === "s";
        const v = (c[2].match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        if (v === undefined) continue;
        cells.push(isShared ? (shared[Number(v)] ?? "") : v);
      }
      const line = cells.filter((x) => String(x).trim()).join(" · ");
      if (line) lines.push(line);
      if (lines.length >= 500) break; // таблицы бывают огромные — берём начало
    }
  }
  return lines.join("\n");
}

// Возвращает извлечённый текст или null, если формат не наш.
export async function extractText(buf: Buffer, mime: string, fileName?: string): Promise<{ kind: DocKind; text: string } | null> {
  const kind = kindOf(mime, fileName);
  if (!kind) return null;
  try {
    if (kind === "docx") return { kind, text: await fromDocx(buf) };
    if (kind === "xlsx") return { kind, text: await fromXlsx(buf) };
    return { kind, text: buf.toString("utf8") };
  } catch {
    return null;
  }
}
