import { describe, expect, it } from "vitest";
import { parseLuseAnnouncements, parseLusePaste } from "@/lib/ingest/luse";
import { expectedLuseSession } from "@/lib/luse-due";

const page = [
  "Market Data Overview",
  "Market Data as of",
  "06/11/2026",
  "LASI",
  "Current Value",
  "24646.88",
  "Change",
  "+20.45",
  "% Change",
  "0.08",
  "Trades",
  "605",
  "Volume Traded",
  "94,517",
  "Value Traded",
  "ZMW 500,571.79",
  "Daily Stock Data",
  "Security\tISIN code\tClosing Price (ZMW)\tPrice Change\tTrades\tVolume Traded\tValue Traded (ZMW)\tBest Bid Price\tBest Bid Quantity\tBest Ask Price\tBest Ask Quantity\t",
  "AECI\tZM0000000284\t115.00\t-\t-\t-\t-\t-\t-\t115.00\t8,590\t113.00",
  "ATEL\tZM0000000342\t222.00\t-1.05\t18\t444\t98,613.00\t-\t-\t222.00\t1,187\t223.49",
  "SHOP\tZAE000012084\t350.00\t-\t-\t-\t-\t350.00\t19\t-\t-\t-",
  "",
  "About Us",
].join("\r\n");

describe("LuSE page paste", () => {
  it("reads date, LASI and share rows", () => {
    const p = parseLusePaste(page);
    expect(p.date.toISOString().slice(0, 10)).toBe("2026-11-06");
    expect(p.lasi.value).toBe(24646.88);
    expect(p.lasi.valueTraded).toBe(500571.79);
    expect(p.stocks.map((s) => s.symbol)).toEqual(["AECI", "ATEL", "SHOP"]);
    expect(p.stocks[1]).toMatchObject({ close: 222, change: -1.05, trades: 18, volume: 444, value: 98613, askPrice: 222, askQty: 1187 });
    expect(p.stocks[0]).toMatchObject({ close: 115, volume: 0, bidPrice: null });
  });
  it("still reads share rows when the copy lost its tabs", () => {
    const p = parseLusePaste(page.replace(/\t/g, "  "));
    expect(p.stocks.find((s) => s.symbol === "ATEL")).toMatchObject({ close: 222, volume: 444, value: 98613 });
  });
  it("rejects text without prices", () => {
    expect(() => parseLusePaste("hello")).toThrow(/market date/);
    expect(() => parseLusePaste("Market Data as of\n06/11/2026\n")).toThrow(/no share prices/);
  });
});

describe("LuSE homepage paste (SENS)", () => {
  // Verbatim shape of the SENS DOCUMENTS block on luse.co.zm (copied 9 Nov 2026).
  const home = [
    "Skip to main content",
    "Home",
    "SENS DOCUMENTS",
    "MFS Mandatory Offer-Results",
    "General Announcements",
    "9 November, 2026",
    "DOWNLOAD",
    "SHOPRITE_OPERATIONAL NOTICE",
    "General Announcements",
    "6 November, 2026",
    "DOWNLOAD",
    "VIEW ALL DOCUMENTS",
  ].join("\n");
  it("reads announcements without PDF links", () => {
    const s = parseLuseAnnouncements(home);
    expect(s).toHaveLength(2);
    expect(s[0]).toMatchObject({ title: "MFS Mandatory Offer-Results", category: "General Announcements", url: null });
    expect(s[0].date.toISOString().slice(0, 10)).toBe("2026-11-09");
    expect(s[1]).toMatchObject({ title: "SHOPRITE_OPERATIONAL NOTICE", category: "General Announcements" });
    expect(s[1].date.toISOString().slice(0, 10)).toBe("2026-11-06");
  });
  it("finds nothing on unrelated text", () => {
    expect(parseLuseAnnouncements("Market Data as of\n06/11/2026\n")).toEqual([]);
  });
});

describe("expected LuSE session", () => {
  const at = (iso: string) => expectedLuseSession(new Date(iso)).toISOString().slice(0, 10);
  it("is today after 17:00 Lusaka, else the previous trading day", () => {
    expect(at("2026-11-06T15:05:00Z")).toBe("2026-11-06");
    expect(at("2026-11-06T10:00:00Z")).toBe("2026-11-05");
  });
  it("skips weekends and holidays", () => {
    expect(at("2026-11-09T06:30:00Z")).toBe("2026-11-06");
    expect(at("2026-12-26T06:30:00Z")).toBe("2026-12-24");
  });
});
