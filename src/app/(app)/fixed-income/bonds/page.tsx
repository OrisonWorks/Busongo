import { bondHistory } from "@/lib/fixed-income";
import FiTabs from "@/components/FiTabs";
import { Card, PageHeader } from "@/components/ui";
import { LineChartBox } from "@/components/charts/LineChartBox";
import { fmt, fmtDate } from "@/lib/format";

export const metadata = { title: "GRZ Bond Auctions" };
export const revalidate = 3600;
export default async function Page() {
  const bd = await bondHistory();
  const tenors = [...new Set(bd.map((b) => b.tenorYears))].sort((a, b) => a - b);
  const dates = [...new Set(bd.map((b) => b.auctionDate))];
  const series = dates.map((d) => Object.fromEntries([["date", d], ...bd.filter((b) => b.auctionDate === d).map((b) => [`${b.tenorYears}y`, b.yield])]));
  const colors = ["#38bdf8", "#10b981", "#a78bfa", "#f59e0b", "#f472b6", "#ef4444", "#eab308"];
  return (
    <div>
      <PageHeader title="GRZ Bond Auctions" subtitle="Weighted-average yields and coupons from Bank of Zambia government bond auctions." />
      <FiTabs active="/fixed-income/bonds" />
      <Card title="Yields by tenor"><LineChartBox data={series} x="date" lines={tenors.map((t, i) => ({ key: `${t}y`, name: `${t} years`, color: colors[i % colors.length] }))} unit="%" /></Card>
      <Card title="Auction results" className="mt-4">
        <div className="overflow-x-auto"><table className="data"><thead><tr><th>Auction date</th><th>Tender</th><th>Tenor</th><th>ISIN</th><th className="r">Coupon</th><th className="r">Yield</th></tr></thead>
          <tbody>{[...bd].reverse().map((b) => <tr key={b.id}><td>{fmtDate(b.auctionDate)}</td><td className="text-muted">{b.tenderNo}</td><td>{b.tenorYears} years</td><td className="text-muted">{b.isin}</td><td className="r">{fmt(b.coupon)}%</td><td className="r font-semibold">{fmt(b.yield)}%</td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}
