import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LIFE OS",
    short_name: "LIFE OS",
    description: "Твой личный дневник жизни — второй мозг.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6d5efc",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
