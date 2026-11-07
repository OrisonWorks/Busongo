import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getQuotes } from "@/lib/market";
import { valuation } from "@/lib/fundamentals";
import { Card, Empty, PageHeader, Stat } from "@/components/ui";
import { BarChartBox } from "@/components/charts/LineChartBox";
import { compact, fmt } from "@/lib/format";

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const s = await prisma.security.findUnique({ where: { symbol: (await params).symbol.toUpperCase() }, include: { fundamentals: { where: { period: "FY" }, orderBy: { fiscalYear: "asc" } } } });
  if (!s) notFound();
  const px = (await getQuotes("EQUITY")).find((q) => q.symbol === s.symbol)?.close ?? null;
  const f = s.fundamentals;
  const v = valuation(f.at(-1), px, s.sharesOutstanding);
  const lines: [string, keyof (typeof f)[0]][] = [["Revenue", "revenue"], ["Gross profit", "grossProfit"], ["Operating profit", "operatingProfit"], ["Net income", "netIncome"], ["Total assets", "totalAssets"], ["Total liabilities", "totalLiabilities"], ["Total equity", "totalEquity"], ["Total debt", "totalDebt"], ["Cash", "cash"], ["Operating cash flow", "operatingCashFlow"], ["Capex", "capex"], ["EPS", "eps"], ["DPS", "dps"], ["Shares outstanding", "sharesOutstanding"]];
  return (
    <div>
      <PageHeader crumbs={[{ href: "/fundamentals", label: "Fundamentals" }]} title={`${s.symbol} fundamentals`} subtitle={s.name}><Link href={`/stocks/${s.symbol}`} className="btn btn-ghost">Price chart →</Link></PageHeader>
      <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {([["Market cap", compact(v.marketCap)], ["P/E", fmt(v.pe, 1)], ["P/B", fmt(v.pb)], ["Div. yield", `${fmt(v.divYield)}%`], ["ROE", `${fmt(v.roe, 1)}%`], ["ROA", `${fmt(v.roa, 1)}%`], ["Net margin", `${fmt(v.netMargin, 1)}%`], ["Debt/Equity", fmt(v.debtToEquity)]] as const).map(([l, x]) => <Stat key={l} label={l} value={x} />)}
      </div>
      {f.length ? (
        <>
          <Card title="Revenue & net income" className="mt-4"><BarChartBox data={f.map((x) => ({ fy: `FY${x.fiscalYear}`, revenue: x.revenue, netIncome: x.netIncome }))} x="fy" bars={[{ key: "revenue", name: "Revenue", color: "#38bdf8" }, { key: "netIncome", name: "Net income", color: "#10b981" }]} /></Card>
          <Card title="Financial statements" className="mt-4"><div className="overflow-x-auto"><table className="data"><thead><tr><th>{s.fundamentals[0]?.currency ?? "ZMW"}</th>{f.map((x) => <th key={x.id} className="r">FY{x.fiscalYear}</th>)}</tr></thead>
            <tbody>{lines.map(([l, k]) => <tr key={k}><td>{l}</td>{f.map((x) => <td key={x.id} className="num r">{typeof x[k] === "number" ? (k === "eps" || k === "dps" ? fmt(x[k] as number) : compact(x[k] as number)) : "—"}</td>)}</tr>)}</tbody></table></div>
            <p className="mt-2 text-xs text-muted">Sources: {[...new Set(f.map((x) => x.sourceUrl).filter(Boolean))].map((u) => <a key={u} href={u!} className="mr-2 text-brand" target="_blank" rel="noreferrer">filing ↗</a>)}{f.every((x) => !x.sourceUrl) && "company annual reports"}</p></Card>
        </>
      ) : <Card className="mt-4"><Empty>No financial statements loaded for {s.symbol} yet.</Empty></Card>}
    </div>
  );
}
