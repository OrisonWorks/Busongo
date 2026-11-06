export type Num = number | null;

export function sma(v: number[], n: number): Num[] {
  const out: Num[] = new Array(v.length).fill(null);
  let s = 0;
  for (let i = 0; i < v.length; i++) {
    s += v[i];
    if (i >= n) s -= v[i - n];
    if (i >= n - 1) out[i] = s / n;
  }
  return out;
}

export function ema(v: number[], n: number): Num[] {
  const out: Num[] = new Array(v.length).fill(null);
  if (v.length < n) return out;
  const k = 2 / (n + 1);
  let prev = v.slice(0, n).reduce((a, b) => a + b, 0) / n;
  out[n - 1] = prev;
  for (let i = n; i < v.length; i++) {
    prev = v[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

function wilder(v: number[], n: number): Num[] {
  const out: Num[] = new Array(v.length).fill(null);
  if (v.length < n) return out;
  let prev = v.slice(0, n).reduce((a, b) => a + b, 0) / n;
  out[n - 1] = prev;
  for (let i = n; i < v.length; i++) {
    prev = (prev * (n - 1) + v[i]) / n;
    out[i] = prev;
  }
  return out;
}

export function rsi(c: number[], n = 14): Num[] {
  const out: Num[] = new Array(c.length).fill(null);
  if (c.length <= n) return out;
  const g: number[] = [], l: number[] = [];
  for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    g.push(Math.max(d, 0));
    l.push(Math.max(-d, 0));
  }
  const ag = wilder(g, n), al = wilder(l, n);
  for (let i = 0; i < g.length; i++) {
    const a = ag[i], b = al[i];
    if (a == null || b == null) continue;
    out[i + 1] = b === 0 ? (a === 0 ? 50 : 100) : 100 - 100 / (1 + a / b);
  }
  return out;
}

export function macd(c: number[], fast = 12, slow = 26, signal = 9) {
  const f = ema(c, fast), s = ema(c, slow);
  const line: Num[] = c.map((_, i) => (f[i] != null && s[i] != null ? (f[i] as number) - (s[i] as number) : null));
  const start = line.findIndex((x) => x != null);
  const sig: Num[] = new Array(c.length).fill(null);
  if (start >= 0) {
    const e = ema(line.slice(start) as number[], signal);
    e.forEach((x, i) => (sig[start + i] = x));
  }
  const hist: Num[] = line.map((x, i) => (x != null && sig[i] != null ? x - (sig[i] as number) : null));
  return { line, signal: sig, hist };
}

export function stdev(v: number[], n: number): Num[] {
  const m = sma(v, n);
  return v.map((_, i) => {
    if (m[i] == null) return null;
    let s = 0;
    for (let j = i - n + 1; j <= i; j++) s += (v[j] - (m[i] as number)) ** 2;
    return Math.sqrt(s / n);
  });
}

export function bollinger(c: number[], n = 20, k = 2) {
  const mid = sma(c, n), sd = stdev(c, n);
  return {
    mid,
    upper: mid.map((m, i) => (m == null ? null : m + k * (sd[i] as number))),
    lower: mid.map((m, i) => (m == null ? null : m - k * (sd[i] as number))),
  };
}

export type HLC = { high: number[]; low: number[]; close: number[] };

export function trueRange({ high, low, close }: HLC): number[] {
  return close.map((_, i) =>
    i === 0 ? high[i] - low[i] : Math.max(high[i] - low[i], Math.abs(high[i] - close[i - 1]), Math.abs(low[i] - close[i - 1])),
  );
}

export function atr(d: HLC, n = 14): Num[] {
  return wilder(trueRange(d), n);
}

export function adx(d: HLC, n = 14) {
  const { high, low } = d;
  const pdm: number[] = [0], ndm: number[] = [0];
  for (let i = 1; i < high.length; i++) {
    const up = high[i] - high[i - 1], dn = low[i - 1] - low[i];
    pdm.push(up > dn && up > 0 ? up : 0);
    ndm.push(dn > up && dn > 0 ? dn : 0);
  }
  const tr = wilder(trueRange(d), n), p = wilder(pdm, n), m = wilder(ndm, n);
  const pdi: Num[] = tr.map((t, i) => (t ? (100 * (p[i] as number)) / t : null));
  const ndi: Num[] = tr.map((t, i) => (t ? (100 * (m[i] as number)) / t : null));
  const dx = pdi.map((a, i) => {
    const b = ndi[i];
    if (a == null || b == null || a + b === 0) return null;
    return (100 * Math.abs(a - b)) / (a + b);
  });
  const start = dx.findIndex((x) => x != null);
  const adxv: Num[] = new Array(high.length).fill(null);
  if (start >= 0) {
    const w = wilder(dx.slice(start).map((x) => x ?? 0), n);
    w.forEach((x, i) => (adxv[start + i] = x));
  }
  return { adx: adxv, pdi, ndi };
}

export function supertrend(d: HLC, n = 10, mult = 3) {
  const a = atr(d, n);
  const st: Num[] = new Array(d.close.length).fill(null);
  const dir: (1 | -1 | null)[] = new Array(d.close.length).fill(null);
  let fu = 0, fl = 0;
  for (let i = 0; i < d.close.length; i++) {
    if (a[i] == null) continue;
    const hl2 = (d.high[i] + d.low[i]) / 2;
    const bu = hl2 + mult * (a[i] as number), bl = hl2 - mult * (a[i] as number);
    const prevDir = i > 0 ? dir[i - 1] : null;
    fu = prevDir == null || bu < fu || d.close[i - 1] > fu ? bu : fu;
    fl = prevDir == null || bl > fl || d.close[i - 1] < fl ? bl : fl;
    let cur: 1 | -1;
    if (prevDir == null) cur = d.close[i] >= hl2 ? 1 : -1;
    else if (prevDir === 1) cur = d.close[i] < fl ? -1 : 1;
    else cur = d.close[i] > fu ? 1 : -1;
    dir[i] = cur;
    st[i] = cur === 1 ? fl : fu;
  }
  return { value: st, dir };
}

export function roc(c: number[], n: number): Num[] {
  return c.map((x, i) => (i >= n && c[i - n] ? (x / c[i - n] - 1) * 100 : null));
}

export function highest(v: number[], n: number): Num[] {
  return v.map((_, i) => (i >= n - 1 ? Math.max(...v.slice(i - n + 1, i + 1)) : null));
}
export function lowest(v: number[], n: number): Num[] {
  return v.map((_, i) => (i >= n - 1 ? Math.min(...v.slice(i - n + 1, i + 1)) : null));
}

export function returns(c: number[]): number[] {
  return c.slice(1).map((x, i) => (c[i] ? x / c[i] - 1 : 0));
}

export function correlation(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 5) return null;
  const x = a.slice(-n), y = b.slice(-n);
  const mx = x.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

export function pivots(h: number, l: number, c: number) {
  const p = (h + l + c) / 3;
  return { p, r1: 2 * p - l, s1: 2 * p - h, r2: p + (h - l), s2: p - (h - l), r3: h + 2 * (p - l), s3: l - 2 * (h - p) };
}

export function last<T>(a: T[]): T | undefined {
  return a[a.length - 1];
}
