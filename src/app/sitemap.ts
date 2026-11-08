import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { brand } from "@/config/brand";
import { CRYPTO_ENABLED, PAYMENTS_ENABLED } from "@/config/features";

export const revalidate = 86400;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = (p: string) => `${brand.siteUrl}${p}`;
  const fixed = ["", ...(PAYMENTS_ENABLED ? ["/pricing"] : []), "/solutions", "/about", "/contact", "/blog", "/videos", "/reference", "/market", "/market/heatmap", "/market/movers", "/market/sectors", "/stocks", ...(CRYPTO_ENABLED ? ["/crypto", "/crypto/kwacha"] : []), "/fixed-income", "/fixed-income/yield-curve", "/fixed-income/tbills", "/fixed-income/bonds", "/fixed-income/corporate", "/fixed-income/calculator", "/macro", "/fundamentals", "/sens", "/calendar", "/scanner", "/backtester", "/backtester/advanced", "/tools/gann", "/tools/smc", "/tools/pivots", "/tools/relative-strength", "/tools/correlation", "/tools/seasonality", "/terms", "/privacy", "/refund"];
  try {
    const [secs, posts] = await Promise.all([prisma.security.findMany({ select: { symbol: true, assetClass: true } }), prisma.blogPost.findMany({ where: { published: true }, select: { slug: true, publishedAt: true } })]);
    return [...fixed.map((p) => ({ url: u(p) })), ...secs.filter((s) => CRYPTO_ENABLED || s.assetClass !== "CRYPTO").map((s) => ({ url: u(`/${s.assetClass === "CRYPTO" ? "crypto" : "stocks"}/${s.symbol}`) })), ...secs.filter((s) => s.assetClass === "EQUITY").map((s) => ({ url: u(`/fundamentals/${s.symbol}`) })), ...posts.map((p) => ({ url: u(`/blog/${p.slug}`), lastModified: p.publishedAt }))];
  } catch { return fixed.map((p) => ({ url: u(p) })); }
}
