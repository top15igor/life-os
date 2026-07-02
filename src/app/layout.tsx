import "./globals.css";
import { cookies } from "next/headers";
import LangFromQuery from "@/components/LangFromQuery";
import Assistant from "@/components/Assistant";
import ConnectBotBanner from "@/components/ConnectBotBanner";

export const metadata = {
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
  return (
    <html lang="ru" data-app={inApp ? "1" : undefined} data-solo={solo ? "1" : undefined}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.34.0/dist/fonts/tabler-icons.woff2"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.34.0/dist/tabler-icons.min.css"
        />
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
