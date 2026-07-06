"use client";

import { useEffect, useState } from "react";

type Triple = { limit: number | null; remaining: number | null; reset: string | null };
type Limits = {
  ok: boolean; error?: string; retryAfter?: string | null;
  requests?: Triple; inputTokens?: Triple; outputTokens?: Triple; tokens?: Triple; checkedModel?: string;
};
type Spend = {
  ok: boolean; hasSnapshot: boolean;
  snapshotUsd: number | null; snapshotAt: string | null;
  spentSinceUsd: number; balanceUsd: number | null;
  spentTodayUsd: number; spentMonthUsd: number;
};

const usd = (n: number | null | undefined): string =>
  n == null ? "—" : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function pct(t?: Triple): number | null {
  if (!t || t.limit == null || t.remaining == null || t.limit <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((t.remaining / t.limit) * 100)));
}
function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(n);
}
function resetIn(reset?: string | null): string {
  if (!reset) return "";
  const t = new Date(reset).getTime();
  if (!isFinite(t)) return "";
  const s = Math.max(0, Math.round((t - Date.now()) / 1000));
  if (s < 60) return `сброс через ${s} с`;
  if (s < 3600) return `сброс через ${Math.round(s / 60)} мин`;
  return `сброс через ${Math.round(s / 3600)} ч`;
}

function Row({ label, t }: { label: string; t?: Triple }) {
  const p = pct(t);
  const low = p != null && p <= 15;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginBottom: 5 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: low ? "#e11d48" : "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
          {fmt(t?.remaining)} / {fmt(t?.limit)}
          {p != null ? ` · ${p}%` : ""}
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
        <div style={{ width: `${p ?? 0}%`, height: "100%", borderRadius: 999, background: low ? "#e11d48" : p != null && p <= 40 ? "#d97706" : "#10b981", transition: "width .3s" }} />
      </div>
      {t?.reset && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>{resetIn(t.reset)}</div>}
    </div>
  );
}

function Balance({ spend, onSaved }: { spend?: Spend | null; onSaved: (s: Spend) => void }) {
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const bal = spend?.balanceUsd;
  const low = bal != null && bal <= 5;
  const save = async () => {
    const n = Number(val.replace(",", "."));
    if (!isFinite(n) || n < 0) return;
    setSaving(true);
    try {
      const r = await fetch("/api/admin/anthropic-limits", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ balanceUsd: n }),
      }).then((x) => x.json());
      if (r?.spend) onSaved(r.spend);
      setVal("");
    } finally { setSaving(false); }
  };
  return (
    <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: low ? "#e11d4810" : "var(--accent-bg)", border: `1px solid ${low ? "#e11d4844" : "var(--accent)"}` }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
          <i className="ti ti-wallet" style={{ fontSize: 17, color: low ? "#e11d48" : "var(--accent)" }} />Остаток на счету
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: low ? "#e11d48" : "var(--text)", fontVariantNumeric: "tabular-nums" }}>
          {spend?.hasSnapshot ? `≈ ${usd(bal)}` : "—"}
        </div>
      </div>
      {spend?.hasSnapshot && (
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
          Потрачено с пополнения {usd(spend.spentSinceUsd)} · сегодня {usd(spend.spentTodayUsd)} · за месяц {usd(spend.spentMonthUsd)}
        </div>
      )}
      {low && <div style={{ fontSize: 12, color: "#e11d48", marginTop: 5, fontWeight: 500 }}>Баланс на исходе — пополни в Console, иначе AI отключится.</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input value={val} onChange={(e) => setVal(e.target.value)} inputMode="decimal" placeholder="напр. 20"
          style={{ width: 110, fontSize: 13.5, padding: "7px 10px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} />
        <button onClick={save} disabled={saving || !val}
          style={{ fontSize: 12.5, fontWeight: 600, padding: "7px 13px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", opacity: saving || !val ? 0.6 : 1 }}>
          {saving ? "…" : "Записать баланс"}
        </button>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>вписывай баланс из Console после пополнения — дальше он тикает вниз сам</span>
      </div>
    </div>
  );
}

export default function AnthropicLimits() {
  const [data, setData] = useState<Limits | null>(null);
  const [spend, setSpend] = useState<Spend | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/anthropic-limits", { cache: "no-store" }).then((x) => x.json());
      setData(r?.limits || { ok: false, error: "нет ответа" });
      setSpend(r?.spend || null);
    } catch {
      setData({ ok: false, error: "сеть" });
    } finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, fontWeight: 600 }}>
          <i className="ti ti-brain" style={{ fontSize: 18, color: "var(--accent)" }} />Anthropic — лимиты аккаунта
        </div>
        <button onClick={load} disabled={busy}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, padding: "6px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          <i className={`ti ${busy ? "ti-loader-2" : "ti-refresh"}`} style={{ fontSize: 14 }} />Обновить
        </button>
      </div>
      <Balance spend={spend} onSaved={setSpend} />

      <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.45, marginBottom: 14 }}>
        Текущие rate-limit'ы из заголовков API. Если «остаток» упирается в ноль при всплеске пользователей — часть запросов ловит 429/529, отсюда и сбои разбора.
      </div>

      {!data ? (
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>Загружаю…</div>
      ) : !data.ok ? (
        <div style={{ fontSize: 13.5, color: "#e11d48", lineHeight: 1.5, background: "#e11d4812", border: "1px solid #e11d4833", borderRadius: 10, padding: "10px 12px" }}>
          <b>{data.error}</b>
          {data.retryAfter ? <div style={{ marginTop: 3 }}>Retry-After: {data.retryAfter} с</div> : null}
          <div style={{ color: "var(--text-2)", marginTop: 5 }}>Тариф и лимиты — в Anthropic Console → Settings → Limits / Billing.</div>
        </div>
      ) : (
        <>
          <Row label="Запросы / мин" t={data.requests} />
          <Row label="Входные токены / мин" t={data.inputTokens} />
          <Row label="Выходные токены / мин" t={data.outputTokens} />
          {data.tokens && (data.tokens.limit != null) ? <Row label="Токены / мин (всего)" t={data.tokens} /> : null}
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6 }}>
            Поднять лимиты/тариф — в <a href="https://console.anthropic.com/settings/limits" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Anthropic Console → Limits</a>.
          </div>
        </>
      )}
    </div>
  );
}
