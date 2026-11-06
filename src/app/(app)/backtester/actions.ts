"use server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUser, requireUser } from "@/lib/auth";
import { getBars, getSecurity } from "@/lib/market";
import { runBacktest, type BacktestConfig, type BacktestResult } from "@/lib/engine/backtest";
import { historyStart, PLANS } from "@/config/plans";
import { consume } from "@/lib/usage";
import { CRYPTO_FEE_RATE, LUSE_FEE_RATE } from "@/config/fees";
import type { Candle } from "@/lib/engine/series";
import type { Prisma } from "@prisma/client";

const operand = z.object({ ind: z.string(), period: z.number().int().min(1).max(1000).optional(), value: z.number().optional(), shift: z.number().int().min(0).max(250).optional() });
const cond = z.object({ left: operand, op: z.enum(["gt", "lt", "gte", "lte", "crossAbove", "crossBelow"]), right: operand });
const cfgSchema = z.object({
  symbols: z.array(z.string()).min(1).max(30),
  from: z.string().optional(), to: z.string().optional(),
  entry: z.array(cond).min(1).max(10), exit: z.array(cond).max(10),
  entryJoin: z.enum(["AND", "OR"]).optional(), exitJoin: z.enum(["AND", "OR"]).optional(),
  stopLossPct: z.number().positive().max(100).nullable().optional(), takeProfitPct: z.number().positive().max(10000).nullable().optional(),
  trailingStopPct: z.number().positive().max(100).nullable().optional(), maxHoldDays: z.number().int().positive().nullable().optional(), minHoldDays: z.number().int().positive().nullable().optional(),
  capital: z.number().positive().max(1e12), positionPct: z.number().positive().max(100), feeRate: z.number().min(0).max(0.1).optional(),
});

export type RunResponse = { error?: string; result?: BacktestResult; bars?: Record<string, Candle[]>; runId?: string; usage?: { used: number; limit: number } };

export async function runBacktestAction(kind: "basic" | "advanced", raw: unknown): Promise<RunResponse> {
  const p = cfgSchema.safeParse(raw);
  if (!p.success) return { error: p.error.issues[0].message };
  const user = await getUser();
  const plan = user?.effectivePlan ?? "FREE";
  if (kind === "advanced") {
    if (!user) return { error: "Sign in to use the advanced backtester." };
    if (p.data.symbols.length > 1 && plan === "FREE") return { error: "Multi-stock portfolio backtests need the Advanced or Pro plan." };
  }
  if (kind === "basic" && p.data.symbols.length > 1) return { error: "The basic backtester tests one symbol at a time." };
  const start = historyStart(plan);
  const data = new Map<string, Candle[]>();
  let crypto = false;
  for (const s of p.data.symbols) {
    const sec = await getSecurity(s);
    if (!sec) return { error: `Unknown symbol ${s}` };
    crypto ||= sec.assetClass === "CRYPTO";
    data.set(sec.symbol, await getBars(sec.symbol, start));
  }
  let usage;
  if (kind === "advanced" && user) {
    const u = await consume(user, "advancedBacktests");
    if (!u.ok) return { error: `You've used all ${u.limit} advanced backtests on your ${PLANS[plan].label} plan this month.` };
    usage = { used: u.used, limit: u.limit };
  }
  const latestTbill = await prisma.tbillAuction.findFirst({ where: { tenorDays: 364 }, orderBy: { auctionDate: "desc" } });
  const cfg: BacktestConfig = { ...p.data, feeRate: p.data.feeRate ?? (crypto ? CRYPTO_FEE_RATE : LUSE_FEE_RATE), benchmarkYield: latestTbill?.yield ?? null } as BacktestConfig;
  const result = runBacktest(cfg, data);
  if (start) result.warnings.push(`Your ${PLANS[plan].label} plan includes ${PLANS[plan].historyLabel.toLowerCase()}. Upgrade for longer history.`);
  let runId: string | undefined;
  if (user) {
    const run = await prisma.backtestRun.create({ data: { userId: user.id, kind, config: cfg as unknown as Prisma.InputJsonValue, summary: { metrics: result.metrics, trades: result.trades.length } as Prisma.InputJsonValue } });
    runId = run.shareId;
  }
  return { result, bars: Object.fromEntries(data), runId, usage };
}

export async function saveStrategy(name: string, kind: string, config: unknown) {
  const u = await requireUser();
  if (!name.trim()) return { error: "Name your strategy" };
  const s = await prisma.strategy.create({ data: { userId: u.id, name: name.trim().slice(0, 80), kind, config: config as Prisma.InputJsonValue } });
  return { ok: true, id: s.id };
}

export async function journalTrades(trades: BacktestResult["trades"]) {
  const u = await requireUser();
  const secs = await prisma.security.findMany({ where: { symbol: { in: [...new Set(trades.map((t) => t.symbol))] } } });
  const id = new Map(secs.map((s) => [s.symbol, s.id]));
  const rows = trades.flatMap((t) => [
    { userId: u.id, securityId: id.get(t.symbol)!, side: "BUY", quantity: t.qty, price: t.entryPrice, fees: 0, date: new Date(t.entryDate + "T00:00:00Z"), tag: "backtest" },
    { userId: u.id, securityId: id.get(t.symbol)!, side: "SELL", quantity: t.qty, price: t.exitPrice, fees: t.fees, date: new Date(t.exitDate + "T00:00:00Z"), tag: "backtest", notes: t.reason },
  ]);
  await prisma.journalEntry.createMany({ data: rows });
  return { ok: true, n: rows.length };
}
