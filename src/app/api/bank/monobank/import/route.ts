import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { mapStatementItem, currencyAlpha } from "@/lib/monobank";
import { ensureMonoAccount } from "@/lib/monoAccount";

export const runtime = "nodejs";
export const maxDuration = 60;

const MONO = "https://api.monobank.ua";

// Импорт операций Monobank за последние ~30 дней (одноразовая подгрузка истории).
// Лимит API: 1 запрос/60с на счёт — поэтому идём по счетам по очереди и на 429 останавливаемся.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = supabaseAdmin();

  // Подключений может быть несколько (свой аккаунт + аккаунт близкого) —
  // импортируем по каждому токену. Старая схема вернёт одну строку.
  let rows: any[] = [];
  try {
    const { data, error } = await db.from("bank_monobank").select("id, token, accounts, client_name, account_id").eq("user_id", user.id);
    if (error) throw error;
    rows = data || [];
  } catch {
    try {
      const { data, error } = await db.from("bank_monobank").select("token, accounts, client_name").eq("user_id", user.id);
      if (error) throw error;
      rows = data || [];
    } catch {
      try { const { data } = await db.from("bank_monobank").select("token").eq("user_id", user.id).maybeSingle(); rows = data ? [data] : []; }
      catch { rows = []; }
    }
  }
  rows = rows.filter((r) => r?.token);
  if (!rows.length) return NextResponse.json({ ok: false, error: "not_connected" }, { status: 400 });

  // Счета каждого подключения (id + валюта счёта + токен + наш счёт-кошелёк,
  // к которому привязываются операции). Список счетов — сохранённый при
  // подключении (без лишнего client-info ради лимита 1 запрос/60с).
  const accounts: { id: string; currency: string; token: string; monoAcc: string | null }[] = [];
  for (const row of rows) {
    const token = row.token as string;
    const monoAcc = await ensureMonoAccount(user.id, row);
    let list: any[] = Array.isArray(row?.accounts) ? row.accounts.filter((a: any) => a?.id) : [];
    if (!list.length) {
      try {
        const r = await fetch(`${MONO}/personal/client-info`, { headers: { "X-Token": token }, cache: "no-store" });
        if (r.ok) { const info = await r.json(); list = (info?.accounts || []).filter((a: any) => a?.id); }
      } catch { /* этот токен пропускаем */ }
    }
    for (const a of list) accounts.push({ id: a.id, currency: currencyAlpha(Number(a.currencyCode)), token, monoAcc });
  }
  if (!accounts.length) return NextResponse.json({ ok: true, inserted: 0, accounts: 0 });

  const to = Math.floor(Date.now() / 1000);
  const from = to - 30 * 24 * 60 * 60;

  // Уже сохранённые операции (ext_id → валюта+сумма) — для анти-дубля и починки
  // валюты/суммы (напр. трата за границей раньше писалась в гривне со счёта).
  const existing = new Map<string, { currency: string; amount: number }>();
  try {
    const { data } = await db.from("finance_tx").select("ext_id, currency, amount").eq("user_id", user.id).eq("source", "monobank").limit(20000);
    for (const t of data || []) if ((t as any).ext_id) existing.set((t as any).ext_id, { currency: (t as any).currency, amount: Number((t as any).amount) });
  } catch { /* нет колонок — дублей по определению нет */ }

  let inserted = 0;
  let fixed = 0;
  let rateLimited = false;
  const toInsert: any[] = [];
  const toFix: { ext_id: string; currency: string; amount: number }[] = [];
  const throttled = new Set<string>(); // токен, упёршийся в лимит, дальше не дёргаем
  for (const acc of accounts) {
    if (throttled.has(acc.token)) continue;
    let res: Response;
    try { res = await fetch(`${MONO}/personal/statement/${acc.id}/${from}/${to}`, { headers: { "X-Token": acc.token }, cache: "no-store" }); }
    catch { continue; }
    if (res.status === 429) { rateLimited = true; throttled.add(acc.token); continue; }
    if (!res.ok) continue;
    const items = await res.json().catch(() => []);
    for (const it of items as any[]) {
      const m = mapStatementItem(it, acc.currency); // валюта — по счёту
      if (!m) continue;
      if (existing.has(m.ext_id)) {
        // Уже есть: чиним валюту И сумму, если сохранены неверно (напр. гривна вместо евро).
        const cur = existing.get(m.ext_id)!;
        if (cur.currency !== m.currency || Math.abs((cur.amount || 0) - m.amount) > 0.005) {
          toFix.push({ ext_id: m.ext_id, currency: m.currency, amount: m.amount });
          existing.set(m.ext_id, { currency: m.currency, amount: m.amount });
        }
        continue;
      }
      existing.set(m.ext_id, { currency: m.currency, amount: m.amount });
      toInsert.push({ user_id: user.id, day: m.day, kind: m.kind, amount: m.amount, currency: m.currency, category: m.category, note: m.note, source: "monobank", ext_id: m.ext_id, scope: m.scope, ...(acc.monoAcc ? { account_id: acc.monoAcc } : {}) });
    }
    // Бэкфилл привязки к счёту: старые операции этого банка без счёта получают
    // его (только пустые — ручную привязку не трогаем).
    if (acc.monoAcc) {
      const ids = (items as any[]).map((it) => mapStatementItem(it, acc.currency)?.ext_id).filter(Boolean) as string[];
      for (let i = 0; i < ids.length; i += 200) {
        await db.from("finance_tx").update({ account_id: acc.monoAcc })
          .eq("user_id", user.id).eq("source", "monobank").is("account_id", null)
          .in("ext_id", ids.slice(i, i + 200))
          .then(() => undefined, () => undefined);
      }
    }
  }

  // Починка валюты и суммы у ранее импортированных операций.
  for (const f of toFix) {
    const { error } = await db.from("finance_tx").update({ currency: f.currency, amount: f.amount }).eq("user_id", user.id).eq("ext_id", f.ext_id).eq("source", "monobank");
    if (!error) fixed++;
  }

  for (let i = 0; i < toInsert.length; i += 500) {
    const chunk = toInsert.slice(i, i + 500);
    let { error } = await db.from("finance_tx").insert(chunk);
    if (error && /ext_id|source|scope|account|column|schema cache/i.test(error.message)) {
      const bare = chunk.map(({ ext_id, source, scope, account_id, ...rest }: any) => rest);
      ({ error } = await db.from("finance_tx").insert(bare));
    }
    if (error) return NextResponse.json({ ok: false, error: error.message, inserted }, { status: 500 });
    inserted += chunk.length;
  }

  return NextResponse.json({ ok: true, inserted, fixed, rateLimited });
}
