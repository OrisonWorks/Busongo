import crypto from "node:crypto";
import bs58 from "bs58";

/** NEP-413 tag: 2^31 + 413, prefixed (u32 LE) to the borsh payload before hashing. */
const TAG = 2147484061;

const u32 = (n: number) => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; };
const str = (s: string) => { const b = Buffer.from(s, "utf8"); return Buffer.concat([u32(b.length), b]); };

export type Nep413Payload = { message: string; nonce: Uint8Array; recipient: string; callbackUrl?: string | null };

export function nep413Hash(p: Nep413Payload) {
  if (p.nonce.length !== 32) throw new Error("nonce must be 32 bytes");
  const cb = p.callbackUrl == null ? Buffer.from([0]) : Buffer.concat([Buffer.from([1]), str(p.callbackUrl)]);
  const body = Buffer.concat([u32(TAG), str(p.message), Buffer.from(p.nonce), str(p.recipient), cb]);
  return crypto.createHash("sha256").update(body).digest();
}

const SPKI_ED25519 = Buffer.from("302a300506032b6570032100", "hex");

/** `publicKey` as "ed25519:<base58>", `signature` base64 (as returned by wallets). */
export function verifyNep413(p: Nep413Payload, publicKey: string, signature: string) {
  const m = publicKey.match(/^ed25519:([1-9A-HJ-NP-Za-km-z]+)$/);
  if (!m) return false;
  const raw = Buffer.from(bs58.decode(m[1]));
  const sig = Buffer.from(signature, "base64");
  if (raw.length !== 32 || sig.length !== 64) return false;
  const key = crypto.createPublicKey({ key: Buffer.concat([SPKI_ED25519, raw]), format: "der", type: "spki" });
  const h = nep413Hash(p);
  if (crypto.verify(null, h, key, sig)) return true;
  // Some wallets sign without the callbackUrl field set.
  return p.callbackUrl != null && crypto.verify(null, nep413Hash({ ...p, callbackUrl: null }), key, sig);
}

/** NEAR implicit accounts are the hex of their ed25519 public key. */
export const implicitAccountOf = (publicKey: string) => Buffer.from(bs58.decode(publicKey.replace(/^ed25519:/, ""))).toString("hex");
