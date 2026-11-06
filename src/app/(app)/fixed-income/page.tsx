import { bondHistory, tbillHistory, yieldCurve } from "@/lib/fixed-income";
import { latestMacro } from "@/lib/market";
import FiTabs from "@/components/FiTabs";
import { Card, PageHeader, Stat } from "@/components/ui";
import { LineChartBox } from "@/components/charts/LineChartBox";
import { fmt, fmtDate } from "@/lib/format";
import { realYield } from "@/lib/fi";

export const metadata = { title: "Fixed Income" };
export const revalidate = 3600;
export default async function Page() {
  const [curve, tb, bd, m] = await Promise.all([yieldCurve(), tbillHistory(), bondHistory(), latestMacro()]);
  const inf = m.INFLATION?.value;
  const t364 = curve.find((c) => c.tenor === "364d");
  const longest = curve.filter((c) => c.kind === "Bond").at(-1);
  const lastTb = tb.at(-1), lastBd = bd.at(-1);
  return (
    <div>
      <PageHeader title="Fixed Income" subtitle="Government of the Republic of Zambia Treasury bills and bonds from Bank of Zambia auction results." />
      <FiTabs active="/fixed-income" />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Policy rate (MPR)" value={`${fmt(m.MPR?.value)}%`} sub={fmtDate(m.MPR?.date)} />
        <Stat label="Annual inflation" value={`${fmt(inf)}%`} sub={fmtDate(m.INFLATION?.date)} />
        <Stat label="364-day T-bill" value={`${fmt(t364?.yield)}%`} sub={inf != null && t364 ? `Real ${fmt(realYield(t364.yield, inf))}%` : undefined} />
        <Stat label={`${longest?.tenor ?? "Longest"} bond`} value={`${fmt(longest?.yield)}%`} sub={longest ? `Coupon ${fmt(longest.coupon)}%` : undefined} />
        <Stat label="Interbank (overnight)" value={`${fmt(m.INTERBANK?.value)}%`} sub={fmtDate(m.INTERBANK?.date)} />
        <Stat label="Term spread" value={t364 && longest ? `${fmt((longest.yield - t364.yield) * 100, 0)} bp` : "—"} sub="Longest bond − 364d" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Yield curve" className="lg:col-span-2"><LineChartBox data={curve} x="tenor" lines={[{ key: "yield", name: "Yield %", color: "#f59e0b" }]} unit="%" /></Card>
        <Card title="Latest auctions">
          <div className="text-xs text-muted">T-bills · {fmtDate(lastTb?.auctionDate)} · {lastTb?.tenderNo}</div>
          <table className="data mb-4"><tbody>{tb.filter((x) => x.auctionDate === lastTb?.auctionDate).map((x) => <tr key={x.id}><td>{x.tenorDays} days</td><td className="r">{fmt(x.yield)}%</td></tr>)}</tbody></table>
          <div className="text-xs text-muted">Bonds · {fmtDate(lastBd?.auctionDate)} · {lastBd?.tenderNo}</div>
          <table className="data"><tbody>{bd.filter((x) => x.auctionDate === lastBd?.auctionDate).map((x) => <tr key={x.id}><td>{x.tenorYears} years</td><td className="r text-muted">cpn {fmt(x.coupon)}%</td><td className="r">{fmt(x.yield)}%</td></tr>)}</tbody></table>
        </Card>
      </div>
      <p className="mt-3 text-xs text-muted">Source: Bank of Zambia auction results (boz.zm). Updated after each auction.</p>
    </div>
  );
}
