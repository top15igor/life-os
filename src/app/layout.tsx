import "./globals.css";
import { SITE_URL } from "@/lib/seo";
import { cookies } from "next/headers";
import { getLocale } from "@/lib/locale";
import LangFromQuery from "@/components/LangFromQuery";
import Assistant from "@/components/Assistant";
import ConnectBotBanner from "@/components/ConnectBotBanner";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "LIFE OS",
  description: "Твой архив жизни — второй мозг.",
  applicationName: "LIFE OS",
  appleWebApp: { capable: true, title: "LIFE OS", statusBarStyle: "default" as const },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#6d5efc",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const, // чтобы env(safe-area-inset-*) работал и нижняя навигация не пряталась за панелью Safari
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Нативное приложение открывает веб-разделы через /m, который ставит cookie app=1
  // (и solo=1 для одиночного раздела). Тёмную тему и скрытие веб-навигации задаём
  // СРАЗУ на сервере — без зависимости от JS-инъекции в webview (та не переживает 307-редирект).
  const c = await cookies();
  const inApp = c.get("app")?.value === "1";
  const solo = inApp && c.get("solo")?.value !== "0";
  // Тема: настройка пользователя в куке theme (auto|light|dark), по умолчанию light.
  // Явные light/dark ставим сразу на сервере (без мигания); auto доводит инлайн-скрипт
  // по системной теме ДО первой отрисовки.
  // Язык страницы: был жёстко «ru» на всех пяти языках — поисковики и
  // программы для незрячих считали испанскую версию русской.
  const locale = await getLocale();
  const themePref = c.get("theme")?.value;
  const serverTheme = themePref === "dark" ? "dark" : themePref === "light" ? "light" : undefined;
  const themeScript = `(function(){try{var t=${JSON.stringify(themePref || "light")};var d=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';if(t==='auto'){matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){document.documentElement.dataset.theme=e.matches?'dark':'light';});}}catch(e){}})();`;
  return (
    <html lang={locale} data-app={inApp ? "1" : undefined} data-solo={solo ? "1" : undefined} data-theme={serverTheme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Шрифт иконок лежит у нас (public/fonts), а не на стороннем CDN: если бы
            jsdelivr тормозил или был недоступен, весь интерфейс остался бы без иконок.
            Обновление: качнуть новую версию @tabler/icons-webfont в public/fonts. */}
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/tabler-icons.woff2" />
        <link rel="stylesheet" href="/fonts/tabler-icons.css" />
      </head>
      <body>
        <LangFromQuery />
        <ConnectBotBanner />
        {children}
        <Assistant />
      </body>
    </html>
  );
}
