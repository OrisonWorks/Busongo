import { describe, expect, it } from "vitest";
import { pivot, toCsv } from "@/lib/feed-format";

describe("feed format", () => {
  it("writes CSV with blanks for missing values and quotes when needed", () => {
    expect(toCsv(["date", "value", "note"], [{ date: "2026-01-02", value: 1.5, note: 'a "b", c' }, { date: "2026-01-03", value: null }]))
      .toBe('date,value,note\n2026-01-02,1.5,"a ""b"", c"\n2026-01-03,,\n');
  });
  it("pivots long auction rows into one row per date", () => {
    const rows = [{ d: "2026-02-01", t: 364, y: 15 }, { d: "2026-01-01", t: 91, y: 10 }, { d: "2026-01-01", t: 364, y: 14 }];
    expect(pivot(rows, (r) => r.d, (r) => `d${r.t}`, (r) => r.y)).toEqual([{ date: "2026-01-01", d91: 10, d364: 14 }, { date: "2026-02-01", d364: 15 }]);
  });
});
