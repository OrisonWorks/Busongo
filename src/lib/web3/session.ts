import "server-only";
import { SignJWT, jwtVerify } from "jose";

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only-secret");
export const NEAR_COOKIE = "near_auth";
export const SIGNIN_MESSAGE = "Sign in to Busongo";
export type NearChallenge = { nonce: string; cb: string; next: string; uid?: string };

export const signChallenge = (c: NearChallenge) =>
  new SignJWT(c).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("10m").setAudience("near-signin").sign(key());
export async function readChallenge(token?: string) {
  if (!token) return null;
  try { return (await jwtVerify(token, key(), { audience: "near-signin" })).payload as unknown as NearChallenge; } catch { return null; }
}
export const safeNext = (n: string | null | undefined, d = "/dashboard") => (n && n.startsWith("/") && !n.startsWith("//") ? n : d);
