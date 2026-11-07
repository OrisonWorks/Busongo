import Link from "next/link";
import { getAllBars, getIndex } from "@/lib/market";
import ToolTabs from "@/components/ToolTabs";
import { Card, Chg, PageHeader } from "@/components/ui";
import DataNotice from "@/components/DataNotice";

export const metadata = { title: "Relative Strength" };
const W = [[5, "1W"], [21, "1M"], [63, "3M"], [126, "6M"], [252, "1Y"]] as const;
export default async function Page() {
  const [data, lasi] = await Promise.all([getAllBars("EQUITY"), getIndex()]);
  const r = (a: number[], n: number) => (a.length > n ? (a.at(-1)! / a[a.length - 1 - n] - 1) * 100 : null);
  const li = lasi.map((x) => x.value);
  const rows = [...data].map(([s, b]) => ({ s, rets: W.map(([n]) => r(b.map((x) => x.close), n)) })).sort((a, b) => (b.rets[2] ?? -1e9) - (a.rets[2] ?? -1e9));
  return (
    <div>
      <PageHeader title="Relative Strength" subtitle="Returns over each window and outperformance against the LASI." />
      <ToolTabs active="/tools/relative-strength" />
      <DataNotice need={63} />
      <Card><table className="data"><thead><tr><th>Symbol</th>{W.map(([, l]) => <th key={l} className="r">{l}</th>)}{W.map(([, l]) => <th key={"x" + l} className="r">vs LASI {l}</th>)}</tr></thead>
        <tbody><tr className="font-semibold"><td>LASI</td>{W.map(([n]) => <td key={n} className="r"><Chg v={r(li, n)} /></td>)}{W.map(([n]) => <td key={"x" + n} />)}</tr>
          {rows.map((x) => <tr key={x.s}><td><Link href={`/stocks/${x.s}`} className="text-brand">{x.s}</Link></td>{x.rets.map((v, i) => <td key={i} className="r"><Chg v={v} /></td>)}{x.rets.map((v, i) => { const l = r(li, W[i][0]); return <td key={"x" + i} className="r"><Chg v={v != null && l != null ? v - l : null} /></td>; })}</tr>)}</tbody></table></Card>
    </div>
  );
}
