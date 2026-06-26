"use client";

import { useState } from "react";

const T: Record<string, any> = {
  ru: { youNow: "Ты сейчас здесь", month: "/мес", choose: "Оформить", sending: "Отправляю…", sent: "Заявка отправлена ✓", popular: "Популярный", usage: "Записей в этом месяце", note: "Оплату подключим позже — пока оставь заявку, и мы свяжемся вручную.", soft: "Лимиты мягкие: это «честный потолок» от перегруза, а не жёсткая отсечка." },
  en: { youNow: "You're here now", month: "/mo", choose: "Choose", sending: "Sending…", sent: "Request sent ✓", popular: "Popular", usage: "Entries this month", note: "Payments come later — for now leave a request and we'll reach out.", soft: "Limits are soft: a fair ceiling against overload, not a hard cutoff." },
  uk: { youNow: "Ти зараз тут", month: "/міс", choose: "Оформити", sending: "Надсилаю…", sent: "Заявку надіслано ✓", popular: "Популярний", usage: "Записів цього місяця", note: "Оплату підключимо пізніше — поки залиш заявку, і ми зв'яжемося.", soft: "Ліміти м'які: чесна стеля від перевантаження, а не жорстка відсічка." },
  fr: { youNow: "Tu es ici", month: "/mois", choose: "Choisir", sending: "Envoi…", sent: "Demande envoyée ✓", popular: "Populaire", usage: "Entrées ce mois-ci", note: "Le paiement viendra plus tard — laisse une demande, on te recontacte.", soft: "Limites souples : un plafond juste contre la surcharge, pas un blocage." },
};

const PLANS: Record<string, any[]> = {
  ru: [
    { key: "free", name: "Старт", price: "0", tagline: "Чтобы начать вести жизнь", features: ["До 30 записей в месяц", "Голос и текст в Telegram", "Лента, теги, поиск", "Базовая аналитика"], cta: false },
    { key: "pro", name: "Pro", price: "6", tagline: "Полный дневник жизни", popular: true, features: ["Записи без счётчика (≈300/мес)", "Все AI-разделы: «Что заметил AI», Биограф", "Книга жизни, Мечты, Здоровье и вес", "Экспорт всех данных", "Поддержка"], cta: true },
    { key: "premium", name: "Премиум", price: "12", tagline: "Для тех, кто всерьёз", features: ["Всё из Pro", "Книга жизни в печать (PDF/типография)", "Ранний доступ к новым фичам", "Приоритетная поддержка"], cta: true },
  ],
  en: [
    { key: "free", name: "Start", price: "0", tagline: "To begin journaling life", features: ["Up to 30 entries/month", "Voice & text in Telegram", "Feed, tags, search", "Basic analytics"], cta: false },
    { key: "pro", name: "Pro", price: "6", tagline: "Your full life diary", popular: true, features: ["Entries without a meter (≈300/mo)", "All AI sections: Insights, Biographer", "Life Book, Dreams, Health & weight", "Export all data", "Support"], cta: true },
    { key: "premium", name: "Premium", price: "12", tagline: "For those who are serious", features: ["Everything in Pro", "Life Book print-ready (PDF/press)", "Early access to new features", "Priority support"], cta: true },
  ],
  uk: [
    { key: "free", name: "Старт", price: "0", tagline: "Щоб почати вести життя", features: ["До 30 записів на місяць", "Голос і текст у Telegram", "Стрічка, теги, пошук", "Базова аналітика"], cta: false },
    { key: "pro", name: "Pro", price: "6", tagline: "Повний щоденник життя", popular: true, features: ["Записи без лічильника (≈300/міс)", "Усі AI-розділи: Інсайти, Біограф", "Книга життя, Мрії, Здоров'я і вага", "Експорт усіх даних", "Підтримка"], cta: true },
    { key: "premium", name: "Преміум", price: "12", tagline: "Для тих, хто серйозно", features: ["Усе з Pro", "Книга життя у друк (PDF/типографія)", "Ранній доступ до нових фіч", "Пріоритетна підтримка"], cta: true },
  ],
  fr: [
    { key: "free", name: "Start", price: "0", tagline: "Pour commencer à journaliser", features: ["Jusqu'à 30 entrées/mois", "Voix & texte sur Telegram", "Fil, tags, recherche", "Analyses de base"], cta: false },
    { key: "pro", name: "Pro", price: "6", tagline: "Ton journal de vie complet", popular: true, features: ["Entrées sans compteur (≈300/mois)", "Toutes les sections IA : Insights, Biographe", "Livre de vie, Rêves, Santé & poids", "Export de toutes les données", "Support"], cta: true },
    { key: "premium", name: "Premium", price: "12", tagline: "Pour celles et ceux qui sont sérieux", features: ["Tout de Pro", "Livre de vie prêt à imprimer (PDF)", "Accès anticipé aux nouveautés", "Support prioritaire"], cta: true },
  ],
};

