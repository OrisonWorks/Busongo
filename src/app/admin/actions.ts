"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { importFundamentals, importPrices } from "@/lib/csv-import";
import { ingestBoz } from "@/lib/ingest/boz";
import { ingestCrypto } from "@/lib/ingest/crypto";
import { ingestLuse, ingestLuseAnnouncementsPaste, ingestLusePaste } from "@/lib/ingest/luse";
import { evaluateAlerts } from "@/lib/alerts";
import { generateBrief } from "@/lib/brief";
import { ingestP2P } from "@/lib/ingest/p2p";
import { ingestStableYields } from "@/lib/ingest/defi";
import { anchorMarketData, anchorRoadmapTally } from "@/lib/web3/proofs";
import { summarizeAnnouncements } from "@/lib/ai/sens";
import { extractFundamentals, toCsv } from "@/lib/ai/fundamentals";
import { fetchPdf, pdfTextFromBuffer } from "@/lib/ai/pdf";
import { aiConfigured } from "@/lib/ai";
import type { FormState } from "@/app/(auth)/actions";

async function text(fd: FormData) {
  const f = fd.get("file");
  if (f instanceof File && f.size) return f.text();
  return String(fd.get("csv") || "");
}
/** The scheduled brief and ledger proof run before the day's LuSE prices are pasted, so refresh them after an upload. */
async function refreshAfterUpload() {
  try {
    await generateBrief();
  } catch (e) {
    console.error("brief after upload", e);
  }
  try {
    await anchorMarketData();
  } catch (e) {
    console.error("market-data proof after upload", e);
  }
}
export async function importLusePasteAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const run = await prisma.ingestRun.create({ data: { source: "luse-paste", status: "running" } });
  try {
    const r = await ingestLusePaste(String(fd.get("page") || ""));
    let sensNote = "";
    const sensText = String(fd.get("sens") || "").trim();
    if (sensText) {
      try {
        const s = await ingestLuseAnnouncementsPaste(sensText);
        sensNote = ` ${s.sens} SENS announcement${s.sens === 1 ? "" : "s"} saved.`;
      } catch (e) {
        sensNote = ` SENS paste failed: ${e instanceof Error ? e.message : e}`;
      }
    }
    await evaluateAlerts();
    await refreshAfterUpload();
    await prisma.ingestRun.update({ where: { id: run.id }, data: { status: "ok", rows: r.rows, message: JSON.stringify({ ...r, sensNote }), endedAt: new Date() } });
    revalidatePath("/", "layout");
    return { ok: `Saved ${r.rows} share prices${r.lasi ? " and the LASI" : ""} for ${r.date.toISOString().slice(0, 10)}.${sensNote} Daily brief refreshed.` };
  } catch (e) {
    await prisma.ingestRun.update({ where: { id: run.id }, data: { status: "error", message: String(e).slice(0, 1000), endedAt: new Date() } });
    return { error: `Couldn't read that (${e instanceof Error ? e.message : e}). Copy the whole LuSE Market Data page (Ctrl+A, then Ctrl+C) and paste it here.` };
  }
}
export async function importPricesAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const r = await importPrices(await text(fd));
  if (r.ok) await refreshAfterUpload();
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
export async function runIngest(job: "luse" | "boz" | "crypto" | "p2p" | "defi" | "brief" | "sens-ai" | "proofs" | "roadmap") {
  await requireAdmin();
  const run = await prisma.ingestRun.create({ data: { source: job, status: "running" } });
  try {
    const r = await (job === "luse" ? ingestLuse() : job === "boz" ? ingestBoz() : job === "p2p" ? ingestP2P() : job === "defi" ? ingestStableYields() : job === "brief" ? generateBrief() : job === "sens-ai" ? summarizeAnnouncements(10) : job === "proofs" ? anchorMarketData() : job === "roadmap" ? anchorRoadmapTally() : ingestCrypto(10));
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

export type ExtractState = { error?: string; csv?: string; notes?: string } | undefined;
export async function extractFundamentalsAction(_: ExtractState, fd: FormData): Promise<ExtractState> {
  await requireAdmin();
  if (!aiConfigured()) return { error: "Set AI_API_KEY to extract figures from PDFs." };
  const symbol = String(fd.get("symbol") || "").toUpperCase();
  const sec = await prisma.security.findUnique({ where: { symbol } });
  if (!sec) return { error: "Choose a listed company." };
  const f = fd.get("pdf");
  const url = String(fd.get("url") || "").trim();
  try {
    let buf: Uint8Array;
    if (f instanceof File && f.size) {
      if (f.size > 25 * 1024 * 1024) return { error: "PDF is larger than 25 MB." };
      buf = new Uint8Array(await f.arrayBuffer());
    } else if (/^https?:\/\//.test(url)) buf = await fetchPdf(url);
    else return { error: "Upload a PDF or paste its URL." };
    const text = await pdfTextFromBuffer(buf, 40000);
    if (text.length < 300) return { error: "No readable text in that PDF (it may be a scanned image)." };
    const e = await extractFundamentals(text, sec.symbol, sec.name);
    return { csv: toCsv(sec.symbol, e, url || undefined), notes: [e.period && `Period: ${e.period}`, e.currency && e.currency !== "ZMW" && `Currency: ${e.currency}`, e.notes].filter(Boolean).join(" · ") };
  } catch (err) {
    console.error("extractFundamentals", err);
    return { error: `Extraction failed: ${String(err).slice(0, 160)}` };
  }
}
