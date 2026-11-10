import { prisma } from "@/lib/db";
import { getAllBars, getIndex } from "@/lib/market";
import { alignSeries, dailyReturns, stats } from "@/lib/compare";
import { Card, Chg, Empty, PageHeader } from "@/components/ui";
import { LineChartBox } from "@/components/charts/LineChartBox";
import { compact, fmt } from "@/lib/format";

export const metadata = { title: "Compare stocks", description: "Put LuSE shares side by side: growth, volatility, worst falls, liquidity and how closely they track the LASI." };
const COLORS = ["#10b981", "#38bdf8", "#f59e0b", "#f472b6", "#a78bfa"];
const MAX = 5;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const picked = ([] as string[]).concat(sp.s ?? []).map((x) => x.toUpperCase()).filter(Boolean).slice(0, MAX);
  const secs = await prisma.security.findMany({ where: { assetClass: "EQUITY", active: true }, orderBy: { symbol: "asc" }, select: { symbol: true, name: true } });
  const valid = picked.filter((s) => secs.some((x) => x.symbol === s));

  const [allBars, lasi] = valid.length >= 2 ? await Promise.all([getAllBars("EQUITY"), getIndex("LASI")]) : [new Map<string, { date: string; close: number; value: number }[]>(), []];
  const bench = lasi.map((b) => ({ date: String(b.date).slice(0, 10), close: b.value }));
  const series = valid.map((s) => (allBars.get(s) ?? []).map((b) => ({ date: String(b.date).slice(0, 10), close: b.close, value: b.value })));
  const { dates, closes } = alignSeries(series.map((s) => s.map(({ date, close }) => ({ date, close }))));
  const benchDaily = dailyReturns(bench.map((b) => b.close));
  const rows = valid.map((symbol, i) => ({ symbol, name: secs.find((x) => x.symbol === symbol)?.name, st: stats(series[i], benchDaily) }));
  const chart = dates.map((d, k) => Object.fromEntries([["date", d], ...valid.map((s, i) => [s, closes.length ? closes[i][k] / closes[i][0] * 100 : null])]));
  const lasiAligned = new Map(bench.map((b) => [b.date, b.close]));
  if (dates.length && lasiAligned.has(dates[0])) chart.forEach((r) => { const v = lasiAligned.get(r.date as string); (r as Record<string, unknown>).LASI = v ? v / lasiAligned.get(dates[0])! * 100 : null; });

  return (
    <div>
      <PageHeader crumbs={[{ href: "/tools/relative-strength", label: "Tools" }]} title="Compare stocks" subtitle="Pick two to five shares. The chart rebases each to 100 on the first day they all have prices, so you see growth, not price level." />
      <form className="card mb-4 flex flex-wrap items-end gap-2 p-3">
        {Array.from({ length: MAX }, (_, i) => (
          <div key={i}><label className="label">{i < 2 ? `Stock ${i + 1}` : `+ ${i + 1}`}</label>
            <select name="s" defaultValue={valid[i] ?? ""} className="input w-40"><option value="">—</option>{secs.map((x) => <option key={x.symbol} value={x.symbol}>{x.symbol} · {x.name}</option>)}</select></div>
        ))}
        <button className="btn btn-primary">Compare</button>
      </form>
      {valid.length >= 2 ? (
        chart.length ? (
          <>
            <Card title={`Since ${dates[0]} (rebased to 100)`}>
              <LineChartBox data={chart} x="date" lines={[...valid.map((s, i) => ({ key: s, name: s, color: COLORS[i] })), ...(lasiAligned.has(dates[0]) ? [{ key: "LASI", name: "LASI", color: "#64748b", dashed: true }] : [])]} />
            </Card>
            <Card title="Side by side" className="mt-4">
              <div className="overflow-x-auto"><table className="data"><thead><tr><th></th>{rows.map((r) => <th key={r.symbol} className="r"><a href={`/stocks/${r.symbol}`} className="text-brand">{r.symbol}</a></th>)}</tr></thead>
                <tbody>
                  <tr><td className="text-muted">Name</td>{rows.map((r) => <td key={r.symbol} className="r text-xs text-muted">{r.name}</td>)}</tr>
                  <tr><td>Total return</td>{rows.map((r) => <td key={r.symbol} className="r"><Chg v={r.st.totalReturn} /></td>)}</tr>
                  <tr><td>Volatility (annual)</td>{rows.map((r) => <td key={r.symbol} className="num r">{fmt(r.st.volatility, 1)}%</td>)}</tr>
                  <tr><td>Worst fall</td>{rows.map((r) => <td key={r.symbol} className="num r">{fmt(r.st.maxDrawdown, 1)}%</td>)}</tr>
                  <tr><td>Avg day value</td>{rows.map((r) => <td key={r.symbol} className="num r">{compact(r.st.avgValue)}</td>)}</tr>
                  <tr><td>Beta vs LASI</td>{rows.map((r) => <td key={r.symbol} className="num r">{fmt(r.st.beta)}</td>)}</tr>
                  <tr><td>Tracks LASI</td>{rows.map((r) => <td key={r.symbol} className="num r">{r.st.corr != null ? `${fmt(r.st.corr * 100, 0)}%` : "—"}</td>)}</tr>
                  <tr><td className="text-muted">Sessions</td>{rows.map((r) => <td key={r.symbol} className="num r text-muted">{r.st.sessions}</td>)}</tr>
                </tbody></table></div>
            </Card>
          </>
        ) : <Card><Empty>No shared trading days for that combination yet — prices accumulate day by day.</Empty></Card>
      ) : <Card><Empty>Pick at least two stocks above to compare them.</Empty></Card>}
    </div>
  );
}
