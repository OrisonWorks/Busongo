import "server-only";
import { z } from "zod";
import { prisma } from "../db";
import { aiConfigured, completeJSON } from "../ai";
import { SENS_PROMPT } from "./prompts";
import { fetchPdf, pdfTextFromBuffer } from "./pdf";

const out = z.object({ summary: z.string().min(1), impact: z.string().optional().default(""), category: z.string().optional() });

/** Summarise new SENS announcements (PDF → text → AI) and store the result on each announcement. */
export async function summarizeAnnouncements(limit = 10) {
  if (!aiConfigured()) return { skipped: "AI_API_KEY not set" };
  const todo = await prisma.announcement.findMany({ where: { summarizedAt: null, url: { not: null } }, orderBy: { date: "desc" }, take: limit, include: { security: true } });
  let done = 0;
  const errors: string[] = [];
  for (const a of todo) {
    try {
      const text = await pdfTextFromBuffer(await fetchPdf(a.url!), 12000);
      if (text.length < 150) {
        await prisma.announcement.update({ where: { id: a.id }, data: { summarizedAt: new Date() } });
        continue;
      }
      const r = await completeJSON([{ role: "system", content: SENS_PROMPT }, { role: "user", content: `Company: ${a.security?.name ?? "unknown"} (${a.security?.symbol ?? "-"})\nTitle: ${a.title}\n\n${text}` }], (v) => out.parse(v), 400);
      await prisma.announcement.update({ where: { id: a.id }, data: { summary: [r.summary, r.impact].filter(Boolean).join("\n\n"), category: a.category ?? r.category ?? null, summarizedAt: new Date() } });
      done++;
    } catch (e) {
      errors.push(`${a.title}: ${String(e).slice(0, 120)}`);
    }
  }
  return { candidates: todo.length, summarized: done, errors };
}
