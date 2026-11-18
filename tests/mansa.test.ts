import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseMansaBoard } from "../src/lib/ingest/mansa";

const home = readFileSync(__dirname + "/fixtures/mansa-zambia.html", "utf8");

describe("parseMansaBoard", () => {
  const p = parseMansaBoard(home);
  it("finds the session date, LASI and market cap", () => {
    expect(p.date).toBe("2026-11-18");
    expect(p.lasi.value).toBeCloseTo(24404.88);
    expect(p.lasi.pctChange).toBeCloseTo(-0.57);
    expect(p.marketCap).toBeCloseTo(328.66e9);
    expect(p.totalVolume).toBeCloseTo(80.7e3);
  });
  it("parses the full board once per symbol, signed changes", () => {
    expect(p.stocks.length).toBeGreaterThanOrEqual(20);
    expect(new Set(p.stocks.map((s) => s.symbol)).size).toBe(p.stocks.length);
    const znco = p.stocks.find((s) => s.symbol === "ZNCO")!;
    expect(znco.close).toBeCloseTo(8.51);
    expect(znco.pctChange).toBeCloseTo(-1.05);
    const shop = p.stocks.find((s) => s.symbol === "SHOP")!;
    expect(shop.pctChange).toBeCloseTo(3.76);
  });
});
