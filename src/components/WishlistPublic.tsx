"use client";

import { useEffect, useState } from "react";
import { formatPrice, type PublicWish } from "@/lib/wishlist";

const T: Record<string, any> = {
  ru: {
    title: (n: string | null) => (n ? `Вишлист — ${n}` : "Вишлист"),
    lead: "Выбери, что подаришь. Бронь тайная: автор списка не видит, что занято, — сюрприз сохранится.",
    open: "Открыть в магазине",
    give: "Дарю это",
    taken: "Уже дарят",
    mine: "Вы дарите",
    cancel: "Отменить",
    askName: "Как тебя записать? (необязательно, видят только другие гости)",
    empty: "Список пока пуст.",
    cta: "Хочешь такой же вишлист? Заведи свой в LIFE OS",
  },
  en: {
    title: (n: string | null) => (n ? `${n}'s wishlist` : "Wishlist"),
    lead: "Pick what you'll gift. Reservations are secret — the list owner won't see what's taken, so the surprise stays.",
    open: "Open in store",
    give: "I'll gift this",
    taken: "Already taken",
    mine: "You're gifting",
    cancel: "Cancel",
    askName: "Your name? (optional, only other guests see it)",
    empty: "The list is empty for now.",
    cta: "Want a wishlist like this? Create yours in LIFE OS",
  },
};

function getToken(): string {
  try {
    let tk = localStorage.getItem("lifeos_wish_token");
    if (!tk) { tk = (crypto as any).randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now(); localStorage.setItem("lifeos_wish_token", tk); }
    return tk;
  } catch { return "anon-" + Date.now(); }
}

export default function WishlistPublic({ locale, ownerName, wishes: initial }: { locale: string; ownerName: string | null; wishes: PublicWish[] }) {
  const t = locale === "en" || locale === "fr" ? T.en : T.ru;
  const [wishes, setWishes] = useState<PublicWish[]>(initial);
  const [mine, setMine] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lifeos_wish_mine");
      if (raw) setMine(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  function persistMine(next: Set<string>) {
    setMine(new Set(next));
    try { localStorage.setItem("lifeos_wish_mine", JSON.stringify([...next])); } catch {}
  }

  async function give(id: string) {
    const name = window.prompt(t.askName) || "";
    const token = getToken();
    const r = await fetch("/api/wish/reserve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "reserve", wishId: id, token, name }) }).then((x) => x.json()).catch(() => ({ ok: false }));
    if (r?.ok) {
      setWishes((w) => w.map((x) => (x.id === id ? { ...x, reserved: true } : x)));
      const next = new Set(mine); next.add(id); persistMine(next);
    } else if (r?.error === "taken") {
      setWishes((w) => w.map((x) => (x.id === id ? { ...x, reserved: true } : x)));
    }
  }

  async function cancel(id: string) {
    const token = getToken();
    await fetch("/api/wish/reserve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "unreserve", wishId: id, token }) }).catch(() => {});
    setWishes((w) => w.map((x) => (x.id === id ? { ...x, reserved: false } : x)));
    const next = new Set(mine); next.delete(id); persistMine(next);
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 18px 60px" }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 9 }}>
        <i className="ti ti-gift" style={{ fontSize: 26, color: "#ec4899" }} />{t.title(ownerName)}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginTop: 8, marginBottom: 22, maxWidth: 600 }}>{t.lead}</div>

      {wishes.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--text-2)", padding: "30px 20px" }}>{t.empty}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {wishes.map((w) => {
            const isMine = mine.has(w.id);
            const taken = w.reserved && !isMine;
            return (
              <div key={w.id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {w.image_url ? (
                  <a href={w.url || "#"} target="_blank" rel="noreferrer" style={{ display: "block", aspectRatio: "1 / 1", background: "var(--surface-2)" }}>
                    <img src={w.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </a>
                ) : (
                  <div style={{ aspectRatio: "1 / 1", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-gift" style={{ fontSize: 38, color: "var(--text-3)" }} />
                  </div>
                )}
                <div style={{ padding: "11px 12px 13px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{w.title}</div>
                  {formatPrice(w.price, w.currency) && <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>{formatPrice(w.price, w.currency)}</div>}
                  {w.note && <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, background: "var(--surface-2)", borderRadius: 8, padding: "6px 9px" }}>{w.note}</div>}
                  {w.url && <a href={w.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>{t.open} →</a>}

                  <div style={{ marginTop: "auto", paddingTop: 8 }}>
                    {isMine ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: "#16a34a", fontWeight: 600 }}><i className="ti ti-check" /> {t.mine}</span>
                        <button onClick={() => cancel(w.id)} style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 12, cursor: "pointer", padding: 0 }}>{t.cancel}</button>
                      </div>
                    ) : taken ? (
                      <span style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 500 }}><i className="ti ti-lock" /> {t.taken}</span>
                    ) : (
                      <button onClick={() => give(w.id)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "none", background: "#ec4899", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        <i className="ti ti-gift" style={{ fontSize: 15, verticalAlign: "-2px" }} /> {t.give}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 36 }}>
        <a href="/" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>{t.cta} →</a>
      </div>
    </div>
  );
}
