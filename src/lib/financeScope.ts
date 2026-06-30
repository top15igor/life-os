// Classify a finance transaction as personal / business / transfer.
// Heuristic over the bank note + category. Designed for Monobank imports where
// a single account mixes personal spending, FOP (business) invoices and money
// transfers. Users can override per transaction later.

export type Scope = "personal" | "business" | "transfer";

// Money moved, not spent: own-card top-ups, P2P by name, masked card, cash/ATM.
const TRANSFER_RE =
  /на (білу|чорну|свою|іншу)?\s*карт|на картку|з картки на картку|поповнення|переказ|перевод|готівк|банкомат|зняття|cash|atm|власн(і|ий)|between accounts|own transfer|поповнення картки/i;
// Masked card number like 414962****7351 -> card-to-card transfer.
const CARD_RE = /\*{2,}\s*\d{3,4}/;
// "Артур І." / "Павло З." — person name with initial => P2P transfer.
const PERSON_RE = /^[А-ЯІЇЄҐ][а-яіїєґ'ʼ]+\s+[А-ЯІЇЄҐ][а-яіїєґ'ʼ]?\.?$/;
// Business: invoices, counterparties, VAT, contracts.
const BUSINESS_RE =
  /рахунок|рахунок[- ]?фактур|зг\.?\s*рах|оплата за товар|за товар зг|накладн|\bтов\b|\bтзов\b|\bфоп\b|\bпп\b|\bпдв\b|invoice|факту?ра|договор|договір|дистриб|постач|оптов/i;

export function classifyScope(input: { note?: string | null; category?: string | null }): Scope {
  const noteRaw = (input.note || "").trim();
  const n = noteRaw.toLowerCase();
  if (!noteRaw) return "personal";
  if (TRANSFER_RE.test(n) || CARD_RE.test(noteRaw) || PERSON_RE.test(noteRaw)) return "transfer";
  if (BUSINESS_RE.test(n)) return "business";
  return "personal";
}

// True if a transaction belongs to the requested view. null scope == personal,
// so things work before/without the backfill.
export function inScope(scope: string | null | undefined, view: Scope | "all"): boolean {
  if (view === "all") return true;
  const s = (scope as Scope) || "personal";
  return s === view;
}
