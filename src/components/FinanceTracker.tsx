"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tx = { id: string; day: string; kind: "income" | "expense"; amount: number; currency: string; category: string | null; note: string | null };
type CatSlice = { category: string; amount: number; pct: number };
type Data = { month: string; currency: string; income: number; expense: number; balance: number; byCategory: CatSlice[]; txs: Tx[]; monthsWithData: string[]; hasAny: boolean };

const STR: Record<string, any> = {
  ru: { balance: "Баланс за месяц", income: "Доходы", expense: "Расходы", add: "Добавить", addIncome: "Доход", addExpense: "Расход", amount: "Сумма", category: "Категория", date: "Дата", note: "Заметка (необязательно)", save: "Сохранить", cancel: "Отмена", byCategory: "Расходы по категориям", operations: "Операции", empty: "За этот месяц операций нет. Нажми «Добавить», чтобы записать доход или расход.", emptyAll: "Здесь будут твои доходы и расходы. Добавь первую операцию — и появится понятная картина денег.", delConfirm: "Удалить эту операцию?", noCat: "Без категории", today: "Сегодня", yesterday: "Вчера", saved: "за месяц", currency: "Валюта" },
  en: { balance: "Monthly balance", income: "Income", expense: "Expenses", add: "Add", addIncome: "Income", addExpense: "Expense", amount: "Amount", category: "Category", date: "Date", note: "Note (optional)", save: "Save", cancel: "Cancel", byCategory: "Spending by category", operations: "Transactions", empty: "No transactions this month. Tap “Add” to log income or an expense.", emptyAll: "Your income and expenses will live here. Add your first transaction to see a clear money picture.", delConfirm: "Delete this transaction?", noCat: "No category", today: "Today", yesterday: "Yesterday", saved: "this month", currency: "Currency" },
  uk: { balance: "Баланс за місяць", income: "Доходи", expense: "Витрати", add: "Додати", addIncome: "Дохід", addExpense: "Витрата", amount: "Сума", category: "Категорія", date: "Дата", note: "Нотатка (необов'язково)", save: "Зберегти", cancel: "Скасувати", byCategory: "Витрати за категоріями", operations: "Операції", empty: "За цей місяць операцій немає. Натисни «Додати», щоб записати дохід або витрату.", emptyAll: "Тут будуть твої доходи й витрати. Додай першу операцію — і з'явиться зрозуміла картина грошей.", delConfirm: "Видалити цю операцію?", noCat: "Без категорії", today: "Сьогодні", yesterday: "Вчора", saved: "за місяць", currency: "Валюта" },
  fr: { balance: "Solde du mois", income: "Revenus", expense: "Dépenses", add: "Ajouter", addIncome: "Revenu", addExpense: "Dépense", amount: "Montant", category: "Catégorie", date: "Date", note: "Note (facultatif)", save: "Enregistrer", cancel: "Annuler", byCategory: "Dépenses par catégorie", operations: "Opérations", empty: "Aucune opération ce mois-ci. Touchez « Ajouter » pour noter un revenu ou une dépense.", emptyAll: "Tes revenus et dépenses apparaîtront ici. Ajoute ta première opération pour une vision claire de ton argent.", delConfirm: "Supprimer cette opération ?", noCat: "Sans catégorie", today: "Aujourd'hui", yesterday: "Hier", saved: "ce mois", currency: "Devise" },
};

