import "server-only";
import type { BacktestRun, Prisma, Strategy } from "@prisma/client";
import { prisma } from "../db";
import { getIndex, latestMacro } from "../market";
import { yieldCurve } from "../fixed-income";
import { NEAR, anchorHash, anchoringEnabled } from "./near";
import { proofHash } from "./proof";

export const backtestPayload = (r: BacktestRun) => ({ v: 1, app: "busongo", kind: "backtest", id: r.id, strategyId: r.strategyId, engine: r.kind, config: r.config, summary: r.summary, ranAt: r.createdAt.toISOString() });
export const strategyPayload = (s: Strategy) => ({ v: 1, app: "busongo", kind: "strategy", id: s.id, name: s.name, engine: s.kind, config: s.config, savedAt: s.updatedAt.toISOString() });

/** Daily signed snapshot of Zambian reference data (LASI close, latest T-bill auction yields, BoZ USD/ZMW). */
export async function marketDataPayload() {
  const [lasi, curve, m] = await Promise.all([getIndex("LASI"), yieldCurve(), latestMacro()]);
  const last = lasi.at(-1);
  if (!last) return null;
  return { v: 1, app: "busongo", kind: "market-data", date: last.date, lasi: last.value, tbills: Object.fromEntries(curve.filter((c) => c.kind === "T-bill").map((c) => [c.tenor, { yield: c.yield, auction: c.date }])), usdZmw: m.USDZMW?.value ?? null, usdZmwDate: m.USDZMW?.date ?? null };
}

/** Store a proof of `payload` and, when a Busongo NEAR account is configured, write its hash to NEAR Social. Idempotent by hash. */
export async function createProof(o: { userId?: string | null; kind: string; refId?: string | null; payload: object }) {
  const hash = proofHash(o.payload);
  let p = await prisma.proof.findUnique({ where: { hash } });
  if (!p) p = await prisma.proof.create({ data: { userId: o.userId ?? null, kind: o.kind, refId: o.refId ?? null, hash, payload: o.payload as Prisma.InputJsonValue } });
  if (!p.txHash && anchoringEnabled()) {
    try {
      const txHash = await anchorHash(hash, o.kind);
      p = await prisma.proof.update({ where: { id: p.id }, data: { txHash, network: NEAR.network, signer: NEAR.signer, anchoredAt: new Date() } });
    } catch (e) {
      console.error("NEAR anchoring failed", e);
    }
  }
  return p;
}

export async function anchorMarketData() {
  const payload = await marketDataPayload();
  if (!payload) return { skipped: "no LASI data" };
  const p = await createProof({ kind: "market-data", refId: payload.date, payload });
  return { date: payload.date, hash: p.hash, txHash: p.txHash };
}
