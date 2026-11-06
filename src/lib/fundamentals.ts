import type { Fundamental } from "@prisma/client";

export function valuation(f: Fundamental | undefined, price: number | null, sharesFallback?: number | null) {
  const shares = f?.sharesOutstanding ?? sharesFallback ?? null;
  const mcap = price != null && shares ? price * shares : null;
  const eps = f?.eps ?? (f?.netIncome != null && shares ? f.netIncome / shares : null);
  const bvps = f?.totalEquity != null && shares ? f.totalEquity / shares : null;
  return {
    marketCap: mcap,
    eps,
    pe: price != null && eps && eps > 0 ? price / eps : null,
    pb: price != null && bvps && bvps > 0 ? price / bvps : null,
    divYield: price && f?.dps != null ? (f.dps / price) * 100 : null,
    roe: f?.netIncome != null && f?.totalEquity ? (f.netIncome / f.totalEquity) * 100 : null,
    roa: f?.netIncome != null && f?.totalAssets ? (f.netIncome / f.totalAssets) * 100 : null,
    netMargin: f?.netIncome != null && f?.revenue ? (f.netIncome / f.revenue) * 100 : null,
    opMargin: f?.operatingProfit != null && f?.revenue ? (f.operatingProfit / f.revenue) * 100 : null,
    debtToEquity: f?.totalDebt != null && f?.totalEquity ? f.totalDebt / f.totalEquity : null,
    payout: f?.dps != null && eps ? (f.dps / eps) * 100 : null,
    fcf: f?.operatingCashFlow != null ? f.operatingCashFlow - (f.capex ?? 0) : null,
  };
}
export type Valuation = ReturnType<typeof valuation>;
