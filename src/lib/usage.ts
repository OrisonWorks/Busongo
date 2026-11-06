import "server-only";
import { prisma } from "./db";
import { PLANS, effectivePlan } from "@/config/plans";
import type { SessionUser } from "./auth";

export type UsageKind = "aiMessages" | "advancedBacktests";
const period = () => new Date().toISOString().slice(0, 7);

export async function getUsage(user: SessionUser, kind: UsageKind) {
  const plan = effectivePlan(user);
  const limit = PLANS[plan][kind];
  const row = await prisma.usageCounter.findUnique({ where: { userId_period_kind: { userId: user.id, period: period(), kind } } });
  const used = row?.count ?? 0;
  return { used, limit, ok: used < limit, plan };
}

export async function consume(user: SessionUser, kind: UsageKind) {
  const u = await getUsage(user, kind);
  if (!u.ok) return u;
  await prisma.usageCounter.upsert({
    where: { userId_period_kind: { userId: user.id, period: period(), kind } },
    update: { count: { increment: 1 } },
    create: { userId: user.id, period: period(), kind, count: 1 },
  });
  return { ...u, used: u.used + 1 };
}
