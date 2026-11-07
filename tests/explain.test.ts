import { describe, expect, it } from "vitest";
import { explainRules } from "@/lib/explain";

describe("explainRules", () => {
  it("compares against buy & hold and the T-bill, and flags small samples", () => {
    const pts = explainRules({ metrics: { totalReturn: 12, benchmarkReturn: 20, riskFreeReturn: 14, maxDrawdown: -35, trades: 6, winRate: 50, profitFactor: 1.2, totalFees: 3000, finalEquity: 112000, exposure: 40 } });
    expect(pts[0]).toMatch(/lagged buy-and-hold by 8.0 points/);
    expect(pts[1]).toMatch(/worse than a risk-free 364-day GRZ T-bill/);
    expect(pts.join(" ")).toMatch(/deep drawdown/);
    expect(pts.join(" ")).toMatch(/only 6 trades/);
    expect(pts.join(" ")).toMatch(/K3,000 \(3.0% of starting capital\)/);
  });
  it("handles strategies that never traded", () => {
    expect(explainRules({ metrics: { trades: 0 } })).toHaveLength(1);
  });
});
