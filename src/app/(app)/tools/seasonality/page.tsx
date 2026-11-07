import { getBars } from "@/lib/market";
import { symbolOptions } from "@/lib/symbols";
import SymbolPicker from "@/components/SymbolPicker";
import ToolTabs from "@/components/ToolTabs";
import { Card, PageHeader } from "@/components/ui";
import { BarChartBox } from "@/components/charts/LineChartBox";

export const metadata = { title: "Seasonality" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export default async function Page({ searchParams }: { searchParams: Promise<{ symbol?: string }> }) {
  const syms = await symbolOptions();
  const symbol = ((await searchParams).symbol || syms.find((s) => s.group === "Crypto")?.symbol || "").toUpperCase();
  const bars = await getBars(symbol);
  const lastByMonth = new Map<string, number>();
  for (const b of bars) lastByMonth.set(b.date.slice(0, 7), b.close);
  const keys = [...lastByMonth.keys()].sort();
  const rets: { y: string; m: number; r: number }[] = [];
  for (let i = 1; i < keys.length; i++) rets.push({ y: keys[i].slice(0, 4), m: +keys[i].slice(5, 7) - 1, r: (lastByMonth.get(keys[i])! / lastByMonth.get(keys[i - 1])! - 1) * 100 });
  const avg = MONTHS.map((m, i) => { const r = rets.filter((x) => x.m === i); return { m, avg: r.length ? +(r.reduce((a, x) => a + x.r, 0) / r.length).toFixed(2) : 0, up: r.length ? Math.round((r.filter((x) => x.r > 0).length / r.length) * 100) : 0, n: r.length }; });
  const years = [...new Set(rets.map((r) => r.y))];
  return (
    <div>
      <PageHeader title="Seasonality" subtitle="Average return and hit-rate for each calendar month." />
      <ToolTabs active="/tools/seasonality" />
      <SymbolPicker symbols={syms} value={symbol} />
      <Card title={`${symbol} average monthly return`}><BarChartBox data={avg} x="m" bars={[{ key: "avg", name: "Avg %", color: "#10b981" }]} unit="%" /></Card>
      <Card title="Monthly returns by year" className="mt-4"><div className="overflow-x-auto"><table className="data"><thead><tr><th>Year</th>{MONTHS.map((m) => <th key={m} className="r">{m}</th>)}</tr></thead>
        <tbody>{years.map((y) => <tr key={y}><td>{y}</td>{MONTHS.map((_, i) => { const r = rets.find((x) => x.y === y && x.m === i); return <td key={i} className={`num r ${r ? (r.r > 0 ? "text-up" : "text-down") : ""}`}>{r ? r.r.toFixed(1) : ""}</td>; })}</tr>)}
          <tr className="font-semibold"><td>% up</td>{avg.map((a) => <td key={a.m} className="r">{a.n ? a.up + "%" : ""}</td>)}</tr></tbody></table></div></Card>
    </div>
  );
}
