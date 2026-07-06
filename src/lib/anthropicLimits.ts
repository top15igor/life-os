import Anthropic from "@anthropic-ai/sdk";

// Rate-limit и «остаток» аккаунта Anthropic. Берём из заголовков ответа API
// (anthropic-ratelimit-*) — отдельного «покажи мой тариф» эндпоинта у Anthropic нет,
// а эти заголовки как раз показывают лимиты и сколько осталось до сброса.
export type LimitTriple = { limit: number | null; remaining: number | null; reset: string | null };
export type AnthropicLimits = {
  ok: boolean;
  error?: string;
  retryAfter?: string | null;
  requests?: LimitTriple;
  inputTokens?: LimitTriple;
  outputTokens?: LimitTriple;
  tokens?: LimitTriple;
  checkedModel?: string;
};

const num = (v: string | null): number | null => (v == null || v === "" ? null : Number(v));

// Реальный расход Claude за текущий месяц из Admin API (точная цифра, как в Console).
// Требует отдельный admin-ключ (sk-ant-admin...) в env ANTHROPIC_ADMIN_KEY.
// Если ключа нет или запрос не удался — возвращаем ok:false, карточка это переживёт.
export type RealCost = { ok: boolean; monthUsd?: number; error?: string };
export async function getAnthropicRealCost(): Promise<RealCost> {
  const key = process.env.ANTHROPIC_ADMIN_KEY;
  if (!key) return { ok: false, error: "no_admin_key" };
  try {
    const monthStart = new Date().toISOString().slice(0, 7) + "-01T00:00:00Z";
    const url = "https://api.anthropic.com/v1/organizations/cost_report?starting_at=" + encodeURIComponent(monthStart);
    const r = await fetch(url, { headers: { "x-api-key": key, "anthropic-version": "2023-06-01" }, cache: "no-store" });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const j: any = await r.json();
    // Схема отчёта может отличаться — суммируем любые поля amount (USD) рекурсивно.
    let cents = 0;
    const walk = (o: any) => {
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o)) { o.forEach(walk); return; }
      for (const [k, v] of Object.entries(o)) {
        if (k === "amount" && v != null && (!o.currency || String(o.currency).toUpperCase() === "USD")) {
          const n = Number(v); if (isFinite(n)) cents += Math.round(n * 100);
        } else walk(v);
      }
    };
    walk(j?.data ?? j);
    return { ok: true, monthUsd: Math.round(cents) / 100 };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export async function getAnthropicLimits(): Promise<AnthropicLimits> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "Нет ключа ANTHROPIC_API_KEY в окружении." };
  const model = "claude-haiku-4-5-20251001";
  try {
    const client = new Anthropic({ apiKey: key, maxRetries: 0 });
    // Минимальный запрос (1 токен) — нужен только ради заголовков лимитов.
    const { response } = await client.messages
      .create({ model, max_tokens: 1, messages: [{ role: "user", content: "." }] })
      .withResponse();
    const g = (n: string) => response.headers.get(n);
    return {
      ok: true,
      checkedModel: model,
      requests: { limit: num(g("anthropic-ratelimit-requests-limit")), remaining: num(g("anthropic-ratelimit-requests-remaining")), reset: g("anthropic-ratelimit-requests-reset") },
      inputTokens: { limit: num(g("anthropic-ratelimit-input-tokens-limit")), remaining: num(g("anthropic-ratelimit-input-tokens-remaining")), reset: g("anthropic-ratelimit-input-tokens-reset") },
      outputTokens: { limit: num(g("anthropic-ratelimit-output-tokens-limit")), remaining: num(g("anthropic-ratelimit-output-tokens-remaining")), reset: g("anthropic-ratelimit-output-tokens-reset") },
      tokens: { limit: num(g("anthropic-ratelimit-tokens-limit")), remaining: num(g("anthropic-ratelimit-tokens-remaining")), reset: g("anthropic-ratelimit-tokens-reset") },
    };
  } catch (e: any) {
    const status = e?.status ?? e?.response?.status;
    // Даже на ошибке (напр. 429) достаём retry-after — он показывает перегрузку/лимит.
    let ra: string | null = null;
    try { ra = e?.headers?.get?.("retry-after") ?? e?.response?.headers?.get?.("retry-after") ?? (e?.headers?.["retry-after"] ?? null); } catch {}
    const label = status === 429 ? "Лимит запросов (429)" : status === 529 ? "Перегрузка Anthropic (529)" : status ? `Ошибка HTTP ${status}` : String(e?.message || e);
    return { ok: false, error: label, retryAfter: ra };
  }
}