// Категории расходов и доходов: ключ, эмодзи, цвет, названия на 4 языках.
const EXPENSE_CATS = [
  { key: "food", icon: "🛒", color: "#22c55e", l: { ru: "Продукты", en: "Groceries", uk: "Продукти", fr: "Courses" } },
  { key: "cafe", icon: "☕", color: "#f97316", l: { ru: "Кафе", en: "Eating out", uk: "Кафе", fr: "Restos" } },
  { key: "transport", icon: "🚗", color: "#3b82f6", l: { ru: "Транспорт", en: "Transport", uk: "Транспорт", fr: "Transport" } },
  { key: "housing", icon: "🏠", color: "#8b5cf6", l: { ru: "Жильё", en: "Housing", uk: "Житло", fr: "Logement" } },
  { key: "bills", icon: "🧾", color: "#0ea5e9", l: { ru: "Счета и связь", en: "Bills", uk: "Рахунки", fr: "Factures" } },
  { key: "shopping", icon: "🛍️", color: "#ec4899", l: { ru: "Покупки", en: "Shopping", uk: "Покупки", fr: "Achats" } },
  { key: "health", icon: "💊", color: "#ef4444", l: { ru: "Здоровье", en: "Health", uk: "Здоров'я", fr: "Santé" } },
  { key: "fun", icon: "🎬", color: "#a855f7", l: { ru: "Развлечения", en: "Fun", uk: "Розваги", fr: "Loisirs" } },
  { key: "education", icon: "📚", color: "#14b8a6", l: { ru: "Образование", en: "Education", uk: "Освіта", fr: "Éducation" } },
  { key: "travel", icon: "✈️", color: "#06b6d4", l: { ru: "Путешествия", en: "Travel", uk: "Подорожі", fr: "Voyages" } },
  { key: "gifts", icon: "🎁", color: "#f43f5e", l: { ru: "Подарки", en: "Gifts", uk: "Подарунки", fr: "Cadeaux" } },
  { key: "other", icon: "💸", color: "#64748b", l: { ru: "Другое", en: "Other", uk: "Інше", fr: "Autre" } },
];
const INCOME_CATS = [
  { key: "salary", icon: "💼", color: "#16a34a", l: { ru: "Зарплата", en: "Salary", uk: "Зарплата", fr: "Salaire" } },
  { key: "freelance", icon: "💻", color: "#0ea5e9", l: { ru: "Подработка", en: "Freelance", uk: "Підробіток", fr: "Freelance" } },
  { key: "business", icon: "📈", color: "#8b5cf6", l: { ru: "Бизнес", en: "Business", uk: "Бізнес", fr: "Business" } },
  { key: "gift", icon: "🎁", color: "#f43f5e", l: { ru: "Подарок", en: "Gift", uk: "Подарунок", fr: "Cadeau" } },
  { key: "investment", icon: "💰", color: "#eab308", l: { ru: "Инвестиции", en: "Investments", uk: "Інвестиції", fr: "Investissements" } },
  { key: "other", icon: "➕", color: "#64748b", l: { ru: "Другое", en: "Other", uk: "Інше", fr: "Autre" } },
];

const CUR = [
  { code: "USD", sym: "$" }, { code: "EUR", sym: "€" }, { code: "UAH", sym: "₴" }, { code: "RUB", sym: "₽" },
  { code: "GBP", sym: "£" }, { code: "PLN", sym: "zł" }, { code: "KZT", sym: "₸" }, { code: "GEL", sym: "₾" },
  { code: "TRY", sym: "₺" }, { code: "AED", sym: "AED" },
];
const symOf = (c: string) => CUR.find((x) => x.code === c)?.sym || c;

const todayISO = () => new Date().toISOString().slice(0, 10);

function intlOf(l: string) { return l === "en" ? "en-GB" : l === "fr" ? "fr-FR" : l === "uk" ? "uk-UA" : "ru-RU"; }

// «1 250 ₴» — без копеек, если число целое.
function fmtMoney(amount: number, currency: string, locale: string) {
  const frac = Number.isInteger(amount) ? 0 : 2;
  let n: string;
  try { n = new Intl.NumberFormat(intlOf(locale), { minimumFractionDigits: frac, maximumFractionDigits: 2 }).format(amount); }
  catch { n = String(amount); }
  return `${n} ${symOf(currency)}`;
}

function catMeta(kind: "income" | "expense", key: string | null) {
  const list = kind === "income" ? INCOME_CATS : EXPENSE_CATS;
  return list.find((c) => c.key === key) || list[list.length - 1];
}

function monthLabel(m: string, locale: string) {
  try { return new Date(m + "-01T00:00:00").toLocaleDateString(intlOf(locale), { month: "long", year: "numeric" }); }
  catch { return m; }
}

function shift(m: string, d: number) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1 + d, 1)).toISOString().slice(0, 7);
}

