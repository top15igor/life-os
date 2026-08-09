import Anthropic from "@anthropic-ai/sdk";
import { rulesHint } from "./sortShelf";
import { logClaude } from "./usage";
import { deriveFolder } from "./memoryFolders";

export const MEM_CATEGORIES = ["document", "moment", "thing", "person", "place", "project", "info", "other"];

export type VisionResult = {
  category: string;
  title: string;
  summary: string;
  fields: { label: string; value: string }[];
  folder?: string | null;
  date?: string | null;
  confidence?: "low" | "medium" | "high";
};

const TOOL: Anthropic.Tool = {
  name: "describe_image",
  description: "Описать СМЫСЛ изображения и извлечь полезные данные для «Визуальной памяти».",
  input_schema: {
    type: "object",
    properties: {
      category: { type: "string", enum: MEM_CATEGORIES, description: "document=чек/квитанция/договор/гарантия/билет/мед/документ; moment=знаковый момент жизни; thing=вещь/техника/авто; person=люди; place=место; project=этап работы; info=полезная инфа (где машина, серийник, счётчик, визитка); other." },
      title: { type: "string", description: "Короткое человеческое название, напр. «Квитанция за замену аккумулятора»." },
      summary: { type: "string", description: "1 фраза по-человечески, без технического OCR." },
      fields: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } }, required: ["label", "value"] }, description: "Важные извлечённые данные парами (дата, сумма, организация, предмет, гарантия, номер, модель, серийный, пробег, адрес) — ТОЛЬКО что реально видно." },
      folder: { type: "string", description: "Короткое имя стопки-папки для похожих вещей ВНУТРИ категории, во множественном числе, в языке документа: «Паспорта», «Чеки», «Свидетельства о рождении», «Гарантии», «Билеты», «Медицина». Одинаковые по типу вещи ДОЛЖНЫ получать ОДНО и то же имя папки. Для уникальных моментов/фото, которым папка не нужна — не заполняй." },
      date: { type: "string", description: "YYYY-MM-DD, если на документе видна дата." },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
    },
    required: ["category", "title", "summary"],
  },
};

// Разбор ТЕКСТОВОГО файла (docx, xlsx, txt, csv). Claude читает напрямую только
// PDF и картинки, а офисные файлы — это zip с XML внутри: текст из них достаёт
// docText, а осмысляет уже эта функция. Без неё договор в .docx попадал бы в
// хранилище безымянным «Документом».
export async function analyzeText(text: string, fileName: string | undefined, userId?: string): Promise<VisionResult> {
  const hint = userId ? await rulesHint(userId) : "";
  const body = (text || "").trim().slice(0, 24000);
  const prompt = `Ты — «Визуальная память» дневника LIFE OS. Ниже ТЕКСТ файла${fileName ? ` «${fileName}»` : ""}. Опиши его СМЫСЛ по-человечески и извлеки важные данные. Заполни describe_image: category (для договоров/свидетельств/чеков/справок — document), человеческий title, короткий summary одной фразой, важные fields (реальные данные — даты, номера, стороны, суммы, адреса — не выдумывай), date если есть, confidence.${hint}\n\nТЕКСТ:\n${body}`;
  const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "describe_image" },
    messages: [{ role: "user", content: prompt }],
  });
  logClaude(userId, "vision_text", "sonnet", (m as any).usage);
  const block = m.content.find((b) => b.type === "tool_use");
  const d = (block && block.type === "tool_use" ? block.input : {}) as any;
  return {
    category: MEM_CATEGORIES.includes(d.category) ? d.category : "document",
    title: d.title || fileName || "Документ",
    summary: d.summary || "",
    fields: Array.isArray(d.fields) ? d.fields.filter((f: any) => f?.label && f?.value).slice(0, 12) : [],
    folder: (typeof d.folder === "string" && d.folder.trim()) ? d.folder.trim().slice(0, 60) : deriveFolder("document", d.title, d.fields),
    date: d.date || null,
    confidence: d.confidence,
  };
}

