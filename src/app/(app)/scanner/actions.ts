"use server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUser, requireUser } from "@/lib/auth";
import { getAllBars } from "@/lib/market";
import { runScan, type ScanConfig, type ScanHit } from "@/lib/engine/scanner";
import { PLANS, effectivePlan } from "@/config/plans";
import type { Prisma } from "@prisma/client";

export async function scanAction(cfg: ScanConfig & { asset?: "EQUITY" | "CRYPTO"; symbols?: string[] }): Promise<{ hits: ScanHit[]; total: number; limit: number; error?: string }> {
  const user = await getUser();
  const plan = user?.effectivePlan ?? effectivePlan(null);
  const from = new Date(Date.now() - 800 * 86400000);
  const data = await getAllBars(cfg.asset ?? "EQUITY", from);
  if (cfg.symbols?.length) for (const k of [...data.keys()]) if (!cfg.symbols.includes(k)) data.delete(k);
  const secs = await prisma.security.findMany({ select: { symbol: true, sector: true } });
  const hits = runScan(cfg, data, new Map(secs.map((s) => [s.symbol, { sector: s.sector }])));
  const limit = PLANS[plan].scanResults;
  return { hits: hits.slice(0, limit), total: hits.length, limit };
}

export async function saveScan(name: string, config: unknown) {
  const u = await requireUser();
  const p = z.string().trim().min(1).max(80).safeParse(name);
  if (!p.success) return { error: "Name your scan" };
  await prisma.savedScan.create({ data: { userId: u.id, name: p.data, config: config as Prisma.InputJsonValue } });
  return { ok: true };
}
