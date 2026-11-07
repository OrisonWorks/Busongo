// Fixed-income maths for GRZ securities. BoZ quotes T-bill discount rates and yields on an actual/365 basis; GRZ bonds pay semi-annual coupons.
export function tbillPriceFromYield(yieldPct: number, days: number, face = 100) {
  return face / (1 + (yieldPct / 100) * (days / 365));
}
export function tbillPriceFromDiscount(discPct: number, days: number, face = 100) {
  return face * (1 - (discPct / 100) * (days / 365));
}
export function tbillYieldFromPrice(price: number, days: number, face = 100) {
  return ((face - price) / price) * (365 / days) * 100;
}
export function tbillNet(invest: number, yieldPct: number, days: number, whtPct: number) {
  const price = tbillPriceFromYield(yieldPct, days);
  const face = (invest / price) * 100;
  const interest = face - invest;
  const tax = (interest * whtPct) / 100;
  return { face, interest, tax, net: interest - tax, netYield: ((interest - tax) / invest) * (365 / days) * 100 };
}

export function bondPrice(couponPct: number, yieldPct: number, years: number, freq = 2, face = 100) {
  const n = Math.round(years * freq), c = (couponPct / 100 / freq) * face, y = yieldPct / 100 / freq;
  if (y === 0) return c * n + face;
  return c * ((1 - (1 + y) ** -n) / y) + face * (1 + y) ** -n;
}
export function bondDuration(couponPct: number, yieldPct: number, years: number, freq = 2, face = 100) {
  const n = Math.round(years * freq), c = (couponPct / 100 / freq) * face, y = yieldPct / 100 / freq;
  let pv = 0, w = 0;
  for (let t = 1; t <= n; t++) {
    const cf = c + (t === n ? face : 0);
    const d = cf / (1 + y) ** t;
    pv += d;
    w += (t / freq) * d;
  }
  const mac = w / pv;
  return { macaulay: mac, modified: mac / (1 + y), price: pv };
}
export function bondYield(price: number, couponPct: number, years: number, freq = 2) {
  let lo = -0.99, hi = 2;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (bondPrice(couponPct, mid * 100, years, freq) > price) lo = mid; else hi = mid;
  }
  return ((lo + hi) / 2) * 100;
}
export function realYield(nominalPct: number, inflationPct: number) {
  return ((1 + nominalPct / 100) / (1 + inflationPct / 100) - 1) * 100;
}

export const WHT_DEFAULT = Number(process.env.NEXT_PUBLIC_GRZ_WHT || 15);
