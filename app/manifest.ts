import type { MetadataRoute } from "next"

import { SITE } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    orientation: "portrait",
    categories: ["medical", "health", "shopping"],
    lang: "en-IN",
    icons: [
      { src: "/icon-light-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Browse medicines", url: "/medicines" },
      { name: "Upload prescription", url: "/upload-prescription" },
      { name: "My orders", url: "/orders" },
    ],
  }
}
