import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ingestBoz } from "@/lib/ingest/boz";
import { ingestCrypto } from "@/lib/ingest/crypto";
import { evaluateAlerts } from "@/lib/alerts";

export const maxDuration = 300;
// LuSE needs a headless browser, so it runs from the GitHub Actions workflow (scripts/ingest.ts) instead.
const JOBS = { boz: ingestBoz, crypto: () => ingestCrypto(10) } as const;

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const out: Record<string, unknown> = {};
  for (const [k, fn] of Object.entries(JOBS)) {
    const run = await prisma.ingestRun.create({ data: { source: k, status: "running" } });
    try { out[k] = await fn(); await prisma.ingestRun.update({ where: { id: run.id }, data: { status: "ok", message: JSON.stringify(out[k]), endedAt: new Date() } }); }
    catch (e) { out[k] = String(e); await prisma.ingestRun.update({ where: { id: run.id }, data: { status: "error", message: String(e).slice(0, 1000), endedAt: new Date() } }); }
  }
  out.alerts = await evaluateAlerts();
  return NextResponse.json(out);
}
