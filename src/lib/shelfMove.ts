import { supabaseAdmin } from "./supabaseAdmin";
import { analyze } from "./ai";
import { saveEntry, clearDerived } from "./saveEntry";

// Две полки: «Дневник» — жизнь, события, чувства; «Хранилище» — справка, которую
// надо будет найти (коды, номера, адреса, инструкции).
//
// Принцип: НЕ спрашивать заранее, куда положить, а положить и показать куда,
// дав одну кнопку переложить. Вопрос до сохранения — трение ровно в том месте,
// где его быть не должно: человек диктует на ходу, и развилка его останавливает.
// А ошибается бот редко — платить трением на каждом сообщении за случай из
// десяти невыгодно. Плюс каждый тап «переложить» показывает, где именно роутер
// ошибается: при вопросе заранее такой статистики не появляется вовсе.

export type Shelf = "diary" | "vault";

export const SHELF_LABEL: Record<string, { diary: string; vault: string; toDiary: string; toVault: string; movedToDiary: string; movedToVault: string; gone: string }> = {
  ru: {
    diary: "📓 В дневник", vault: "📚 В хранилище",
    toDiary: "📓 Это в дневник", toVault: "📚 Это в хранилище",
    movedToDiary: "📓 Переложил в дневник", movedToVault: "📚 Переложил в хранилище",
    gone: "Уже переложено",
  },
  en: {
    diary: "📓 To the diary", vault: "📚 To the vault",
    toDiary: "📓 This is diary", toVault: "📚 This is reference",
    movedToDiary: "📓 Moved to the diary", movedToVault: "📚 Moved to the vault",
    gone: "Already moved",
  },
  uk: {
    diary: "📓 У щоденник", vault: "📚 У сховище",
    toDiary: "📓 Це у щоденник", toVault: "📚 Це у сховище",
    movedToDiary: "📓 Переклав у щоденник", movedToVault: "📚 Переклав у сховище",
    gone: "Вже перекладено",
  },
  fr: {
    diary: "📓 Dans le journal", vault: "📚 Dans le coffre",
    toDiary: "📓 C'est pour le journal", toVault: "📚 C'est une info à garder",
    movedToDiary: "📓 Déplacé dans le journal", movedToVault: "📚 Déplacé dans le coffre",
    gone: "Déjà déplacé",
  },
  es: {
    diary: "📓 Al diario", vault: "📚 Al baúl",
    toDiary: "📓 Esto es diario", toVault: "📚 Esto es información",
    movedToDiary: "📓 Movido al diario", movedToVault: "📚 Movido al baúl",
    gone: "Ya está movido",
  },
};

// Запись дневника → заметка в хранилище. Производные (задачи, траты, люди)
// снимаем: у справки их быть не должно, иначе «код от домофона» останется
// висеть задачей.
export async function entryToVault(userId: string, entryId: string): Promise<{ ok: boolean; text?: string }> {
  const db = supabaseAdmin();
  const { data: e } = await db.from("entries").select("id, raw_text").eq("id", entryId).eq("user_id", userId).maybeSingle();
  if (!e) return { ok: false };
  const text = String((e as any).raw_text || "").trim();
  if (!text) return { ok: false };

  const { error } = await db.from("notes").insert({ user_id: userId, text: text.slice(0, 4000) });
  if (error) return { ok: false };

  await clearDerived(entryId).catch(() => {});
  await db.from("entries").delete().eq("id", entryId).eq("user_id", userId);
  return { ok: true, text };
}

// Заметка → запись дневника. Здесь наоборот нужен разбор: у записи есть
// настроение, люди, задачи — без него она ляжет в ленту пустой.
export async function vaultToEntry(userId: string, noteId: string): Promise<{ ok: boolean; text?: string }> {
  const db = supabaseAdmin();
  const { data: n } = await db.from("notes").select("id, text").eq("id", noteId).eq("user_id", userId).maybeSingle();
  if (!n) return { ok: false };
  const text = String((n as any).text || "").trim();
  if (!text) return { ok: false };

  try {
    const analysis = await analyze(text, userId);
    await saveEntry({ userId, raw_text: text, source: "moved_from_vault", analysis });
  } catch {
    return { ok: false };
  }
  await db.from("notes").delete().eq("id", noteId).eq("user_id", userId);
  return { ok: true, text };
}

// ===== Отложенный выбор полки =====
//
// Редкий случай: роутер честно сказал, что не может решить. Тогда — и только
// тогда — спрашиваем. Текст держим в настройках самого человека: в кнопку
// Telegram помещается 64 байта, длинная заметка туда не влезет.

export async function rememberPendingShelf(userId: string, text: string): Promise<void> {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const prefs: any = { ...((data as any)?.morning_prefs || {}) };
    prefs.shelfText = String(text || "").slice(0, 4000);
    prefs.shelfAt = new Date().toISOString();
    await db.from("users").update({ morning_prefs: prefs }).eq("id", userId);
  } catch { /* не записалось — кнопки просто ничего не найдут, ответим мягко */ }
}

// Положить отложенное на выбранную полку. Возвращает текст или null, если
// выбор устарел (сутки) либо ничего не ждали.
export async function placePendingShelf(userId: string, shelf: Shelf): Promise<string | null> {
  const db = supabaseAdmin();
  let text = "";
  try {
    const { data } = await db.from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const prefs: any = { ...((data as any)?.morning_prefs || {}) };
    const at = Date.parse(prefs.shelfAt || "");
    if (prefs.shelfText && (Number.isNaN(at) || Date.now() - at < 24 * 3600_000)) text = String(prefs.shelfText);
    if (prefs.shelfText) {
      await db.from("users").update({ morning_prefs: { ...prefs, shelfText: "", shelfAt: "" } }).eq("id", userId);
    }
  } catch { return null; }
  if (!text) return null;

  if (shelf === "vault") {
    const { error } = await db.from("notes").insert({ user_id: userId, text: text.slice(0, 4000) });
    return error ? null : text;
  }
  try {
    const analysis = await analyze(text, userId);
    await saveEntry({ userId, raw_text: text, source: "telegram_text", analysis });
    return text;
  } catch {
    return null;
  }
}
