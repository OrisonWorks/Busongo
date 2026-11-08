import { describe, expect, it } from "vitest";
import { direction, monthChange, priceGrowth, since } from "@/lib/plain";
import { t } from "@/lib/i18n";

describe("plain-language helpers", () => {
  it("compounds annual inflation prints over the period", () => {
    const inf = [{ date: "2020-01-01", value: 12 }];
    expect(priceGrowth(inf, "2020-01-01", "2021-01-01")).toBeCloseTo(1.12, 2);
    expect(priceGrowth([{ date: "2020-01-01", value: 10 }, { date: "2021-01-01", value: 20 }], "2020-01-01", "2022-01-01")).toBeCloseTo(1.1 * 1.2, 2);
  });
  it("compares the latest value with about a month earlier", () => {
    const rows = [{ date: "2026-09-01", value: 20 }, { date: "2026-10-01", value: 21 }, { date: "2026-10-05", value: 22 }];
    const c = monthChange(rows)!;
    expect(c.prev?.value).toBe(20);
    expect(c.pct).toBeCloseTo(10);
    expect(direction(c.pct)).toBe("up");
    expect(direction(0.01)).toBe("same");
  });
  it("finds when the current policy rate took effect", () => {
    expect(since([{ date: "a", value: 9 }, { date: "b", value: 10 }, { date: "c", value: 10 }])).toBe("b");
  });
  it("falls back to English for untranslated strings and fills placeholders", () => {
    expect(t("toi", "dollar.line", { now: "K20" })).toBe("$1 costs K20 today.");
    expect(t("ny", "dollar.line", { now: "K20" })).toBe("$1 ndi K20 lero.");
  });
});
