import { adx, atr, bollinger, ema, highest, lowest, macd, roc, rsi, sma, supertrend, type Num } from "../indicators";

export type Candle = { date: string; open: number; high: number; low: number; close: number; volume: number; value?: number };

export const INDICATORS = [
  { id: "close", label: "Close price", period: false },
  { id: "open", label: "Open price", period: false },
  { id: "high", label: "High", period: false },
  { id: "low", label: "Low", period: false },
  { id: "volume", label: "Volume", period: false },
  { id: "sma", label: "SMA", period: true, def: 20 },
  { id: "ema", label: "EMA", period: true, def: 20 },
  { id: "rsi", label: "RSI", period: true, def: 14 },
  { id: "macd", label: "MACD line", period: false },
  { id: "macdSignal", label: "MACD signal", period: false },
  { id: "macdHist", label: "MACD histogram", period: false },
  { id: "bbUpper", label: "Bollinger upper", period: true, def: 20 },
  { id: "bbMid", label: "Bollinger middle", period: true, def: 20 },
  { id: "bbLower", label: "Bollinger lower", period: true, def: 20 },
  { id: "atr", label: "ATR", period: true, def: 14 },
  { id: "adx", label: "ADX", period: true, def: 14 },
  { id: "pdi", label: "+DI", period: true, def: 14 },
  { id: "ndi", label: "−DI", period: true, def: 14 },
  { id: "supertrend", label: "Supertrend", period: true, def: 10 },
  { id: "roc", label: "Rate of change %", period: true, def: 10 },
  { id: "highest", label: "Highest close (N)", period: true, def: 252 },
  { id: "lowest", label: "Lowest close (N)", period: true, def: 252 },
  { id: "volSma", label: "Average volume", period: true, def: 20 },
  { id: "number", label: "Number", period: false },
] as const;
export type IndicatorId = (typeof INDICATORS)[number]["id"];

export type Operand = { ind: IndicatorId; period?: number; value?: number; shift?: number };
export type Op = "gt" | "lt" | "gte" | "lte" | "crossAbove" | "crossBelow";
export type Cond = { left: Operand; op: Op; right: Operand };
export const OPS: { id: Op; label: string }[] = [
  { id: "gt", label: ">" },
  { id: "gte", label: "≥" },
  { id: "lt", label: "<" },
  { id: "lte", label: "≤" },
  { id: "crossAbove", label: "crosses above" },
  { id: "crossBelow", label: "crosses below" },
];

export class Series {
  private memo = new Map<string, Num[]>();
  readonly close: number[];
  readonly hlc: { high: number[]; low: number[]; close: number[] };
  constructor(public bars: Candle[]) {
    this.close = bars.map((b) => b.close);
    this.hlc = { high: bars.map((b) => b.high), low: bars.map((b) => b.low), close: this.close };
  }
  get(o: Operand): Num[] {
    const p = o.period || (INDICATORS.find((x) => x.id === o.ind) as { def?: number })?.def || 14;
    const key = `${o.ind}:${p}:${o.value ?? ""}`;
    let v = this.memo.get(key);
    if (!v) {
      v = this.compute(o.ind, p, o.value);
      this.memo.set(key, v);
    }
    if (o.shift) {
      const s = o.shift;
      return v.map((_, i) => (i - s >= 0 ? v![i - s] : null));
    }
    return v;
  }
  private compute(ind: IndicatorId, p: number, value?: number): Num[] {
    const c = this.close;
    switch (ind) {
      case "close": return c;
      case "open": return this.bars.map((b) => b.open);
      case "high": return this.hlc.high;
      case "low": return this.hlc.low;
      case "volume": return this.bars.map((b) => b.volume);
      case "sma": return sma(c, p);
      case "ema": return ema(c, p);
      case "rsi": return rsi(c, p);
      case "macd": return macd(c).line;
      case "macdSignal": return macd(c).signal;
      case "macdHist": return macd(c).hist;
      case "bbUpper": return bollinger(c, p).upper;
      case "bbMid": return bollinger(c, p).mid;
      case "bbLower": return bollinger(c, p).lower;
      case "atr": return atr(this.hlc, p);
      case "adx": return adx(this.hlc, p).adx;
      case "pdi": return adx(this.hlc, p).pdi;
      case "ndi": return adx(this.hlc, p).ndi;
      case "supertrend": return supertrend(this.hlc, p).value;
      case "roc": return roc(c, p);
      case "highest": return highest(c, p);
      case "lowest": return lowest(c, p);
      case "volSma": return sma(this.bars.map((b) => b.volume), p);
      case "number": return c.map(() => value ?? 0);
    }
  }
  test(cond: Cond, i: number): boolean {
    const a = this.get(cond.left), b = this.get(cond.right);
    const x = a[i], y = b[i];
    if (x == null || y == null) return false;
    switch (cond.op) {
      case "gt": return x > y;
      case "gte": return x >= y;
      case "lt": return x < y;
      case "lte": return x <= y;
      case "crossAbove":
      case "crossBelow": {
        const px = a[i - 1], py = b[i - 1];
        if (i < 1 || px == null || py == null) return false;
        return cond.op === "crossAbove" ? px <= py && x > y : px >= py && x < y;
      }
    }
  }
  all(conds: Cond[], i: number, join: "AND" | "OR" = "AND") {
    if (!conds.length) return false;
    return join === "AND" ? conds.every((c) => this.test(c, i)) : conds.some((c) => this.test(c, i));
  }
}

export function describeOperand(o: Operand) {
  if (o.ind === "number") return String(o.value ?? 0);
  const m = INDICATORS.find((x) => x.id === o.ind);
  const base = m?.period ? `${m.label}(${o.period || (m as { def?: number }).def})` : m?.label || o.ind;
  return o.shift ? `${base} [${o.shift} bars ago]` : base;
}
export function describeCond(c: Cond) {
  return `${describeOperand(c.left)} ${OPS.find((o) => o.id === c.op)?.label} ${describeOperand(c.right)}`;
}
