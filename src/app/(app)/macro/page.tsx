import { getMacro, latestMacro } from "@/lib/market";
import FiTabs from "@/components/FiTabs";
import { Card, PageHeader, Stat } from "@/components/ui";
import { LineChartBox } from "@/components/charts/LineChartBox";
import { fmt, fmtDate } from "@/lib/format";

export const metadata = { title: "Macro Dashboard" };
export const revalidate = 3600;
export default async function Page() {
  const [m, mpr, inf, food, nf, ib, fx] = await Promise.all([latestMacro(), getMacro("MPR"), getMacro("INFLATION"), getMacro("INFLATION_FOOD"), getMacro("INFLATION_NONFOOD"), getMacro("INTERBANK"), getMacro("USDZMW")]);
  const infSeries = inf.map((r) => ({ date: r.date, overall: r.value, food: food.find((f) => f.date === r.date)?.value, nonfood: nf.find((f) => f.date === r.date)?.value }));
  const step = (rows: { date: string; value: number }[]) => rows.map((r) => ({ date: r.date, value: r.value }));
  return (
    <div>
      <PageHeader title="Macro Dashboard" subtitle="Bank of Zambia policy rate, inflation, interbank rate and the kwacha." />
      <FiTabs active="/macro" />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Monetary policy rate" value={`${fmt(m.MPR?.value)}%`} sub={`since ${fmtDate(m.MPR?.date)}`} />
        <Stat label="Annual inflation" value={`${fmt(m.INFLATION?.value)}%`} sub={fmtDate(m.INFLATION?.date)} />
        <Stat label="Overnight interbank" value={`${fmt(m.INTERBANK?.value, 4)}%`} sub={fmtDate(m.INTERBANK?.date)} />
        <Stat label="USD/ZMW (BoZ mid)" value={fmt(m.USDZMW?.value, 4)} sub={fmtDate(m.USDZMW?.date)} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Monetary policy rate"><LineChartBox data={step(mpr)} x="date" lines={[{ key: "value", name: "MPR %", color: "#10b981" }]} unit="%" /></Card>
        <Card title="Inflation">{infSeries.length > 1 ? <LineChartBox data={infSeries} x="date" lines={[{ key: "overall", name: "Overall", color: "#f59e0b" }, { key: "food", name: "Food", color: "#ef4444" }, { key: "nonfood", name: "Non-food", color: "#38bdf8" }]} unit="%" /> : <div className="py-16 text-center text-sm text-muted">{inf.length ? `${fmt(inf[0].value)}% in ${fmtDate(inf[0].date)}. BoZ's public API exposes only the latest print, so the series builds up monthly.` : "No data"}</div>}</Card>
        <Card title="Overnight interbank rate"><LineChartBox data={step(ib)} x="date" lines={[{ key: "value", name: "Interbank %", color: "#a78bfa" }]} unit="%" /></Card>
        <Card title="USD/ZMW"><LineChartBox data={step(fx)} x="date" lines={[{ key: "value", name: "USD/ZMW", color: "#38bdf8" }]} /></Card>
      </div>
      <p className="mt-3 text-xs text-muted">Source: Bank of Zambia (boz.zm).</p>
    </div>
  );
}
