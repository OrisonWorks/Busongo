import crypto from "node:crypto";

/** Deterministic JSON: object keys sorted recursively, so the same content always hashes the same. */
export function canonical(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(",")}}`;
}
export const proofHash = (payload: unknown) => crypto.createHash("sha256").update(canonical(payload)).digest("hex");
