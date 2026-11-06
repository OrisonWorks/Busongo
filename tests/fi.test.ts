import { describe, expect, it } from "vitest";
import { bondPrice, bondYield, bondDuration, realYield, tbillPriceFromYield, tbillYieldFromPrice } from "@/lib/fi";
describe("fixed income", () => {
  it("bond at par when coupon = yield", () => expect(bondPrice(12, 12, 2)).toBeCloseTo(100, 6));
  it("bond price/yield round-trip", () => { const p = bondPrice(16.6, 14.5, 10); expect(p).toBeGreaterThan(100); expect(bondYield(p, 16.6, 10)).toBeCloseTo(14.5, 3); });
  it("duration below maturity", () => { const d = bondDuration(16, 13.75, 7); expect(d.macaulay).toBeLessThan(7); expect(d.modified).toBeLessThan(d.macaulay); });
  it("t-bill round-trip", () => { const p = tbillPriceFromYield(10, 364); expect(p).toBeLessThan(100); expect(tbillYieldFromPrice(p, 364)).toBeCloseTo(10, 6); });
  it("real yield", () => expect(realYield(10, 6.3)).toBeCloseTo((1.1 / 1.063 - 1) * 100, 6));
});