export default function FinanceTracker({ data, locale }: { data: Data; locale: string }) {
  const s = STR[locale] || STR.ru;
  const router = useRouter();
  const { month, income, expense, balance, byCategory, txs } = data;

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(data.currency);
  const [category, setCategory] = useState("food");
  const [day, setDay] = useState(todayISO());
  const [note, setNote] = useState("");

  const isCur = month === todayISO().slice(0, 7);
  const cats = kind === "income" ? INCOME_CATS : EXPENSE_CATS;

  function gotoMonth(d: number) { router.push(`/finance?m=${shift(month, d)}`); }

  function switchKind(k: "income" | "expense") {
    setKind(k);
    setCategory(k === "income" ? "salary" : "food");
  }

  async function save() {
    const v = parseFloat(amount.replace(",", "."));
    if (!isFinite(v) || v <= 0) return;
    setBusy(true);
    const r = await fetch("/api/finance", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ day, kind, amount: v, currency, category, note: note.trim() || null }),
    });
    setBusy(false);
    if (r.ok) { setOpen(false); setAmount(""); setNote(""); router.refresh(); }
  }

  async function del(id: string) {
    if (busy || !window.confirm(s.delConfirm)) return;
    setBusy(true);
    const r = await fetch("/api/finance", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    setBusy(false);
    if (r.ok) router.refresh();
  }

  const input: any = { fontSize: 14, padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" };
  const btnP: any = { fontSize: 13.5, padding: "9px 16px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: 500 };
  const btnG: any = { fontSize: 13.5, padding: "9px 14px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer" };

  // Группировка операций по дням.
  const byDay = new Map<string, Tx[]>();
  for (const t of txs) {
    const list = byDay.get(t.day) ?? [];
    list.push(t);
    byDay.set(t.day, list);
  }
  const days = [...byDay.keys()].sort().reverse();

  function dayLabel(d: string) {
    const t = todayISO();
    const y = shiftDay(t, -1);
    if (d === t) return s.today;
    if (d === y) return s.yesterday;
    try { return new Date(d + "T00:00:00").toLocaleDateString(intlOf(locale), { day: "numeric", month: "long" }); }
    catch { return d; }
  }

  return (
    <div>
      {/* Шапка: переключатель месяца */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={() => gotoMonth(-1)} aria-label="prev" style={{ ...btnG, padding: "6px 10px" }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 16, verticalAlign: "-3px" }} />
        </button>
        <div style={{ fontSize: 15, fontWeight: 600, textTransform: "capitalize" }}>{monthLabel(month, locale)}</div>
        <button onClick={() => gotoMonth(1)} disabled={isCur} aria-label="next" style={{ ...btnG, padding: "6px 10px", opacity: isCur ? 0.4 : 1, cursor: isCur ? "default" : "pointer" }}>
          <i className="ti ti-chevron-right" style={{ fontSize: 16, verticalAlign: "-3px" }} />
        </button>
      </div>

      {/* Баланс + доходы/расходы */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}>
          <i className="ti ti-wallet" style={{ fontSize: 14, color: "var(--accent)" }} />{s.balance}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 3, lineHeight: 1.1, color: balance < 0 ? "#ef4444" : "var(--text)" }}>
          {balance > 0 ? "+" : ""}{fmtMoney(balance, data.currency, locale)}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 120px", background: "#10b9811a", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
              <i className="ti ti-arrow-down-left" style={{ fontSize: 14 }} />{s.income}
            </div>
            <div style={{ fontSize: 19, fontWeight: 600, marginTop: 2 }}>{fmtMoney(income, data.currency, locale)}</div>
          </div>
          <div style={{ flex: "1 1 120px", background: "#ef44441a", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
              <i className="ti ti-arrow-up-right" style={{ fontSize: 14 }} />{s.expense}
            </div>
            <div style={{ fontSize: 19, fontWeight: 600, marginTop: 2 }}>{fmtMoney(expense, data.currency, locale)}</div>
          </div>
        </div>
        <button onClick={() => setOpen((o) => !o)} style={{ ...btnP, width: "100%", marginTop: 14 }}>
          <i className="ti ti-plus" style={{ fontSize: 15, verticalAlign: "-2px" }} /> {s.add}
        </button>

        {/* Форма добавления */}
        {open && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            {/* Доход / Расход */}
            <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", padding: 4, borderRadius: 10, marginBottom: 12 }}>
              {(["expense", "income"] as const).map((k) => (
                <button key={k} onClick={() => switchKind(k)} style={{
                  flex: 1, fontSize: 13.5, padding: "8px", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 500,
                  background: kind === k ? (k === "income" ? "#10b981" : "#ef4444") : "transparent",
                  color: kind === k ? "#fff" : "var(--text-2)",
                }}>
                  {k === "income" ? s.addIncome : s.addExpense}
                </button>
              ))}
            </div>

            {/* Сумма + валюта + дата */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <input autoFocus type="number" inputMode="decimal" step="0.01" placeholder={s.amount} value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...input, flex: "2 1 120px", fontSize: 18, fontWeight: 600 }} />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...input, flex: "1 1 80px" }}>
                {CUR.map((c) => <option key={c.code} value={c.code}>{c.code} {c.sym}</option>)}
              </select>
              <input type="date" value={day} max={todayISO()} onChange={(e) => setDay(e.target.value)} style={{ ...input, flex: "1 1 140px" }} />
            </div>

            {/* Категории */}
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>{s.category}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {cats.map((c) => (
                <button key={c.key} onClick={() => setCategory(c.key)} style={{
                  fontSize: 12.5, padding: "6px 11px", borderRadius: 20, cursor: "pointer",
                  border: `1px solid ${category === c.key ? c.color : "var(--border)"}`,
                  background: category === c.key ? `${c.color}1f` : "var(--surface)",
                  color: category === c.key ? "var(--text)" : "var(--text-2)",
                  display: "inline-flex", alignItems: "center", gap: 5, fontWeight: category === c.key ? 600 : 400,
                }}>
                  <span>{c.icon}</span>{c.l[locale as "ru"] || c.l.ru}
                </button>
              ))}
            </div>

            <input type="text" placeholder={s.note} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} style={{ ...input, width: "100%", marginBottom: 12, boxSizing: "border-box" }} />

            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={busy} onClick={save} style={{ ...btnP, flex: 1 }}>{s.save}</button>
              <button disabled={busy} onClick={() => setOpen(false)} style={btnG}>{s.cancel}</button>
            </div>
          </div>
        )}
      </div>

      {/* Расходы по категориям */}
      {byCategory.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-chart-donut" style={{ fontSize: 15, color: "var(--accent)" }} />{s.byCategory}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {byCategory.map((c) => {
              const m = catMeta("expense", c.category);
              return (
                <div key={c.category}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span>{m.icon}</span>{m.l[locale as "ru"] || m.l.ru}
                      <span style={{ color: "var(--text-3)", fontSize: 12 }}>{c.pct}%</span>
                    </span>
                    <b>{fmtMoney(c.amount, data.currency, locale)}</b>
                  </div>
                  <div style={{ height: 7, background: "var(--surface-2)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: `max(${c.pct}%, 4px)`, height: "100%", background: m.color, borderRadius: 5 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Список операций */}
      {txs.length === 0 ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 14, textAlign: "center", padding: "26px 16px" }}>
          {data.hasAny ? s.empty : s.emptyAll}
        </div>
      ) : (
        <div className="card">
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-list" style={{ fontSize: 15, color: "var(--accent)" }} />{s.operations}
          </div>
          {days.map((d) => (
            <div key={d} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", textTransform: "capitalize", marginBottom: 6 }}>{dayLabel(d)}</div>
              {byDay.get(d)!.map((t) => {
                const m = catMeta(t.kind, t.category);
                const pos = t.kind === "income";
                return (
                  <div key={t.id} className="fin-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0" }}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, background: `${m.color}1f`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{m.icon}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{m.l[locale as "ru"] || m.l.ru}</div>
                      {t.note && <div style={{ fontSize: 12, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.note}</div>}
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: pos ? "#10b981" : "var(--text)", whiteSpace: "nowrap" }}>
                      {pos ? "+" : "−"}{fmtMoney(t.amount, t.currency, locale)}
                    </div>
                    <button onClick={() => del(t.id)} aria-label="delete" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, flexShrink: 0 }}>
                      <i className="ti ti-trash" style={{ fontSize: 15 }} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Сдвиг даты YYYY-MM-DD на ±N дней.
function shiftDay(d: string, delta: number) {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + delta);
  return dt.toISOString().slice(0, 10);
}
