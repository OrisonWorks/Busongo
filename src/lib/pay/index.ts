import "server-only";
import crypto from "node:crypto";
import { prisma } from "../db";
import type { Plan } from "@prisma/client";

export type Network = "MTN" | "AIRTEL" | "ZAMTEL";
export type ChargeResult = { status: "pending" | "success" | "failed"; externalRef?: string; message?: string };
export interface PaymentProvider {
  id: string;
  label: string;
  charge(p: { reference: string; amount: number; phone: string; network: Network; email: string }): Promise<ChargeResult>;
  verifyWebhook(req: Request, body: string): Promise<{ reference: string; status: "success" | "failed"; externalRef?: string } | null>;
}

/** Sandbox provider for development: auto-approves after a short delay via the status endpoint. */
const sandbox: PaymentProvider = {
  id: "sandbox",
  label: "Sandbox (test payments)",
  async charge() { return { status: "pending", message: "Sandbox: approve the payment on the next screen." }; },
  async verifyWebhook() { return null; },
};

/** Generic HTTP Mobile Money aggregator, configured with env vars. Webhooks must be HMAC-SHA256 signed with PAYMENT_WEBHOOK_SECRET. */
const aggregator: PaymentProvider = {
  id: "aggregator",
  label: "Mobile Money",
  async charge(p) {
    const r = await fetch(process.env.PAYMENT_CHARGE_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.PAYMENT_API_KEY}` },
      body: JSON.stringify({ reference: p.reference, amount: p.amount, currency: "ZMW", phone: p.phone, network: p.network, email: p.email, callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/aggregator` }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { status: "failed", message: j.message || `Payment provider error ${r.status}` };
    return { status: "pending", externalRef: j.id ?? j.transactionId, message: "Approve the prompt on your phone." };
  },
  async verifyWebhook(req, body) {
    const sig = req.headers.get("x-signature") || "";
    const want = crypto.createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET || "").update(body).digest("hex");
    if (!sig || sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
    const j = JSON.parse(body);
    return { reference: j.reference, status: j.status === "success" || j.status === "successful" ? "success" : "failed", externalRef: j.id };
  },
};

export function provider(): PaymentProvider {
  return process.env.PAYMENT_CHARGE_URL && process.env.PAYMENT_API_KEY ? aggregator : sandbox;
}
export function getProvider(id: string) { return [sandbox, aggregator].find((p) => p.id === id); }

export function normalizePhone(p: string) {
  const d = p.replace(/\D/g, "");
  if (/^0[79]\d{8}$/.test(d)) return "260" + d.slice(1);
  if (/^260[79]\d{8}$/.test(d)) return d;
  if (/^[79]\d{8}$/.test(d)) return "260" + d;
  return null;
}
export function detectNetwork(phone260: string): Network | null {
  const p = phone260.slice(3, 5);
  if (["96", "76"].includes(p)) return "MTN";
  if (["97", "77", "57"].includes(p)) return "AIRTEL";
  if (["95", "75"].includes(p)) return "ZAMTEL";
  return null;
}

export async function settle(reference: string, status: "success" | "failed", externalRef?: string) {
  const pay = await prisma.payment.findUnique({ where: { reference } });
  if (!pay || pay.status === "success") return pay;
  if (status === "failed") return prisma.payment.update({ where: { reference }, data: { status, externalRef } });
  const u = await prisma.user.findUniqueOrThrow({ where: { id: pay.userId } });
  const base = u.plan === pay.plan && u.planExpiresAt && u.planExpiresAt > new Date() ? u.planExpiresAt : new Date();
  const exp = new Date(base); exp.setUTCMonth(exp.getUTCMonth() + pay.months);
  const [p] = await prisma.$transaction([
    prisma.payment.update({ where: { reference }, data: { status: "success", externalRef } }),
    prisma.user.update({ where: { id: u.id }, data: { plan: pay.plan as Plan, planExpiresAt: exp } }),
    prisma.notification.create({ data: { userId: u.id, title: "Payment received", body: `Your ${pay.plan} plan is active until ${exp.toISOString().slice(0, 10)}.` } }),
  ]);
  return p;
}
