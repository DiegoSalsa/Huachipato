import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Huachipato Analytics",
    short_name: "Huachipato",
    description:
      "Plataforma de análisis deportivo y seguimiento médico del Club Deportivo Huachipato",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#006195",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
