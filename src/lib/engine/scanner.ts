import { Series, type Candle, type Cond } from "./series";

export type ScanConfig = { conds: Cond[]; join: "AND" | "OR"; sector?: string; minValue?: number; minPrice?: number; maxPrice?: number };
export type ScanHit = { symbol: string; date: string; close: number; changePct: number | null; value: number; rsi: number | null };

export function runScan(cfg: ScanConfig, data: Map<string, Candle[]>, meta: Map<string, { sector: string | null }>): ScanHit[] {
  const hits: ScanHit[] = [];
  for (const [symbol, bars] of data) {
    if (!bars.length) continue;
    if (cfg.sector && meta.get(symbol)?.sector !== cfg.sector) continue;
    const s = new Series(bars);
    const i = bars.length - 1;
    const b = bars[i];
    if (cfg.minPrice != null && b.close < cfg.minPrice) continue;
    if (cfg.maxPrice != null && b.close > cfg.maxPrice) continue;
    if (cfg.minValue != null && (b.value ?? 0) < cfg.minValue) continue;
    if (cfg.conds.length && !s.all(cfg.conds, i, cfg.join)) continue;
    const prev = bars[i - 1]?.close;
    hits.push({ symbol, date: b.date, close: b.close, changePct: prev ? (b.close / prev - 1) * 100 : null, value: b.value ?? 0, rsi: s.get({ ind: "rsi", period: 14 })[i] });
  }
  return hits.sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0));
}

const n = (value: number) => ({ ind: "number" as const, value });
export const PRESET_SCANS: { id: string; name: string; group: string; description: string; config: ScanConfig }[] = [
  { id: "rsi-oversold", group: "Momentum", name: "RSI oversold", description: "RSI(14) below 30", config: { join: "AND", conds: [{ left: { ind: "rsi", period: 14 }, op: "lt", right: n(30) }] } },
  { id: "rsi-overbought", group: "Momentum", name: "RSI overbought", description: "RSI(14) above 70", config: { join: "AND", conds: [{ left: { ind: "rsi", period: 14 }, op: "gt", right: n(70) }] } },
  { id: "golden-cross", group: "Trend", name: "Golden cross", description: "SMA(50) crosses above SMA(200)", config: { join: "AND", conds: [{ left: { ind: "sma", period: 50 }, op: "crossAbove", right: { ind: "sma", period: 200 } }] } },
  { id: "death-cross", group: "Trend", name: "Death cross", description: "SMA(50) crosses below SMA(200)", config: { join: "AND", conds: [{ left: { ind: "sma", period: 50 }, op: "crossBelow", right: { ind: "sma", period: 200 } }] } },
  { id: "above-200", group: "Trend", name: "Above 200-day average", description: "Close above SMA(200)", config: { join: "AND", conds: [{ left: { ind: "close" }, op: "gt", right: { ind: "sma", period: 200 } }] } },
  { id: "52w-high", group: "Breakout", name: "At 52-week high", description: "Close at its highest in 252 sessions", config: { join: "AND", conds: [{ left: { ind: "close" }, op: "gte", right: { ind: "highest", period: 252 } }] } },
  { id: "52w-low", group: "Breakout", name: "At 52-week low", description: "Close at its lowest in 252 sessions", config: { join: "AND", conds: [{ left: { ind: "close" }, op: "lte", right: { ind: "lowest", period: 252 } }] } },
  { id: "macd-bull", group: "Momentum", name: "MACD bullish cross", description: "MACD crosses above signal", config: { join: "AND", conds: [{ left: { ind: "macd" }, op: "crossAbove", right: { ind: "macdSignal" } }] } },
  { id: "bb-squeeze-break", group: "Volatility", name: "Bollinger breakout", description: "Close above upper Bollinger band", config: { join: "AND", conds: [{ left: { ind: "close" }, op: "gt", right: { ind: "bbUpper", period: 20 } }] } },
  { id: "volume-spike", group: "Volume", name: "Volume spike", description: "Volume above 3× its 20-day average", config: { join: "AND", conds: [{ left: { ind: "volume" }, op: "gt", right: { ind: "volSma", period: 20 } }] } },
  { id: "strong-trend", group: "Trend", name: "Strong trend (ADX > 25)", description: "ADX(14) above 25 and +DI above −DI", config: { join: "AND", conds: [{ left: { ind: "adx", period: 14 }, op: "gt", right: n(25) }, { left: { ind: "pdi", period: 14 }, op: "gt", right: { ind: "ndi", period: 14 } }] } },
  { id: "supertrend-buy", group: "Trend", name: "Supertrend buy", description: "Close crosses above Supertrend(10, 3)", config: { join: "AND", conds: [{ left: { ind: "close" }, op: "crossAbove", right: { ind: "supertrend", period: 10 } }] } },
];
