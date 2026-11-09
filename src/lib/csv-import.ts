import "server-only";
import { prisma } from "./db";

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const split = (l: string) => { const out: string[] = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === "," && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()); };
  const head = split(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  return lines.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [head[i], v])));
}

function parseDate(s: string): Date | null {
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return null;
}
const num = (s?: string) => { if (s == null || s === "") return null; const n = Number(s.replace(/[,\sK]/g, "")); return Number.isFinite(n) ? n : null; };

/** Columns: date, symbol, close (required; rows with a blank close are skipped); open, high, low, volume, value, trades (optional). Dates as YYYY-MM-DD or DD/MM/YYYY. */
export async function importPrices(text: string) {
  const rows = parseCsv(text);
  const secs = new Map((await prisma.security.findMany()).map((s) => [s.symbol, s.id]));
  let ok = 0; const errors: string[] = [];
  for (const [i, r] of rows.entries()) {
    if (!r.close?.trim()) continue;
    const sid = secs.get((r.symbol || "").toUpperCase()), date = parseDate(r.date || ""), close = num(r.close);
    if (!sid || !date || close == null) { if (errors.length < 20) errors.push(`Row ${i + 2}: ${!sid ? `unknown symbol "${r.symbol}"` : !date ? `bad date "${r.date}"` : "missing close"}`); continue; }
    const d = { open: num(r.open), high: num(r.high), low: num(r.low), close, volume: num(r.volume) ?? 0, value: num(r.value) ?? 0, trades: num(r.trades) ?? 0, source: "import" };
    await prisma.priceBar.upsert({ where: { securityId_date: { securityId: sid, date } }, update: d, create: { securityId: sid, date, ...d } });
    ok++;
  }
  return { ok, total: rows.length, errors };
}

const normPeriod = (s?: string) => { const v = (s || "").toUpperCase(); const q = v.match(/\bQ([1-4])\b/); return q ? `Q${q[1]}` : /\bH1\b|HALF|INTERIM|SIX MONTHS|6 MONTHS/.test(v) ? "H1" : /\bH2\b/.test(v) ? "H2" : "FY"; };

/** Columns: symbol, fiscalyear, optional period (FY, H1, H2, Q1–Q4; default FY) and currency (default ZMW), and any of revenue, grossprofit, operatingprofit, netincome, totalassets, totalliabilities, totalequity, totaldebt, cash, operatingcashflow, capex, eps, dps, sharesoutstanding, sourceurl. */
export async function importFundamentals(text: string) {
  const rows = parseCsv(text);
  const secs = new Map((await prisma.security.findMany()).map((s) => [s.symbol, s.id]));
  const F = { revenue: "revenue", grossprofit: "grossProfit", operatingprofit: "operatingProfit", netincome: "netIncome", totalassets: "totalAssets", totalliabilities: "totalLiabilities", totalequity: "totalEquity", totaldebt: "totalDebt", cash: "cash", operatingcashflow: "operatingCashFlow", capex: "capex", eps: "eps", dps: "dps", sharesoutstanding: "sharesOutstanding" } as const;
  let ok = 0; const errors: string[] = [];
  for (const [i, r] of rows.entries()) {
    const sid = secs.get((r.symbol || "").toUpperCase()), fy = num(r.fiscalyear);
    if (!sid || !fy) { if (errors.length < 20) errors.push(`Row ${i + 2}: ${!sid ? `unknown symbol "${r.symbol}"` : "missing fiscalyear"}`); continue; }
    const period = normPeriod(r.period);
    const data: Record<string, number | string | null> = { source: "import", sourceUrl: r.sourceurl || null };
    if (/^[A-Za-z]{3}$/.test(r.currency || "")) data.currency = r.currency.toUpperCase();
    for (const [k, f] of Object.entries(F)) if (r[k] != null && r[k] !== "") data[f] = num(r[k]);
    await prisma.fundamental.upsert({ where: { securityId_fiscalYear_period: { securityId: sid, fiscalYear: fy, period } }, update: data, create: { securityId: sid, fiscalYear: fy, period, ...data } });
    ok++;
  }
  return { ok, total: rows.length, errors };
}
