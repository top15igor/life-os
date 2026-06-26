"use client";

import { useState } from "react";
import Link from "next/link";

const T: Record<string, any> = {
  ru: { youNow: "Ты сейчас здесь", month: "/мес", choose: "Оформить", sending: "Отправляю…", sent: "Заявка отправлена ✓", popular: "Популярный", usage: "Записей в этом месяце", note: "Оплату подключим позже — пока оставь заявку, и мы свяжемся вручную.", soft: "Лимиты мягкие: это «честный потолок» от перегруза, а не жёсткая отсечка.", bookTitle: "Хочешь печатную «Книгу жизни»?", bookSub: "Твоя жизнь в твёрдой обложке — чтобы подарить близким. Это разовый заказ, отдельно от подписки.", bookCta: "Заказать книгу" },
  en: { youNow: "You're here now", month: "/mo", choose: "Choose", sending: "Sending…", sent: "Request sent ✓", popular: "Popular", usage: "Entries this month", note: "Payments come later — for now leave a request and we'll reach out.", soft: "Limits are soft: a fair ceiling against overload, not a hard cutoff.", bookTitle: "Want a printed Book of Life?", bookSub: "Your life in a hardcover — to gift your loved ones. A one-time order, separate from the subscription.", bookCta: "Order the book" },
  uk: { youNow: "Ти зараз тут", month: "/міс", choose: "Оформити", sending: "Надсилаю…", sent: "Заявку надіслано ✓", popular: "Популярний", usage: "Записів цього місяця", note: "Оплату підключимо пізніше — поки залиш заявку, і ми зв'яжемося.", soft: "Ліміти м'які: чесна стеля від перевантаження, а не жорстка відсічка.", bookTitle: "Хочеш друковану «Книгу життя»?", bookSub: "Твоє життя у твердій обкладинці — щоб подарувати близьким. Це разове замовлення, окремо від підписки.", bookCta: "Замовити книгу" },
  fr: { youNow: "Tu es ici", month: "/mois", choose: "Choisir", sending: "Envoi…", sent: "Demande envoyée ✓", popular: "Populaire", usage: "Entrées ce mois-ci", note: "Le paiement viendra plus tard — laisse une demande, on te recontacte.", soft: "Limites souples : un plafond juste contre la surcharge, pas un blocage.", bookTitle: "Envie d'un Livre de vie imprimé ?", bookSub: "Ta vie en couverture rigide — à offrir à tes proches. Une commande unique, séparée de l'abonnement.", bookCta: "Commander le livre" },
};

const PLANS: Record<string, any[]> = {
  ru: [
    { key: "free", name: "Старт", price: "0", tagline: "Попробовать и привыкнуть", features: ["До 30 записей в месяц", "Голос и текст в Telegram", "Лента, поиск, теги, настроение", "Базовые графики самочувствия"], cta: false },
    { key: "pro", name: "Pro", price: "9.99", tagline: "Весь дневник, без ограничений", popular: true, features: ["Записи без лимита (честный потолок ~300/мес)", "AI «Что заметил AI»: паттерны, инсайты, зеркало жизни", "AI-Биограф: вопросы о своей жизни", "Книга жизни, Карта мечты, трекер веса", "Экспорт всех данных · поддержка"], cta: true },
    { key: "premium", name: "Премиум", price: "19.99", tagline: "Для семьи и печатной книги", features: ["Всё из Pro, без потолка записей", "📖 Печатная «Книга жизни» (типография + доставка)", "Семейный доступ (скоро)", "Ранний доступ к новым функциям", "Приоритетная поддержка"], cta: true },
  ],
  en: [
    { key: "free", name: "Start", price: "0", tagline: "Try it and build the habit", features: ["Up to 30 entries/month", "Voice & text in Telegram", "Feed, search, tags, mood", "Basic wellbeing charts"], cta: false },
    { key: "pro", name: "Pro", price: "9.99", tagline: "The whole diary, no limits", popular: true, features: ["Unlimited entries (fair cap ~300/mo)", "AI Insights: patterns, mirror of life", "AI Biographer: ask about your life", "Life Book, Dream Map, weight tracker", "Export all data · support"], cta: true },
    { key: "premium", name: "Premium", price: "19.99", tagline: "For family & a printed book", features: ["Everything in Pro, no entry cap", "📖 Printed Life Book (press + delivery)", "Family access (soon)", "Early access to new features", "Priority support"], cta: true },
  ],
  uk: [
    { key: "free", name: "Старт", price: "0", tagline: "Спробувати і звикнути", features: ["До 30 записів на місяць", "Голос і текст у Telegram", "Стрічка, пошук, теги, настрій", "Базові графіки самопочуття"], cta: false },
    { key: "pro", name: "Pro", price: "9.99", tagline: "Весь щоденник, без обмежень", popular: true, features: ["Записи без ліміту (чесна стеля ~300/міс)", "AI-Інсайти: патерни, дзеркало життя", "AI-Біограф: питання про своє життя", "Книга життя, Карта мрії, трекер ваги", "Експорт усіх даних · підтримка"], cta: true },
    { key: "premium", name: "Преміум", price: "19.99", tagline: "Для сім'ї та друкованої книги", features: ["Усе з Pro, без стелі записів", "📖 Друкована «Книга життя» (типографія + доставка)", "Сімейний доступ (скоро)", "Ранній доступ до нових функцій", "Пріоритетна підтримка"], cta: true },
  ],
  fr: [
    { key: "free", name: "Start", price: "0", tagline: "Essayer et prendre l'habitude", features: ["Jusqu'à 30 entrées/mois", "Voix & texte sur Telegram", "Fil, recherche, tags, humeur", "Graphiques de bien-être de base"], cta: false },
    { key: "pro", name: "Pro", price: "9.99", tagline: "Tout le journal, sans limites", popular: true, features: ["Entrées illimitées (plafond juste ~300/mois)", "IA Insights : tendances, miroir de vie", "Biographe IA : questions sur ta vie", "Livre de vie, Carte des rêves, suivi du poids", "Export de toutes les données · support"], cta: true },
    { key: "premium", name: "Premium", price: "19.99", tagline: "Pour la famille & un livre imprimé", features: ["Tout de Pro, sans plafond d'entrées", "📖 Livre de vie imprimé (presse + livraison)", "Accès famille (bientôt)", "Accès anticipé aux nouveautés", "Support prioritaire"], cta: true },
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

      {/* Печатная книга — разовый заказ, отдельно от подписки */}
      <Link href="/lifebook" className="card" style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, textDecoration: "none", color: "var(--text)", background: "linear-gradient(135deg, var(--accent-bg), #fff7ed)", border: "1px solid var(--border)" }}>
        <span style={{ width: 44, height: 44, borderRadius: 11, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <i className="ti ti-book-2" style={{ fontSize: 24, color: "var(--accent)" }} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{s.bookTitle}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, marginTop: 2 }}>{s.bookSub}</div>
        </div>
        <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>{s.bookCta}<i className="ti ti-arrow-right" style={{ fontSize: 16 }} /></span>
      </Link>

      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 14, lineHeight: 1.5 }}>
        <div>{s.soft}</div>
        <div style={{ marginTop: 3 }}>{s.note}</div>
      </div>
    </div>
  );
}
