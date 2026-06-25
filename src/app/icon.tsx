import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6d5efc,#a855f7)", color: "#fff", fontWeight: 800, letterSpacing: -4 }}>
        <div style={{ fontSize: 150, lineHeight: 1 }}>LIFE</div>
        <div style={{ fontSize: 150, lineHeight: 1 }}>OS</div>
      </div>
    ),
    { ...size }
  );
}
