import "server-only";
import { cache } from "react";
import { prisma } from "./db";

const day = (d: Date) => d.toISOString().slice(0, 10);

export const TBILL_TENORS = [91, 182, 273, 364];
export const BOND_TENORS = [2, 3, 5, 7, 10, 15];

export const tbillHistory = cache(async () => {
  const rows = await prisma.tbillAuction.findMany({ orderBy: [{ auctionDate: "asc" }, { tenorDays: "asc" }] });
  return rows.map((r) => ({ ...r, auctionDate: day(r.auctionDate) }));
});
export const bondHistory = cache(async () => {
  const rows = await prisma.bondAuction.findMany({ orderBy: [{ auctionDate: "asc" }, { tenorYears: "asc" }] });
  return rows.map((r) => ({ ...r, auctionDate: day(r.auctionDate) }));
});

// Latest observed yield per tenor (most recent auction that offered that tenor).
export const yieldCurve = cache(async () => {
  const [tb, bd] = await Promise.all([tbillHistory(), bondHistory()]);
  const pts: { tenor: string; years: number; yield: number; date: string; kind: "T-bill" | "Bond"; coupon?: number | null; isin?: string | null }[] = [];
  for (const t of TBILL_TENORS) {
    const r = [...tb].reverse().find((x) => x.tenorDays === t);
    if (r) pts.push({ tenor: `${t}d`, years: t / 365, yield: r.yield, date: r.auctionDate, kind: "T-bill", isin: r.isin });
  }
  const bondTenors = [...new Set(bd.map((b) => b.tenorYears))].sort((a, b) => a - b);
  for (const t of bondTenors) {
    const r = [...bd].reverse().find((x) => x.tenorYears === t);
    if (r) pts.push({ tenor: `${t}y`, years: t, yield: r.yield, date: r.auctionDate, kind: "Bond", coupon: r.coupon, isin: r.isin });
  }
  return pts;
});

// Curve as of each of the last N auction months, for comparison.
export const curveHistory = cache(async (monthsBack: number[]) => {
  const [tb, bd] = await Promise.all([tbillHistory(), bondHistory()]);
  return monthsBack.map((m) => {
    const cut = new Date();
    cut.setUTCMonth(cut.getUTCMonth() - m);
    const c = day(cut);
    const pts: Record<string, number | string> = { label: m === 0 ? "Latest" : `${m}m ago` };
    for (const t of TBILL_TENORS) {
      const r = [...tb].reverse().find((x) => x.tenorDays === t && x.auctionDate <= c);
      if (r) pts[`${t}d`] = r.yield;
    }
    for (const t of [...new Set(bd.map((b) => b.tenorYears))]) {
      const r = [...bd].reverse().find((x) => x.tenorYears === t && x.auctionDate <= c);
      if (r) pts[`${t}y`] = r.yield;
    }
    return pts;
  });
});
