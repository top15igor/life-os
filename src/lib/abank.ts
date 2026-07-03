// ============================================================
//  А-Банк Open Banking API (AIS): согласие + SCA + чтение операций.
//  Поток проверен на песочнице (api-dev-portal.a-bank.com.ua):
//  создать согласие → авторизация (подтверждение в приложении àbank24) →
//  статус "valid" → GET /v2/accounts → GET .../transactions.
//  На прод переключается сменой ABANK_API_BASE (после онбординга TPP).
// ============================================================

import { randomUUID } from "crypto";
import { mccCategory } from "./monobank";
import { classifyScope } from "./financeScope";

const BASE = process.env.ABANK_API_BASE || "https://api-dev-portal.a-bank.com.ua/api";

export type AbankPsu = { iban: string; corporate: boolean };

function headers(psu: AbankPsu, extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-ID": randomUUID(),
    "PSU-IP-Address": "127.0.0.1",
    ...(extra || {}),
  };
  if (psu.corporate) { h["PSU-Corporate-ID"] = psu.iban; h["PSU-Corporate-ID-Type"] = "IBAN"; }
  else { h["PSU-ID"] = psu.iban; h["PSU-ID-Type"] = "IBAN"; }
  return h;
}

async function req(method: string, path: string, psu: AbankPsu, body?: any, consentId?: string): Promise<{ ok: boolean; status: number; data: any }> {
  const extra = consentId ? { "Consent-ID": consentId } : undefined;
  const r = await fetch(`${BASE}${path}`, { method, headers: headers(psu, extra), body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const data = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, data };
}

// 1) Создать согласие на чтение балансов и операций счёта (до 90 дней).
export async function createConsent(psu: AbankPsu, currency: string, validTo: string) {
  const body = {
    consentType: "detailed",
    recurringIndicator: true,
    frequencyPerDay: 4,
    validTo,
    access: { payments: [{ account: { iban: psu.iban, currency }, rights: ["balances", "transactions"] }] },
  };
  return req("POST", "/v2/consents/account-access", psu, body);
}

// 2) Запустить авторизацию согласия (SCA DECOUPLED — пользователь подтверждает в àbank24).
export async function startAuthorisation(psu: AbankPsu, consentId: string) {
  return req("POST", `/v2/consents/account-access/${consentId}/authorisations`, psu, {});
}

// 3) Статус согласия: "received" (ждём подтверждения) | "valid" (подтверждено) | иное.
export async function consentStatus(psu: AbankPsu, consentId: string): Promise<string | null> {
  const r = await req("GET", `/v2/consents/account-access/${consentId}/status`, psu);
  return r.ok ? (r.data?.consentStatus || null) : null;
}

// 4) Список счетов (resourceId нужен для чтения операций).
export async function getAccounts(psu: AbankPsu, consentId: string) {
  const r = await req("GET", "/v2/accounts?withBalance=true", psu, undefined, consentId);
  return r.ok ? (r.data?.accounts || []) : [];
}

// 5) Операции счёта за период (окно ≤31 дня).
export async function getTransactions(psu: AbankPsu, consentId: string, resourceId: string, dateFrom: string, dateTo: string) {
  const r = await req("GET", `/v2/accounts/${resourceId}/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}&bookingStatus=both`, psu, undefined, consentId);
  if (!r.ok) return { booked: [], pending: [] };
  const t = r.data?.transactions || {};
  return { booked: t.booked || [], pending: t.pending || [] };
}

export type AbankMapped = {
  ext_id: string; day: string; kind: "income" | "expense";
  amount: number; currency: string; category: string | null; note: string | null; scope: string;
};

// Операция А-Банка → наша finance_tx. Сумма со знаком (расход < 0), валюта операции,
// категория по MCC (тот же справочник, что у Monobank).
export function mapAbankTx(t: any): AbankMapped | null {
  if (!t || !t.transactionId) return null;
  const raw = Number(t.transactionAmount?.amount);
  if (!Number.isFinite(raw) || raw === 0) return null;
  const kind: "income" | "expense" = raw < 0 ? "expense" : "income";
  const amount = Math.round(Math.abs(raw) * 100) / 100;
  const currency = t.transactionAmount?.currency || "UAH";
  const day = String(t.transactionDateTime || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
  const category = t.merchantCategoryCode ? mccCategory(Number(t.merchantCategoryCode)) : null;
  const note = t.remittanceInformationUnstructured ? String(t.remittanceInformationUnstructured).slice(0, 200) : null;
  return { ext_id: `ab_${t.transactionId}`, day, kind, amount, currency, category, note, scope: classifyScope({ note, category }) };
}
