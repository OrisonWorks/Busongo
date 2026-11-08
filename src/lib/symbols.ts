import "server-only";
import { prisma } from "./db";
import { CRYPTO_ENABLED } from "@/config/features";
export async function symbolOptions() {
  const s = await prisma.security.findMany({ where: { active: true }, orderBy: [{ assetClass: "asc" }, { symbol: "asc" }], select: { symbol: true, name: true, assetClass: true } });
  return s.map((x) => ({ symbol: x.symbol, name: x.name, group: x.assetClass === "CRYPTO" ? (CRYPTO_ENABLED ? "Crypto" : "Crypto (demo data)") : "LuSE equities" }));
}
