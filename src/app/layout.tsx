import "./globals.css";
import LangFromQuery from "@/components/LangFromQuery";
import Assistant from "@/components/Assistant";

export const metadata = {
  title: "LIFE OS",
  description: "Твой личный дневник жизни — второй мозг.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
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
        {children}
        <Assistant />
      </body>
    </html>
  );
}
