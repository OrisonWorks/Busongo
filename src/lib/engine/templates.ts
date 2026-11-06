import type { Cond } from "./series";

export type Template = { id: string; name: string; description: string; params: { key: string; label: string; def: number }[]; build: (p: Record<string, number>) => { entry: Cond[]; exit: Cond[] } };

const n = (value: number) => ({ ind: "number" as const, value });

export const TEMPLATES: Template[] = [
  {
    id: "ma-cross", name: "Moving average crossover", description: "Buy when the fast SMA crosses above the slow SMA; sell on the reverse cross.",
    params: [{ key: "fast", label: "Fast SMA", def: 20 }, { key: "slow", label: "Slow SMA", def: 50 }],
    build: (p) => ({ entry: [{ left: { ind: "sma", period: p.fast }, op: "crossAbove", right: { ind: "sma", period: p.slow } }], exit: [{ left: { ind: "sma", period: p.fast }, op: "crossBelow", right: { ind: "sma", period: p.slow } }] }),
  },
  {
    id: "price-ma", name: "Price above moving average", description: "Hold while the close is above its EMA.",
    params: [{ key: "period", label: "EMA period", def: 50 }],
    build: (p) => ({ entry: [{ left: { ind: "close" }, op: "crossAbove", right: { ind: "ema", period: p.period } }], exit: [{ left: { ind: "close" }, op: "crossBelow", right: { ind: "ema", period: p.period } }] }),
  },
  {
    id: "rsi-reversion", name: "RSI mean reversion", description: "Buy when RSI is oversold, sell when it recovers.",
    params: [{ key: "period", label: "RSI period", def: 14 }, { key: "low", label: "Buy below", def: 30 }, { key: "high", label: "Sell above", def: 60 }],
    build: (p) => ({ entry: [{ left: { ind: "rsi", period: p.period }, op: "crossBelow", right: n(p.low) }], exit: [{ left: { ind: "rsi", period: p.period }, op: "crossAbove", right: n(p.high) }] }),
  },
  {
    id: "macd", name: "MACD signal cross", description: "Buy when MACD crosses above its signal line, sell on the cross below.",
    params: [],
    build: () => ({ entry: [{ left: { ind: "macd" }, op: "crossAbove", right: { ind: "macdSignal" } }], exit: [{ left: { ind: "macd" }, op: "crossBelow", right: { ind: "macdSignal" } }] }),
  },
  {
    id: "breakout", name: "52-week high breakout", description: "Buy a new N-day closing high, exit below the M-day low.",
    params: [{ key: "hi", label: "Breakout lookback", def: 252 }, { key: "lo", label: "Exit lookback", def: 50 }],
    build: (p) => ({ entry: [{ left: { ind: "close" }, op: "gte", right: { ind: "highest", period: p.hi } }], exit: [{ left: { ind: "close" }, op: "lte", right: { ind: "lowest", period: p.lo } }] }),
  },
  {
    id: "bollinger", name: "Bollinger band bounce", description: "Buy a close below the lower band, sell at the middle band.",
    params: [{ key: "period", label: "Band period", def: 20 }],
    build: (p) => ({ entry: [{ left: { ind: "close" }, op: "lt", right: { ind: "bbLower", period: p.period } }], exit: [{ left: { ind: "close" }, op: "gt", right: { ind: "bbMid", period: p.period } }] }),
  },
  {
    id: "supertrend", name: "Supertrend follower", description: "Long when the close is above Supertrend.",
    params: [{ key: "period", label: "ATR period", def: 10 }],
    build: (p) => ({ entry: [{ left: { ind: "close" }, op: "crossAbove", right: { ind: "supertrend", period: p.period } }], exit: [{ left: { ind: "close" }, op: "crossBelow", right: { ind: "supertrend", period: p.period } }] }),
  },
];
