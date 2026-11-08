import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { NEAR, hasFullAccessKey } from "@/lib/web3/near";
import { implicitAccountOf, verifyNep413 } from "@/lib/web3/nep413";
import { NEAR_COOKIE, SIGNIN_MESSAGE, WALLET_EMAIL_DOMAIN, readChallenge } from "@/lib/web3/session";
import { WEB3_ENABLED } from "@/config/features";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (!WEB3_ENABLED) return NextResponse.json({ error: "not found" }, { status: 404 });
  const jar = await cookies();
  const ch = await readChallenge(jar.get(NEAR_COOKIE)?.value);
  if (!ch) return fail("Sign-in request expired. Please try again.");
  jar.delete(NEAR_COOKIE);
  const b = (await req.json().catch(() => ({}))) as { accountId?: string; publicKey?: string; signature?: string };
  const accountId = String(b.accountId || "").toLowerCase();
  if (!/^[a-z0-9._-]{2,64}$/.test(accountId) || !b.publicKey || !b.signature) return fail("The wallet did not return a signature");
  const payload = { message: SIGNIN_MESSAGE, nonce: Buffer.from(ch.nonce, "base64"), recipient: NEAR.recipient, callbackUrl: ch.cb };
  if (!verifyNep413(payload, b.publicKey, b.signature)) return fail("Signature check failed", 401);
  const owns = /^[0-9a-f]{64}$/.test(accountId) ? implicitAccountOf(b.publicKey) === accountId || (await hasFullAccessKey(accountId, b.publicKey)) : await hasFullAccessKey(accountId, b.publicKey);
  if (!owns) return fail(`That key is not a full-access key of ${accountId}`, 401);

  const existing = await prisma.user.findUnique({ where: { nearAccountId: accountId } });
  if (ch.uid) {
    if (existing && existing.id !== ch.uid) return fail(`${accountId} is already linked to another Busongo account`, 409);
    await prisma.user.update({ where: { id: ch.uid }, data: { nearAccountId: accountId } });
    return NextResponse.json({ next: ch.next, accountId });
  }
  const user = existing ?? await prisma.user.create({
    data: { email: `${accountId}@${WALLET_EMAIL_DOMAIN}`, name: accountId, nearAccountId: accountId, passwordHash: await hashPassword(crypto.randomBytes(32).toString("hex")) },
  });
  await createSession(user.id);
  return NextResponse.json({ next: ch.next, accountId });
}
