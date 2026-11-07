"use server";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PLANS } from "@/config/plans";
import { detectNetwork, normalizePhone, provider, settle, type Network } from "@/lib/pay";
import type { FormState } from "@/app/(auth)/actions";

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
