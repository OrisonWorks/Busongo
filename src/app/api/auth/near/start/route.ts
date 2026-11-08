import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { NEAR } from "@/lib/web3/near";
import { NEAR_COOKIE, SIGNIN_MESSAGE, safeNext, signChallenge } from "@/lib/web3/session";
import { WEB3_ENABLED } from "@/config/features";

/** Starts NEP-413 sign-in (or account linking with ?link=1): redirects to the wallet with a fresh 32-byte nonce. */
export async function GET(req: Request) {
  if (!WEB3_ENABLED) return NextResponse.json({ error: "not found" }, { status: 404 });
  const url = new URL(req.url);
  const link = url.searchParams.get("link") === "1";
  const u = link ? await getUser() : null;
  if (link && !u) return NextResponse.redirect(new URL("/login?next=/profile", url));
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const nonce = crypto.randomBytes(32);
  const cb = `${origin}/auth/near`;
  const token = await signChallenge({ nonce: nonce.toString("base64"), cb, next: link ? "/profile" : safeNext(url.searchParams.get("next")), ...(u ? { uid: u.id } : {}) });
  const w = new URL(`${NEAR.wallet}/sign-message`);
  w.searchParams.set("message", SIGNIN_MESSAGE);
  w.searchParams.set("nonce", nonce.toString("base64"));
  w.searchParams.set("recipient", NEAR.recipient);
  w.searchParams.set("callbackUrl", cb);
  const res = NextResponse.redirect(w);
  res.cookies.set(NEAR_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: url.protocol === "https:", path: "/", maxAge: 600 });
  return res;
}
