import { describe, expect, it } from "vitest";
import { sma, ema, rsi, pivots, correlation } from "@/lib/indicators";
describe("indicators", () => {
  it("sma", () => expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]));
  it("ema seeds with sma", () => { const e = ema([1, 2, 3, 4, 5], 3); expect(e[2]).toBe(2); expect(e[3]).toBeCloseTo(3); });
  it("rsi is 100 on a straight rise", () => expect(rsi(Array.from({ length: 30 }, (_, i) => i + 1), 14).at(-1)).toBe(100));
  it("pivots", () => { const p = pivots(12, 8, 10); expect(p.p).toBe(10); expect(p.r1).toBe(12); expect(p.s1).toBe(8); });
  it("correlation", () => { expect(correlation([1, 2, 3, 4, 5, 6], [2, 4, 6, 8, 10, 12])).toBeCloseTo(1); expect(correlation([1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1])).toBeCloseTo(-1); });
});
