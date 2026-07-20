import Link from "next/link";
import { cookies } from "next/headers";
import { ProfileButtons } from "@/components/ProfileActions";
import LangSwitcher from "@/components/LangSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import ChatToneSettings from "@/components/ChatToneSettings";
import { normalizeMorningPrefs } from "@/lib/morningPrefs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { CurrentUser } from "@/lib/auth";

const THEME_LABEL: Record<string, string> = { ru: "Тема", en: "Theme", uk: "Тема", fr: "Thème" };

const STR: Record<string, any> = {
  ru: { title: "Профиль", privateT: "Это твой личный кабинет", privateS: "Дневник виден только тебе — по этой личной ссылке. Никто другой его не видит, и в публичном доступе его нет.", yourLink: "Твоя личная ссылка", linkHint: "Сохрани её — по ней ты входишь в свой дневник на любом устройстве.", backupT: "Запасной вход по ссылке", backupS: "У тебя уже есть вход через Google или почту. Эта личная ссылка — запасной ключ: по ней тоже можно войти на любом устройстве. Никому не пересылай — кто откроет, попадёт в твой дневник.", pinNote: "У тебя есть пароль или Google — этого достаточно для защиты входа. PIN можно не ставить (он нужен в основном для общего компьютера).", language: "Язык", privacy: "Подробнее о приватности", yourData: "Твои данные", exportBtn: "Скачать мои данные", exportHint: "Все твои записи в одном файле — забери в любой момент. А код LIFE OS открыт: можешь сам проверить, что мы делаем с данными.", openCode: "Открытый код на GitHub", obsidianBtn: "Скачать для Obsidian (Markdown)", obsidianHint: "Хочешь хранить всё у себя? Скачай дневник папкой Markdown-файлов и открой в Obsidian — данные станут полностью твоими, без зависимости от нас.", accent: "Акцент главной", security: "Безопасность", dataS: "Экспорт записей, Obsidian, открытый код.", secS: "Приватность и PIN-код.", danger: "Управление аккаунтом", plan: "Тариф", planSub: "Сейчас ты на «Старт». Больше живёшь в дневнике — больше он даёт.", planBtn: "Смотреть тарифы", refT: "Мои приглашённые", refS: "Кого ты привёл — и кого пригласили они. Деревом.", refBtn: "Открыть", accountT: "Аккаунт и вход", accountS: "Ссылка, @имя, способы входа.", notifT: "Пуш-уведомления", notifS: "Утро, вечер, время, тон и стиль сообщений.", secLead: "Твоя жизнь — закрыта и под защитой", sec: ["Только ты видишь свои записи — вход лишь по твоей личной ссылке. Других пользователей в дневник мы не пускаем.", "Люди их не читают: ни другие пользователи, ни наша команда. Для статистики мы видим только обезличенные цифры — без текста записей.", "Текст видит только AI — и лишь чтобы готовить твои же резюме, ответы и Книгу жизни. На обучение моделей он не идёт.", "Данные передаются и хранятся в зашифрованном виде; доступ — по секретным ключам, которых нет в открытом коде.", "Ты полный владелец: в любой момент можешь скачать всё или удалить аккаунт без следа.", "Код LIFE OS открыт — можешь сам проверить, что именно происходит с данными."] },
  en: { title: "Profile", privateT: "This is your private space", privateS: "Your diary is visible only to you — via this personal link. No one else can see it, and it's not public.", yourLink: "Your personal link", linkHint: "Save it — it's how you sign in to your diary on any device.", backupT: "Backup access via link", backupS: "You already sign in with Google or email. This personal link is a backup key — it also lets you in on any device. Don't forward it: whoever opens it gets into your diary.", pinNote: "You have a password or Google — that already protects your sign-in. A PIN is optional (mainly useful on a shared computer).", language: "Language", privacy: "More about privacy", yourData: "Your data", exportBtn: "Download my data", exportHint: "All your entries in one file — take them anytime. And the LIFE OS code is open: check for yourself what we do with data.", openCode: "Open source on GitHub", obsidianBtn: "Download for Obsidian (Markdown)", obsidianHint: "Want to keep everything yourself? Download your diary as a folder of Markdown files and open it in Obsidian — your data becomes fully yours, independent of us.", accent: "Home accent", security: "Security", dataS: "Export entries, Obsidian, open source.", secS: "Privacy and PIN.", danger: "Account", plan: "Plan", planSub: "You're on Start. The more you live in your diary, the more it gives back.", planBtn: "See plans", refT: "People you invited", refS: "Who you brought — and who they invited. As a tree.", refBtn: "Open", accountT: "Account & sign-in", accountS: "Link, @username, sign-in methods.", notifT: "Push notifications", notifS: "Morning, evening, time, tone and message style.", secLead: "Your life is private and protected", sec: ["Only you can see your entries — access is via your personal link. No other users are allowed into your diary.", "People don't read them: not other users, not our team. For statistics we see only anonymized numbers — no entry text.", "Only the AI sees the text — and only to prepare your own summaries, answers and Book of Life. It's never used to train models.", "Data is transferred and stored encrypted; access is via secret keys that are not in the open-source code.", "You fully own it: download everything or delete your account, without a trace, anytime.", "The LIFE OS code is open — check for yourself exactly what happens with your data."] },
  uk: { title: "Профіль", privateT: "Це твій особистий кабінет", privateS: "Щоденник бачиш лише ти — за цим особистим посиланням. Ніхто інший його не бачить, і в публічному доступі його немає.", yourLink: "Твоє особисте посилання", linkHint: "Збережи його — за ним ти входиш у щоденник на будь-якому пристрої.", backupT: "Запасний вхід за посиланням", backupS: "У тебе вже є вхід через Google або пошту. Це особисте посилання — запасний ключ: за ним теж можна увійти на будь-якому пристрої. Нікому не пересилай — хто відкриє, потрапить у твій щоденник.", pinNote: "У тебе є пароль або Google — цього достатньо для захисту входу. PIN можна не ставити (потрібен переважно для спільного комп'ютера).", language: "Мова", privacy: "Докладніше про приватність", yourData: "Твої дані", exportBtn: "Завантажити мої дані", exportHint: "Усі твої записи в одному файлі — забери будь-коли. А код LIFE OS відкритий: можеш сам перевірити, що ми робимо з даними.", openCode: "Відкритий код на GitHub", obsidianBtn: "Завантажити для Obsidian (Markdown)", obsidianHint: "Хочеш зберігати все в себе? Завантаж щоденник текою Markdown-файлів і відкрий в Obsidian — дані стануть повністю твоїми, без залежності від нас.", accent: "Акцент головної", security: "Безпека", dataS: "Експорт записів, Obsidian, відкритий код.", secS: "Приватність і PIN-код.", danger: "Керування акаунтом", plan: "Тариф", planSub: "Зараз ти на «Старт». Більше живеш у щоденнику — більше він дає.", planBtn: "Дивитися тарифи", refT: "Мої запрошені", refS: "Кого ти привів — і кого запросили вони. Деревом.", refBtn: "Відкрити", accountT: "Акаунт і вхід", accountS: "Посилання, @ім'я, способи входу.", notifT: "Пуш-сповіщення", notifS: "Ранок, вечір, час, тон і стиль повідомлень.", secLead: "Твоє життя — закрите й під захистом", sec: ["Лише ти бачиш свої записи — вхід тільки за твоїм особистим посиланням. Інших користувачів у щоденник ми не пускаємо.", "Люди їх не читають: ні інші користувачі, ні наша команда. Для статистики ми бачимо лише знеособлені цифри — без тексту записів.", "Текст бачить лише AI — і тільки щоб готувати твої ж резюме, відповіді та Книгу життя. На навчання моделей він не йде.", "Дані передаються і зберігаються у зашифрованому вигляді; доступ — за секретними ключами, яких немає у відкритому коді.", "Ти повний власник: будь-коли можеш завантажити все або видалити акаунт без сліду.", "Код LIFE OS відкритий — можеш сам перевірити, що саме відбувається з даними."] },
  fr: { title: "Profil", privateT: "C'est ton espace privé", privateS: "Ton journal n'est visible que par toi — via ce lien personnel. Personne d'autre ne le voit, il n'est pas public.", yourLink: "Ton lien personnel", linkHint: "Garde-le — c'est ainsi que tu te connectes sur n'importe quel appareil.", backupT: "Accès de secours par lien", backupS: "Tu te connectes déjà avec Google ou e-mail. Ce lien personnel est une clé de secours : il permet aussi d'entrer sur n'importe quel appareil. Ne le transfère pas — quiconque l'ouvre entre dans ton journal.", pinNote: "Tu as un mot de passe ou Google — cela protège déjà ta connexion. Le PIN est facultatif (utile surtout sur un ordinateur partagé).", language: "Langue", privacy: "En savoir plus sur la confidentialité", yourData: "Tes données", exportBtn: "Télécharger mes données", exportHint: "Toutes tes entrées en un fichier — récupère-les quand tu veux. Et le code de LIFE OS est ouvert : vérifie toi-même ce qu'on fait des données.", openCode: "Code source sur GitHub", obsidianBtn: "Télécharger pour Obsidian (Markdown)", obsidianHint: "Tu veux tout garder chez toi ? Télécharge ton journal en dossier de fichiers Markdown et ouvre-le dans Obsidian — tes données t'appartiennent entièrement.", accent: "Accent de l'accueil", security: "Sécurité", dataS: "Export, Obsidian, code ouvert.", secS: "Confidentialité et code PIN.", danger: "Compte", plan: "Forfait", planSub: "Tu es sur Start. Plus tu vis dans ton journal, plus il te rend.", planBtn: "Voir les forfaits", refT: "Tes invités", refS: "Qui tu as amené — et qui ils ont invité. En arbre.", refBtn: "Ouvrir", accountT: "Compte et connexion", accountS: "Lien, @nom, méthodes de connexion.", notifT: "Notifications push", notifS: "Matin, soir, heure, ton et style des messages.", secLead: "Ta vie est privée et protégée", sec: ["Toi seul vois tes entrées — l'accès se fait via ton lien personnel. Aucun autre utilisateur n'entre dans ton journal.", "Les gens ne les lisent pas : ni les autres utilisateurs, ni notre équipe. Pour les stats, on ne voit que des chiffres anonymes — sans le texte.", "Seule l'IA voit le texte — et uniquement pour préparer tes résumés, réponses et Livre de vie. Jamais pour entraîner des modèles.", "Les données sont transférées et stockées chiffrées ; l'accès se fait via des clés secrètes absentes du code ouvert.", "Tu en es le propriétaire : télécharge tout ou supprime ton compte, sans trace, à tout moment.", "Le code de LIFE OS est ouvert — vérifie toi-même ce qui se passe avec tes données."] },
};

