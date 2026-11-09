import { appendFileSync } from "node:fs";
import { prisma } from "../src/lib/db";
import { expectedLuseSession, MIN_SESSION_PRICE_BARS } from "../src/lib/luse-due";

(async () => {
  const expected = expectedLuseSession(new Date()).toISOString().slice(0, 10);
  const last = await prisma.priceBar.findFirst({ where: { security: { assetClass: "EQUITY" } }, orderBy: { date: "desc" }, select: { date: true } });
  const latest = last ? last.date.toISOString().slice(0, 10) : "none";
  // A session with only a few share prices (e.g. a partial paste) still needs the full page.
  const bars = last ? await prisma.priceBar.count({ where: { date: last.date, security: { assetClass: "EQUITY" } } }) : 0;
  const missing = !last || latest < expected;
  const partial = !missing && bars < MIN_SESSION_PRICE_BARS;
  const due = missing || partial;
  const reason = missing ? "missing" : partial ? "partial" : "";
  const out = `due=${due}\nexpected=${expected}\nlatest=${latest}\nrows=${bars}\nreason=${reason}\n`;
  console.log(out);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, out);
  await prisma.$disconnect();
})();
