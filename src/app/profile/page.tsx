import { headers, cookies } from "next/headers";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import LangSwitcher from "@/components/LangSwitcher";
import { CopyLink, ProfileButtons, PinSettings } from "@/components/ProfileActions";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const STR: Record<string, any> = {
  ru: { title: "Профиль", privateT: "Это твой личный кабинет", privateS: "Дневник виден только тебе — по этой личной ссылке. Никто другой его не видит, и в публичном доступе его нет.", yourLink: "Твоя личная ссылка", linkHint: "Сохрани её — по ней ты входишь в свой дневник на любом устройстве.", language: "Язык", privacy: "Подробнее о приватности", yourData: "Твои данные", exportBtn: "Скачать мои данные", exportHint: "Все твои записи в одном файле — забери в любой момент. А код LIFE OS открыт: можешь сам проверить, что мы делаем с данными.", openCode: "Открытый код на GitHub", obsidianBtn: "Скачать для Obsidian (Markdown)", obsidianHint: "Хочешь хранить всё у себя? Скачай дневник папкой Markdown-файлов и открой в Obsidian — данные станут полностью твоими, без зависимости от нас.", accent: "Акцент главной", security: "Безопасность", danger: "Управление аккаунтом", plan: "Тариф", planSub: "Сейчас ты на «Старт». Больше живёшь в дневнике — больше он даёт.", planBtn: "Смотреть тарифы", secLead: "Твоя жизнь — закрыта и под защитой", sec: ["Только ты видишь свои записи — вход лишь по твоей личной ссылке. Других пользователей в дневник мы не пускаем.", "Люди их не читают: ни другие пользователи, ни наша команда. Для статистики мы видим только обезличенные цифры — без текста записей.", "Текст видит только AI — и лишь чтобы готовить твои же резюме, ответы и Книгу жизни. На обучение моделей он не идёт.", "Данные передаются и хранятся в зашифрованном виде; доступ — по секретным ключам, которых нет в открытом коде.", "Ты полный владелец: в любой момент можешь скачать всё или удалить аккаунт без следа.", "Код LIFE OS открыт — можешь сам проверить, что именно происходит с данными."] },
  en: { title: "Profile", privateT: "This is your private space", privateS: "Your diary is visible only to you — via this personal link. No one else can see it, and it's not public.", yourLink: "Your personal link", linkHint: "Save it — it's how you sign in to your diary on any device.", language: "Language", privacy: "More about privacy", yourData: "Your data", exportBtn: "Download my data", exportHint: "All your entries in one file — take them anytime. And the LIFE OS code is open: check for yourself what we do with data.", openCode: "Open source on GitHub", obsidianBtn: "Download for Obsidian (Markdown)", obsidianHint: "Want to keep everything yourself? Download your diary as a folder of Markdown files and open it in Obsidian — your data becomes fully yours, independent of us.", accent: "Home accent", security: "Security", danger: "Account", plan: "Plan", planSub: "You're on Start. The more you live in your diary, the more it gives back.", planBtn: "See plans", secLead: "Your life is private and protected", sec: ["Only you can see your entries — access is via your personal link. No other users are allowed into your diary.", "People don't read them: not other users, not our team. For statistics we see only anonymized numbers — no entry text.", "Only the AI sees the text — and only to prepare your own summaries, answers and Book of Life. It's never used to train models.", "Data is transferred and stored encrypted; access is via secret keys that are not in the open-source code.", "You fully own it: download everything or delete your account, without a trace, anytime.", "The LIFE OS code is open — check for yourself exactly what happens with your data."] },
  uk: { title: "Профіль", privateT: "Це твій особистий кабінет", privateS: "Щоденник бачиш лише ти — за цим особистим посиланням. Ніхто інший його не бачить, і в публічному доступі його немає.", yourLink: "Твоє особисте посилання", linkHint: "Збережи його — за ним ти входиш у щоденник на будь-якому пристрої.", language: "Мова", privacy: "Докладніше про приватність", yourData: "Твої дані", exportBtn: "Завантажити мої дані", exportHint: "Усі твої записи в одному файлі — забери будь-коли. А код LIFE OS відкритий: можеш сам перевірити, що ми робимо з даними.", openCode: "Відкритий код на GitHub", obsidianBtn: "Завантажити для Obsidian (Markdown)", obsidianHint: "Хочеш зберігати все в себе? Завантаж щоденник текою Markdown-файлів і відкрий в Obsidian — дані стануть повністю твоїми, без залежності від нас.", accent: "Акцент головної", security: "Безпека", danger: "Керування акаунтом", plan: "Тариф", planSub: "Зараз ти на «Старт». Більше живеш у щоденнику — більше він дає.", planBtn: "Дивитися тарифи", secLead: "Твоє життя — закрите й під захистом", sec: ["Лише ти бачиш свої записи — вхід тільки за твоїм особистим посиланням. Інших користувачів у щоденник ми не пускаємо.", "Люди їх не читають: ні інші користувачі, ні наша команда. Для статистики ми бачимо лише знеособлені цифри — без тексту записів.", "Текст бачить лише AI — і тільки щоб готувати твої ж резюме, відповіді та Книгу життя. На навчання моделей він не йде.", "Дані передаються і зберігаються у зашифрованому вигляді; доступ — за секретними ключами, яких немає у відкритому коді.", "Ти повний власник: будь-коли можеш завантажити все або видалити акаунт без сліду.", "Код LIFE OS відкритий — можеш сам перевірити, що саме відбувається з даними."] },
  fr: { title: "Profil", privateT: "C'est ton espace privé", privateS: "Ton journal n'est visible que par toi — via ce lien personnel. Personne d'autre ne le voit, il n'est pas public.", yourLink: "Ton lien personnel", linkHint: "Garde-le — c'est ainsi que tu te connectes sur n'importe quel appareil.", language: "Langue", privacy: "En savoir plus sur la confidentialité", yourData: "Tes données", exportBtn: "Télécharger mes données", exportHint: "Toutes tes entrées en un fichier — récupère-les quand tu veux. Et le code de LIFE OS est ouvert : vérifie toi-même ce qu'on fait des données.", openCode: "Code source sur GitHub", obsidianBtn: "Télécharger pour Obsidian (Markdown)", obsidianHint: "Tu veux tout garder chez toi ? Télécharge ton journal en dossier de fichiers Markdown et ouvre-le dans Obsidian — tes données t'appartiennent entièrement.", accent: "Accent de l'accueil", security: "Sécurité", danger: "Compte", plan: "Forfait", planSub: "Tu es sur Start. Plus tu vis dans ton journal, plus il te rend.", planBtn: "Voir les forfaits", secLead: "Ta vie est privée et protégée", sec: ["Toi seul vois tes entrées — l'accès se fait via ton lien personnel. Aucun autre utilisateur n'entre dans ton journal.", "Les gens ne les lisent pas : ni les autres utilisateurs, ni notre équipe. Pour les stats, on ne voit que des chiffres anonymes — sans le texte.", "Seule l'IA voit le texte — et uniquement pour préparer tes résumés, réponses et Livre de vie. Jamais pour entraîner des modèles.", "Les données sont transférées et stockées chiffrées ; l'accès se fait via des clés secrètes absentes du code ouvert.", "Tu en es le propriétaire : télécharge tout ou supprime ton compte, sans trace, à tout moment.", "Le code de LIFE OS est ouvert — vérifie toi-même ce qui se passe avec tes données."] },
};

