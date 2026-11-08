import type { Fundamental } from "@prisma/client";

/** Factor converting amounts in `from` currency into `to` currency, using the BoZ USD/ZMW rate; null when unknown. */
export function fxFactor(from: string, to: string, usdZmw?: number | null) {
  if (from === to) return 1;
  if (!usdZmw) return null;
  if (from === "USD" && to === "ZMW") return usdZmw;
  if (from === "ZMW" && to === "USD") return 1 / usdZmw;
  return null;
}

/** Price-based ratios convert the filing's figures into the share's trading currency first. */
export function valuation(f: Fundamental | undefined, price: number | null, sharesFallback?: number | null, priceCcy = "ZMW", usdZmw?: number | null) {
  const shares = f?.sharesOutstanding ?? sharesFallback ?? null;
  const mcap = price != null && shares ? price * shares : null;
  const eps = f?.eps ?? (f?.netIncome != null && shares ? f.netIncome / shares : null);
  const bvps = f?.totalEquity != null && shares ? f.totalEquity / shares : null;
  const k = f ? fxFactor(f.currency, priceCcy, usdZmw) : 1;
  const epsP = eps != null && k != null ? eps * k : null, bvpsP = bvps != null && k != null ? bvps * k : null, dpsP = f?.dps != null && k != null ? f.dps * k : null;
  return {
    marketCap: mcap,
    eps,
    pe: price != null && epsP && epsP > 0 ? price / epsP : null,
    pb: price != null && bvpsP && bvpsP > 0 ? price / bvpsP : null,
    divYield: price && dpsP != null ? (dpsP / price) * 100 : null,
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
