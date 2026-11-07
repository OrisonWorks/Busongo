import { getQuotes } from "@/lib/market";
import MarketTabs from "@/components/MarketTabs";
import QuoteTable from "@/components/QuoteTable";
import { Card, PageHeader } from "@/components/ui";
import { BarChartBox } from "@/components/charts/LineChartBox";

export const metadata = { title: "Movers & Turnover" };
export const revalidate = 300;
export default async function Page() {
  const q = await getQuotes();
  const byChg = q.filter((x) => x.changePct != null).sort((a, b) => b.changePct! - a.changePct!);
  const byVal = [...q].filter((x) => (x.value ?? 0) > 0).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return (
    <div>
      <PageHeader title="Movers & Turnover" />
      <MarketTabs active="/market/movers" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="% change, latest session"><BarChartBox data={byChg.map((x) => ({ s: x.symbol, v: +x.changePct!.toFixed(2) }))} x="s" bars={[{ key: "v", name: "% change", color: "#10b981" }]} unit="%" /></Card>
        <Card title="Value traded (K)"><BarChartBox data={byVal.map((x) => ({ s: x.symbol, v: Math.round(x.value ?? 0) }))} x="s" bars={[{ key: "v", name: "Value K", color: "#f59e0b" }]} /></Card>
      </div>
      <Card title="Ranked by % change" className="mt-4"><QuoteTable rows={byChg} /></Card>
      <Card title="Ranked by value traded" className="mt-4"><QuoteTable rows={byVal} /></Card>
    </div>
  );
}
