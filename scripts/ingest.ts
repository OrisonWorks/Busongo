import { prisma } from "../src/lib/db";
import { ingestLuse } from "../src/lib/ingest/luse";
import { ingestBoz } from "../src/lib/ingest/boz";
import { ingestCrypto } from "../src/lib/ingest/crypto";
import { evaluateAlerts } from "../src/lib/alerts";
import { generateBrief } from "../src/lib/brief";
import { ingestP2P } from "../src/lib/ingest/p2p";
import { ingestStableYields } from "../src/lib/ingest/defi";
import { summarizeAnnouncements } from "../src/lib/ai/sens";

const jobs: Record<string, () => Promise<unknown>> = { luse: ingestLuse, boz: ingestBoz, crypto: () => ingestCrypto(), p2p: ingestP2P, defi: () => ingestStableYields(), brief: generateBrief, "sens-ai": () => summarizeAnnouncements(15) };

async function run(name: string) {
  const r = await prisma.ingestRun.create({ data: { source: name, status: "running" } });
  try {
    const out = await jobs[name]();
    console.log(name, out);
    await prisma.ingestRun.update({ where: { id: r.id }, data: { status: "ok", message: JSON.stringify(out), endedAt: new Date() } });
    return true;
  } catch (e) {
    console.error(name, e);
    await prisma.ingestRun.update({ where: { id: r.id }, data: { status: "error", message: String(e).slice(0, 1000), endedAt: new Date() } });
    return false;
  }
}

(async () => {
  const which = process.argv.slice(2);
  const names = !which.length || which.includes("all") ? Object.keys(jobs) : which;
  let ok = true;
  for (const n of names) ok = (await run(n)) && ok;
  console.log("alerts fired:", await evaluateAlerts());
  await prisma.$disconnect();
  process.exit(ok ? 0 : 1);
})();
