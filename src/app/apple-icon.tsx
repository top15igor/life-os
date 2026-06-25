import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6d5efc,#a855f7)", color: "#fff", fontWeight: 800, letterSpacing: -2 }}>
        <div style={{ fontSize: 52, lineHeight: 1 }}>LIFE</div>
        <div style={{ fontSize: 52, lineHeight: 1 }}>OS</div>
      </div>
    ),
    { ...size }
  );
}
