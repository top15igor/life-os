import { supabaseAdmin } from "./supabaseAdmin";
import { classifyScope } from "./financeScope";
import { ensureBankAccount } from "./monoAccount";

// ПриватБанк, бизнес-счета (ФОП) через API «Автоклиент»
// (https://acp.privatbank.ua/api). Вебхуков у Привата нет — операции
// подтягивает почасовой крон и ручной «Импорт за 30 дней».
//
// Авторизация: заголовки id (client id) + token, оба создаются в
// Приват24 для бизнеса. Транзакция: SUM/CCY (сумма и валюта),
// TRANTYPE C|D (зачисление/списание), DAT_OD (dd.mm.yyyy), OSND
// (назначение), AUT_CNTR_NAM (контрагент), ID/REF (уникальность).

const BASE = "https://acp.privatbank.ua/api";

function pbHeaders(clientId: string, token: string): Record<string, string> {
  return { id: clientId, token, "User-Agent": "LIFE OS", "Content-Type": "application/json;charset=utf8" };
}

const ddmmyyyy = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
};

// Проверка пары id+token: короткий запрос выписки за сегодня.
export async function probePrivat(clientId: string, token: string): Promise<{ ok: boolean; status: number }> {
  try {
    const qs = new URLSearchParams({ startDate: ddmmyyyy(new Date()), limit: "1" });
    const r = await fetch(`${BASE}/statements/transactions?${qs}`, { headers: pbHeaders(clientId, token), cache: "no-store" });
    return { ok: r.ok, status: r.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

// Все транзакции с даты (страницами по next_page_id).
export async function fetchPrivatTransactions(clientId: string, token: string, days: number): Promise<any[]> {
  const start = new Date(Date.now() - days * 24 * 3600_000);
  const out: any[] = [];
  let followId = "";
  for (let page = 0; page < 60; page++) {
    const qs = new URLSearchParams({ startDate: ddmmyyyy(start), limit: "100" });
    if (followId) qs.set("followId", followId);
    const r = await fetch(`${BASE}/statements/transactions?${qs}`, { headers: pbHeaders(clientId, token), cache: "no-store" });
    if (!r.ok) throw new Error(`privat ${r.status}`);
    const j: any = await r.json().catch(() => null);
    out.push(...((j?.transactions as any[]) || []));
    if (j?.exist_next_page && j?.next_page_id) followId = String(j.next_page_id);
    else break;
  }
  return out;
}

export type PrivatMapped = {
  ext_id: string; day: string; kind: "income" | "expense"; amount: number;
  currency: string; note: string | null; scope: string; category: string | null;
};

export function mapPrivatTx(t: any): PrivatMapped | null {
  const ref = String(t?.ID || t?.TECHNICAL_TRANSACTION_ID || (t?.REF ? `${t.REF}:${t.NUM_DOC || ""}:${t.TRANTYPE || ""}` : "")).trim();
  if (!ref) return null;
  const amount = Number(String(t?.SUM ?? "").replace(",", "."));
  if (!isFinite(amount) || amount <= 0) return null;
  const kind: "income" | "expense" = t?.TRANTYPE === "C" ? "income" : "expense";
  const currency = String(t?.CCY || "UAH").toUpperCase().slice(0, 3);
  const dm = String(t?.DAT_OD || t?.DAT_KL || "").match(/(\d{2})\.(\d{2})\.(\d{4})/);
  const day = dm ? `${dm[3]}-${dm[2]}-${dm[1]}` : new Date().toISOString().slice(0, 10);
  const who = String(t?.AUT_CNTR_NAM || "").replace(/\s+/g, " ").trim();
  const osnd = String(t?.OSND || "").replace(/\s+/g, " ").trim();
  const note = ((who && osnd ? `${who} · ${osnd}` : who || osnd) || null)?.slice(0, 200) || null;
  // Это счёт ФОП: всё по умолчанию «Бизнес», а переводы на свои карты — «Перевод».
  const scope = classifyScope({ note, category: null }) === "transfer" ? "transfer" : "business";
  return { ext_id: `pb:${ref}`, day, kind, amount, currency, note, scope, category: null };
}

// Синхронизация одного пользователя: все его подключения, дедуп по ext_id.
export async function syncPrivat(userId: string, days: number): Promise<{ inserted: number; connections: number; failed: number }> {
  const db = supabaseAdmin();
  let rows: any[] = [];
  try {
    const { data, error } = await db.from("bank_privat").select("id, client_id, token, name, account_id").eq("user_id", userId);
    if (error) throw error;
    rows = (data || []).filter((r: any) => r?.token && r?.client_id);
  } catch {
    return { inserted: 0, connections: 0, failed: 0 }; // таблицы ещё нет
  }
  if (!rows.length) return { inserted: 0, connections: 0, failed: 0 };

  const existing = new Set<string>();
  try {
    const { data } = await db.from("finance_tx").select("ext_id").eq("user_id", userId).eq("source", "privatbank").limit(20000);
    for (const t of data || []) if ((t as any).ext_id) existing.add((t as any).ext_id);
  } catch { /* нет колонок — дублей нет по определению */ }

  let inserted = 0;
  let failed = 0;
  for (const conn of rows) {
    let txs: any[] = [];
    try { txs = await fetchPrivatTransactions(conn.client_id, conn.token, days); }
    catch { failed++; continue; }
    const accId = await ensureBankAccount(userId, conn, { table: "bank_privat", emoji: "🏛️", fallbackName: "Приват ФОП" });
    const toInsert: any[] = [];
    for (const t of txs) {
      const m = mapPrivatTx(t);
      if (!m || existing.has(m.ext_id)) continue;
      existing.add(m.ext_id);
      toInsert.push({ user_id: userId, day: m.day, kind: m.kind, amount: m.amount, currency: m.currency, category: m.category, note: m.note, source: "privatbank", ext_id: m.ext_id, scope: m.scope, ...(accId ? { account_id: accId } : {}) });
    }
    for (let i = 0; i < toInsert.length; i += 500) {
      const chunk = toInsert.slice(i, i + 500);
      let { error } = await db.from("finance_tx").insert(chunk);
      if (error && /ext_id|source|scope|account|column|schema cache/i.test(error.message)) {
        const bare = chunk.map(({ ext_id, source, scope, account_id, ...rest }: any) => rest);
        ({ error } = await db.from("finance_tx").insert(bare));
      }
      if (!error) inserted += chunk.length;
    }
    // Бэкфилл привязки к счёту у старых операций (пустые — ручные не трогаем).
    if (accId) {
      const ids = txs.map((t) => mapPrivatTx(t)?.ext_id).filter(Boolean) as string[];
      for (let i = 0; i < ids.length; i += 200) {
        await db.from("finance_tx").update({ account_id: accId })
          .eq("user_id", userId).eq("source", "privatbank").is("account_id", null)
          .in("ext_id", ids.slice(i, i + 200))
          .then(() => undefined, () => undefined);
      }
    }
  }
  return { inserted, connections: rows.length, failed };
}

// Все пользователи с подключениями — для почасового крона.
export async function syncPrivatAll(days: number): Promise<number> {
  const db = supabaseAdmin();
  let userIds: string[] = [];
  try {
    const { data, error } = await db.from("bank_privat").select("user_id");
    if (error) throw error;
    userIds = [...new Set((data || []).map((r: any) => r.user_id))];
  } catch {
    return 0;
  }
  let total = 0;
  for (const uid of userIds) {
    try { total += (await syncPrivat(uid, days)).inserted; } catch { /* следующий */ }
  }
  return total;
}
