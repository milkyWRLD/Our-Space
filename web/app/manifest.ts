import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Our Space",
    short_name: "Our Space",
    description:
      "A private space for two: wishlist, places, trips, memories and emotional notifications.",
    start_url: "/",
    display: "standalone",
    background_color: "#fceff9",
    theme_color: "#a78bfa",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
