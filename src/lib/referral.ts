import { supabaseAdmin } from "./supabaseAdmin";

// ===== Награда: пригласи друзей -> бесплатная печатная книга =====
// Друг засчитывается, когда зарегистрировался по твоей ссылке И сделал
// не меньше ACTIVE_THRESHOLD записей в дневнике (защита от «пустых» приглашений).
// Каждые FRIENDS_PER_BOOK активных друга дают одну бесплатную печатную книгу
// в тарифе Classic (мягкая обложка). Числа можно менять здесь.
export const ACTIVE_THRESHOLD = 5;
export const FRIENDS_PER_BOOK = 3;
export const REWARD_TIER = "classic";

export type ReferralStatus = {
  invited: number; // всего зарегистрировалось по ссылке
  active: number; // из них активных (>= ACTIVE_THRESHOLD записей)
  threshold: number; // сколько записей нужно другу, чтобы стать активным
  perBook: number; // сколько активных друзей за одну бесплатную книгу
  earned: number; // всего заработано бесплатных книг
  used: number; // уже использовано (заявок на бесплатную книгу)
  available: number; // доступно сейчас (earned - used)
  toNext: number; // сколько ещё активных друзей до следующей бесплатной книги
};

function empty(): ReferralStatus {
  return { invited: 0, active: 0, threshold: ACTIVE_THRESHOLD, perBook: FRIENDS_PER_BOOK, earned: 0, used: 0, available: 0, toNext: FRIENDS_PER_BOOK };
}

// Считает реферальный статус пользователя: приглашённые, активные, награды.
export async function getReferralStatus(userId: string): Promise<ReferralStatus> {
  const db = supabaseAdmin();
  try {
    const { data: friends } = await db.from("users").select("id").eq("referred_by", userId);
    const ids = (friends || []).map((f: any) => f.id);
    const invited = ids.length;

    let active = 0;
    if (ids.length) {
      // Считаем записи по всем друзьям одним запросом; активный = >= порога.
      const { data: rows } = await db.from("entries").select("user_id").in("user_id", ids);
      const cnt: Record<string, number> = {};
      for (const r of rows || []) {
        const uid = (r as any).user_id as string;
        cnt[uid] = (cnt[uid] || 0) + 1;
      }
      active = ids.filter((id) => (cnt[id] || 0) >= ACTIVE_THRESHOLD).length;
    }

    const earned = Math.floor(active / FRIENDS_PER_BOOK);

    // Сколько бесплатных книг уже запрошено. Фолбэк (колонки ещё нет) — 0.
    let used = 0;
    try {
      const { data: me } = await db.from("users").select("free_books_used").eq("id", userId).maybeSingle();
      used = Number((me as any)?.free_books_used || 0);
    } catch {}

    const available = Math.max(0, earned - used);
    const toNext = (earned + 1) * FRIENDS_PER_BOOK - active;
    return { invited, active, threshold: ACTIVE_THRESHOLD, perBook: FRIENDS_PER_BOOK, earned, used, available, toNext };
  } catch {
    return empty();
  }
}

// Списывает одну бесплатную книгу (расходует кредит). true — если получилось.
export async function claimFreeBook(userId: string): Promise<boolean> {
  const st = await getReferralStatus(userId);
  if (st.available < 1) return false;
  try {
    await supabaseAdmin().from("users").update({ free_books_used: st.used + 1 }).eq("id", userId);
    return true;
  } catch {
    return false;
  }
}
