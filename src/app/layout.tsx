export const metadata = {
  title: "LIFE OS",
  description: "Личный дневник жизни",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
