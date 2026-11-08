"use server";
import { revalidatePath } from "next/cache";
import { paperBook } from "@/lib/paper";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PLANS } from "@/config/plans";
import type { FormState } from "@/app/(auth)/actions";
import { PAYMENTS_ENABLED } from "@/config/features";

export async function toggleWatch(symbol: string) {
  const u = await requireUser();
  const ex = await prisma.watchItem.findUnique({ where: { userId_symbol: { userId: u.id, symbol } } });
  if (ex) await prisma.watchItem.delete({ where: { id: ex.id } });
  else await prisma.watchItem.create({ data: { userId: u.id, symbol } });
  revalidatePath("/watchlist");
  revalidatePath(`/stocks/${symbol}`);
  return !ex;
}

const alertSchema = z.object({ symbol: z.string().min(1), metric: z.enum(["close", "changePct", "volume", "value"]), operator: z.enum(["gt", "lt"]), threshold: z.coerce.number().finite() });
export async function createAlert(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const p = alertSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const limit = PLANS[u.effectivePlan].alerts;
  const n = await prisma.alert.count({ where: { userId: u.id, active: true } });
  if (n >= limit) return { error: PAYMENTS_ENABLED ? `Your ${PLANS[u.effectivePlan].label} plan allows ${limit} active alerts. Upgrade for more.` : `You can have up to ${limit} active alerts.` };
  const sec = await prisma.security.findUnique({ where: { symbol: p.data.symbol.toUpperCase() } });
  if (!sec) return { error: "Unknown symbol" };
  await prisma.alert.create({ data: { userId: u.id, securityId: sec.id, metric: p.data.metric, operator: p.data.operator, threshold: p.data.threshold } });
  revalidatePath("/alerts");
  return { ok: "Alert created. You'll be notified after the next end-of-day update that meets it." };
}

export async function deleteAlert(id: string) {
  const u = await requireUser();
  await prisma.alert.deleteMany({ where: { id, userId: u.id } });
  revalidatePath("/alerts");
}

export async function markNotificationsRead() {
  const u = await requireUser();
  await prisma.notification.updateMany({ where: { userId: u.id, read: false }, data: { read: true } });
  revalidatePath("/notifications");
}

const journalSchema = z.object({ symbol: z.string().min(1), side: z.enum(["BUY", "SELL"]), quantity: z.coerce.number().positive(), price: z.coerce.number().positive(), fees: z.coerce.number().min(0).optional(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), tag: z.string().max(40).optional(), notes: z.string().max(2000).optional() });
export async function addJournal(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const p = journalSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const sec = await prisma.security.findUnique({ where: { symbol: p.data.symbol.toUpperCase() } });
  if (!sec) return { error: "Unknown symbol" };
  const { LUSE_FEE_RATE, CRYPTO_FEE_RATE } = await import("@/config/fees");
  const fees = p.data.fees ?? p.data.quantity * p.data.price * (sec.assetClass === "CRYPTO" ? CRYPTO_FEE_RATE : LUSE_FEE_RATE);
  await prisma.journalEntry.create({ data: { userId: u.id, securityId: sec.id, side: p.data.side, quantity: p.data.quantity, price: p.data.price, fees, date: new Date(p.data.date + "T00:00:00Z"), tag: p.data.tag || null, notes: p.data.notes || null } });
  revalidatePath("/journal");
  return { ok: "Trade logged." };
}
export async function deleteJournal(id: string) {
  const u = await requireUser();
  await prisma.journalEntry.deleteMany({ where: { id, userId: u.id } });
  revalidatePath("/journal");
}

export async function paperTrade(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const symbol = String(fd.get("symbol") || "").toUpperCase();
  const side = fd.get("side") === "SELL" ? "SELL" : "BUY";
  const quantity = Number(fd.get("quantity"));
  if (!(quantity > 0)) return { error: "Enter a quantity" };
  const sec = await prisma.security.findUnique({ where: { symbol }, include: { bars: { orderBy: { date: "desc" }, take: 1 } } });
  const price = sec?.bars[0]?.close;
  if (!sec || !price) return { error: "No price available for that symbol" };
  const { LUSE_FEE_RATE, CRYPTO_FEE_RATE } = await import("@/config/fees");
  if (sec.assetClass !== "CRYPTO" && !Number.isInteger(quantity)) return { error: "LuSE shares trade in whole units" };
  const fees = quantity * price * (sec.assetClass === "CRYPTO" ? CRYPTO_FEE_RATE : LUSE_FEE_RATE);
  const { cash, pos } = paperBook(await prisma.paperTrade.findMany({ where: { userId: u.id }, orderBy: { createdAt: "asc" } }));
  if (side === "SELL") {
    const held = pos.get(symbol)?.q ?? 0;
    if (held < quantity) return { error: `You only hold ${held} ${symbol}` };
  } else if (quantity * price + fees > cash + 1e-6) {
    return { error: `Insufficient cash: this order costs K${(quantity * price + fees).toFixed(2)} including fees, but you have K${cash.toFixed(2)}.` };
  }
  await prisma.paperTrade.create({ data: { userId: u.id, symbol, side, quantity, price, fees } });
  revalidatePath("/paper");
  return { ok: `${side === "BUY" ? "Bought" : "Sold"} ${quantity} ${symbol} at ${price} (latest close).` };
}
