import { getUser } from "@/lib/auth";
import { planAtLeast } from "@/config/plans";
import PlanLock from "@/components/PlanLock";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getQuotes } from "@/lib/market";
import { valuation } from "@/lib/fundamentals";
import { Card, Notice, PageHeader } from "@/components/ui";
import { compact, fmt } from "@/lib/format";

export const metadata = { title: "Fundamentals Screener" };
const COLS = [["pe", "P/E", 1], ["pb", "P/B", 2], ["divYield", "Div yield %", 2], ["roe", "ROE %", 1], ["netMargin", "Net margin %", 1], ["debtToEquity", "D/E", 2], ["payout", "Payout %", 0]] as const;
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getUser();
  if (!planAtLeast(viewer?.effectivePlan ?? "FREE", "ADVANCED")) return (
    <div>
      <PageHeader title="Fundamentals Screener" subtitle="Valuation, profitability and leverage for LuSE companies, from published annual results." />
      <PlanLock min="ADVANCED" feature="Fundamentals screener tools" signedIn={!!viewer} />
    </div>
  );
  const sp = await searchParams;
  const [q, secs] = await Promise.all([getQuotes("EQUITY"), prisma.security.findMany({ where: { assetClass: "EQUITY" }, include: { fundamentals: { where: { period: "FY" }, orderBy: { fiscalYear: "desc" }, take: 1 } } })]);
  const px = new Map(q.map((x) => [x.symbol, x.close]));
  let rows = secs.map((s) => ({ s, f: s.fundamentals[0], v: valuation(s.fundamentals[0], px.get(s.symbol) ?? null, s.sharesOutstanding) }));
  const num = (k: string) => (sp[k] ? +sp[k]! : null);
  const maxPe = num("maxPe"), minDy = num("minDy"), minRoe = num("minRoe");
  if (maxPe != null) rows = rows.filter((r) => r.v.pe != null && r.v.pe <= maxPe);
  if (minDy != null) rows = rows.filter((r) => r.v.divYield != null && r.v.divYield >= minDy);
  if (minRoe != null) rows = rows.filter((r) => r.v.roe != null && r.v.roe >= minRoe);
  const sort = (sp.sort as keyof typeof rows[0]["v"]) || "marketCap";
  rows.sort((a, b) => (b.v[sort] ?? -1e18) - (a.v[sort] ?? -1e18));
  const covered = secs.filter((s) => s.fundamentals.length).length;
  return (
    <div>
      <PageHeader title="Fundamentals Screener" subtitle="Valuation, profitability and leverage for LuSE companies, from published annual results." />
      {covered < secs.length && <Notice>Financial statements are loaded for {covered} of {secs.length} companies. The rest are added from SENS results announcements as they are captured.</Notice>}
      <form className="card mb-4 flex flex-wrap items-end gap-2 p-3">
        <div><label className="label">Max P/E</label><input name="maxPe" defaultValue={sp.maxPe} type="number" step="any" className="input w-28" /></div>
        <div><label className="label">Min div. yield %</label><input name="minDy" defaultValue={sp.minDy} type="number" step="any" className="input w-28" /></div>
        <div><label className="label">Min ROE %</label><input name="minRoe" defaultValue={sp.minRoe} type="number" step="any" className="input w-28" /></div>
        <div><label className="label">Sort by</label><select name="sort" defaultValue={sort} className="input"><option value="marketCap">Market cap</option>{COLS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <button className="btn btn-primary">Screen</button>
      </form>
      <Card><div className="overflow-x-auto"><table className="data"><thead><tr><th>Symbol</th><th>Sector</th><th className="r">Price</th><th className="r">Mkt cap</th>{COLS.map(([k, l]) => <th key={k} className="r">{l}</th>)}<th>FY</th></tr></thead>
        <tbody>{rows.map(({ s, f, v }) => <tr key={s.id}><td><Link href={`/fundamentals/${s.symbol}`} className="font-semibold text-brand">{s.symbol}</Link></td><td className="text-muted">{s.sector}</td><td className="num r">{fmt(px.get(s.symbol))}</td><td className="num r">{compact(v.marketCap)}</td>{COLS.map(([k, , d]) => <td key={k} className="num r">{fmt(v[k], d)}</td>)}<td className="text-muted">{f ? f.fiscalYear : "—"}</td></tr>)}</tbody></table></div></Card>
    </div>
  );
}