export default async function ProfileBody({ user, locale }: { user: CurrentUser; locale: string }) {
  const s = STR[locale] || STR.ru;
  const initial = (user.name || "?").trim().charAt(0).toUpperCase() || "?";
  const showPushToggle = !!user.chat_id; // пуши приходят только тем, кто в Telegram
  const tc = (await cookies()).get("theme")?.value;
  const themePref = (tc === "light" || tc === "dark" || tc === "auto" ? tc : "auto") as "auto" | "light" | "dark";

  // Тон общения с ботом (AI-друг) — хранится в morning_prefs, читаем мягко.
  let chatPrefs = normalizeMorningPrefs(null);
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", user.id).maybeSingle();
    chatPrefs = normalizeMorningPrefs((data as any)?.morning_prefs);
  } catch { /* нет колонки — дефолты */ }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 22 }}>
        <span style={{ width: 52, height: 52, borderRadius: 99, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600 }}>{initial}</span>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{user.name || "—"}</div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>{s.title} · LIFE OS</div>
        </div>
      </div>

      {/* Аккаунт и вход → отдельная страница (ссылка, @имя, способы входа) */}
      <Link href="/profile/account" className="card" style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
        <i className="ti ti-user-circle" style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{s.accountT}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>{s.accountS}</div>
        </div>
        <span style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 500, whiteSpace: "nowrap" }}>{s.refBtn} →</span>
      </Link>

      {/* Мои приглашённые (реферальное дерево) */}
      <Link href="/referrals" className="card" style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
        <i className="ti ti-affiliate" style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{s.refT}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>{s.refS}</div>
        </div>
        <span style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 500, whiteSpace: "nowrap" }}>{s.refBtn} →</span>
      </Link>

      {/* Пуш-уведомления: отдельная страница со всеми настройками (утро/вечер/время/тон…) */}
      {showPushToggle && (
        <Link href="/profile/notifications" className="card" style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
          <i className="ti ti-bell" style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{s.notifT}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>{s.notifS}</div>
          </div>
          <span style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 500, whiteSpace: "nowrap" }}>{s.refBtn} →</span>
        </Link>
      )}

      {/* Тон общения с ботом (AI-друг: чат + голос) — здесь же, не в пушах */}
      <ChatToneSettings locale={locale} initial={chatPrefs} />

      {/* Твои данные → отдельная страница */}
      <Link href="/profile/data" className="card" style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
        <i className="ti ti-database" style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{s.yourData}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>{s.dataS}</div>
        </div>
        <span style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 500, whiteSpace: "nowrap" }}>{s.refBtn} →</span>
      </Link>

      {/* Безопасность → отдельная страница */}
      <Link href="/profile/security" className="card" style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
        <i className="ti ti-shield-lock" style={{ fontSize: 22, color: "var(--positive)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{s.security}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>{s.secS}</div>
        </div>
        <span style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 500, whiteSpace: "nowrap" }}>{s.refBtn} →</span>
      </Link>

      {/* Тестировщик → отдельная страница (режим + условия) */}
      <Link href="/profile/tester" className="card" style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
        <i className="ti ti-bug" style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Тестировщик</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>Тестируй приложение и получай за баги. Отчёты, условия, оплата.</div>
        </div>
        <span style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 500, whiteSpace: "nowrap" }}>{s.refBtn} →</span>
      </Link>

      {/* Тариф */}
      <Link href="/pricing" className="card" style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16, border: "1px solid #f59e0b55", background: "#f59e0b0d" }}>
        <i className="ti ti-star" style={{ fontSize: 22, color: "#f59e0b", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{s.plan}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>{s.planSub}</div>
        </div>
        <span style={{ fontSize: 12.5, color: "#f59e0b", fontWeight: 500, whiteSpace: "nowrap" }}>{s.planBtn} →</span>
      </Link>

      {/* Язык */}
      <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{s.language}</span>
        <LangSwitcher current={locale as any} />
      </div>

      {/* Тема оформления */}
      <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{THEME_LABEL[locale] || THEME_LABEL.ru}</span>
        <ThemeSwitcher current={themePref} locale={locale} />
      </div>

      {/* Управление */}
      <div style={{ fontSize: 13, color: "var(--text-2)", margin: "20px 0 10px" }}>{s.danger}</div>
      <ProfileButtons locale={locale} />
    </div>
  );
}
