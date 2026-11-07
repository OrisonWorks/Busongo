"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { backtestPayload, createProof, strategyPayload } from "@/lib/web3/proofs";

export async function proveBacktest(runId: string) {
  const u = await requireUser();
  const r = await prisma.backtestRun.findFirst({ where: { id: runId, userId: u.id } });
  if (!r) return;
  const p = await createProof({ userId: u.id, kind: "backtest", refId: r.id, payload: backtestPayload(r) });
  redirect(`/verify/${p.hash}`);
}

export async function proveStrategy(id: string) {
  const u = await requireUser();
  const s = await prisma.strategy.findFirst({ where: { id, userId: u.id } });
  if (!s) return;
  const p = await createProof({ userId: u.id, kind: "strategy", refId: s.id, payload: strategyPayload(s) });
  redirect(`/verify/${p.hash}`);
}
