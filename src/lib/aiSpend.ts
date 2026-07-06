import { supabaseAdmin } from "./supabaseAdmin";

// Контроль расходов на AI. Точного «остатка счёта» Anthropic через API не отдаёт
// (виден только в Console), поэтому балансом управляем сами: владелец вписывает
// текущий баланс после пополнения (снимок), а дальше он уменьшается на НАШУ оценку
// расхода (по токенам из таблицы usage). Это оценка, а не точная цифра биллинга.
const OWNER = "00000000-0000-0000-0000-000000000000";
const SNAP_KIND = "balance_set"; // служебные строки-снимки баланса в таблице usage

export type AiSpend = {
  ok: boolean;
  hasSnapshot: boolean;
  snapshotUsd: number | null;   // сколько было на счету на момент снимка
  snapshotAt: string | null;
  spentSinceUsd: number;        // потрачено с момента снимка (наша оценка)
  balanceUsd: number | null;    // остаток ≈ снимок − расход с момента снимка
  spentTodayUsd: number;
  spentMonthUsd: number;
};

const c2u = (cents: number) => Math.round((cents / 100) * 100) / 100;

export async function getAiSpend(): Promise<AiSpend> {
  try {
    const { data } = await supabaseAdmin().from("usage").select("kind, cost_cents, created_at");
    const rows = (data as any[]) || [];
    // Последний снимок баланса.
    const snaps = rows
      .filter((r) => r.kind === SNAP_KIND)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    const snap = snaps[0] || null;
    const snapshotCents = snap ? Number(snap.cost_cents) || 0 : null;
    const snapshotAt = snap ? String(snap.created_at) : null;

    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + "-01";
    let spentSince = 0, spentToday = 0, spentMonth = 0;
    for (const r of rows) {
      if (r.kind === SNAP_KIND) continue; // снимки — не расход
      const cents = Number(r.cost_cents) || 0;
      const at = String(r.created_at || "");
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
    };
  } catch {
    return { ok: false, hasSnapshot: false, snapshotUsd: null, snapshotAt: null, spentSinceUsd: 0, balanceUsd: null, spentTodayUsd: 0, spentMonthUsd: 0 };
  }
}

// Владелец вписал текущий баланс счёта (после пополнения) — сохраняем снимок.
export async function setAiBalance(usd: number): Promise<boolean> {
  if (!isFinite(usd) || usd < 0) return false;
  try {
    await supabaseAdmin().from("usage").insert({ user_id: OWNER, kind: SNAP_KIND, tokens_in: 0, tokens_out: 0, cost_cents: Math.round(usd * 100) });
    return true;
  } catch {
    return false;
  }
}
