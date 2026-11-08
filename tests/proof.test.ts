import { describe, expect, it } from "vitest";
import { canonical, proofHash } from "@/lib/web3/proof";

describe("proof hashing", () => {
  it("is independent of key order and sensitive to content", () => {
    expect(canonical({ b: 1, a: [{ y: 2, x: 1 }] })).toBe('{"a":[{"x":1,"y":2}],"b":1}');
    expect(proofHash({ a: 1, b: 2 })).toBe(proofHash({ b: 2, a: 1 }));
    expect(proofHash({ a: 1, b: 2 })).not.toBe(proofHash({ a: 1, b: 3 }));
    expect(proofHash({ a: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });
});
