import type { Plan } from "@prisma/client";

export type PlanLimits = {
  id: Plan;
  label: string;
  priceZmw: number;
  historyDays: number | null;
  historyLabel: string;
  scanResults: number;
  alerts: number;
  aiMessages: number;
  advancedBacktests: number;
  popular?: boolean;
};

export const PLANS: Record<Plan, PlanLimits> = {
  FREE: {
    id: "FREE",
    label: "Free",
    priceZmw: 0,
    historyDays: 92,
    historyLabel: "Last 3 months of data",
    scanResults: 10,
    alerts: 5,
    aiMessages: 5,
    advancedBacktests: 5,
  },
  ADVANCED: {
    id: "ADVANCED",
    label: "Advanced",
    priceZmw: Number(process.env.NEXT_PUBLIC_PRICE_ADVANCED || 199),
    historyDays: 366,
    historyLabel: "Last 12 months of data",
    scanResults: 100,
    alerts: 125,
    aiMessages: 50,
    advancedBacktests: 125,
    popular: true,
  },
  PRO: {
    id: "PRO",
    label: "Pro",
    priceZmw: Number(process.env.NEXT_PUBLIC_PRICE_PRO || 349),
    historyDays: null,
    historyLabel: "Full history",
    scanResults: 1000,
    alerts: 200,
    aiMessages: 200,
    advancedBacktests: 200,
  },
};

export const PLAN_ORDER: Plan[] = ["FREE", "ADVANCED", "PRO"];

export function effectivePlan(user: { plan: Plan; planExpiresAt: Date | null } | null): Plan {
  if (!user) return "FREE";
  if (user.plan !== "FREE" && user.planExpiresAt && user.planExpiresAt < new Date()) return "FREE";
  return user.plan;
}

export function historyStart(plan: Plan): Date | null {
  const d = PLANS[plan].historyDays;
  if (d == null) return null;
  return new Date(Date.now() - d * 86400000);
}
