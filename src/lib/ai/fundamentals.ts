import "server-only";
import { z } from "zod";
import { completeJSON } from "../ai";
import { FUNDAMENTALS_PROMPT } from "./prompts";

const n = z.number().nullable().optional();
export const extracted = z.object({
  fiscalYear: z.number().int().min(1990).max(2100), period: z.string().optional(), currency: z.string().optional(),
  revenue: n, grossProfit: n, operatingProfit: n, netIncome: n, totalAssets: n, totalLiabilities: n, totalEquity: n, totalDebt: n,
  cash: n, operatingCashFlow: n, capex: n, eps: n, dps: n, sharesOutstanding: n, notes: z.string().optional(),
});
export type Extracted = z.infer<typeof extracted>;

export const FUND_COLS = ["revenue", "grossProfit", "operatingProfit", "netIncome", "totalAssets", "totalLiabilities", "totalEquity", "totalDebt", "cash", "operatingCashFlow", "capex", "eps", "dps", "sharesOutstanding"] as const;

export async function extractFundamentals(text: string, symbol: string, name: string) {
  return completeJSON([{ role: "system", content: FUNDAMENTALS_PROMPT }, { role: "user", content: `Company: ${name} (${symbol}), listed on LuSE.\n\n${text}` }], (v) => extracted.parse(v), 700);
}

/** Render extracted figures as a CSV row accepted by the admin fundamentals importer. */
export function toCsv(symbol: string, e: Extracted, sourceUrl?: string) {
  const head = ["symbol", "fiscalyear", ...FUND_COLS.map((c) => c.toLowerCase()), ...(sourceUrl ? ["sourceurl"] : [])];
  const row = [symbol, e.fiscalYear, ...FUND_COLS.map((c) => e[c] ?? ""), ...(sourceUrl ? [sourceUrl] : [])];
  return `${head.join(",")}\n${row.join(",")}`;
}
