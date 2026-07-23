import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { NotificationToggle } from "@/components/ProfileActions";
import PushSettings from "@/components/PushSettings";
import VoiceTextToggle from "@/components/VoiceTextToggle";
import { normalizeMorningPrefs } from "@/lib/morningPrefs";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const STR: Record<string, { title: string; sub: string; back: string; noTg: string }> = {
  ru: { title: "Пуш-уведомления", sub: "Когда, о чём и как бот пишет тебе утром и вечером.", back: "Профиль", noTg: "Пуши приходят в Telegram. Подключи Telegram-бота, чтобы настроить уведомления." },
  en: { title: "Push notifications", sub: "When, about what and how the bot writes to you in the morning and evening.", back: "Profile", noTg: "Pushes are sent in Telegram. Connect the Telegram bot to set up notifications." },
  uk: { title: "Пуш-сповіщення", sub: "Коли, про що і як бот пише тобі вранці та ввечері.", back: "Профіль", noTg: "Пуші приходять у Telegram. Підключи Telegram-бота, щоб налаштувати сповіщення." },
  fr: { title: "Notifications push", sub: "Quand, sur quoi et comment le bot t'écrit le matin et le soir.", back: "Profil", noTg: "Les push arrivent dans Telegram. Connecte le bot Telegram pour configurer les notifications." },
  es: { title: "Notificaciones push", sub: "Cuándo, sobre qué y cómo te escribe el bot por la mañana y por la noche.", back: "Perfil", noTg: "Las notificaciones llegan por Telegram. Conecta el bot de Telegram para configurar las notificaciones." },
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;

  let pushEnabled = true;
  let morningPrefs = normalizeMorningPrefs(null);
  try {
    const { data } = await supabaseAdmin().from("users").select("push_enabled, morning_prefs").eq("id", user.id).maybeSingle();
    pushEnabled = (data as any)?.push_enabled !== false;
    morningPrefs = normalizeMorningPrefs((data as any)?.morning_prefs);
  } catch { /* колонок может не быть — дефолты */ }
  // Отдельно и защищённо: колонки show_voice_text может ещё не быть (до миграции).
  let showVoiceText = true;
  try {
    const { data, error } = await supabaseAdmin().from("users").select("show_voice_text").eq("id", user.id).maybeSingle();
    if (!error) showVoiceText = (data as any)?.show_voice_text !== false;
  } catch { /* нет колонки — по умолчанию показываем */ }
  const hasTg = !!user.chat_id;

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 560 }}>
          <Link href="/profile" className="app-back" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", textDecoration: "none", marginBottom: 14 }}>
            <i className="ti ti-chevron-left" style={{ fontSize: 16 }} />{s.back}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
            <i className="ti ti-bell" style={{ fontSize: 24, color: "var(--accent)" }} />
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{s.title}</h1>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 20 }}>{s.sub}</div>

          {hasTg ? (
            <>
              <NotificationToggle locale={locale} enabled={pushEnabled} />
              <VoiceTextToggle locale={locale} initial={showVoiceText} />
              <PushSettings locale={locale} initial={morningPrefs} />
            </>
          ) : (
            <div className="card" style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5 }}>{s.noTg}</div>
          )}
        </div>
      </main>
    </div>
  );
}
