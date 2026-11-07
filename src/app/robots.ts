import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/dashboard", "/profile", "/payment"] }], sitemap: `${brand.siteUrl}/sitemap.xml` };
}
