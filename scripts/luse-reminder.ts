import { appendFileSync } from "node:fs";
import { prisma } from "../src/lib/db";
import { expectedLuseSession } from "../src/lib/luse-due";

(async () => {
  const expected = expectedLuseSession(new Date()).toISOString().slice(0, 10);
  const last = await prisma.priceBar.findFirst({ where: { security: { assetClass: "EQUITY" } }, orderBy: { date: "desc" }, select: { date: true } });
  const latest = last ? last.date.toISOString().slice(0, 10) : "none";
  const out = `due=${!last || latest < expected}\nexpected=${expected}\nlatest=${latest}\n`;
  console.log(out);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, out);
  await prisma.$disconnect();
})();
