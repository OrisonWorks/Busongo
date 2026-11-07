import { describe, expect, it } from "vitest";
import { parseClause, parseStrategyText } from "@/lib/nl-strategy";

describe("parseStrategyText", () => {
  it("parses RSI + moving-average entry, RSI exit and risk rules", () => {
    const r = parseStrategyText("Buy when RSI is under 30 and price is above the 200-day moving average. Sell when RSI goes above 70, with a 5% stop loss and 15% take profit");
    expect(r.entry).toEqual([
      { left: { ind: "rsi", period: 14 }, op: "lt", right: { ind: "number", value: 30 } },
      { left: { ind: "close" }, op: "gt", right: { ind: "sma", period: 200 } },
    ]);
    expect(r.exit).toEqual([{ left: { ind: "rsi", period: 14 }, op: "crossAbove", right: { ind: "number", value: 70 } }]);
    expect(r.stopLossPct).toBe(5);
    expect(r.takeProfitPct).toBe(15);
    expect(r.unparsed).toEqual([]);
  });
  it("parses crossovers, MACD and 52-week highs", () => {
    expect(parseClause("50 day EMA crosses above 200 day SMA")).toEqual({ left: { ind: "ema", period: 50 }, op: "crossAbove", right: { ind: "sma", period: 200 } });
    expect(parseClause("bullish MACD crossover")).toEqual({ left: { ind: "macd" }, op: "crossAbove", right: { ind: "macdSignal" } });
    expect(parseClause("hits a new 52-week high")).toEqual({ left: { ind: "close" }, op: "gte", right: { ind: "highest", period: 252 } });
    expect(parseClause("golden cross")?.right).toEqual({ ind: "sma", period: 200 });
    expect(parseClause("volume above its 20-day average")).toEqual({ left: { ind: "volume" }, op: "gt", right: { ind: "volSma", period: 20 } });
    expect(parseClause("up more than 10% in 20 days")).toEqual({ left: { ind: "roc", period: 20 }, op: "gt", right: { ind: "number", value: 10 } });
  });
  it("reports clauses it can't map, and OR joins", () => {
    const r = parseStrategyText("enter when RSI(7) below 20 or price crosses below the lower Bollinger band. exit after holding 10 days");
    expect(r.entryJoin).toBe("OR");
    expect(r.entry).toHaveLength(2);
    expect(r.maxHoldDays).toBe(10);
    expect(parseStrategyText("buy when the CEO tweets").unparsed).toEqual(["the CEO tweets"]);
  });
});
