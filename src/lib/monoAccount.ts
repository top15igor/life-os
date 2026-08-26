import { supabaseAdmin } from "./supabaseAdmin";

// Счёт (finance_accounts) для подключения Monobank.
//
// Операции банка привязываются к своему счёту автоматически — тогда каждый
// подключённый аккаунт (свой, близкого человека) можно смотреть отдельно,
// а без фильтра они складываются вместе. Функция идемпотентна: сперва связка
// из bank_monobank.account_id, затем поиск по имени, и только потом создание.
// Любая ошибка (нет таблицы счетов, нет колонки-связки) — просто null:
// операции лягут без привязки, как раньше.
export async function ensureMonoAccount(
  userId: string,
  conn: { id?: string | null; client_name?: string | null; account_id?: string | null }
): Promise<string | null> {
  const db = supabaseAdmin();
  const name = String(conn.client_name || "Monobank").slice(0, 60);
  try {
    if (conn.account_id) {
      const { data } = await db.from("finance_accounts").select("id").eq("id", conn.account_id).eq("user_id", userId).maybeSingle();
      if (data) return (data as any).id;
    }
    const { data: byName } = await db.from("finance_accounts").select("id").eq("user_id", userId).eq("name", name).limit(1);
    let accId: string | null = (byName as any[])?.[0]?.id || null;
    if (!accId) {
      const { data: created, error } = await db
        .from("finance_accounts")
        .insert({ user_id: userId, name, emoji: "🏦", currency: "UAH", opening_balance: 0 })
        .select("id")
        .single();
      if (error || !created) return null;
      accId = (created as any).id;
    }
    if (conn.id && accId) {
      // Колонки account_id в bank_monobank может ещё не быть — не критично.
      await db.from("bank_monobank").update({ account_id: accId }).eq("id", conn.id).then(() => undefined, () => undefined);
    }
    return accId;
  } catch {
    return null;
  }
}
