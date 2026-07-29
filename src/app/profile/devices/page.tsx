import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { headers } from "next/headers";
import DevicesManager from "@/components/DevicesManager";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { listDevices } from "@/lib/devices";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const STR: Record<string, { title: string; sub: string; back: string }> = {
  ru: { title: "Мои устройства", sub: "Кнопка на руке или на шее: нажал — наговорил — запись в дневнике.", back: "Профиль" },
  en: { title: "My devices", sub: "A button on your wrist or neck: press, speak, and it's in your diary.", back: "Profile" },
  uk: { title: "Мої пристрої", sub: "Кнопка на руці чи на шиї: натиснув — наговорив — запис у щоденнику.", back: "Профіль" },
  fr: { title: "Mes appareils", sub: "Un bouton au poignet ou au cou : appuie, parle, c'est dans ton journal.", back: "Profil" },
  es: { title: "Mis dispositivos", sub: "Un botón en la muñeca o el cuello: pulsa, habla y ya está en tu diario.", back: "Perfil" },
};

export default async function DevicesPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "life-os.today";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const devices = await listDevices(user.id);
  // Таблицы может ещё не быть (миграция не применена) — тогда честно об этом скажем.
  let ready = true;
  try {
    const { error } = await supabaseAdmin().from("devices").select("id").limit(1);
    if (error) ready = false;
  } catch { ready = false; }

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 560 }}>
          <Link href="/profile" className="app-back" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", textDecoration: "none", marginBottom: 14 }}>
            <i className="ti ti-chevron-left" style={{ fontSize: 16 }} />{s.back}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
            <i className="ti ti-device-watch" style={{ fontSize: 24, color: "var(--accent)" }} />
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{s.title}</h1>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 20 }}>{s.sub}</div>

          <DevicesManager devices={devices as any} locale={locale} origin={origin} ready={ready} />
        </div>
      </main>
    </div>
  );
}
