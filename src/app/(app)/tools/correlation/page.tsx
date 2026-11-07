import Link from "next/link";
import { getAllBars } from "@/lib/market";
import { correlation } from "@/lib/indicators";
import ToolTabs from "@/components/ToolTabs";
import { Card, PageHeader } from "@/components/ui";
import DataNotice from "@/components/DataNotice";

export const metadata = { title: "Correlation Matrix" };
export default async function Page({ searchParams }: { searchParams: Promise<{ asset?: string }> }) {
  const { asset = "CRYPTO" } = await searchParams;
  const data = await getAllBars(asset === "EQUITY" ? "EQUITY" : "CRYPTO", new Date(Date.now() - 400 * 86400000));
  const syms = [...data.keys()];
  const ret = new Map(syms.map((s) => { const b = data.get(s)!; return [s, new Map(b.slice(1).map((x, i) => [x.date, x.close / b[i].close - 1]))]; }));
  const corr = (a: string, b: string) => { const A = ret.get(a)!, B = ret.get(b)!; const d = [...A.keys()].filter((k) => B.has(k)); return d.length > 10 ? correlation(d.map((k) => A.get(k)!), d.map((k) => B.get(k)!)) : null; };
  const bg = (c: number | null) => (c == null ? "transparent" : c >= 0 ? `rgba(16,185,129,${Math.abs(c) * 0.8})` : `rgba(239,68,68,${Math.abs(c) * 0.8})`);
  return (
    <div>
      <PageHeader title="Correlation Matrix" subtitle="Correlation of daily returns over the last year. Low or negative correlations improve diversification." />
      <ToolTabs active="/tools/correlation" />
      <div className="mb-3 flex gap-2">{["CRYPTO", "EQUITY"].map((a) => <Link key={a} href={`/tools/correlation?asset=${a}`} className={`btn ${asset === a ? "btn-primary" : "btn-ghost"}`}>{a === "EQUITY" ? "LuSE" : "Crypto"}</Link>)}</div>
      {asset === "EQUITY" && <DataNotice need={30} />}
      <Card><div className="overflow-x-auto"><table className="data"><thead><tr><th></th>{syms.map((s) => <th key={s} className="r">{s}</th>)}</tr></thead>
        <tbody>{syms.map((a) => <tr key={a}><td className="font-semibold">{a}</td>{syms.map((b) => { const c = a === b ? 1 : corr(a, b); return <td key={b} className="num r" style={{ background: bg(c) }}>{c == null ? "—" : c.toFixed(2)}</td>; })}</tr>)}</tbody></table></div></Card>
    </div>
  );
}
