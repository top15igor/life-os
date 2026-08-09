import type { CSSProperties } from "react";

// Общая светлая палитра публичных страниц.
//
// Зачем: тема (светлая/тёмная) живёт в куке посетителя и вешается на <html>.
// Для приложения это правильно, но публичная страница — витрина: чужой дневник,
// вишлист или юридический документ должен выглядеть одинаково у всех, а не
// зависеть от того, какую тему выбрал у себя гость. Лендинги так делали и раньше,
// каждый своей копией этих же значений — здесь один источник правды.
// Только переменные палитры — для страниц, которые рисуют фон сами
// (лендинги /features и /one-place со своими градиентами). Без этого шапка
// и футер брали --bg из темы посетителя и на тёмной теме становились чёрными.
export const PUBLIC_LIGHT_VARS: CSSProperties = {
  ["--bg" as any]: "#f7f8fc",
  ["--surface" as any]: "#ffffff",
  ["--surface-2" as any]: "#eef1f8",
  ["--text" as any]: "#14161c",
  ["--text-2" as any]: "#4a5261",
  ["--text-3" as any]: "#8b93a3",
  ["--border" as any]: "rgba(20,24,40,0.08)",
  ["--accent" as any]: "#5b5bf5",
  ["--accent-bg" as any]: "#edecff",
  ["--accent-text" as any]: "#4338ca",
  ["--shadow" as any]: "0 1px 2px rgba(20,24,40,0.05), 0 12px 32px -20px rgba(20,24,40,0.18)",
  colorScheme: "light",
};

export const PUBLIC_LIGHT: CSSProperties = {
  ["--bg" as any]: "#f7f8fc",
  ["--surface" as any]: "#ffffff",
  ["--surface-2" as any]: "#eef1f8",
  ["--text" as any]: "#14161c",
  ["--text-2" as any]: "#4a5261",
  ["--text-3" as any]: "#8b93a3",
  ["--border" as any]: "rgba(20,24,40,0.08)",
  ["--accent" as any]: "#5b5bf5",
  ["--accent-bg" as any]: "#edecff",
  ["--accent-text" as any]: "#4338ca",
  ["--shadow" as any]: "0 1px 2px rgba(20,24,40,0.05), 0 12px 32px -20px rgba(20,24,40,0.18)",
  colorScheme: "light",
  color: "var(--text)",
  background: "#f7f8fc",
  minHeight: "100dvh",
};

// Та же палитра с «авророй» под первым экраном — для лендингов и документов.
export const PUBLIC_LIGHT_AURORA: CSSProperties = {
  ...PUBLIC_LIGHT,
  background:
    "radial-gradient(720px 420px at 18% -12%, rgba(124,92,246,0.20), transparent 60%)," +
    "radial-gradient(720px 420px at 84% -8%, rgba(91,91,245,0.16), transparent 60%)," +
    "#f7f8fc",
};