export default function PricingPlans({ locale, monthEntries, userName }: { locale: string; monthEntries: number; userName: string }) {
  const s = T[locale] || T.ru;
  const plans = PLANS[locale] || PLANS.ru;
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function order(plan: any) {
    if (busy) return;
    setBusy(plan.key);
    const text = `Хочу тариф: ${plan.name} ($${plan.price}${s.month}). Записей в этом месяце: ${monthEntries}.`;
    const r = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "plan_order", text }) });
    setBusy(null);
    if (r.ok) setSent((p) => ({ ...p, [plan.key]: true }));
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 16 }}>
        <i className="ti ti-pencil" style={{ fontSize: 14, color: "var(--accent)", verticalAlign: "-2px" }} /> {s.usage}: <b>{monthEntries}</b>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "start" }}>
        {plans.map((p) => {
          const isFree = p.key === "free";
          const accent = p.popular ? "#f59e0b" : "var(--border)";
          return (
            <div key={p.key} className="card" style={{ position: "relative", border: `1.5px solid ${p.popular ? "#f59e0b" : "var(--border)"}`, paddingTop: p.popular ? 22 : 16 }}>
              {p.popular && (
                <span style={{ position: "absolute", top: -10, left: 16, background: "#f59e0b", color: "#fff", fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }}>{s.popular}</span>
              )}
              <div style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 1, minHeight: 32 }}>{p.tagline}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, margin: "8px 0 12px" }}>
                <span style={{ fontSize: 28, fontWeight: 700 }}>${p.price}</span>
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>{s.month}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                {p.features.map((f: string, i: number) => (
                  <div key={i} style={{ fontSize: 12.5, color: "var(--text-2)", display: "flex", gap: 7, lineHeight: 1.4 }}>
                    <i className="ti ti-check" style={{ fontSize: 14, color: "#10b981", flexShrink: 0, marginTop: 1 }} />{f}
                  </div>
                ))}
              </div>
              {isFree ? (
                <div style={{ fontSize: 12.5, textAlign: "center", padding: "9px", borderRadius: 10, background: "var(--surface-2)", color: "var(--text-2)" }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 14, color: "#10b981", verticalAlign: "-2px" }} /> {s.youNow}
                </div>
              ) : sent[p.key] ? (
                <div style={{ fontSize: 12.5, textAlign: "center", padding: "9px", borderRadius: 10, background: "#10b9811a", color: "#10b981", fontWeight: 500 }}>{s.sent}</div>
              ) : (
                <button onClick={() => order(p)} disabled={!!busy} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: p.popular ? "#f59e0b" : "var(--accent)", color: "#fff", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
                  {busy === p.key ? s.sending : s.choose}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 14, lineHeight: 1.5 }}>
        <div>{s.soft}</div>
        <div style={{ marginTop: 3 }}>{s.note}</div>
      </div>
    </div>
  );
}