export default async function ProfilePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;

  const hdrs = await headers();
  const host = hdrs.get("host") || "mylifebookai.vercel.app";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const token = (await cookies()).get("lifeos_token")?.value || "";
  const link = `${proto}://${host}/u/${token}`;
  const initial = (user.name || "?").trim().charAt(0).toUpperCase() || "?";

  let hasPin = false;
  try {
    const { data } = await supabaseAdmin().from("users").select("pin_hash").eq("id", user.id).maybeSingle();
    hasPin = !!data?.pin_hash;
  } catch {}

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 22 }}>
            <span style={{ width: 52, height: 52, borderRadius: 99, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600 }}>{initial}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{user.name || "—"}</div>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>{s.title} · LIFE OS</div>
            </div>
          </div>

          {/* Личная ссылка */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{s.yourLink}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 11, lineHeight: 1.5 }}>{s.linkHint}</div>
            <CopyLink link={link} locale={locale} />
          </div>

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
            <LangSwitcher current={locale} />
          </div>

          {/* Твои данные */}
          <div style={{ fontSize: 13, color: "var(--text-2)", margin: "20px 0 10px" }}>{s.yourData}</div>
          <div className="card">
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12, lineHeight: 1.55 }}>{s.exportHint}</div>
            <a href="/api/export" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 11, background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", marginBottom: 9 }}>
              <i className="ti ti-download" style={{ fontSize: 17 }} />{s.exportBtn}
            </a>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, margin: "4px 0 9px", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <i className="ti ti-folder-share" style={{ fontSize: 16, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />{s.obsidianHint}
            </div>
            <a href="/api/export-obsidian" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 11, border: "1px solid var(--accent)", background: "var(--accent-bg)", color: "var(--accent-text)", fontSize: 13.5, fontWeight: 500, textDecoration: "none", marginBottom: 9 }}>
              <i className="ti ti-folder-down" style={{ fontSize: 16 }} />{s.obsidianBtn}
            </a>
            <a href="https://github.com/top15igor/life-os" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, textDecoration: "none" }}>
              <i className="ti ti-brand-github" style={{ fontSize: 16 }} />{s.openCode}
            </a>
          </div>

          {/* Безопасность */}
          <div style={{ fontSize: 13, color: "var(--text-2)", margin: "20px 0 10px" }}>{s.security}</div>
          <div className="card" style={{ marginBottom: 12, background: "var(--surface-2)", border: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
              <i className="ti ti-shield-lock" style={{ fontSize: 22, color: "var(--positive)", flexShrink: 0 }} />
              <span style={{ fontSize: 14.5, fontWeight: 600 }}>{s.secLead}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {s.sec.map((p: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 16, color: "var(--positive)", flexShrink: 0, marginTop: 1 }} />{p}
                </div>
              ))}
            </div>
            <Link href="/privacy" style={{ fontSize: 12.5, color: "var(--accent)", display: "inline-block", marginTop: 11 }}>{s.privacy} →</Link>
          </div>
          <PinSettings locale={locale} hasPin={hasPin} />

          {/* Управление */}
          <div style={{ fontSize: 13, color: "var(--text-2)", margin: "20px 0 10px" }}>{s.danger}</div>
          <ProfileButtons locale={locale} />
        </div>
      </main>
    </div>
  );
}
