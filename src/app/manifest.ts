import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inkforge — The Living Digital Book & Publishing Platform",
    short_name: "Inkforge",
    description:
      "A living publishing ecosystem combining editorial sophistication, tactile book-inspired design, and modern digital energy.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1012",
    theme_color: "#831e26",
    orientation: "portrait-primary",
    categories: ["books", "education", "news", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
