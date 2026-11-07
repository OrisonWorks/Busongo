import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/csv-import";
import { normalizePhone, detectNetwork } from "@/lib/pay";
import { zambianHolidays } from "@/lib/data/holidays";
import { LUSE_FEE_RATE } from "@/config/fees";
describe("parsers", () => {
  it("csv with quotes", () => expect(parseCsv('Date,Symbol,Close\n2025-01-02,ZSUG,"1,234.5"\n')).toEqual([{ date: "2025-01-02", symbol: "ZSUG", close: "1,234.5" }]));
  it("phones", () => { expect(normalizePhone("0961234567")).toBe("260961234567"); expect(detectNetwork("260971234567")).toBe("AIRTEL"); expect(detectNetwork("260961234567")).toBe("MTN"); expect(normalizePhone("12345")).toBeNull(); });
  it("holidays include Independence Day", () => expect(zambianHolidays(2026).some((h) => h.date.toISOString().startsWith("2026-10-24"))).toBe(true));
  it("LuSE fee 1.375%", () => expect(LUSE_FEE_RATE).toBeCloseTo(0.01375, 10));
});
