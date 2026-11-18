import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseMansaBoard, parseMansaDividends } from "../src/lib/ingest/mansa";

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
    // +3.76% belongs to ZABR's mover card, not SHOP (board badge "—").
    const zabr = p.stocks.find((s) => s.symbol === "ZABR")!;
    expect(zabr.pctChange).toBeCloseTo(3.76);
    const shop = p.stocks.find((s) => s.symbol === "SHOP")!;
    expect(shop.pctChange).toBeNull();
    // A counter whose badge is "—" (no % change) must still be kept, not skipped.
    const mafs = p.stocks.find((s) => s.symbol === "MAFS")!;
    expect(mafs.close).toBeCloseTo(1.81);
    expect(mafs.pctChange).toBeNull();
    expect(p.stocks.some((s) => s.symbol === "KLRE")).toBe(true);
    expect(p.stocks.some((s) => s.symbol === "NATB")).toBe(true);
  });
});

describe("ticker page volume", () => {
  it("parses Volume from sibling spans and bare numbers", async () => {
    const { mansaVolume } = await import("../src/lib/ingest/mansa");
    const { readFileSync } = await import("node:fs");
    const { volume } = await import("../src/lib/ingest/mansa");
    const cecz = readFileSync(__dirname + "/fixtures/mansa-cecz.html", "utf8");
    expect(volume(cecz)).toBeCloseTo(19.7e3);
    expect(volume('<span>Volume</span><span>4</span>')).toBe(4);
  });
});

describe("parseMansaDividends", () => {
  const rows = parseMansaDividends(readFileSync(__dirname + "/fixtures/mansa-dividends.html", "utf8"));
  it("parses DPS, dates, yield and status", () => {
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const z = rows.find((r) => r.name.includes("Zambia National"))!;
    expect(z.dps).toBeCloseTo(0.58);
    expect(z.exDate?.toISOString().slice(0, 10)).toBe("2026-05-12");
    expect(z.payDate?.toISOString().slice(0, 10)).toBe("2026-06-09");
    expect(z.yieldPct).toBeCloseTo(8.8);
  });
});
