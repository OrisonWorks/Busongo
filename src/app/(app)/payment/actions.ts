"use server";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PLANS } from "@/config/plans";
import { detectNetwork, normalizePhone, provider, settle, type Network } from "@/lib/pay";
import type { FormState } from "@/app/(auth)/actions";
import { latestMacro } from "@/lib/market";
import { NEAR, ftDecimals, stablePaymentsEnabled, toUnits, verifyFtTransfer, type Stablecoin } from "@/lib/web3/near";

const DISCOUNT: Record<number, number> = { 1: 0, 3: 0.05, 6: 0.1, 12: 0.2 };
export async function startPayment(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const plan = String(fd.get("plan"));
  const months = Number(fd.get("months"));
  if (plan !== "ADVANCED" && plan !== "PRO") return { error: "Choose a plan" };
  if (!(months in DISCOUNT)) return { error: "Choose a billing period" };
  const phone = normalizePhone(String(fd.get("phone") || ""));
  if (!phone) return { error: "Enter a valid Zambian mobile number" };
  const network = (String(fd.get("network") || "") || detectNetwork(phone)) as Network | null;
  if (!network) return { error: "Choose your mobile network" };
  const amount = Math.round(PLANS[plan].priceZmw * months * (1 - DISCOUNT[months]) * 100) / 100;
  const reference = `ZQ${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const pv = provider();
  await prisma.payment.create({ data: { userId: u.id, plan, months, amount, provider: pv.id, network, phone, reference } });
  const r = await pv.charge({ reference, amount, phone, network, email: u.email });
  if (r.status === "failed") { await settle(reference, "failed"); return { error: r.message || "Payment failed" }; }
  await prisma.payment.update({ where: { reference }, data: { externalRef: r.externalRef } });
  if (r.status === "success") await settle(reference, "success", r.externalRef);
  redirect(`/payment?ref=${reference}`);
}

export async function sandboxApprove(reference: string) {
  const u = await requireUser();
  if (provider().id !== "sandbox") return;
  const p = await prisma.payment.findFirst({ where: { reference, userId: u.id, provider: "sandbox" } });
  if (p) await settle(reference, "success", "sandbox");
  redirect(`/payment?ref=${reference}`);
}

export async function startStablePayment(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const plan = String(fd.get("plan"));
  const months = Number(fd.get("months"));
  const token = String(fd.get("token")) as Stablecoin;
  if (plan !== "ADVANCED" && plan !== "PRO") return { error: "Choose a plan" };
  if (!(months in DISCOUNT)) return { error: "Choose a billing period" };
  if (!(token in NEAR.tokens) || !stablePaymentsEnabled()) return { error: "Stablecoin payments are not available" };
  const rate = (await latestMacro()).USDZMW?.value;
  if (!rate) return { error: "No BoZ USD/ZMW rate available yet" };
  const zmw = PLANS[plan].priceZmw * months * (1 - DISCOUNT[months]);
  const amount = Math.ceil((zmw / rate) * 100) / 100;
  const reference = `ZQ${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  await prisma.payment.create({ data: { userId: u.id, plan, months, amount, currency: token, provider: "near", network: NEAR.network, reference } });
  redirect(`/payment?ref=${reference}`);
}

export async function confirmStablePayment(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const reference = String(fd.get("ref"));
  const txHash = String(fd.get("txHash") || "").trim();
  const sender = String(fd.get("sender") || "").trim().toLowerCase();
  const p = await prisma.payment.findFirst({ where: { reference, userId: u.id, provider: "near" } });
  if (!p || p.status !== "pending") return { error: "Payment not found or already settled" };
  if (!/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(txHash)) return { error: "Paste the transaction hash from your wallet or explorer" };
  if (!/^[a-z0-9._-]{2,64}$/.test(sender)) return { error: "Enter the NEAR account you paid from" };
  if (await prisma.payment.findFirst({ where: { externalRef: txHash, status: "success" } })) return { error: "That transaction has already been used" };
  const token = NEAR.tokens[p.currency as Stablecoin];
  const minUnits = toUnits(p.amount, await ftDecimals(token));
  const v = await verifyFtTransfer({ txHash, sender, token, receiver: NEAR.merchant, minUnits, memo: p.reference });
  if (!v.ok) return { error: v.error };
  await settle(reference, "success", txHash);
  redirect(`/payment?ref=${reference}`);
}
