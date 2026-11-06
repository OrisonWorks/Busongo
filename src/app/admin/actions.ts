"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { importFundamentals, importPrices } from "@/lib/csv-import";
import { ingestBoz } from "@/lib/ingest/boz";
import { ingestCrypto } from "@/lib/ingest/crypto";
import { ingestLuse } from "@/lib/ingest/luse";
import { evaluateAlerts } from "@/lib/alerts";
import type { FormState } from "@/app/(auth)/actions";

async function text(fd: FormData) {
  const f = fd.get("file");
  if (f instanceof File && f.size) return f.text();
  return String(fd.get("csv") || "");
}
export async function importPricesAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const r = await importPrices(await text(fd));
  revalidatePath("/", "layout");
  return r.ok ? { ok: `Imported ${r.ok}/${r.total} rows.${r.errors.length ? " " + r.errors.join("; ") : ""}` } : { error: `Nothing imported. ${r.errors.join("; ")}` };
}
export async function importFundamentalsAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const r = await importFundamentals(await text(fd));
  revalidatePath("/fundamentals");
  return r.ok ? { ok: `Imported ${r.ok}/${r.total} rows.${r.errors.length ? " " + r.errors.join("; ") : ""}` } : { error: `Nothing imported. ${r.errors.join("; ")}` };
}
const actionSchema = z.object({ symbol: z.string().min(1), type: z.string().min(1).max(40), amount: z.coerce.number().optional(), exDate: z.string().optional(), payDate: z.string().optional(), notes: z.string().max(500).optional() });
export async function addCorporateAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const p = actionSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const s = await prisma.security.findUnique({ where: { symbol: p.data.symbol } });
  if (!s) return { error: "Unknown symbol" };
  const d = (x?: string) => (x ? new Date(x + "T00:00:00Z") : null);
  await prisma.corporateAction.create({ data: { securityId: s.id, type: p.data.type, amount: p.data.amount ?? null, exDate: d(p.data.exDate), payDate: d(p.data.payDate), notes: p.data.notes || null } });
  revalidatePath("/calendar");
  return { ok: "Corporate action added." };
}
export async function runIngest(job: "luse" | "boz" | "crypto") {
  await requireAdmin();
  const run = await prisma.ingestRun.create({ data: { source: job, status: "running" } });
  try {
    const r = await (job === "luse" ? ingestLuse() : job === "boz" ? ingestBoz() : ingestCrypto(10));
    await evaluateAlerts();
    await prisma.ingestRun.update({ where: { id: run.id }, data: { status: "ok", message: JSON.stringify(r), endedAt: new Date() } });
  } catch (e) {
    await prisma.ingestRun.update({ where: { id: run.id }, data: { status: "error", message: String(e).slice(0, 1000), endedAt: new Date() } });
  }
  revalidatePath("/admin");
}
export async function setPlan(userId: string, fd: FormData) {
  await requireAdmin();
  const plan = String(fd.get("plan")) as "FREE" | "ADVANCED" | "PRO";
  const months = Number(fd.get("months") || 1);
  const exp = new Date(); exp.setUTCMonth(exp.getUTCMonth() + months);
  await prisma.user.update({ where: { id: userId }, data: { plan, planExpiresAt: plan === "FREE" ? null : exp } });
  revalidatePath("/admin");
}
