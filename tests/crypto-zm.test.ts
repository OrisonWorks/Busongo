import { describe, expect, it } from "vitest";
import { afterTax, median, p2pPremium, realReturn, zmwReturnFromUsd } from "@/lib/crypto-zm";

describe("crypto-zm", () => {
  it("computes median, P2P premium and kwacha-terms returns", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
    expect(p2pPremium(21, 20)).toBeCloseTo(5);
    expect(zmwReturnFromUsd(5, 10)).toBeCloseTo(15.5);
    expect(zmwReturnFromUsd(5, -20)).toBeCloseTo(-16);
    expect(realReturn(10, 6)).toBeCloseTo(3.7736, 3);
    expect(afterTax(10, 15)).toBeCloseTo(8.5);
  });
});
