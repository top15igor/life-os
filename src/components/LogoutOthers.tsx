"use client";

import { useState } from "react";

const STR: Record<string, any> = {
  ru: {
    title: "Безопасность",
    lead: "Если ты делилась ссылкой-входом, здесь можно отключить все другие устройства. Войти снова они смогут только с твоим паролем/Google или новой ссылкой из бота. Ты на этом устройстве останешься.",
    btn: "Выйти на всех других устройствах",
    busy: "Отключаю…",
    confirm: "Отключить все другие устройства? Ты останешься в системе здесь.",
    done: "Готово — все другие устройства отключены ✓",
  },
  en: {
    title: "Security",
    lead: "If you've ever shared your login link, you can sign out all other devices here. They'll only be able to get back in with your password/Google or a fresh link from the bot. You stay signed in on this device.",
    btn: "Sign out all other devices",
    busy: "Signing out…",
    confirm: "Sign out all other devices? You'll stay signed in here.",
    done: "Done — all other devices signed out ✓",
  },
  uk: {
    title: "Безпека",
    lead: "Якщо ти ділилася посиланням-входом, тут можна відключити всі інші пристрої. Увійти знову вони зможуть лише з твоїм паролем/Google або новим посиланням із бота. На цьому пристрої ти залишишся.",
    btn: "Вийти на всіх інших пристроях",
    busy: "Відключаю…",
    confirm: "Відключити всі інші пристрої? Тут ти залишишся в системі.",
    done: "Готово — усі інші пристрої відключено ✓",
  },
  fr: {
    title: "Sécurité",
    lead: "Si tu as partagé ton lien de connexion, tu peux déconnecter tous les autres appareils ici. Ils ne pourront revenir qu'avec ton mot de passe/Google ou un nouveau lien du bot. Tu restes connectée sur cet appareil.",
    btn: "Déconnecter tous les autres appareils",
    busy: "Déconnexion…",
    confirm: "Déconnecter tous les autres appareils ? Tu restes connectée ici.",
    done: "Terminé — tous les autres appareils déconnectés ✓",
  },
  es: {
    title: "Seguridad",
    lead: "Si compartiste alguna vez tu enlace de acceso, aquí puedes cerrar sesión en todos los demás dispositivos. Solo podrán volver a entrar con tu contraseña/Google o un enlace nuevo del bot. Tú seguirás con la sesión iniciada en este dispositivo.",
    btn: "Cerrar sesión en todos los demás dispositivos",
    busy: "Cerrando sesión…",
    confirm: "¿Cerrar sesión en todos los demás dispositivos? Aquí seguirás con la sesión iniciada.",
    done: "Listo — todos los demás dispositivos han cerrado sesión ✓",
  },
};

export default function LogoutOthers({ locale }: { locale: string }) {
  const s = STR[locale] || STR.ru;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function go() {
    if (busy || done) return;
    if (!confirm(s.confirm)) return;
    setBusy(true);
    const r = await fetch("/api/auth/logout-others", { method: "POST" }).then((x) => x.json()).catch(() => ({ ok: false }));
    setBusy(false);
    if (r?.ok) setDone(true);
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <i className="ti ti-shield-lock" style={{ fontSize: 18, color: "var(--accent)" }} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 12 }}>{s.lead}</div>
      {done ? (
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--positive)" }}>{s.done}</div>
      ) : (
        <button
          onClick={go}
          disabled={busy}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 10, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", fontSize: 13.5, fontWeight: 500, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}
        >
          <i className="ti ti-logout-2" style={{ fontSize: 16 }} />{busy ? s.busy : s.btn}
        </button>
      )}
    </div>
  );
}
