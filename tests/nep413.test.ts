import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { KeyPair } from "near-api-js";
import { implicitAccountOf, nep413Hash, verifyNep413 } from "@/lib/web3/nep413";

describe("NEP-413", () => {
  it("verifies a wallet-style signature and rejects tampering", () => {
    const kp = KeyPair.fromRandom("ed25519");
    const p = { message: "Sign in to Busongo", nonce: crypto.randomBytes(32), recipient: "busongo", callbackUrl: "http://localhost:3000/auth/near" };
    const sig = Buffer.from(kp.sign(nep413Hash(p)).signature).toString("base64");
    const pk = kp.getPublicKey().toString();
    expect(verifyNep413(p, pk, sig)).toBe(true);
    expect(verifyNep413({ ...p, recipient: "evil" }, pk, sig)).toBe(false);
    expect(verifyNep413({ ...p, nonce: crypto.randomBytes(32) }, pk, sig)).toBe(false);
    expect(verifyNep413(p, KeyPair.fromRandom("ed25519").getPublicKey().toString(), sig)).toBe(false);
    const noCb = Buffer.from(kp.sign(nep413Hash({ ...p, callbackUrl: null })).signature).toString("base64");
    expect(verifyNep413(p, pk, noCb)).toBe(true);
    expect(implicitAccountOf(pk)).toMatch(/^[0-9a-f]{64}$/);
  });
});