// Разбор загруженного ДОКУМЕНТА (PDF). Claude читает PDF напрямую — отдельный парсер не нужен.
export async function analyzeDocument(base64: string, userId?: string): Promise<VisionResult> {
  const hint = userId ? await rulesHint(userId) : "";
  const prompt = `Ты — «Визуальная память» дневника LIFE OS. Перед тобой документ (PDF). Опиши его СМЫСЛ по-человечески и извлеки важные данные. Заполни describe_image: category (для договоров/свидетельств/чеков/справок — document), человеческий title, короткий summary одной фразой, важные fields (реальные данные — даты, номера, стороны, суммы, адреса — не выдумывай), date если есть, confidence. ВАЖНО: если это удостоверение личности, паспорт, виза, права, гарантия или страховка и виден СРОК ДЕЙСТВИЯ (на укр. «Дата закінчення строку дії», Date of expiry, «действителен до», «valid until») — ОБЯЗАТЕЛЬНО добавь отдельное поле с label «Действителен до» и value датой в формате ГГГГ-ММ-ДД (сконвертируй из любого вида, напр. «24 ЖОВ/OCT 27» → 2027-10-24). Не путай с датой выдачи.${hint}`;
  const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "describe_image" },
    messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }, { type: "text", text: prompt }] as any }],
  });
  logClaude(userId, "vision_doc", "sonnet", (m as any).usage);
  const block = m.content.find((b) => b.type === "tool_use");
  const d = (block && block.type === "tool_use" ? block.input : {}) as any;
  return {
    category: MEM_CATEGORIES.includes(d.category) ? d.category : "document",
    title: d.title || "Документ",
    summary: d.summary || "",
    fields: Array.isArray(d.fields) ? d.fields.filter((f: any) => f?.label && f?.value).slice(0, 12) : [],
    folder: (typeof d.folder === "string" && d.folder.trim()) ? d.folder.trim().slice(0, 60) : deriveFolder("document", d.title, d.fields),
    date: d.date || null,
    confidence: d.confidence,
  };
}

export async function analyzeImage(base64: string, mediaType: string, userId?: string): Promise<VisionResult> {
  const mt = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mediaType) ? mediaType : "image/jpeg";
  // Правила человека: чему он уже поправлял разбор. Без этого одна и та же
  // ошибка повторяется бесконечно, и разбор выглядит глухим.
  const hint = userId ? await rulesHint(userId) : "";
  const prompt = `Ты — «Визуальная память» дневника LIFE OS. Посмотри на изображение и опиши его СМЫСЛ для человека (НЕ технический OCR, не сырой текст). Заполни describe_image: category, человеческий title, короткий summary, важные fields (только реально видимые данные — не выдумывай), date если видна, confidence по чёткости. Если фото нечёткое или непонятное — confidence: low. ВАЖНО: если это удостоверение личности, паспорт, виза, права, гарантия или страховка и виден СРОК ДЕЙСТВИЯ (на укр. «Дата закінчення строку дії», Date of expiry, «действителен до», «valid until») — ОБЯЗАТЕЛЬНО добавь отдельное поле с label «Действителен до» и value датой в формате ГГГГ-ММ-ДД (сконвертируй из любого вида, напр. «24 ЖОВ/OCT 27» → 2027-10-24). Не путай с датой выдачи.${hint}`;
  const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "describe_image" },
    messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mt as any, data: base64 } }, { type: "text", text: prompt }] }],
  });
  logClaude(userId, "vision", "sonnet", (m as any).usage);
  const block = m.content.find((b) => b.type === "tool_use");
  const d = (block && block.type === "tool_use" ? block.input : {}) as any;
  return {
    category: MEM_CATEGORIES.includes(d.category) ? d.category : "other",
    title: d.title || "Фото",
    summary: d.summary || "",
    fields: Array.isArray(d.fields) ? d.fields.filter((f: any) => f?.label && f?.value).slice(0, 12) : [],
    folder: (typeof d.folder === "string" && d.folder.trim()) ? d.folder.trim().slice(0, 60) : deriveFolder(MEM_CATEGORIES.includes(d.category) ? d.category : "other", d.title, d.fields),
    date: d.date || null,
    confidence: d.confidence,
  };
}
