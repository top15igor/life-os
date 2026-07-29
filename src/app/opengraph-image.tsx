import { ImageResponse } from "next/og";

// Картинка-превью для мессенджеров и соцсетей: то, что видит человек, когда
// ему присылают ссылку на life-os.today. Файл лежит в корне app/ — Next
// подставляет её всем публичным страницам, у которых нет своей.
export const alt = "LIFE OS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "linear-gradient(135deg, #5b5bf5 0%, #8b5cf6 55%, #a855f7 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 600, letterSpacing: 6, opacity: 0.92 }}>
          <div
            style={{
              display: "flex",
              width: 54,
              height: 54,
              borderRadius: 16,
              background: "rgba(255,255,255,.22)",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
            }}
          >
            ✳
          </div>
          LIFE OS
        </div>

        <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -3, marginTop: 34, lineHeight: 1 }}>
          Сохранись.
        </div>

        <div style={{ fontSize: 38, marginTop: 26, lineHeight: 1.35, opacity: 0.93, maxWidth: 900 }}>
          Просто расскажи, как прошёл день — AI соберёт из этого твой дневник и книгу жизни.
        </div>

        <div style={{ fontSize: 28, marginTop: 40, opacity: 0.75 }}>life-os.today</div>
      </div>
    ),
    { ...size }
  );
}
