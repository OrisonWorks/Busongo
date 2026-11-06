import { describe, expect, it } from "vitest";
import { runBacktest } from "@/lib/engine/backtest";
import type { Candle } from "@/lib/engine/series";
const bars: Candle[] = Array.from({ length: 60 }, (_, i) => { const c = 100 + (i < 30 ? i : 60 - i); return { date: new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10), open: c, high: c, low: c, close: c, volume: 1000 }; });
describe("backtest", () => {
  it("enters and exits with fees, next-bar fills", () => {
    const r = runBacktest({ symbols: ["X"], entry: [{ left: { ind: "close" }, op: "crossAbove", right: { ind: "number", value: 110 } }], exit: [{ left: { ind: "close" }, op: "crossBelow", right: { ind: "number", value: 120 } }], capital: 100000, positionPct: 100, feeRate: 0.01375 }, new Map([["X", bars]]));
    expect(r.trades.length).toBe(1);
    const t = r.trades[0];
    expect(t.entryPrice).toBe(112);
    expect(t.fees).toBeGreaterThan(0);
    expect(r.metrics.totalFees).toBeCloseTo(t.fees, 6);
  });
  it("no trades without signals", () => {
    const r = runBacktest({ symbols: ["X"], entry: [{ left: { ind: "close" }, op: "gt", right: { ind: "number", value: 1e9 } }], exit: [], capital: 1000, positionPct: 100, feeRate: 0 }, new Map([["X", bars]]));
    expect(r.trades.length).toBe(0);
  });
});
