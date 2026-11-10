import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} — Kwacha Today`,
    short_name: brand.shortName,
    description: "Zambia's money numbers in plain words: the dollar, prices, T-bills, the Bank of Zambia rate and the LuSE index.",
    start_url: "/kwacha-today",
    display: "standalone",
    background_color: "#070b14",
    theme_color: "#070b14",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
