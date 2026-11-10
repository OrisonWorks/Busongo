/** Pure comparison maths over daily close series — no DB access, unit-testable. */
export type Dated = { date: string; close: number };

export function dailyReturns(closes: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < closes.length; i++) if (closes[i - 1] > 0) r.push(closes[i] / closes[i - 1] - 1);
  return r;
}

export function mean(xs: number[]) { return xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : null; }

export function stdev(xs: number[]) {
  const m = mean(xs);
  if (m == null || xs.length < 2) return null;
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

/** Annualised volatility (%) of a close series, assuming ~252 trading days. */
export function volatility(closes: number[]) {
  const s = stdev(dailyReturns(closes));
  return s == null ? null : s * Math.sqrt(252) * 100;
}

/** Worst peak-to-trough loss (%) across the series. */
export function maxDrawdown(closes: number[]) {
  let peak = -Infinity, worst: number | null = null;
  for (const c of closes) {
    peak = Math.max(peak, c);
    const dd = c / peak - 1;
    if (worst == null || dd < worst) worst = dd;
  }
  return worst == null ? null : worst * 100;
}

const mean2 = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / xs.length;

/** Pearson correlation of two equal-length return series; null when <2 points or zero variance. */
export function correlation(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return null;
  const x = a.slice(-n), y = b.slice(-n);
  const mx = mean2(x), my = mean2(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

/** Beta vs a benchmark (e.g. LASI): slope of stock returns on benchmark returns. */
export function beta(stock: number[], bench: number[]) {
  const n = Math.min(stock.length, bench.length);
  if (n < 2) return null;
  const x = stock.slice(-n), y = bench.slice(-n);
  const mx = mean2(x), my = mean2(y);
  let sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); syy += (y[i] - my) ** 2; }
  return syy ? sxy / syy : null;
}

/** Align several close series on their shared dates. */
export function alignSeries(series: Dated[][]): { dates: string[]; closes: number[][] } {
  if (!series.length) return { dates: [], closes: [] };
  const maps = series.map((s) => new Map(s.map((b) => [b.date, b.close])));
  const dates = [...maps[0].keys()].filter((d) => maps.every((m) => m.has(d))).sort();
  return { dates, closes: maps.map((m) => dates.map((d) => m.get(d)!)) };
}

export function stats(bars: Dated[], benchDaily: number[] = []) {
  const closes = bars.map((b) => b.close);
  const dr = dailyReturns(closes);
  const vals = bars.map((b) => (b as { value?: number }).value ?? 0).filter((v) => v > 0);
  return {
    sessions: closes.length,
    totalReturn: closes.length > 1 ? (closes.at(-1)! / closes[0] - 1) * 100 : null,
    volatility: volatility(closes),
    maxDrawdown: maxDrawdown(closes),
    avgValue: vals.length ? vals.reduce((a, x) => a + x, 0) / vals.length : null,
    beta: beta(dr, benchDaily),
    corr: correlation(dr, benchDaily),
    daily: dr,
  };
}
export type CompareStats = ReturnType<typeof stats>;
