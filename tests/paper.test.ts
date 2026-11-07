import { describe, expect, it } from "vitest";
import { PAPER_START, paperBook } from "@/lib/paper";
import { planAtLeast } from "@/config/plans";

describe("paper book", () => {
  it("tracks cash and holdings through buys and sells", () => {
    const { cash, pos } = paperBook([
      { symbol: "A", side: "BUY", quantity: 10, price: 100, fees: 1 },
      { symbol: "A", side: "SELL", quantity: 4, price: 110, fees: 1 },
    ]);
    expect(cash).toBeCloseTo(PAPER_START - 1001 + 439, 6);
    expect(pos.get("A")?.q).toBe(6);
  });
});

describe("plans", () => {
  it("orders plans", () => {
    expect(planAtLeast("FREE", "ADVANCED")).toBe(false);
    expect(planAtLeast("ADVANCED", "ADVANCED")).toBe(true);
    expect(planAtLeast("PRO", "ADVANCED")).toBe(true);
  });
});
