import { describe, expect, it } from "vitest";
import { alignSeries, beta, correlation, dailyReturns, maxDrawdown, stats, volatility } from "@/lib/compare";

describe("compare maths", () => {
  it("daily returns", () => {
    expect(dailyReturns([100, 110, 99])[0]).toBeCloseTo(0.1);
    expect(dailyReturns([100, 110, 99])[1]).toBeCloseTo(-0.1);
    expect(dailyReturns([100])).toEqual([]);
  });
  it("volatility is 0 for a flat series and grows with jumps", () => {
    expect(volatility([10, 10, 10, 10])).toBe(0);
    expect(volatility([10, 11, 9, 12])!).toBeGreaterThan(0);
  });
  it("maxDrawdown measures peak-to-trough", () => {
    expect(maxDrawdown([100, 120, 60, 90])).toBeCloseTo(-50);
    expect(maxDrawdown([10, 11, 12])).toBe(0);
  });
  it("correlation & beta", () => {
    const a = [0.02, -0.01, 0.03, -0.02, 0.015, 0.005];
    const b = a.map((x) => x / 2); // benchmark moves are exactly half
    expect(correlation(a, b)!).toBeCloseTo(1, 1);
    expect(beta(a, b)!).toBeCloseTo(2, 1);
    expect(correlation([0.01], [0.02])).toBeNull();
  });
  it("alignSeries keeps shared dates only", () => {
    const { dates, closes } = alignSeries([
      [{ date: "2026-01-01", close: 1 }, { date: "2026-01-02", close: 2 }],
      [{ date: "2026-01-02", close: 5 }, { date: "2026-01-03", close: 6 }],
    ]);
    expect(dates).toEqual(["2026-01-02"]);
    expect(closes).toEqual([[2], [5]]);
  });
  it("stats bundles everything", () => {
    const bars = Array.from({ length: 30 }, (_, i) => ({ date: `2026-01-${i + 1}`, close: 100 + i, value: 1000 }));
    // Benchmark with identical daily moves → beta 1, correlation 1.
    const st = stats(bars, dailyReturns(bars.map((b) => b.close)));
    expect(st.sessions).toBe(30);
    expect(st.totalReturn!).toBeCloseTo(29, 0);
    expect(st.avgValue).toBe(1000);
    expect(st.beta!).toBeCloseTo(1, 5);
    expect(st.corr!).toBeCloseTo(1, 5);
  });
});
