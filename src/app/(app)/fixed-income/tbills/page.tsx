import { TBILL_TENORS, tbillHistory } from "@/lib/fixed-income";
import FiTabs from "@/components/FiTabs";
import { Card, PageHeader } from "@/components/ui";
import { LineChartBox } from "@/components/charts/LineChartBox";
import { fmt, fmtDate } from "@/lib/format";

export const metadata = { title: "T-Bill Auctions" };
export const revalidate = 3600;
export default async function Page() {
  const tb = await tbillHistory();
  const dates = [...new Set(tb.map((t) => t.auctionDate))];
  const series = dates.map((d) => Object.fromEntries([["date", d], ...tb.filter((t) => t.auctionDate === d).map((t) => [`${t.tenorDays}d`, t.yield])]));
  const colors = ["#38bdf8", "#10b981", "#a78bfa", "#f59e0b"];
  return (
    <div>
      <PageHeader title="Treasury Bill Auctions" subtitle="Yield and discount rate for each tenor at every Bank of Zambia T-bill auction." />
      <FiTabs active="/fixed-income/tbills" />
      <Card title="Yields by tenor"><LineChartBox data={series} x="date" lines={TBILL_TENORS.map((t, i) => ({ key: `${t}d`, name: `${t} days`, color: colors[i] }))} unit="%" /></Card>
      <Card title="Auction results" className="mt-4">
        <div className="overflow-x-auto"><table className="data"><thead><tr><th>Auction date</th><th>Tender</th>{TBILL_TENORS.map((t) => <th key={t} className="r">{t}d yield / disc.</th>)}</tr></thead>
          <tbody>{[...dates].reverse().map((d) => { const r = tb.filter((t) => t.auctionDate === d); return <tr key={d}><td>{fmtDate(d)}</td><td className="text-muted">{r[0]?.tenderNo}</td>{TBILL_TENORS.map((t) => { const x = r.find((y) => y.tenorDays === t); return <td key={t} className="num r">{x ? <>{fmt(x.yield)}% <span className="text-muted">/ {fmt(x.discountRate)}</span></> : "—"}</td>; })}</tr>; })}</tbody></table></div>
      </Card>
    </div>
  );
}
