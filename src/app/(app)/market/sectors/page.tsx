import { prisma } from "@/lib/db";
import { getQuotes } from "@/lib/market";
import MarketTabs from "@/components/MarketTabs";
import { Card, Chg, PageHeader } from "@/components/ui";
import { compact } from "@/lib/format";
import { BarChartBox } from "@/components/charts/LineChartBox";

export const metadata = { title: "Sectors & Breadth" };
export const revalidate = 300;
export default async function Page() {
  const q = await getQuotes();
  const sectors = [...new Set(q.map((x) => x.sector || "Other"))].map((s) => {
    const r = q.filter((x) => (x.sector || "Other") === s);
    const ch = r.filter((x) => x.changePct != null);
    return { s, n: r.length, avg: ch.length ? ch.reduce((a, x) => a + x.changePct!, 0) / ch.length : null, value: r.reduce((a, x) => a + (x.value ?? 0), 0), adv: ch.filter((x) => x.changePct! > 0).length, dec: ch.filter((x) => x.changePct! < 0).length };
  }).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  const rows = await prisma.priceBar.findMany({ where: { security: { assetClass: "EQUITY" } }, select: { date: true, change: true } });
  const by = new Map<string, { adv: number; dec: number }>();
  for (const r of rows) {
    const k = r.date.toISOString().slice(0, 10);
    const o = by.get(k) || { adv: 0, dec: 0 };
    if ((r.change ?? 0) > 0) o.adv++;
    if ((r.change ?? 0) < 0) o.dec++;
    by.set(k, o);
  }
  let cum = 0;
  const ad = [...by].sort(([a], [b]) => a.localeCompare(b)).map(([date, o]) => ({ date, adv: o.adv, dec: -o.dec, line: (cum += o.adv - o.dec) }));
  return (
    <div>
      <PageHeader title="Sectors & Breadth" />
      <MarketTabs active="/market/sectors" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Sector performance (avg % change)"><BarChartBox data={sectors.map((x) => ({ s: x.s, v: x.avg == null ? 0 : +x.avg.toFixed(2) }))} x="s" bars={[{ key: "v", name: "Avg %", color: "#10b981" }]} unit="%" /></Card>
        <Card title="Advance / decline by session"><BarChartBox data={ad} x="date" bars={[{ key: "adv", name: "Advances", color: "#22c55e" }, { key: "dec", name: "Declines", color: "#ef4444" }]} /></Card>
      </div>
      <Card title="Sectors" className="mt-4">
        <table className="data"><thead><tr><th>Sector</th><th className="r">Stocks</th><th className="r">Avg % chg</th><th className="r">Adv / Dec</th><th className="r">Value traded</th></tr></thead>
          <tbody>{sectors.map((x) => <tr key={x.s}><td>{x.s}</td><td className="r">{x.n}</td><td className="r"><Chg v={x.avg} /></td><td className="r">{x.adv} / {x.dec}</td><td className="num r">K{compact(x.value)}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
