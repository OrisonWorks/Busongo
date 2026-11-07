export const P2P_BUY = "P2P_USDT_ZMW_BUY";
export const P2P_SELL = "P2P_USDT_ZMW_SELL";

export function median(xs: number[]) {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** % by which the street (P2P) USDT/ZMW rate exceeds the official BoZ USD/ZMW rate. */
export const p2pPremium = (p2p: number, official: number) => (p2p / official - 1) * 100;

/** Return in kwacha terms of a USD-denominated yield, given the % change in USD/ZMW over the period (positive = kwacha weakened). */
export const zmwReturnFromUsd = (usdPct: number, fxChangePct: number) => ((1 + usdPct / 100) * (1 + fxChangePct / 100) - 1) * 100;

export const realReturn = (nominalPct: number, inflationPct: number) => ((1 + nominalPct / 100) / (1 + inflationPct / 100) - 1) * 100;

export const afterTax = (yieldPct: number, whtPct: number) => yieldPct * (1 - whtPct / 100);
