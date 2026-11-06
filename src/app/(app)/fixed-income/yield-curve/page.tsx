import { curveHistory, yieldCurve } from "@/lib/fixed-income";
import { latestMacro } from "@/lib/market";
import FiTabs from "@/components/FiTabs";
import { Card, PageHeader } from "@/components/ui";
import { LineChartBox } from "@/components/charts/LineChartBox";
import { fmt, fmtDate } from "@/lib/format";
import { realYield } from "@/lib/fi";

export const metadata = { title: "GRZ Yield Curve" };
export const revalidate = 3600;
export default async function Page() {
  const [curve, hist, m] = await Promise.all([yieldCurve(), curveHistory([0, 3, 6, 9]), latestMacro()]);
  const inf = m.INFLATION?.value ?? null;
  const tenors = curve.map((c) => c.tenor);
  const cmp = tenors.map((t) => Object.fromEntries([["tenor", t], ...hist.map((h) => [h.label, h[t] ?? null])]));
  const colors = ["#f59e0b", "#10b981", "#38bdf8", "#a78bfa"];
  return (
    <div>
      <PageHeader title="GRZ Yield Curve" subtitle="Latest auction yield for each tenor, compared with the curve 3, 6 and 9 months ago." />
      <FiTabs active="/fixed-income/yield-curve" />
      <Card title="Curve shifts"><LineChartBox data={cmp} x="tenor" lines={hist.map((h, i) => ({ key: String(h.label), name: String(h.label), color: colors[i], dashed: i > 0 }))} unit="%" height={340} /></Card>
      <Card title="Curve points" className="mt-4">
        <table className="data"><thead><tr><th>Tenor</th><th>Type</th><th>ISIN</th><th className="r">Coupon</th><th className="r">Yield</th><th className="r">Real yield</th><th>Auction</th></tr></thead>
          <tbody>{curve.map((c) => <tr key={c.tenor}><td>{c.tenor}</td><td>{c.kind}</td><td className="text-muted">{c.isin}</td><td className="r">{c.coupon != null ? fmt(c.coupon) + "%" : "—"}</td><td className="r font-semibold">{fmt(c.yield)}%</td><td className="r">{inf != null ? fmt(realYield(c.yield, inf)) + "%" : "—"}</td><td>{fmtDate(c.date)}</td></tr>)}</tbody></table>
        <p className="mt-2 text-xs text-muted">Real yield = (1 + nominal) / (1 + inflation) − 1, using annual inflation of {fmt(inf)}% ({fmtDate(m.INFLATION?.date)}).</p>
      </Card>
    </div>
  );
}
