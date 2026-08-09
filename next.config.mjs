/** @type {import('next').NextConfig} */

// Заголовки безопасности для всех страниц.
//
// frame-ancestors — защита от кликджекинга: чужой сайт не сможет спрятать
// LIFE OS в невидимом окошке у себя и подловить нажатие. Telegram оставлен
// в списке: мини-приложение («Позвать друга») открывается в их окне.
//
// nosniff — браузер не додумывает тип файла: загруженный документ не станет
// исполняемым скриптом. Referrer-Policy — чужой сайт не увидит, с какой
// именно нашей страницы пришёл человек. HSTS — только https, без обратной
// дороги. Permissions-Policy — камера и геолокация не нужны никому;
// микрофон нужен нам самим (запись голоса в вебвью).

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), payment=(), microphone=(self)" },
];

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
