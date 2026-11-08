import { describe, expect, it } from "vitest";
import { handleError, handleLabel, normalizeHandle } from "@/lib/handles";

describe("handles", () => {
  it("normalises @ and case", () => {
    expect(normalizeHandle(" @Tumelo ")).toBe("tumelo");
    expect(handleLabel("tumelo")).toBe("@tumelo");
  });
  it("validates format and reserved names", () => {
    expect(handleError("tumelo")).toBeNull();
    expect(handleError("lusaka-trader-1")).toBeNull();
    expect(handleError("ab")).not.toBeNull();
    expect(handleError("-tumelo")).not.toBeNull();
    expect(handleError("tumelo_m")).not.toBeNull();
    expect(handleError("tumelo.busongo")).not.toBeNull();
    expect(handleError("admin")).toBe("That handle is reserved");
  });
});
