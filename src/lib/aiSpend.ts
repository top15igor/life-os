import { supabaseAdmin } from "./supabaseAdmin";

// Контроль расходов на AI. Точного «остатка счёта» Anthropic через API не отдаёт
// (виден только в Console), поэтому балансом управляем сами: владелец вписывает
// текущий баланс Anthropic после пополнения (снимок), а дальше он уменьшается на
// НАШУ оценку расхода Claude (по токенам из таблицы usage). Это оценка, не биллинг.
//
// ВАЖНО: против баланса Anthropic считаем ТОЛЬКО расход Claude. Whisper (kind
// 'transcribe') — это OpenAI, отдельный счёт, его в баланс Anthropic не включаем.
const OWNER = "00000000-0000-0000-0000-000000000000";
const SNAP_KIND = "balance_set"; // служебные строки-снимки баланса в таблице usage
const OPENAI_KINDS = new Set(["transcribe"]); // расход OpenAI (Whisper), не Anthropic

export type AiSpend = {
  ok: boolean;
  hasSnapshot: boolean;
  snapshotUsd: number | null;   // сколько было на счету Anthropic на момент снимка
  snapshotAt: string | null;
  spentSinceUsd: number;        // расход Claude с момента снимка (наша оценка)
  balanceUsd: number | null;    // остаток ≈ снимок − расход Claude с момента снимка
  spentTodayUsd: number;        // Claude сегодня
  spentMonthUsd: number;        // Claude за месяц
  openaiMonthUsd: number;       // OpenAI (Whisper) за месяц — справочно, отдельный счёт
  error?: string;
};

const c2u = (cents: number) => Math.round((cents / 100) * 100) / 100;

export async function getAiSpend(): Promise<AiSpend> {
  const empty: AiSpend = { ok: false, hasSnapshot: false, snapshotUsd: null, snapshotAt: null, spentSinceUsd: 0, balanceUsd: null, spentTodayUsd: 0, spentMonthUsd: 0, openaiMonthUsd: 0 };
  try {
    const { data, error } = await supabaseAdmin().from("usage").select("kind, cost_cents, created_at");
    if (error) return { ...empty, error: error.message };
    const rows = (data as any[]) || [];
    const snaps = rows
      .filter((r) => r.kind === SNAP_KIND)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    const snap = snaps[0] || null;
    const snapshotCents = snap ? Number(snap.cost_cents) || 0 : null;
    const snapshotAt = snap ? String(snap.created_at) : null;

    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + "-01";
    let spentSince = 0, spentToday = 0, spentMonth = 0, openaiMonth = 0;
    for (const r of rows) {
      if (r.kind === SNAP_KIND) continue;            // снимки — не расход
      const cents = Number(r.cost_cents) || 0;
      const at = String(r.created_at || "");
      const isOpenAI = OPENAI_KINDS.has(r.kind);
      if (isOpenAI) {
        if (at.slice(0, 10) >= monthStart) openaiMonth += cents;
        continue;                                    // OpenAI не трогает баланс Anthropic
      }
      if (snapshotAt && at > snapshotAt) spentSince += cents;
      if (at.slice(0, 10) === today) spentToday += cents;
      if (at.slice(0, 10) >= monthStart) spentMonth += cents;
    }
    return {
      ok: true,
      hasSnapshot: !!snap,
      snapshotUsd: snapshotCents != null ? c2u(snapshotCents) : null,
      snapshotAt,
      spentSinceUsd: c2u(spentSince),
      balanceUsd: snapshotCents != null ? c2u(snapshotCents - spentSince) : null,
      spentTodayUsd: c2u(spentToday),
      spentMonthUsd: c2u(spentMonth),
      openaiMonthUsd: c2u(openaiMonth),
    };
  } catch (e: any) {
    return { ...empty, error: String(e?.message || e) };
  }
}

// Владелец вписал текущий баланс счёта Anthropic (после пополнения) — снимок.
// supabase .insert() НЕ бросает исключение, а возвращает {error} — проверяем явно.
export async function setAiBalance(usd: number): Promise<{ ok: boolean; error?: string }> {
  if (!isFinite(usd) || usd < 0) return { ok: false, error: "неверная сумма" };
  try {
    const { error } = await supabaseAdmin()
      .from("usage")
      .insert({ user_id: OWNER, kind: SNAP_KIND, tokens_in: 0, tokens_out: 0, cost_cents: Math.round(usd * 100) });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}
