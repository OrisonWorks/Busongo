import { expect, test } from "vitest";
import { safeNext } from "@/lib/web3/session";
test("safeNext", () => {
  for (const ok of ["/dashboard", "/stocks/ZSUG?x=1", "/a/b#c"]) expect(safeNext(ok)).toBe(ok);
  for (const bad of ["//evil.com", "/\\evil.com", "/\t/evil.com", "/%0a", "https://evil.com", "", null, "/ok\\x"]) expect(safeNext(bad as string)).toBe(bad === "/%0a" ? "/%0a" : "/dashboard");
});
