import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

// Подтверждение входа по ЧУЖОЙ ссылке. Сюда ведёт /u/<token>, когда в браузере уже
// есть сессия другого пользователя (частый случай: кто-то переслал сообщение бота
// со своей личной кнопкой). Молча аккаунт не меняем — спрашиваем.
const STR: Record<string, any> = {
  ru: {
    title: "Это ссылка другого человека",
    body: (who: string, cur: string) => `Ты открыл личную ссылку входа${who ? ` (${who})` : ""}. Если продолжить — ты выйдешь из своего аккаунта${cur ? ` «${cur}»` : ""} и попадёшь в чужой дневник. Обычно так бывает, когда переслали сообщение из бота — тогда это не твоя ссылка.`,
    stay: "Остаться в своём аккаунте",
    go: (who: string) => `Всё равно войти${who ? ` как ${who}` : ""}`,
    gone: "Ссылка недействительна или уже использована.",
  },
  en: {
    title: "This link belongs to someone else",
    body: (who: string, cur: string) => `You opened a personal sign-in link${who ? ` (${who})` : ""}. If you continue, you'll be signed out of your account${cur ? ` “${cur}”` : ""} and land in someone else's diary. This usually happens when a bot message was forwarded — then it's not your link.`,
    stay: "Stay in my account",
    go: (who: string) => `Sign in anyway${who ? ` as ${who}` : ""}`,
    gone: "This link is invalid or already used.",
  },
  uk: {
    title: "Це посилання іншої людини",
    body: (who: string, cur: string) => `Ти відкрив особисте посилання входу${who ? ` (${who})` : ""}. Якщо продовжити — ти вийдеш зі свого акаунта${cur ? ` «${cur}»` : ""} і потрапиш у чужий щоденник. Зазвичай так буває, коли переслали повідомлення з бота — тоді це не твоє посилання.`,
    stay: "Залишитись у своєму акаунті",
    go: (who: string) => `Все одно увійти${who ? ` як ${who}` : ""}`,
    gone: "Посилання недійсне або вже використане.",
  },
  fr: {
    title: "Ce lien appartient à quelqu'un d'autre",
    body: (who: string, cur: string) => `Tu as ouvert un lien de connexion personnel${who ? ` (${who})` : ""}. Si tu continues, tu seras déconnecté de ton compte${cur ? ` « ${cur} »` : ""} et tu arriveras dans le journal de quelqu'un d'autre. Cela arrive souvent quand un message du bot a été transféré — alors ce n'est pas ton lien.`,
    stay: "Rester dans mon compte",
    go: (who: string) => `Se connecter quand même${who ? ` en tant que ${who}` : ""}`,
    gone: "Ce lien est invalide ou déjà utilisé.",
  },
  es: {
    title: "Este enlace es de otra persona",
    body: (who: string, cur: string) => `Abriste un enlace de acceso personal${who ? ` (${who})` : ""}. Si continúas, se cerrará tu sesión${cur ? ` «${cur}»` : ""} y entrarás en el diario de otra persona. Suele pasar cuando se reenvía un mensaje del bot — entonces no es tu enlace.`,
    stay: "Quedarme en mi cuenta",
    go: (who: string) => `Entrar de todos modos${who ? ` como ${who}` : ""}`,
    gone: "El enlace no es válido o ya se usó.",
  },
};

export default async function SwitchPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const locale = await getLocale();
  const s = STR[locale] || STR.ru;
  const token = String(t || "");
  if (!/^[0-9a-f-]{20,40}$/i.test(token)) redirect("/");

  const db = supabaseAdmin();
  const { data: owner } = await db.from("users").select("name").eq("token", token).maybeSingle();
  // Ссылка уже сгорела/неверна — просто ведём человека в его же аккаунт.
  if (!owner) redirect("/");

  // Имя текущей (своей) сессии — чтобы честно сказать, из какого аккаунта выйдешь.
  let curName = "";
  try {
    const cookie = (await cookies()).get("lifeos_token")?.value || "";
    if (cookie) {
      const { data: me } = await db.from("users").select("name").eq("session_secret", cookie).maybeSingle();
      curName = (me as any)?.name || "";
    }
  } catch {}

  const who = (owner as any)?.name || "";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg, #0f172a)" }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 99, background: "#f59e0b22", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 30, color: "#f59e0b" }} />
        </div>
        <div style={{ fontSize: 21, fontWeight: 700, color: "var(--text, #fff)", marginBottom: 10 }}>{s.title}</div>
        <div style={{ fontSize: 14, color: "var(--text-2, #94a3b8)", lineHeight: 1.55, marginBottom: 24 }}>{s.body(who, curName)}</div>

        <Link href="/" style={{ display: "block", padding: "13px", borderRadius: 12, background: "var(--accent, #6366f1)", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none", marginBottom: 10 }}>
          {s.stay}
        </Link>
        <a href={`/u/${encodeURIComponent(token)}?sw=1`} style={{ display: "block", padding: "11px", fontSize: 13.5, color: "var(--text-3, #64748b)", textDecoration: "none" }}>
          {s.go(who)}
        </a>
      </div>
    </div>
  );
}
