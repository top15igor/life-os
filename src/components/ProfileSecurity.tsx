import Link from "next/link";
import { PinSettings } from "@/components/ProfileActions";

// Блок «Безопасность» (объяснение приватности + PIN). Вынесен на отдельную
// страницу /profile/security, чтобы профиль оставался компактным.

const STR: Record<string, { lead: string; sec: string[]; privacy: string; pinNote: string }> = {
  ru: {
    lead: "Твоя жизнь — закрыта и под защитой", privacy: "Подробнее о приватности",
    pinNote: "У тебя есть пароль или Google — этого достаточно для защиты входа. PIN можно не ставить (он нужен в основном для общего компьютера).",
    sec: ["Только ты видишь свои записи — вход лишь по твоей личной ссылке. Других пользователей в дневник мы не пускаем.", "Люди их не читают: ни другие пользователи, ни наша команда. Для статистики мы видим только обезличенные цифры — без текста записей.", "Текст видит только AI — и лишь чтобы готовить твои же резюме, ответы и Книгу жизни. На обучение моделей он не идёт.", "Данные передаются и хранятся в зашифрованном виде; доступ — по секретным ключам, которых нет в открытом коде.", "Ты полный владелец: в любой момент можешь скачать всё или удалить аккаунт без следа.", "Код LIFE OS открыт — можешь сам проверить, что именно происходит с данными."],
  },
  en: {
    lead: "Your life is private and protected", privacy: "More about privacy",
    pinNote: "You have a password or Google — that already protects your sign-in. A PIN is optional (mainly useful on a shared computer).",
    sec: ["Only you can see your entries — access is via your personal link. No other users are allowed into your diary.", "People don't read them: not other users, not our team. For statistics we see only anonymized numbers — no entry text.", "Only the AI sees the text — and only to prepare your own summaries, answers and Book of Life. It's never used to train models.", "Data is transferred and stored encrypted; access is via secret keys that are not in the open-source code.", "You fully own it: download everything or delete your account, without a trace, anytime.", "The LIFE OS code is open — check for yourself exactly what happens with your data."],
  },
  uk: {
    lead: "Твоє життя — закрите й під захистом", privacy: "Докладніше про приватність",
    pinNote: "У тебе є пароль або Google — цього достатньо для захисту входу. PIN можна не ставити (потрібен переважно для спільного комп'ютера).",
    sec: ["Лише ти бачиш свої записи — вхід тільки за твоїм особистим посиланням. Інших користувачів у щоденник ми не пускаємо.", "Люди їх не читають: ні інші користувачі, ні наша команда. Для статистики ми бачимо лише знеособлені цифри — без тексту записів.", "Текст бачить лише AI — і тільки щоб готувати твої ж резюме, відповіді та Книгу життя. На навчання моделей він не йде.", "Дані передаються і зберігаються у зашифрованому вигляді; доступ — за секретними ключами, яких немає у відкритому коді.", "Ти повний власник: будь-коли можеш завантажити все або видалити акаунт без сліду.", "Код LIFE OS відкритий — можеш сам перевірити, що саме відбувається з даними."],
  },
  fr: {
    lead: "Ta vie est privée et protégée", privacy: "En savoir plus sur la confidentialité",
    pinNote: "Tu as un mot de passe ou Google — cela protège déjà ta connexion. Le PIN est facultatif (utile surtout sur un ordinateur partagé).",
    sec: ["Toi seul vois tes entrées — l'accès se fait via ton lien personnel. Aucun autre utilisateur n'entre dans ton journal.", "Les gens ne les lisent pas : ni les autres utilisateurs, ni notre équipe. Pour les stats, on ne voit que des chiffres anonymes — sans le texte.", "Seule l'IA voit le texte — et uniquement pour préparer tes résumés, réponses et Livre de vie. Jamais pour entraîner des modèles.", "Les données sont transférées et stockées chiffrées ; l'accès se fait via des clés secrètes absentes du code ouvert.", "Tu en es le propriétaire : télécharge tout ou supprime ton compte, sans trace, à tout moment.", "Le code de LIFE OS est ouvert — vérifie toi-même ce qui se passe avec tes données."],
  },
  es: {
    lead: "Tu vida está privada y protegida", privacy: "Más sobre privacidad",
    pinNote: "Tienes contraseña o Google — eso ya protege tu acceso. El PIN es opcional (útil sobre todo en un ordenador compartido).",
    sec: ["Solo tú ves tus entradas — el acceso es a través de tu enlace personal. No dejamos entrar a otros usuarios a tu diario.", "Nadie las lee: ni otros usuarios ni nuestro equipo. Para las estadísticas solo vemos números anónimos — nunca el texto de tus entradas.", "Solo la IA ve el texto — y únicamente para preparar tus propios resúmenes, respuestas y tu Libro de vida. Nunca se usa para entrenar modelos.", "Los datos se transmiten y guardan cifrados; el acceso es mediante claves secretas que no están en el código abierto.", "Eres el dueño total: puedes descargarlo todo o eliminar tu cuenta sin dejar rastro, cuando quieras.", "El código de LIFE OS es abierto — puedes comprobar tú mismo qué pasa exactamente con tus datos."],
  },
};

export default function ProfileSecurity({ locale, hasPin, email }: { locale: string; hasPin: boolean; email: string | null }) {
  const s = STR[locale] || STR.ru;
  return (
    <>
      <div className="card" style={{ marginBottom: 12, background: "var(--surface-2)", border: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
          <i className="ti ti-shield-lock" style={{ fontSize: 22, color: "var(--positive)", flexShrink: 0 }} />
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{s.lead}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {s.sec.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
              <i className="ti ti-circle-check" style={{ fontSize: 16, color: "var(--positive)", flexShrink: 0, marginTop: 1 }} />{p}
            </div>
          ))}
        </div>
        <Link href="/privacy" style={{ fontSize: 12.5, color: "var(--accent)", display: "inline-block", marginTop: 11 }}>{s.privacy} →</Link>
      </div>
      {/* PIN: прячем для тех, у кого есть почта/Google (защита уже есть). Если PIN уже стоял — показываем. */}
      {(!email || hasPin) && (
        <>
          {email && hasPin && <div style={{ fontSize: 12, color: "var(--text-3)", margin: "0 0 8px", lineHeight: 1.45 }}>{s.pinNote}</div>}
          <PinSettings locale={locale} hasPin={hasPin} />
        </>
      )}
    </>
  );
}
