import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";

export type PublicVersion = { title: string; text: string; removed: string[] };
export type PublishStatus = { published: boolean; title: string; text: string; privacy: string } | null;
export type PublicPage = { id: string; title: string; text: string; privacy: string; created_at: string };

const TOOL: Anthropic.Tool = {
  name: "public_version",
  description: "Публичная версия дневниковой записи — безопасная и тёплая, без личного.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Короткий цепляющий заголовок (3–7 слов) на языке записи." },
      text: { type: "string", description: "Публичная версия ОТ ПЕРВОГО ЛИЦА: тёплая, понятная, полезная другим. Без канцелярита, на языке записи. 2–5 предложений." },
      removed: { type: "array", items: { type: "string" }, description: "Кратко (по-русски) что скрыл/обобщил ради приватности: напр. «фамилия друга», «номер телефона», «медицинские детали». Если ничего — пустой массив." },
    },
    required: ["title", "text", "removed"],
  },
};

// AI готовит публичную версию записи: переписывает личное→публичное и прячет чувствительное.
export async function preparePublicVersion(rawText: string, summary: string | null, userId?: string): Promise<PublicVersion> {
  const src = (rawText || summary || "").slice(0, 2000);
  const prompt = `Ты помогаешь человеку опубликовать его личную дневниковую запись в публичную «Книгу жизни» — место, где люди делятся ПУТЁМ и опытом (как соцсеть жизненных путей, не постов).

Перепиши запись в тёплую, понятную ПУБЛИЧНУЮ версию ОТ ПЕРВОГО ЛИЦА — так, чтобы она была интересна/полезна другим, вдохновляла, но без лишнего личного.

ОБЯЗАТЕЛЬНО убери или обобщи чувствительное: фамилии, телефоны, адреса, медицинские диагнозы/детали, имена детей, финансовые суммы, чужие имена без согласия, слишком интимные эмоции. Это вопрос приватности.

Пиши цельно и естественно. НЕ используй скобочные родовые формы вроде «решил(а)», «заметил(а)», «понял(а)» — выбери одну живую форму или переформулируй, чтобы звучало как живой человек, а не анкета.

Предложи короткий заголовок. Заполни инструмент public_version. На языке записи. Ничего не выдумывай сверх записи.

ЗАПИСЬ:
"""
${src}
"""`;
  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "public_version" },
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(userId, "publish", "sonnet", (m as any).usage);
    const block = m.content.find((b) => b.type === "tool_use");
    const d = (block && block.type === "tool_use" ? block.input : {}) as any;
    return { title: d.title || "", text: d.text || src, removed: Array.isArray(d.removed) ? d.removed.filter((x: any) => typeof x === "string") : [] };
  } catch (e) {
    console.error(e);
    return { title: "", text: src, removed: [] };
  }
}

export async function getPublishStatus(userId: string, entryId: string): Promise<PublishStatus> {
  try {
    const { data } = await supabaseAdmin().from("public_pages").select("title, text, privacy").eq("user_id", userId).eq("entry_id", entryId).maybeSingle();
    if (!data) return { published: false, title: "", text: "", privacy: "public" };
    return { published: true, title: data.title || "", text: data.text || "", privacy: data.privacy || "public" };
  } catch {
    return null; // таблицы ещё нет
  }
}

// Опубликованные страницы пользователя для публичной книги (только видимые на профиле).
export async function getPublicPages(userId: string): Promise<PublicPage[]> {
  try {
    const { data } = await supabaseAdmin().from("public_pages").select("id, title, text, privacy, created_at").eq("user_id", userId).eq("privacy", "public").order("created_at", { ascending: false }).limit(100);
    return (data as PublicPage[]) || [];
  } catch {
    return [];
  }
}
