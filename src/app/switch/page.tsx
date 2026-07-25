import Link from "next/link";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

// Экран после попытки входа по ЧУЖОЙ ссылке. Сюда ведёт /u/<token>, когда в браузере
// уже есть сессия другого пользователя (частый случай: переслали сообщение бота с
// кнопкой). Кнопки «всё равно войти» больше НЕТ: ссылка уже сожжена на сервере,
// владельцу отправлено предупреждение в бота. Открывший остаётся в своём аккаунте.
const STR: Record<string, any> = {
  ru: {
    title: "Это была ссылка другого человека",
    body: (who: string) => `Ты открыл личную ссылку входа${who ? ` (${who})` : ""} — обычно так бывает, когда пересылают сообщение из бота. Для безопасности я погасил эту ссылку: по ней больше никто не войдёт, а владелец получил предупреждение и свежую ссылку. Ты остаёшься в своём аккаунте.`,
    hint: "Если это правда твой второй аккаунт — выйди из текущего (Профиль → Выйти) и возьми свежую ссылку командой /link у бота.",
    stay: "Остаться в своём аккаунте",
  },
  en: {
    title: "That link belonged to someone else",
    body: (who: string) => `You opened a personal sign-in link${who ? ` (${who})` : ""} — this usually happens when a bot message gets forwarded. For safety I've burned that link: nobody can use it anymore, and its owner got a warning with a fresh one. You stay in your own account.`,
    hint: "If it really is your second account — sign out of the current one (Profile → Sign out) and get a fresh link with /link in the bot.",
    stay: "Stay in my account",
  },
  uk: {
    title: "Це було посилання іншої людини",
    body: (who: string) => `Ти відкрив особисте посилання входу${who ? ` (${who})` : ""} — зазвичай так буває, коли пересилають повідомлення з бота. Для безпеки я погасив це посилання: ним більше ніхто не увійде, а власник отримав попередження і свіже посилання. Ти залишаєшся у своєму акаунті.`,
    hint: "Якщо це справді твій другий акаунт — вийди з поточного (Профіль → Вийти) і візьми свіже посилання командою /link у бота.",
    stay: "Залишитись у своєму акаунті",
  },
  fr: {
    title: "Ce lien appartenait à quelqu'un d'autre",
    body: (who: string) => `Tu as ouvert un lien de connexion personnel${who ? ` (${who})` : ""} — cela arrive souvent quand un message du bot est transféré. Par sécurité, j'ai désactivé ce lien : plus personne ne peut l'utiliser, et son propriétaire a reçu un avertissement avec un nouveau lien. Tu restes dans ton propre compte.`,
    hint: "Si c'est vraiment ton second compte — déconnecte-toi du compte actuel (Profil → Déconnexion) et obtiens un nouveau lien avec /link dans le bot.",
    stay: "Rester dans mon compte",
  },
  es: {
    title: "Ese enlace era de otra persona",
    body: (who: string) => `Abriste un enlace de acceso personal${who ? ` (${who})` : ""} — suele pasar cuando se reenvía un mensaje del bot. Por seguridad he anulado ese enlace: ya nadie puede usarlo, y su dueño recibió un aviso con uno nuevo. Tú sigues en tu propia cuenta.`,
    hint: "Si de verdad es tu segunda cuenta — cierra la sesión actual (Perfil → Salir) y consigue un enlace nuevo con /link en el bot.",
    stay: "Quedarme en mi cuenta",
  },
};

export default async function SwitchPage({ searchParams }: { searchParams: Promise<{ who?: string; t?: string }> }) {
  const { who: whoRaw } = await searchParams; // t (legacy-ссылки из истории) игнорируем — вход по ним закрыт
  const locale = await getLocale();
  const s = STR[locale] || STR.ru;
  const who = String(whoRaw || "").slice(0, 60);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg, #0f172a)" }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 99, background: "#f59e0b22", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <i className="ti ti-flame" style={{ fontSize: 30, color: "#f59e0b" }} />
        </div>
        <div style={{ fontSize: 21, fontWeight: 700, color: "var(--text, #fff)", marginBottom: 10 }}>{s.title}</div>
        <div style={{ fontSize: 14, color: "var(--text-2, #94a3b8)", lineHeight: 1.55, marginBottom: 18 }}>{s.body(who)}</div>

        <Link href="/" style={{ display: "block", padding: "13px", borderRadius: 12, background: "var(--accent, #6366f1)", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none", marginBottom: 14 }}>
          {s.stay}
        </Link>
        <div style={{ fontSize: 12.5, color: "var(--text-3, #64748b)", lineHeight: 1.55 }}>{s.hint}</div>
      </div>
    </div>
  );
}
